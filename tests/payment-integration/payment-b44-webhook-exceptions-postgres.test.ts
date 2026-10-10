import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {PrismaClient,PaymentProvider} from "@prisma/client";
import {classifyWebhookExceptions} from "../../scripts/payment-b44-webhook-exception-rules";
assert.equal(process.env.PAYMENT_INTEGRATION_TEST,"1");
assert.ok(process.env.DATABASE_URL);
assert.equal(process.env.DATABASE_URL,process.env.TEST_DATABASE_URL);
const url=new URL(process.env.DATABASE_URL);
assert.ok(["postgres:","postgresql:"].includes(url.protocol));
assert.equal(url.hostname,"127.0.0.1");
assert.equal(url.port,"5432");
assert.equal(url.pathname,"/easymovers_payment_test");
assert.equal(decodeURIComponent(url.username),"easymovers_test_user");
assert.ok(url.password);
assert.deepEqual([...url.searchParams.entries()],[["schema","public"]]);
assert.equal(url.hash,"");

test("B4.4B.3 real PostgreSQL detects controlled webhook exceptions without mutation",async()=>{
 const prisma=new PrismaClient();
 const suffix=randomUUID().replace(/-/g,"");
 let leadId:string|undefined,bookingId:string|undefined,paymentId:string|undefined;
 try{
  const lead=await prisma.lead.create({data:{referenceId:`EM-B44B3-LEAD-${suffix}`,name:"B44B3 Audit Fixture",mobile:"9000000000"}});
  leadId=lead.id;
  const booking=await prisma.booking.create({data:{
   bookingNumber:`EM-B44B3-${suffix}`,leadId:lead.id,leadReferenceId:lead.referenceId,
   customerName:"B44B3 Audit Fixture",customerMobile:"9000000000",
   serviceType:"HOUSEHOLD_SHIFTING",moveType:"WITHIN_CITY",moveDate:new Date("2027-01-01T09:00:00Z"),
   pickupCity:"Bhopal",pickupState:"MP",pickupPincode:"462001",
   dropCity:"Bhopal",dropState:"MP",dropPincode:"462001",
   pickupAddress:"Integration Test Pickup",dropAddress:"Integration Test Drop",
   contactJson:{},pickupAddressJson:{},dropAddressJson:{},scheduleJson:{},
   inventoryJson:[],inventorySummaryJson:{},servicesJson:{},timelineJson:[],auditJson:[],totalAmount:1000,
  }});
  bookingId=booking.id;
  const payment=await prisma.payment.create({data:{
   paymentNumber:`EMP-B44B3-${suffix}`,bookingId:booking.id,amount:1000,totalAmount:1000,
   paidAmount:400,balanceAmount:600,paymentPending:600,currency:"INR",paymentStatus:"PARTIALLY_PAID",
  }});
  paymentId=payment.id;
  const gatewayPaymentId=`pay_B44B3_${suffix}`,gatewayOrderId=`order_B44B3_${suffix}`;
  const transaction=await prisma.paymentTransaction.create({data:{
   paymentId:payment.id,transactionType:"COLLECTION",amount:400,status:"SUCCESS",
   provider:PaymentProvider.RAZORPAY,gatewayPaymentId,gatewayOrderId,currency:"INR",
  }});
  const createReceipt=(key:string,processed:boolean,ageMinutes:number,extra:Record<string,unknown>={})=>
   prisma.paymentWebhook.create({data:{
    webhookId:`B44B3-${key}-${suffix}`,provider:PaymentProvider.RAZORPAY,
    providerEventId:`evt_B44B3_${key}_${suffix}`,eventType:"payment.captured",
    paymentId:payment.id,gatewayPaymentId,gatewayOrderId,processed,
    receivedAt:new Date(Date.now()-ageMinutes*60000),...extra,
   }});
  const healthy=await createReceipt("healthy",true,1);
  const stale=await createReceipt("stale",false,30);
  const broken=await createReceipt("broken",true,1,{gatewayPaymentId:`pay_missing_${suffix}`});
  const receipts=await prisma.paymentWebhook.findMany({where:{id:{in:[healthy.id,stale.id,broken.id]}},
   select:{id:true,eventType:true,processed:true,errorCode:true,receivedAt:true,paymentId:true,gatewayPaymentId:true}});
  const transactions=await prisma.paymentTransaction.findMany({where:{paymentId:payment.id,status:"SUCCESS"},
   select:{id:true,paymentId:true,gatewayPaymentId:true}});
  const syncs=await prisma.paymentBookingSync.findMany({where:{paymentId:payment.id},select:{paymentId:true,status:true}});
  const before=JSON.stringify({receipts,transactions,syncs});
  const exceptions=classifyWebhookExceptions(receipts,transactions,syncs,Date.now());
  const has=(id:string,reason:string)=>exceptions.some(x=>x.receiptId===id&&x.reason===reason);
  assert.equal(exceptions.filter(x=>x.receiptId===healthy.id).some(x=>x.reason==="UNPROCESSED_RECEIPT"),false);
  assert.ok(has(stale.id,"UNPROCESSED_RECEIPT"));
  assert.ok(has(stale.id,"STALE_UNPROCESSED_RECEIPT"));
  assert.ok(has(broken.id,"PROCESSED_CAPTURE_MISSING_SUCCESSFUL_TRANSACTION"));
  assert.ok(has(healthy.id,"SUCCESSFUL_CAPTURE_MISSING_BOOKING_SYNC"));
  const after=JSON.stringify({
   receipts:await prisma.paymentWebhook.findMany({where:{id:{in:[healthy.id,stale.id,broken.id]}},
    select:{id:true,eventType:true,processed:true,errorCode:true,receivedAt:true,paymentId:true,gatewayPaymentId:true}}),
   transactions:await prisma.paymentTransaction.findMany({where:{paymentId:payment.id,status:"SUCCESS"},
    select:{id:true,paymentId:true,gatewayPaymentId:true}}),
   syncs:await prisma.paymentBookingSync.findMany({where:{paymentId:payment.id},select:{paymentId:true,status:true}}),
  });
  assert.equal(after,before,"Read-only classifier must not change database rows");
  assert.equal(await prisma.paymentTransaction.count({where:{paymentId:payment.id}}),1);
  assert.equal(transaction.paymentId,payment.id);
  console.log("B4.4B.3 verified populated PostgreSQL anomaly classification and unchanged financial records");
 }finally{
  try{
   if(paymentId){
    await prisma.paymentWebhook.deleteMany({where:{paymentId}});
    await prisma.payment.deleteMany({where:{id:paymentId}});
   }
   if(bookingId)await prisma.booking.deleteMany({where:{id:bookingId}});
   if(leadId)await prisma.lead.deleteMany({where:{id:leadId}});
  }finally{await prisma.$disconnect();}
 }
});
