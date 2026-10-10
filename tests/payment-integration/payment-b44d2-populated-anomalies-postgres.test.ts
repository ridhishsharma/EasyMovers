/** B4.4D.2B: controlled, isolated PostgreSQL financial anomaly certification.
 * Runs the ACTUAL B4.4D.2 auditor. No staging/production access.
 * The test creates and deletes only its own uniquely identified fixtures.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { runAudit } from '../../scripts/payment-b44d2-financial-integrity';

function guard(): void {
  const raw = process.env.DATABASE_URL;
  assert.equal(process.env.PAYMENT_INTEGRATION_TEST, '1');
  assert.ok(raw && raw === process.env.TEST_DATABASE_URL);
  const u = new URL(raw);
  assert.ok(['postgres:', 'postgresql:'].includes(u.protocol));
  assert.equal(u.hostname, '127.0.0.1');
  assert.equal(u.port, '5432');
  assert.equal(decodeURIComponent(u.username), 'easymovers_test_user');
  assert.equal(u.pathname, '/easymovers_payment_test');
  assert.deepEqual([...u.searchParams.entries()], [['schema', 'public']]);
  assert.equal(u.hash, '');
}
guard();

type Finding = {code:string;id:string;detail:string};
type Report = {milestone:string;mode:string;counts:{payments:number};findings:Finding[]};

// Capture only the auditor's JSON output. The auditor itself is unchanged.
async function inspectAudit(): Promise<{report:Report;error:unknown}> {
  const original = console.log;
  let report: Report | undefined;
  console.log = (...args:unknown[]) => {
    if (typeof args[0] === 'string') {
      try {
        const parsed: unknown = JSON.parse(args[0]);
        if (parsed && typeof parsed === 'object' && 'milestone' in parsed &&
            (parsed as {milestone?:string}).milestone === 'B4.4D.2') {
          report = parsed as Report;
        }
      } catch { /* Not a JSON audit report. */ }
    }
    original(...args);
  };
  let error: unknown;
  try { await runAudit(); } catch (e) { error = e; }
  finally { console.log = original; }
  assert.ok(report, 'The real auditor must emit its JSON report');
  return {report, error};
}

