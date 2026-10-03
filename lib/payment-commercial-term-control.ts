import { CommercialTaxTreatment, CommercialTermRequestStatus, Prisma, QuotationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveFinancialBusinessSegment } from "@/lib/financial-business-segment";

export class CommercialTermError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) { super(message); this.name = "CommercialTermError"; }
}

const asRecord = (value: Prisma.JsonValue | null) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
const numeric = (value: unknown) => { const result = Number(value); return Number.isFinite(result) ? result : null; };
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const decimal = (value: number) => new Prisma.Decimal(value.toFixed(2));
const rateDecimal = (value: number) => new Prisma.Decimal(value.toFixed(4));
const text = (value: unknown, limit = 100) => typeof value === "string" ? value.trim().slice(0, limit) || null : null;
const note = (value: unknown, required = false) => { const result = text(value, 1000); if (required && !result) throw new CommercialTermError("REVIEW_NOTE_REQUIRED", "Enter a reason before rejecting the commission request.", 400); return result; };
const locked = (value: Prisma.JsonValue | null) => numeric(asRecord(value).platformCommissionAmount) !== null;
const validGstin = (value: unknown) => { const result = text(value, 15)?.toUpperCase() || null; return result && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(result) ? result : null; };

export function calculateCommercialTaxes(input: { commissionBase:number;commissionRate:number;gstTreatment:CommercialTaxTreatment;gstRate:number;tcsApplicable:boolean;tcsRate:number;tcsBase:number }) {
  const platformCommissionAmount = round(input.commissionBase * input.commissionRate / 100);
  const gst = round(platformCommissionAmount * input.gstRate / 100);
  const cgstAmount = input.gstTreatment === CommercialTaxTreatment.CGST_SGST ? round(gst / 2) : 0;
  const sgstAmount = input.gstTreatment === CommercialTaxTreatment.CGST_SGST ? round(gst - cgstAmount) : 0;
  const igstAmount = input.gstTreatment === CommercialTaxTreatment.IGST ? gst : 0;
  const tcsAmount = input.tcsApplicable ? round(input.tcsBase * input.tcsRate / 100) : 0;
  const totalGstAmount = round(cgstAmount + sgstAmount + igstAmount);
  const platformInvoiceAmount = round(platformCommissionAmount + totalGstAmount);
  return { platformCommissionAmount, cgstAmount, sgstAmount, igstAmount, totalGstAmount, platformInvoiceAmount, tcsAmount, totalSettlementDeduction: round(platformInvoiceAmount + tcsAmount) };
}

async function audit(tx: Prisma.TransactionClient, actorUserId:string, action:string, entityId:string, metadata?:Prisma.InputJsonValue) {
  await tx.crmAuditLog.create({ data: { actorUserId, action, entityType: "PaymentCommercialTermRequest", entityId, metadata } });
}

const requestSelection = {
  id:true,paymentId:true,vendorId:true,quotationId:true,businessSegment:true,customerPayableAmount:true,vendorQuotedAmount:true,platformCommissionAmount:true,
  commissionRate:true,commissionBase:true,gstTreatment:true,gstRate:true,cgstAmount:true,sgstAmount:true,igstAmount:true,tcsApplicable:true,tcsRate:true,tcsBase:true,tcsAmount:true,
  placeOfSupplyState:true,vendorGstinSnapshot:true,easymoversGstinSnapshot:true,taxOverrideReason:true,revisedFromId:true,revisionNumber:true,currency:true,status:true,
  submissionNote:true,reviewNote:true,submittedBy:true,reviewedBy:true,submittedAt:true,reviewedAt:true,appliedAt:true,
  vendor:{select:{vendorCode:true,companyName:true}},payment:{select:{paymentNumber:true,booking:{select:{bookingNumber:true}}}},quotation:{select:{quotationNumber:true}},
} satisfies Prisma.PaymentCommercialTermRequestSelect;

