import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcile, type AuditData } from "../../scripts/payment-b44-reconciliation-rules";
const healthy=():AuditData=>({
 payments:[{id:"p1",bookingId:"b1",total:100000,paid:40000,balance:60000}],
 transactions:[{id:"t1",paymentId:"p1",amount:40000,provider:"RAZORPAY",gatewayOrderId:"o1",gatewayPaymentId:"g1"}],
 orders:[{paymentId:"p1",gatewayOrderId:"o1",amount:40000}],
 receipts:[{id:"r1",paymentId:"p1",gatewayOrderId:"o1",gatewayPaymentId:"g1",processed:true}],
 syncs:[{paymentId:"p1",bookingId:"b1",status:"SYNCHRONIZED"}]
});
test("B4.4A healthy populated financial ledger has no findings",()=>{
 assert.equal(reconcile(healthy()).reduce((a,x)=>a+x.count,0),0);
});
test("B4.4A detects incorrect balances and mismatched gateway order",()=>{
 const d=healthy();d.payments[0].balance=70000;d.orders[0].amount=50000;
 const f=reconcile(d);assert.equal(f.find(x=>x.check==="invalid payment balances")?.count,1);
 assert.equal(f.find(x=>x.check.includes("mismatched order"))?.count,1);
});
test("B4.4A detects missing successful receipt evidence and booking sync",()=>{
 const d=healthy();d.receipts[0].gatewayPaymentId="g_unknown";d.syncs=[];
 const f=reconcile(d);assert.equal(f.find(x=>x.check.startsWith("processed capture"))?.count,1);
 assert.equal(f.find(x=>x.check.includes("without booking sync"))?.count,1);
});
test("B4.4A identifies pending receipt and unsynchronized booking",()=>{
 const d=healthy();d.receipts[0].processed=false;d.syncs[0].status="PENDING";
 const f=reconcile(d);assert.equal(f.find(x=>x.check==="pending capture receipts")?.count,1);
 assert.equal(f.find(x=>x.check==="non-synchronized booking projections")?.count,1);
});
