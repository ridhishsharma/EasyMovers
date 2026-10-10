// Pure B4.4 reconciliation rules. Amounts are integer paise to avoid float drift.
export type PaymentRow = {id:string; bookingId:string; total:number; paid:number; balance:number};
export type TransactionRow = {id:string; paymentId:string; amount:number; provider:string; gatewayOrderId:string|null; gatewayPaymentId:string|null};
export type OrderRow = {paymentId:string; gatewayOrderId:string; amount:number};
export type ReceiptRow = {id:string; paymentId:string|null; gatewayPaymentId:string|null; gatewayOrderId:string|null; processed:boolean};
export type SyncRow = {paymentId:string; bookingId:string; status:string};
export type AuditData = {payments:PaymentRow[]; transactions:TransactionRow[]; orders:OrderRow[]; receipts:ReceiptRow[]; syncs:SyncRow[]};
export function reconcile(d:AuditData) {
 const p=new Map(d.payments.map(x=>[x.id,x]));
 const o=new Map(d.orders.map(x=>[x.gatewayOrderId,x]));
 const t=new Map(d.transactions.filter(x=>x.gatewayPaymentId).map(x=>[x.gatewayPaymentId,x]));
 const s=new Map(d.syncs.map(x=>[x.paymentId,x]));
 const findings=[
  {check:"invalid payment balances",ids:d.payments.filter(x=>x.paid<0||x.balance<0||x.total!==x.paid+x.balance).map(x=>x.id)},
  {check:"successful transactions missing payment",ids:d.transactions.filter(x=>!p.has(x.paymentId)).map(x=>x.id)},
  {check:"Razorpay successful transactions missing/mismatched order",ids:d.transactions.filter(x=>{if(x.provider!=="RAZORPAY")return false;const z=x.gatewayOrderId?o.get(x.gatewayOrderId):undefined;return !z||z.paymentId!==x.paymentId||z.amount!==x.amount}).map(x=>x.id)},
  {check:"processed capture receipts without matching successful transaction",ids:d.receipts.filter(x=>{if(!x.processed)return false;const z=x.gatewayPaymentId?t.get(x.gatewayPaymentId):undefined;return !z||z.paymentId!==x.paymentId||z.gatewayOrderId!==x.gatewayOrderId}).map(x=>x.id)},
  {check:"pending capture receipts",ids:d.receipts.filter(x=>!x.processed).map(x=>x.id)},
  {check:"successful gateway collections without booking sync",ids:d.transactions.filter(x=>x.provider==="RAZORPAY"&&!s.has(x.paymentId)).map(x=>x.id)},
  {check:"booking sync pointing to different booking",ids:d.syncs.filter(x=>{const z=p.get(x.paymentId);return !z||z.bookingId!==x.bookingId}).map(x=>x.paymentId)},
  {check:"non-synchronized booking projections",ids:d.syncs.filter(x=>x.status!=="SYNCHRONIZED").map(x=>x.paymentId)}
 ];
 return findings.map(x=>({check:x.check,count:x.ids.length,examples:x.ids.slice(0,5)}));
}
