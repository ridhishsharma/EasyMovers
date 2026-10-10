// B4.4B pure, read-only webhook exception classification.
export type Receipt={id:string;eventType:string;processed:boolean;errorCode:string|null;receivedAt:Date;paymentId:string|null;gatewayPaymentId:string|null};
export type Success={id:string;paymentId:string;gatewayPaymentId:string|null};
export type BookingSync={paymentId:string;status:string};
export type Exception={receiptId:string;reason:string;ageMinutes:number;paymentId:string|null;nextAction:"INVESTIGATE_RETRY"|"MANUAL_REVIEW"};
export function classifyWebhookExceptions(receipts:Receipt[],transactions:Success[],syncs:BookingSync[],now:number):Exception[]{
 const byGateway=new Map(transactions.filter(t=>t.gatewayPaymentId).map(t=>[t.gatewayPaymentId,t]));
 const bySync=new Map(syncs.map(s=>[s.paymentId,s]));
 return receipts.flatMap(r=>{
  const reasons:string[]=[];
  const ageMs=now-r.receivedAt.getTime();
  if(!r.processed)reasons.push("UNPROCESSED_RECEIPT");
  if(!r.processed&&ageMs>15*60*1000)reasons.push("STALE_UNPROCESSED_RECEIPT");
  if(r.errorCode)reasons.push("RECORDED_WEBHOOK_ERROR");
  const txn=r.gatewayPaymentId?byGateway.get(r.gatewayPaymentId):undefined;
  if(r.processed&&r.eventType==="payment.captured"&&(!txn||txn.paymentId!==r.paymentId))
   reasons.push("PROCESSED_CAPTURE_MISSING_SUCCESSFUL_TRANSACTION");
  if(r.eventType==="payment.captured"&&r.paymentId){
   const sync=bySync.get(r.paymentId);
   if(txn&&txn.paymentId===r.paymentId&&!sync)reasons.push("SUCCESSFUL_CAPTURE_MISSING_BOOKING_SYNC");
   else if(txn&&txn.paymentId===r.paymentId&&sync&&sync.status!=="SYNCHRONIZED")reasons.push("BOOKING_SYNC_NOT_COMPLETE");
  }
  return reasons.map(reason=>({receiptId:r.id,reason,ageMinutes:Math.max(0,Math.floor(ageMs/60000)),paymentId:r.paymentId,
   nextAction:reason==="STALE_UNPROCESSED_RECEIPT"?"INVESTIGATE_RETRY" as const:"MANUAL_REVIEW" as const}));
 });
}
