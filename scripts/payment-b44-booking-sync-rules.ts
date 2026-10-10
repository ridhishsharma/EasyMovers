// B4.4C read-only booking synchronization recovery triage.
export type SyncState={paymentId:string;bookingId:string;status:string;attemptCount:number;nextRetryAt:Date|null;lastAttemptAt:Date|null;paymentUpdatedAt:Date;lastErrorCode:string|null};
export type PaymentState={id:string;bookingId:string;updatedAt:Date};
export function auditBookingSync(payments:PaymentState[],syncs:SyncState[],now:number){
 const byPayment=new Map(payments.map(p=>[p.id,p]));
 return syncs.flatMap(s=>{
  const reasons:string[]=[];
  const payment=byPayment.get(s.paymentId);
  if(!payment)reasons.push("MISSING_PAYMENT");
  else {
   if(payment.bookingId!==s.bookingId)reasons.push("BOOKING_ID_MISMATCH");
   if(s.paymentUpdatedAt.getTime()<payment.updatedAt.getTime())reasons.push("STALE_PAYMENT_PROJECTION");
  }
  if(s.status!=="SYNCHRONIZED"){
   reasons.push("SYNC_INCOMPLETE");
   if(s.nextRetryAt&&s.nextRetryAt.getTime()<=now)reasons.push("RETRY_DUE");
   if(s.attemptCount>=3)reasons.push("REPEATED_SYNC_FAILURE");
  }
  if(s.lastErrorCode)reasons.push("SYNC_ERROR_RECORDED");
  return reasons.map(reason=>({paymentId:s.paymentId,bookingId:s.bookingId,reason,action:"MANUAL_REVIEW" as const}));
 });
}