export async function getCommercialTermWorkspace(status: CommercialTermRequestStatus = CommercialTermRequestStatus.PENDING) {
  const [payments, requests] = await Promise.all([
    prisma.payment.findMany({ where:{quotationId:{not:null}},orderBy:{updatedAt:"desc"},take:200,select:{
      id:true,paymentNumber:true,totalAmount:true,currency:true,commercialReference:true,booking:{select:{bookingNumber:true,selectedQuotationId:true}},
      quotation:{select:{id:true,quotationNumber:true,status:true,vendorId:true,totalAmount:true,currency:true,vendor:{select:{vendorCode:true,companyName:true,gstNumber:true,state:true}}}},
      commercialTermRequests:{where:{status:CommercialTermRequestStatus.PENDING},select:{id:true}},
    }}),
    prisma.paymentCommercialTermRequest.findMany({where:{status},orderBy:{submittedAt:"asc"},take:200,select:requestSelection}),
  ]);
  const candidates = payments.flatMap(payment => {
    const quotation = payment.quotation;
    if (!quotation || quotation.status !== QuotationStatus.ACCEPTED || payment.booking.selectedQuotationId !== quotation.id || locked(payment.commercialReference) || payment.commercialTermRequests.length) return [];
    return [{ paymentId:payment.id,paymentNumber:payment.paymentNumber,bookingNumber:payment.booking.bookingNumber,customerPayableAmount:Number(payment.totalAmount),currency:payment.currency,quotationId:quotation.id,quotationNumber:quotation.quotationNumber,vendorId:quotation.vendorId,vendorQuotedAmount:Number(quotation.totalAmount),vendor:quotation.vendor }];
  });
  return { candidates, requests };
}

type SubmitInput = { paymentId:string;commissionRate:unknown;gstTreatment:unknown;gstRate:unknown;tcsApplicable?:unknown;tcsRate?:unknown;placeOfSupplyState?:unknown;taxOverrideReason?:unknown;revisedFromId?:unknown;submissionNote?:unknown;actorUserId:string };

