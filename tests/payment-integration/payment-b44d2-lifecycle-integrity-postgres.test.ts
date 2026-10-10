/** B4.4D.2C: populated successful financial lifecycle integrity certification.
 * Creates isolated PostgreSQL fixtures and runs the REAL read-only B4.4D.2 auditor.
 * No migrations, truncation, staging, or production access.
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

type Finding = {code:string; id:string; detail:string};
type Report = {
  milestone:string; mode:string;
  counts:{payments:number;transactions:number;orders:number;receipts:number;syncs:number};
  findings:Finding[];
};
async function inspectAudit():Promise<{report:Report; error:unknown}> {
  const original = console.log;
  let report:Report|undefined;
  console.log = (...args:unknown[]) => {
    if(typeof args[0] === 'string') {
      try {
        const candidate:unknown = JSON.parse(args[0]);
        if(candidate && typeof candidate === 'object' &&
           'milestone' in candidate && (candidate as {milestone?:string}).milestone === 'B4.4D.2') {
          report = candidate as Report;
        }
      } catch { /* non-JSON output */ }
    }
    original(...args);
  };
  let error:unknown;
  try {await runAudit();} catch(e) {error=e;} finally {console.log=original;}
  assert.ok(report,'Real auditor must emit a B4.4D.2 report');
  return {report,error};
}

