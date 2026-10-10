/** B4.4D.2: read-only, isolated PostgreSQL financial integrity audit.
 * Execute through the guarded payment integration runner or with:
 * PAYMENT_INTEGRATION_TEST=1 DATABASE_URL=<exact TEST_DATABASE_URL> npx tsx scripts/payment-b44d2-financial-integrity.ts
 * Never run against staging or production.
 */
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

function guard() {
  const url = process.env.DATABASE_URL;
  assert.equal(process.env.PAYMENT_INTEGRATION_TEST, '1', 'PAYMENT_INTEGRATION_TEST=1 required');
  assert.ok(url && url === process.env.TEST_DATABASE_URL, 'DATABASE_URL must equal TEST_DATABASE_URL');
  const parsed = new URL(url);
  assert.equal(parsed.protocol, 'postgresql:');
  assert.equal(parsed.hostname, '127.0.0.1');
  assert.equal(parsed.port, '5432');
  assert.equal(parsed.username, 'easymovers_test_user');
  assert.equal(parsed.pathname, '/easymovers_payment_test');
  assert.equal(parsed.searchParams.get('schema'), 'public');
  assert.equal(parsed.searchParams.has('pgbouncer'), false);
}
const cents = (value: {toString():string}) => {
  const s = value.toString();
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error(`Non-cent monetary value: ${s}`);
  const negative = s.startsWith('-');
  const [whole, fraction=''] = (negative?s.slice(1):s).split('.');
const result =
  BigInt(whole) * BigInt(100) +
  BigInt(fraction.padEnd(2, "0"));
  return negative ? -result : result;
};
export async function runAudit() {
  guard();
  const db = new PrismaClient();
  const findings: Array<{code:string; id:string; detail:string}> = [];
  const add = (code:string,id:string,detail:string) => findings.push({code,id,detail});
  try {
    // All queries below are SELECT-only. No fixtures or financial mutations.
    const [payments, transactions, orders, receipts, syncs] = await Promise.all([
      db.payment.findMany({select:{id:true,bookingId:true,totalAmount:true,paidAmount:true,balanceAmount:true,paymentPending:true,updatedAt:true}}),
      db.paymentTransaction.findMany({select:{id:true,paymentId:true,transactionType:true,status:true,amount:true,provider:true,gatewayPaymentId:true,gatewayOrderId:true}}),
      db.paymentGatewayOrder.findMany({select:{id:true,paymentId:true,gatewayOrderId:true,provider:true}}),
      db.paymentWebhook.findMany({select:{id:true,eventType:true,processed:true,paymentId:true,gatewayPaymentId:true}}),
      db.paymentBookingSync.findMany({select:{id:true,paymentId:true,bookingId:true,status:true,paymentUpdatedAt:true}}),
    ]);
    const byPayment = new Map(payments.map(p=>[p.id,p]));
    const byOrder = new Map(orders.map(o=>[o.gatewayOrderId,o]));
    const success = transactions.filter(t=>t.transactionType==='COLLECTION' && (t.status==='SUCCESS'||t.status==='CAPTURED'));
    const byGateway = new Map<string,typeof success>();
    for(const t of success){
      if(t.gatewayPaymentId) byGateway.set(t.gatewayPaymentId,[...(byGateway.get(t.gatewayPaymentId)||[]),t]);
      if(!byPayment.has(t.paymentId)) add('SUCCESS_WITHOUT_PAYMENT',t.id,t.paymentId);
      if(t.provider==='RAZORPAY' && t.gatewayOrderId){
        const order=byOrder.get(t.gatewayOrderId);
        if(!order) add('SUCCESS_WITHOUT_ORDER',t.id,t.gatewayOrderId);
        else if(order.paymentId!==t.paymentId) add('ORDER_PAYMENT_MISMATCH',t.id,t.gatewayOrderId);
      }
    }
    for(const [gatewayId,rows] of byGateway){
      if(rows.length>1) add('DUPLICATE_SUCCESS_GATEWAY_PAYMENT',gatewayId,`${rows.length} successful collections`);
    }
    for(const p of payments){
      const total=cents(p.totalAmount),paid=cents(p.paidAmount),balance=cents(p.balanceAmount),pending=cents(p.paymentPending);
      if(total<BigInt(0)||paid<BigInt(0)||balance<BigInt(0)||paid>total||total!==paid+balance) add('INVALID_PAYMENT_BALANCE',p.id,`${total}/${paid}/${balance} paise`);
      if(pending!==balance) add('PENDING_BALANCE_MISMATCH',p.id,`${pending}/${balance} paise`);
      const collected=success.filter(t=>t.paymentId===p.id).reduce((sum,t)=>sum+cents(t.amount),BigInt(0));
      // Legacy/migrated payments may predate normalized transactions; flag for review, never repair automatically.
      if(collected!==paid) add('COLLECTION_SUM_MISMATCH',p.id,`${collected}/${paid} paise`);
    }
    for(const r of receipts){
      if(r.processed&&r.eventType==='payment.captured'){
        const matches=r.gatewayPaymentId?byGateway.get(r.gatewayPaymentId)||[]:[];
        if(!matches.some(t=>t.paymentId===r.paymentId)) add('PROCESSED_CAPTURE_WITHOUT_COLLECTION',r.id,r.gatewayPaymentId||'missing gatewayPaymentId');
      }
    }
    for(const s of syncs){
      const p=byPayment.get(s.paymentId);
      if(!p) add('SYNC_WITHOUT_PAYMENT',s.id,s.paymentId);
      else {
        if(p.bookingId!==s.bookingId) add('SYNC_BOOKING_MISMATCH',s.id,s.bookingId);
        if(s.status==='SYNCHRONIZED' && p.updatedAt.getTime()!==s.paymentUpdatedAt.getTime()) add('STALE_SYNCHRONIZED_SNAPSHOT',s.id,s.paymentId);
      }
    }
    const counts={payments:payments.length,transactions:transactions.length,orders:orders.length,receipts:receipts.length,syncs:syncs.length};
    console.log(JSON.stringify({milestone:'B4.4D.2',mode:'READ_ONLY',counts,findings},null,2));
    if(payments.length===0) {throw new Error('NO_PAYMENTS: populated fixture certification required');}
    else if(findings.length) throw new Error(`${findings.length} financial integrity findings`);
    else console.log('[B4.4D.2] PASS: no findings in populated database');
  } finally {await db.$disconnect();}
}
if(require.main===module){runAudit().catch(e=>{console.error(e);process.exitCode=1;});}