export async function submitCommercialTermRequest(input: SubmitInput) {
  const commissionRate=numeric(input.commissionRate), gstRate=numeric(input.gstRate), tcsApplicable=input.tcsApplicable===true, tcsRate=tcsApplicable?numeric(input.tcsRate):0;
  const gstTreatment=String(input.gstTreatment||"").toUpperCase() as CommercialTaxTreatment;
  if (commissionRate===null||commissionRate<0||commissionRate>100) throw new CommercialTermError("INVALID_COMMISSION_RATE","Commission rate must be between 0% and 100%.",400);
  if (!Object.values(CommercialTaxTreatment).includes(gstTreatment)||gstTreatment===CommercialTaxTreatment.PENDING_REVIEW) throw new CommercialTermError("INVALID_GST_TREATMENT","Select CGST + SGST, IGST or Not applicable.",400);
  if (gstRate===null||gstRate<0||gstRate>100) throw new CommercialTermError("INVALID_GST_RATE","GST rate must be between 0% and 100%.",400);
  if (gstTreatment===CommercialTaxTreatment.NOT_APPLICABLE&&gstRate!==0) throw new CommercialTermError("GST_NOT_APPLICABLE","GST rate must be zero when GST is not applicable.",400);
  if (tcsRate===null||tcsRate<0||tcsRate>100) throw new CommercialTermError("INVALID_TCS_RATE","TCS rate must be between 0% and 100%.",400);
  const taxOverrideReason=text(input.taxOverrideReason,500);
  if (gstTreatment===CommercialTaxTreatment.NOT_APPLICABLE&&!taxOverrideReason) throw new CommercialTermError("TAX_REASON_REQUIRED","Record the reason when GST is not applicable.",400);

  return prisma.$transaction(async tx => {
    const payment=await tx.payment.findUnique({where:{id:input.paymentId},select:{id:true,totalAmount:true,currency:true,commercialReference:true,businessSegment:true,metadata:true,booking:{select:{selectedQuotationId:true,serviceType:true,moveType:true,requirementsJson:true}},quotation:{select:{id:true,quotationNumber:true,status:true,vendorId:true,totalAmount:true,pricingBreakdown:true,vendor:{select:{gstNumber:true,state:true}}}}}});
    if (!payment?.quotation) throw new CommercialTermError("PAYMENT_NOT_ELIGIBLE","Select a payment linked to an accepted vendor quotation.",404);
    if (payment.quotation.status!==QuotationStatus.ACCEPTED||payment.booking.selectedQuotationId!==payment.quotation.id) throw new CommercialTermError("QUOTATION_NOT_ACCEPTED","Commission can be locked only for the booking's accepted quotation.",409);
    if (locked(payment.commercialReference)) throw new CommercialTermError("COMMISSION_ALREADY_LOCKED","Commission is already locked for this payment.",409);
    if (await tx.paymentCommercialTermRequest.findFirst({where:{paymentId:payment.id,status:CommercialTermRequestStatus.PENDING},select:{id:true}})) throw new CommercialTermError("COMMISSION_REQUEST_PENDING","A commission request is already awaiting checker approval.",409);
    const revisedFromId=text(input.revisedFromId,64);
    const previous=revisedFromId?await tx.paymentCommercialTermRequest.findUnique({where:{id:revisedFromId},select:{id:true,paymentId:true,status:true,revisionNumber:true}}):null;
    if (revisedFromId&&(!previous||previous.paymentId!==payment.id||previous.status!==CommercialTermRequestStatus.REJECTED)) throw new CommercialTermError("INVALID_REVISION_SOURCE","Only a rejected request for the same payment can be revised.",409);
    const commissionBase=Number(payment.quotation.totalAmount);
    const businessSegment=payment.businessSegment??deriveFinancialBusinessSegment({serviceType:payment.booking.serviceType,moveType:payment.booking.moveType,requirementsJson:payment.booking.requirementsJson,paymentMetadata:payment.metadata,pricingBreakdown:payment.quotation.pricingBreakdown});
    const taxes=calculateCommercialTaxes({commissionBase,commissionRate,gstTreatment,gstRate,tcsApplicable,tcsRate:tcsRate||0,tcsBase:commissionBase});
    if (taxes.totalSettlementDeduction>commissionBase) throw new CommercialTermError("DEDUCTIONS_EXCEED_QUOTE","Commission, GST and TCS deductions cannot exceed the vendor quotation.",400);
    const request=await tx.paymentCommercialTermRequest.create({data:{paymentId:payment.id,vendorId:payment.quotation.vendorId,quotationId:payment.quotation.id,businessSegment,customerPayableAmount:payment.totalAmount,vendorQuotedAmount:payment.quotation.totalAmount,
      platformCommissionAmount:decimal(taxes.platformCommissionAmount),commissionRate:rateDecimal(commissionRate),commissionBase:decimal(commissionBase),gstTreatment,gstRate:rateDecimal(gstTreatment===CommercialTaxTreatment.NOT_APPLICABLE?0:gstRate),
      cgstAmount:decimal(taxes.cgstAmount),sgstAmount:decimal(taxes.sgstAmount),igstAmount:decimal(taxes.igstAmount),tcsApplicable,tcsRate:rateDecimal(tcsRate||0),tcsBase:decimal(commissionBase),tcsAmount:decimal(taxes.tcsAmount),
      placeOfSupplyState:text(input.placeOfSupplyState,100)||payment.quotation.vendor.state,vendorGstinSnapshot:validGstin(payment.quotation.vendor.gstNumber),easymoversGstinSnapshot:validGstin(process.env.EASYMOVERS_GSTIN),taxOverrideReason,
      revisedFromId:previous?.id,revisionNumber:previous?previous.revisionNumber+1:1,currency:payment.currency,submissionNote:note(input.submissionNote),submittedBy:input.actorUserId}});
    await audit(tx,input.actorUserId,previous?"COMMISSION_TERMS_REVISED":"COMMISSION_TERMS_SUBMITTED",request.id,{paymentId:payment.id,vendorId:payment.quotation.vendorId,commissionRate,...taxes,revisedFromId:previous?.id||null});
    return request;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function reviewCommercialTermRequest(input:{requestId:string;decision:"APPROVED"|"REJECTED";reviewNote?:unknown;actorUserId:string}) {
  return prisma.$transaction(async tx=>{
    const request=await tx.paymentCommercialTermRequest.findUnique({where:{id:input.requestId}});
    if(!request)throw new CommercialTermError("COMMISSION_REQUEST_NOT_FOUND","Commission request was not found.",404);
    if(request.status!==CommercialTermRequestStatus.PENDING)throw new CommercialTermError("COMMISSION_REQUEST_REVIEWED","This commission request has already been reviewed.",409);
    if(request.submittedBy===input.actorUserId)throw new CommercialTermError("MAKER_CANNOT_APPROVE","The maker cannot approve their own commission request.",403);
    const reviewNote=note(input.reviewNote,input.decision==="REJECTED"),now=new Date();
    if(input.decision==="REJECTED"){
      const changed=await tx.paymentCommercialTermRequest.updateMany({where:{id:request.id,status:CommercialTermRequestStatus.PENDING},data:{status:CommercialTermRequestStatus.REJECTED,reviewNote,reviewedBy:input.actorUserId,reviewedAt:now}});
      if(!changed.count)throw new CommercialTermError("COMMISSION_REQUEST_REVIEWED","Another checker already reviewed this request.",409);
      await audit(tx,input.actorUserId,"COMMISSION_TERMS_REJECTED",request.id);return tx.paymentCommercialTermRequest.findUniqueOrThrow({where:{id:request.id}});
    }
    const payment=await tx.payment.findUnique({where:{id:request.paymentId},select:{id:true,quotationId:true,totalAmount:true,currency:true,commercialReference:true,businessSegment:true,businessSegmentLockedAt:true,quotation:{select:{id:true,quotationNumber:true,vendorId:true,totalAmount:true,status:true}}}});
    if(!payment?.quotation||payment.quotationId!==request.quotationId||payment.quotation.vendorId!==request.vendorId)throw new CommercialTermError("COMMERCIAL_CONTEXT_CHANGED","Payment or quotation context changed; reject and submit a fresh request.",409);
    if(payment.quotation.status!==QuotationStatus.ACCEPTED||Number(payment.totalAmount)!==Number(request.customerPayableAmount)||Number(payment.quotation.totalAmount)!==Number(request.vendorQuotedAmount)||payment.currency!==request.currency)throw new CommercialTermError("COMMERCIAL_CONTEXT_CHANGED","Commercial amounts changed; reject and submit a fresh request.",409);
    if(locked(payment.commercialReference))throw new CommercialTermError("COMMISSION_ALREADY_LOCKED","Commission was already locked by another approved request.",409);
    const platformInvoiceAmount=round(Number(request.platformCommissionAmount)+Number(request.cgstAmount)+Number(request.sgstAmount)+Number(request.igstAmount));
    const totalSettlementDeduction=round(platformInvoiceAmount+Number(request.tcsAmount));
    if(payment.businessSegment&&payment.businessSegment!==request.businessSegment)throw new CommercialTermError("BUSINESS_SEGMENT_LOCKED","The payment business segment no longer matches this approval request.",409);
    await tx.payment.update({where:{id:payment.id},data:{businessSegment:request.businessSegment,businessSegmentLockedAt:payment.businessSegmentLockedAt??now,commercialReference:{...asRecord(payment.commercialReference),businessSegment:request.businessSegment,quotationId:payment.quotation.id,quotationNumber:payment.quotation.quotationNumber,customerPayableAmount:Number(request.customerPayableAmount),vendorQuotedAmount:Number(request.vendorQuotedAmount),platformCommissionAmount:Number(request.platformCommissionAmount),commissionRate:Number(request.commissionRate),commissionBase:Number(request.commissionBase),gstTreatment:request.gstTreatment,gstRate:Number(request.gstRate),cgstAmount:Number(request.cgstAmount),sgstAmount:Number(request.sgstAmount),igstAmount:Number(request.igstAmount),platformInvoiceAmount,tcsApplicable:request.tcsApplicable,tcsRate:Number(request.tcsRate),tcsBase:Number(request.tcsBase),tcsAmount:Number(request.tcsAmount),totalSettlementDeduction,placeOfSupplyState:request.placeOfSupplyState,vendorGstinSnapshot:request.vendorGstinSnapshot,easymoversGstinSnapshot:request.easymoversGstinSnapshot,commercialTermRequestId:request.id,commercialTermRevision:request.revisionNumber,currency:request.currency}}});
    const changed=await tx.paymentCommercialTermRequest.updateMany({where:{id:request.id,status:CommercialTermRequestStatus.PENDING},data:{status:CommercialTermRequestStatus.APPROVED,reviewNote,reviewedBy:input.actorUserId,reviewedAt:now,appliedAt:now}});
    if(!changed.count)throw new CommercialTermError("COMMISSION_REQUEST_REVIEWED","Another checker already reviewed this request.",409);
    await audit(tx,input.actorUserId,"COMMISSION_TERMS_APPROVED",request.id,{paymentId:payment.id,commission:Number(request.platformCommissionAmount),platformInvoiceAmount,totalSettlementDeduction});
    return tx.paymentCommercialTermRequest.findUniqueOrThrow({where:{id:request.id}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
