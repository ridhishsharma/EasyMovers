import { FinancialBusinessSegment, PaymentTransactionStatus, PaymentTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveFinancialBusinessSegment } from "@/lib/financial-business-segment";

export class FinanceReportError extends Error {
  constructor(public readonly code:string,message:string,public readonly status:number){super(message);this.name="FinanceReportError";}
}

const completedStatuses=[PaymentTransactionStatus.SUCCESS,PaymentTransactionStatus.CAPTURED];
const round=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const jsonRecord=(value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const amount=(value:unknown)=>{const parsed=Number(value);return Number.isFinite(parsed)&&parsed>=0?parsed:0;};

export function financialMonthRange(raw:string|null,now=new Date()){
  const fallback=`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`;
  const month=raw&&/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)?raw:fallback;
  if(raw&&month!==raw)throw new FinanceReportError("INVALID_FINANCIAL_MONTH","Month must use YYYY-MM format.",400);
  const [year,number]=month.split("-").map(Number);
  const start=new Date(`${month}-01T00:00:00+05:30`);
  const nextMonth=number===12?`${year+1}-01`:`${year}-${String(number+1).padStart(2,"0")}`;
  const end=new Date(`${nextMonth}-01T00:00:00+05:30`);
  return{month,start,end};
}

export async function getMonthlyCollections(input:{month:string|null;segment:string|null}){
  const range=financialMonthRange(input.month);
  const requested=input.segment?.toUpperCase()||"";
  if(requested&&!Object.values(FinancialBusinessSegment).includes(requested as FinancialBusinessSegment))throw new FinanceReportError("INVALID_BUSINESS_SEGMENT","Business segment is invalid.",400);
  const segment=requested as FinancialBusinessSegment||null;
  const period={gte:range.start,lt:range.end};
  const payments=await prisma.payment.findMany({
    where:{...(segment?{businessSegment:segment}:{}),OR:[
      {transactions:{some:{createdAt:period,status:{in:completedStatuses}}}},
      {commercialTermRequests:{some:{status:"APPROVED",appliedAt:period}}},
      {vendorSettlements:{some:{status:"SETTLED",settledAt:period}}},
    ]},orderBy:{updatedAt:"desc"},take:500,select:{
      id:true,paymentNumber:true,currency:true,totalAmount:true,paidAmount:true,balanceAmount:true,businessSegment:true,metadata:true,commercialReference:true,
      booking:{select:{bookingNumber:true,serviceType:true,moveType:true,pickupCity:true,pickupState:true,dropCity:true,dropState:true,requirementsJson:true}},
      quotation:{select:{pricingBreakdown:true,vendor:{select:{vendorCode:true,companyName:true}}}},
      transactions:{where:{createdAt:period,status:{in:completedStatuses}},select:{transactionType:true,amount:true,createdAt:true}},
      commercialTermRequests:{where:{status:"APPROVED",appliedAt:period},select:{platformCommissionAmount:true,cgstAmount:true,sgstAmount:true,igstAmount:true,tcsAmount:true,businessSegment:true,appliedAt:true}},
      vendorSettlements:{where:{status:"SETTLED"},select:{amount:true,settledAt:true}},
    },
  });
  const rows=payments.map(payment=>{
    const businessSegment=payment.businessSegment??deriveFinancialBusinessSegment({serviceType:payment.booking.serviceType,moveType:payment.booking.moveType,requirementsJson:payment.booking.requirementsJson,paymentMetadata:payment.metadata,pricingBreakdown:payment.quotation?.pricingBreakdown});
    const collections=payment.transactions.filter(item=>item.transactionType===PaymentTransactionType.COLLECTION).reduce((sum,item)=>sum+Number(item.amount),0);
    const refunds=payment.transactions.filter(item=>item.transactionType===PaymentTransactionType.REFUND).reduce((sum,item)=>sum+Number(item.amount),0);
    const terms=payment.commercialTermRequests[0];
    const commissionIncome=terms?Number(terms.platformCommissionAmount):0;
    const gst=terms?Number(terms.cgstAmount)+Number(terms.sgstAmount)+Number(terms.igstAmount):0;
    const tcs=terms?Number(terms.tcsAmount):0;
    const snapshot=jsonRecord(payment.commercialReference);
    const vendorQuoted=amount(snapshot.vendorQuotedAmount);
    const totalDeduction=amount(snapshot.totalSettlementDeduction);
    const vendorPayable=Math.max(0,vendorQuoted-totalDeduction);
    const settledTotal=payment.vendorSettlements.reduce((sum,item)=>sum+Number(item.amount),0);
    const settledInMonth=payment.vendorSettlements.filter(item=>item.settledAt&&item.settledAt>=range.start&&item.settledAt<range.end).reduce((sum,item)=>sum+Number(item.amount),0);
    return{id:payment.id,paymentNumber:payment.paymentNumber,bookingNumber:payment.booking.bookingNumber,businessSegment,serviceType:payment.booking.serviceType,moveType:payment.booking.moveType,route:`${payment.booking.pickupCity} → ${payment.booking.dropCity}`,vendor:payment.quotation?.vendor||null,currency:payment.currency,collections:round(collections),refunds:round(refunds),netCollections:round(collections-refunds),commissionIncome:round(commissionIncome),gst:round(gst),tcs:round(tcs),vendorPayable:round(vendorPayable),vendorSettledInMonth:round(settledInMonth),vendorOutstanding:round(Math.max(0,vendorPayable-settledTotal)),customerOutstanding:Number(payment.balanceAmount)};
  });
  const empty=()=>({bookings:0,collections:0,refunds:0,netCollections:0,commissionIncome:0,gst:0,tcs:0,vendorPayable:0,vendorSettledInMonth:0,vendorOutstanding:0,customerOutstanding:0});
  const bySegment=Object.fromEntries(Object.values(FinancialBusinessSegment).map(value=>[value,empty()])) as Record<FinancialBusinessSegment,ReturnType<typeof empty>>;
  const total=empty();
  for(const row of rows){for(const target of [total,bySegment[row.businessSegment]]){target.bookings+=1;for(const key of ["collections","refunds","netCollections","commissionIncome","gst","tcs","vendorPayable","vendorSettledInMonth","vendorOutstanding","customerOutstanding"] as const)target[key]=round(target[key]+row[key]);}}
  return{month:range.month,timezone:"Asia/Kolkata",segment,total,bySegment,rows,generatedAt:new Date().toISOString(),notes:{income:"EasyMovers income is approved commission excluding GST.",collections:"Collections and refunds use successful payment transactions recorded during the selected month.",gatewayCharges:"Gateway charges are excluded until provider fee records are persisted."}};
}
