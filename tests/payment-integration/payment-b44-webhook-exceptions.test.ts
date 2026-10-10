import {test} from "node:test";
import assert from "node:assert/strict";
import {classifyWebhookExceptions,type Receipt,type Success,type BookingSync} from "../../scripts/payment-b44-webhook-exception-rules";
const NOW=Date.parse("2026-10-10T12:00:00Z");
const receipt=(patch:Partial<Receipt>={}):Receipt=>({id:"receipt1",eventType:"payment.captured",processed:true,errorCode:null,receivedAt:new Date(NOW-60000),paymentId:"payment1",gatewayPaymentId:"gateway1",...patch});
const success:Success={id:"txn1",paymentId:"payment1",gatewayPaymentId:"gateway1"};
const sync:BookingSync={paymentId:"payment1",status:"SYNCHRONIZED"};
const reasons=(r:Receipt,t:Success[]=[success],s:BookingSync[]=[sync])=>classifyWebhookExceptions([r],t,s,NOW).map(x=>x.reason);
test("B4.4B healthy captured receipt produces no exceptions",()=>assert.deepEqual(reasons(receipt()),[]));
test("B4.4B fresh unprocessed receipt",()=>assert.deepEqual(reasons(receipt({processed:false})),["UNPROCESSED_RECEIPT"]));
test("B4.4B stale unprocessed receipt flagged for retry investigation",()=>{
 const result=classifyWebhookExceptions([receipt({processed:false,receivedAt:new Date(NOW-16*60000)})],[success],[sync],NOW);
 assert.deepEqual(result.map(x=>x.reason),["UNPROCESSED_RECEIPT","STALE_UNPROCESSED_RECEIPT"]);
 assert.equal(result[1].nextAction,"INVESTIGATE_RETRY");
});
test("B4.4B recorded error flagged even when processed",()=>assert.deepEqual(reasons(receipt({errorCode:"TEMPORARY_ERROR"})),["RECORDED_WEBHOOK_ERROR"]));
test("B4.4B processed capture with no successful transaction",()=>assert.deepEqual(reasons(receipt(),[],[sync]),["PROCESSED_CAPTURE_MISSING_SUCCESSFUL_TRANSACTION"]));
test("B4.4B processed capture with mismatched transaction ownership",()=>assert.deepEqual(reasons(receipt(),[{...success,paymentId:"another-payment"}],[sync]),["PROCESSED_CAPTURE_MISSING_SUCCESSFUL_TRANSACTION"]));
test("B4.4B successful capture without booking sync",()=>assert.deepEqual(reasons(receipt(),[success],[]),["SUCCESSFUL_CAPTURE_MISSING_BOOKING_SYNC"]));
test("B4.4B pending booking synchronization",()=>assert.deepEqual(reasons(receipt(),[success],[{...sync,status:"PENDING"}]),["BOOKING_SYNC_NOT_COMPLETE"]));
test("B4.4B noncapture processed event does not require financial transaction",()=>assert.deepEqual(reasons(receipt({eventType:"payment.failed",gatewayPaymentId:null})),[]));
test("B4.4B never mutates source financial records",()=>{
 const r=receipt({processed:false});const before=JSON.stringify(r);classifyWebhookExceptions([r],[success],[sync],NOW);assert.equal(JSON.stringify(r),before);
});