test('B4.4D.2B populated PostgreSQL detects controlled anomalies without audit mutation', async () => {
  const prisma = new PrismaClient();
  const token = randomUUID().replace(/-/g, '');
  let leadId: string | undefined;
  let bookingId: string | undefined;
  let paymentId: string | undefined;
  let webhookId: string | undefined;
  try {
    const lead = await prisma.lead.create({data:{
      referenceId:`EM-B44D2B-LEAD-${token}`, name:'B44D2B Integrity Fixture', mobile:'9000000000',
    }});
    leadId = lead.id;
    const booking = await prisma.booking.create({data:{
      bookingNumber:`EM-B44D2B-${token}`, leadId:lead.id, leadReferenceId:lead.referenceId,
      customerName:'B44D2B Integrity Fixture', customerMobile:'9000000000',
      serviceType:'HOUSEHOLD_SHIFTING', moveType:'WITHIN_CITY',
      moveDate:new Date('2027-01-01T09:00:00Z'),
      pickupCity:'Bhopal', pickupState:'MP', pickupPincode:'462001',
      dropCity:'Bhopal', dropState:'MP', dropPincode:'462001',
      pickupAddress:'B44D2B test pickup', dropAddress:'B44D2B test drop',
      contactJson:{},pickupAddressJson:{},dropAddressJson:{},scheduleJson:{},
      inventoryJson:[],inventorySummaryJson:{},servicesJson:{},timelineJson:[],auditJson:[],
      totalAmount:1000,
    }});
    bookingId = booking.id;
    const payment = await prisma.payment.create({data:{
      paymentNumber:`EMP-B44D2B-${token}`, bookingId:booking.id,
      amount:1000,totalAmount:1000,paidAmount:400,balanceAmount:600,
      paymentPending:600,currency:'INR',paymentStatus:'PARTIALLY_PAID',
    }});
    paymentId = payment.id;
    const txn = await prisma.paymentTransaction.create({data:{
      paymentId:payment.id, transactionType:'COLLECTION',status:'SUCCESS',
      amount:400,currency:'INR',provider:'OTHER',
    }});

    // Baseline: our fixture is internally consistent. The isolated DB should
    // be clean after earlier tests, but we only assert no findings for our IDs.
    const baseline = await inspectAudit();
    assert.equal(baseline.report.mode,'READ_ONLY');
    assert.ok(baseline.report.counts.payments >= 1);
    assert.equal(baseline.report.findings.filter(f=>f.id===payment.id||f.id===txn.id).length,0);

    // Inject controlled anomalies only into this test's rows.
    await prisma.payment.update({where:{id:payment.id},data:{balanceAmount:550,paymentPending:550}});
    const receipt = await prisma.paymentWebhook.create({data:{
      webhookId:`EM-B44D2B-WEBHOOK-${token}`,provider:'RAZORPAY',
      eventType:'payment.captured',processed:true,paymentId:payment.id,
      gatewayPaymentId:`pay_b44d2b_missing_${token}`,
    }});
    webhookId = receipt.id;
    const sync = await prisma.paymentBookingSync.create({data:{
      paymentId:payment.id,bookingId:booking.id,status:'SYNCHRONIZED',
      paymentUpdatedAt:new Date('2025-01-01T00:00:00Z'),
      paymentSnapshotJson:{totalAmount:1000,paidAmount:400,balanceAmount:600},
      requestedBy:'B44D2B_TEST',
    }});
    const before = await Promise.all([
      prisma.payment.findUniqueOrThrow({where:{id:payment.id}}),
      prisma.paymentTransaction.findUniqueOrThrow({where:{id:txn.id}}),
      prisma.paymentWebhook.findUniqueOrThrow({where:{id:receipt.id}}),
      prisma.paymentBookingSync.findUniqueOrThrow({where:{id:sync.id}}),
    ]);
    const checked = await inspectAudit();
    assert.ok(checked.error instanceof Error, 'Auditor must fail when findings exist');
    const codes = new Set(checked.report.findings.filter(f=>
      f.id===payment.id||f.id===receipt.id||f.id===sync.id).map(f=>f.code));
    for (const code of ['INVALID_PAYMENT_BALANCE','PROCESSED_CAPTURE_WITHOUT_COLLECTION','STALE_SYNCHRONIZED_SNAPSHOT']) {
      assert.ok(codes.has(code), `Expected ${code}; received ${[...codes].join(', ')}`);
    }
    // Compare persisted rows: read-only auditor must not mutate ANY fixture.
    const after = await Promise.all([
      prisma.payment.findUniqueOrThrow({where:{id:payment.id}}),
      prisma.paymentTransaction.findUniqueOrThrow({where:{id:txn.id}}),
      prisma.paymentWebhook.findUniqueOrThrow({where:{id:receipt.id}}),
      prisma.paymentBookingSync.findUniqueOrThrow({where:{id:sync.id}}),
    ]);
    assert.deepEqual(after,before,'Auditor changed persisted financial records');
  } finally {
    // Cleanup only rows owned by this test. No global truncation or reset.
    try {
      if(paymentId){
        await prisma.paymentBookingSync.deleteMany({where:{paymentId}});
        if(webhookId) await prisma.paymentWebhook.deleteMany({where:{id:webhookId}});
        await prisma.paymentTransaction.deleteMany({where:{paymentId}});
        await prisma.payment.deleteMany({where:{id:paymentId}});
      }
      if(bookingId) await prisma.booking.deleteMany({where:{id:bookingId}});
      if(leadId) await prisma.lead.deleteMany({where:{id:leadId}});
    } finally {await prisma.$disconnect();}
  }
});
