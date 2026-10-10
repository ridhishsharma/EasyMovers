import assert from "node:assert/strict";
import { PrismaClient, PaymentProvider } from "@prisma/client";
import { classifyWebhookExceptions } from "./payment-b44-webhook-exception-rules";

// B4.4B read-only webhook exception audit.
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
  const exceptions=classifyWebhookExceptions(receipts,transactions,syncs,Date.now());
  console.log(JSON.stringify({audit:"B4.4B_READ_ONLY_WEBHOOK_EXCEPTIONS",totals:{receipts:receipts.length,exceptions:exceptions.length},exceptions:exceptions.slice(0,100)},null,2));
  assert.equal(exceptions.length,0,"Webhook exceptions require review; no financial records modified");
 }finally{await prisma.$disconnect();}
}
main().catch(error=>{console.error("B4.4B webhook exception audit failed:",error);process.exitCode=1;});