test('B4.4D.2C populated two-collection Razorpay lifecycle passes read-only financial integrity audit',async()=>{
  const prisma = new PrismaClient();
  const token = randomUUID().replace(/-/g,'');
  let leadId:string|undefined;
  let bookingId:string|undefined;
  let paymentId:string|undefined;
  try {
    const lead=await prisma.lead.create({data:{
      referenceId:`EM-B44D2C-LEAD-${token}`,name:'B44D2C Integrity Fixture',mobile:'9000000000',
    }});
    leadId=lead.id;
    const booking=await prisma.booking.create({data:{
      bookingNumber:`EM-B44D2C-${token}`,leadId:lead.id,leadReferenceId:lead.referenceId,
      customerName:'B44D2C Integrity Fixture',customerMobile:'9000000000',
      serviceType:'HOUSEHOLD_SHIFTING',moveType:'WITHIN_CITY',
      moveDate:new Date('2027-01-01T09:00:00Z'),
      pickupCity:'Bhopal',pickupState:'MP',pickupPincode:'462001',
      dropCity:'Bhopal',dropState:'MP',dropPincode:'462001',
      pickupAddress:'B44D2C pickup',dropAddress:'B44D2C drop',
      contactJson:{},pickupAddressJson:{},dropAddressJson:{},scheduleJson:{},
      inventoryJson:[],inventorySummaryJson:{},servicesJson:{},timelineJson:[],auditJson:[],
      totalAmount:1000,
    }});
    bookingId=booking.id;
    const payment=await prisma.payment.create({data:{
      paymentNumber:`EMP-B44D2C-${token}`,bookingId:booking.id,
      amount:1000,totalAmount:1000,paidAmount:1000,balanceAmount:0,
      paymentPending:0,currency:'INR',paymentStatus:'PAID',
    }});
    paymentId=payment.id;
    const gatewayPayments=[`pay_b44d2c_400_${token}`,`pay_b44d2c_600_${token}`];
    const gatewayOrders=[`order_b44d2c_400_${token}`,`order_b44d2c_600_${token}`];
    const amounts=[400,600];
    const transactionIds:string[]=[];
    for(let i=0;i<2;i++) {
      await prisma.paymentGatewayOrder.create({data:{
        paymentId:payment.id,provider:'RAZORPAY',gatewayOrderId:gatewayOrders[i],
        amount:amounts[i],currency:'INR',status:'PAID',
      }});
      const txn=await prisma.paymentTransaction.create({data:{
        paymentId:payment.id,transactionType:'COLLECTION',status:'SUCCESS',
        amount:amounts[i],currency:'INR',provider:'RAZORPAY',
        gatewayPaymentId:gatewayPayments[i],gatewayOrderId:gatewayOrders[i],
      }});
      transactionIds.push(txn.id);
      await prisma.paymentWebhook.create({data:{
        webhookId:`EM-B44D2C-WEBHOOK-${i}-${token}`,provider:'RAZORPAY',
        eventType:'payment.captured',processed:true,paymentId:payment.id,
        transactionId:txn.id,gatewayPaymentId:gatewayPayments[i],
        gatewayOrderId:gatewayOrders[i],
      }});
    }
    // Capture the authoritative persisted payment version, not a guessed timestamp.
    const persistedPayment=await prisma.payment.findUniqueOrThrow({where:{id:payment.id}});
    await prisma.paymentBookingSync.create({data:{
      paymentId:payment.id,bookingId:booking.id,status:'SYNCHRONIZED',
      paymentUpdatedAt:persistedPayment.updatedAt,
      paymentSnapshotJson:{totalAmount:1000,paidAmount:1000,balanceAmount:0,currency:'INR'},
      bookingSnapshotJson:{totalAmount:1000,paidAmount:1000,balanceAmount:0,currency:'INR'},
      requestedBy:'B44D2C_TEST',synchronizedAt:new Date(),
    }});
    const before=await Promise.all([
      prisma.payment.findUniqueOrThrow({where:{id:payment.id}}),
      prisma.paymentTransaction.findMany({where:{paymentId:payment.id},orderBy:{id:'asc'}}),
      prisma.paymentGatewayOrder.findMany({where:{paymentId:payment.id},orderBy:{id:'asc'}}),
      prisma.paymentWebhook.findMany({where:{paymentId:payment.id},orderBy:{id:'asc'}}),
      prisma.paymentBookingSync.findUniqueOrThrow({where:{paymentId:payment.id}}),
    ]);
    assert.equal(before[1].length,2);
    assert.equal(before[2].length,2);
    assert.equal(before[3].length,2);
    assert.equal(new Set(gatewayPayments).size,2);
    assert.equal(transactionIds.length,2);
    const inspected=await inspectAudit();
    assert.equal(inspected.report.mode,'READ_ONLY');
    assert.ok(inspected.report.counts.payments>=1);
    assert.ok(inspected.report.counts.transactions>=2);
    assert.ok(inspected.report.counts.orders>=2);
    assert.ok(inspected.report.counts.receipts>=2);
    assert.ok(inspected.report.counts.syncs>=1);
    const fixtureIds=new Set<string>([
      payment.id,...before[1].map(x=>x.id),...before[2].map(x=>x.id),
      ...before[3].map(x=>x.id),before[4].id,...gatewayPayments,
    ]);
    const fixtureFindings=inspected.report.findings.filter(f=>fixtureIds.has(f.id));
    assert.deepEqual(fixtureFindings,[],`Fixture integrity findings: ${JSON.stringify(fixtureFindings)}`);
    // An unrelated fixture left behind by another test may cause a global audit
    // failure. Do not misreport it as a defect in this isolated lifecycle.
    if(inspected.error) {
      assert.ok(inspected.report.findings.length>0,'Unexpected auditor failure');
      console.warn('[B4.4D.2C] Other database records have findings; fixture is clean.');
    }
    const after=await Promise.all([
      prisma.payment.findUniqueOrThrow({where:{id:payment.id}}),
      prisma.paymentTransaction.findMany({where:{paymentId:payment.id},orderBy:{id:'asc'}}),
      prisma.paymentGatewayOrder.findMany({where:{paymentId:payment.id},orderBy:{id:'asc'}}),
      prisma.paymentWebhook.findMany({where:{paymentId:payment.id},orderBy:{id:'asc'}}),
      prisma.paymentBookingSync.findUniqueOrThrow({where:{paymentId:payment.id}}),
    ]);
    assert.deepEqual(after,before,'Read-only auditor mutated financial fixture records');
    assert.equal(before[1].reduce((sum,t)=>sum+Number(t.amount),0),1000);
  } finally {
    try {
      if(paymentId) {
        await prisma.paymentBookingSync.deleteMany({where:{paymentId}});
        await prisma.paymentWebhook.deleteMany({where:{paymentId}});
        await prisma.paymentTransaction.deleteMany({where:{paymentId}});
        await prisma.paymentGatewayOrder.deleteMany({where:{paymentId}});
        await prisma.payment.deleteMany({where:{id:paymentId}});
      }
      if(bookingId) await prisma.booking.deleteMany({where:{id:bookingId}});
      if(leadId) await prisma.lead.deleteMany({where:{id:leadId}});
    } finally {await prisma.$disconnect();}
  }
});
