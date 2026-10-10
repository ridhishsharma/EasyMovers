import assert from "node:assert/strict";
import { PrismaClient, PaymentProvider } from "@prisma/client";

// B4.4A read-only financial reconciliation audit.
// Isolated test DB ONLY. No writes, no external gateway calls, no secrets in output.
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1", "Use payment integration runner");
assert.ok(process.env.DATABASE_URL);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const url = new URL(process.env.DATABASE_URL);
assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5432");
assert.equal(url.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(url.username), "easymovers_test_user");
assert.ok(url.password);
assert.deepEqual([...url.searchParams.entries()], [["schema", "public"]]);
assert.equal(url.hash, "");


async function main(): Promise<void> {
 const prisma=new PrismaClient();
 try {
  const receipts=await prisma.paymentWebhook.findMany({
   where:{provider:PaymentProvider.RAZORPAY},
   select:{id:true,eventType:true,processed:true,errorCode:true,receivedAt:true,processedAt:true,paymentId:true,transactionId:true,gatewayPaymentId:true,gatewayOrderId:true}
  });
  const paymentIds=[...new Set(receipts.map(r=>r.paymentId).filter((v):v is string=>Boolean(v)))];
  const transactions=await prisma.paymentTransaction.findMany({
   where:{paymentId:{in:paymentIds},status:"SUCCESS"},
   select:{id:true,paymentId:true,gatewayPaymentId:true}
  });
  const syncs=await prisma.paymentBookingSync.findMany({
   where:{paymentId:{in:paymentIds}},
   select:{paymentId:true,status:true,attemptCount:true,nextRetryAt:true,lastErrorCode:true}
  });
  const byGateway=new Map(transactions.filter(t=>t.gatewayPaymentId).map(t=>[t.gatewayPaymentId,t]));
  const bySync=new Map(syncs.map(s=>[s.paymentId,s]));
  const now=Date.now();
  const exceptions=receipts.flatMap(r=>{
   const reasons:string[]=[];
   if(!r.processed)reasons.push("UNPROCESSED_RECEIPT");
   if(!r.processed&&now-r.receivedAt.getTime()>15*60*1000)reasons.push("STALE_UNPROCESSED_RECEIPT");
   if(r.errorCode)reasons.push("RECORDED_WEBHOOK_ERROR");
   const txn=r.gatewayPaymentId?byGateway.get(r.gatewayPaymentId):undefined;
   if(r.processed&&r.eventType==="payment.captured"&&(!txn||txn.paymentId!==r.paymentId))reasons.push("PROCESSED_CAPTURE_MISSING_SUCCESSFUL_TRANSACTION");
   if(r.eventType==="payment.captured"&&r.paymentId){
    const sync=bySync.get(r.paymentId);
    if(txn&&!sync)reasons.push("SUCCESSFUL_CAPTURE_MISSING_BOOKING_SYNC");
    else if(sync&&sync.status!=="SYNCHRONIZED")reasons.push("BOOKING_SYNC_NOT_COMPLETE");
   }
   return reasons.map(reason=>({receiptId:r.id,reason,ageMinutes:Math.floor((now-r.receivedAt.getTime())/60000),paymentId:r.paymentId,
    nextAction:reason==="STALE_UNPROCESSED_RECEIPT"?"INVESTIGATE_RETRY":"MANUAL_REVIEW"}));
  });
  console.log(JSON.stringify({audit:"B4.4B_READ_ONLY_WEBHOOK_EXCEPTIONS",totals:{receipts:receipts.length,exceptions:exceptions.length},exceptions:exceptions.slice(0,100)},null,2));
  assert.equal(exceptions.length,0,"Webhook exceptions require review; no financial records modified");
 }finally{await prisma.$disconnect();}
}
main().catch(error=>{console.error("B4.4B webhook exception audit failed:",error);process.exitCode=1;});
