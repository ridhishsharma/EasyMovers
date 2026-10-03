import {createHash} from "node:crypto";
import {CommercialTermRequestStatus,PlatformFeeInvoiceStatus,Prisma,TrackingStatus} from "@prisma/client";
import {prisma} from "@/lib/prisma";

export class PlatformFeeInvoiceError extends Error{constructor(public readonly code:string,message:string,public readonly status:number){super(message);this.name="PlatformFeeInvoiceError";}}
const text=(value:unknown,limit=500)=>typeof value==="string"?value.trim().slice(0,limit):"";
const checksum=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const number=(value:unknown)=>Number(value).toFixed(2);
const completed=(status:string,tracking:TrackingStatus)=>["COMPLETED","DELIVERED","CLOSED"].includes(status.toUpperCase())||tracking===TrackingStatus.DELIVERY_COMPLETED;
export const financialYear=(date=new Date())=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric"}).formatToParts(date);const year=Number(parts.find(item=>item.type==="year")?.value),month=Number(parts.find(item=>item.type==="month")?.value);const start=month>=4?year:year-1;return`${start}-${String((start+1)%100).padStart(2,"0")}`;};
const supplier=()=>({legalName:text(process.env.EASYMOVERS_LEGAL_NAME,200),address:text(process.env.EASYMOVERS_REGISTERED_ADDRESS,500),gstin:text(process.env.EASYMOVERS_GSTIN,15).toUpperCase(),serviceAccountingCode:text(process.env.EASYMOVERS_COMMISSION_SAC,6)});
const supplierReady=()=>{const value=supplier();return!!value.legalName&&!!value.address&&/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.gstin)&&/^[0-9]{6}$/.test(value.serviceAccountingCode);};

const invoiceSelect={id:true,invoiceNumber:true,financialYear:true,sequenceNumber:true,status:true,paymentId:true,vendorId:true,commercialTermRequestId:true,businessSegment:true,bookingNumber:true,paymentNumber:true,quotationNumber:true,currency:true,commissionBase:true,commissionRate:true,taxableAmount:true,gstTreatment:true,gstRate:true,cgstAmount:true,sgstAmount:true,igstAmount:true,totalAmount:true,tcsApplicable:true,tcsRate:true,tcsBase:true,tcsAmount:true,placeOfSupplyState:true,supplierLegalName:true,supplierAddress:true,supplierGstin:true,serviceAccountingCode:true,vendorLegalName:true,vendorAddress:true,vendorGstin:true,vendorPan:true,issuedAt:true,serviceCompletedAt:true,snapshotChecksum:true,createdBy:true,issuedBy:true,createdAt:true} satisfies Prisma.PlatformFeeInvoiceSelect;

export async function getPlatformFeeInvoiceWorkspace(status?:PlatformFeeInvoiceStatus){
  const [terms,invoices]=await Promise.all([
    prisma.paymentCommercialTermRequest.findMany({where:{status:CommercialTermRequestStatus.APPROVED,platformFeeInvoice:null,payment:{OR:[{booking:{bookingStatus:{in:["COMPLETED","DELIVERED","CLOSED"],mode:"insensitive"}}},{booking:{trackingStatus:TrackingStatus.DELIVERY_COMPLETED}}]}},orderBy:{appliedAt:"desc"},take:200,select:{id:true,paymentId:true,businessSegment:true,platformCommissionAmount:true,cgstAmount:true,sgstAmount:true,igstAmount:true,currency:true,payment:{select:{paymentNumber:true,booking:{select:{bookingNumber:true,bookingStatus:true,trackingStatus:true}}}},vendor:{select:{vendorCode:true,companyName:true}}}}),
    prisma.platformFeeInvoice.findMany({where:status?{status}:undefined,orderBy:{createdAt:"desc"},take:200,select:invoiceSelect}),
  ]);
  return{supplierConfigured:supplierReady(),candidates:terms.map(term=>({...term,totalAmount:Number(term.platformCommissionAmount)+Number(term.cgstAmount)+Number(term.sgstAmount)+Number(term.igstAmount)})),invoices};
}

export async function createPlatformFeeInvoiceDraft(input:{commercialTermRequestId:string;actorUserId:string}){
  if(!supplierReady())throw new PlatformFeeInvoiceError("SUPPLIER_TAX_PROFILE_INCOMPLETE","Configure EASYMOVERS_LEGAL_NAME, EASYMOVERS_REGISTERED_ADDRESS, a valid EASYMOVERS_GSTIN and six-digit EASYMOVERS_COMMISSION_SAC before creating invoices.",409);
  return prisma.$transaction(async tx=>{
    const term=await tx.paymentCommercialTermRequest.findUnique({where:{id:input.commercialTermRequestId},include:{platformFeeInvoice:true,payment:{include:{booking:true}},quotation:{select:{quotationNumber:true}},vendor:{select:{companyName:true,address:true,city:true,state:true,pincode:true,gstNumber:true,panNumber:true}}}});
    if(!term||term.status!==CommercialTermRequestStatus.APPROVED||!term.appliedAt)throw new PlatformFeeInvoiceError("APPROVED_TERMS_REQUIRED","An approved commission and tax snapshot is required.",409);
    if(term.platformFeeInvoice)throw new PlatformFeeInvoiceError("INVOICE_ALREADY_EXISTS","A platform-fee invoice already exists for this commission approval.",409);
    if(!completed(term.payment.booking.bookingStatus,term.payment.booking.trackingStatus))throw new PlatformFeeInvoiceError("SERVICE_NOT_COMPLETED","Issue eligibility begins only after the move is recorded as completed.",409);
    const profile=supplier(),vendorAddress=[term.vendor.address,term.vendor.city,term.vendor.state,term.vendor.pincode].filter(Boolean).join(", ");
    if(!vendorAddress)throw new PlatformFeeInvoiceError("VENDOR_BILLING_ADDRESS_REQUIRED","Add the vendor billing address before creating the invoice.",409);
    const base={financialYear:financialYear(),paymentId:term.paymentId,vendorId:term.vendorId,commercialTermRequestId:term.id,businessSegment:term.businessSegment,bookingNumber:term.payment.booking.bookingNumber,paymentNumber:term.payment.paymentNumber,quotationNumber:term.quotation.quotationNumber,currency:term.currency,commissionBase:number(term.commissionBase),commissionRate:String(term.commissionRate),taxableAmount:number(term.platformCommissionAmount),gstTreatment:term.gstTreatment,gstRate:String(term.gstRate),cgstAmount:number(term.cgstAmount),sgstAmount:number(term.sgstAmount),igstAmount:number(term.igstAmount),totalAmount:number(Number(term.platformCommissionAmount)+Number(term.cgstAmount)+Number(term.sgstAmount)+Number(term.igstAmount)),tcsApplicable:term.tcsApplicable,tcsRate:String(term.tcsRate),tcsBase:number(term.tcsBase),tcsAmount:number(term.tcsAmount),placeOfSupplyState:term.placeOfSupplyState,supplierLegalName:profile.legalName,supplierAddress:profile.address,supplierGstin:profile.gstin,serviceAccountingCode:profile.serviceAccountingCode,vendorLegalName:term.vendor.companyName,vendorAddress,vendorGstin:term.vendor.gstNumber,vendorPan:term.vendor.panNumber,serviceCompletedAt:term.payment.booking.updatedAt.toISOString()};
    const draft=await tx.platformFeeInvoice.create({data:{...base,commissionBase:new Prisma.Decimal(base.commissionBase),commissionRate:new Prisma.Decimal(base.commissionRate),taxableAmount:new Prisma.Decimal(base.taxableAmount),gstRate:new Prisma.Decimal(base.gstRate),cgstAmount:new Prisma.Decimal(base.cgstAmount),sgstAmount:new Prisma.Decimal(base.sgstAmount),igstAmount:new Prisma.Decimal(base.igstAmount),totalAmount:new Prisma.Decimal(base.totalAmount),tcsRate:new Prisma.Decimal(base.tcsRate),tcsBase:new Prisma.Decimal(base.tcsBase),tcsAmount:new Prisma.Decimal(base.tcsAmount),serviceCompletedAt:new Date(base.serviceCompletedAt),snapshotJson:base,snapshotChecksum:checksum(base),createdBy:input.actorUserId}});
    await tx.crmAuditLog.create({data:{actorUserId:input.actorUserId,action:"PLATFORM_FEE_INVOICE_DRAFTED",entityType:"PlatformFeeInvoice",entityId:draft.id,metadata:{paymentId:term.paymentId,vendorId:term.vendorId,checksum:draft.snapshotChecksum}}});
    return draft;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function issuePlatformFeeInvoice(input:{invoiceId:string;actorUserId:string}){
  return prisma.$transaction(async tx=>{
    const current=await tx.platformFeeInvoice.findUnique({where:{id:input.invoiceId}});
    if(!current)throw new PlatformFeeInvoiceError("INVOICE_NOT_FOUND","Platform-fee invoice was not found.",404);
    if(current.status!==PlatformFeeInvoiceStatus.DRAFT)throw new PlatformFeeInvoiceError("INVOICE_ALREADY_FINAL","Only a draft invoice can be issued.",409);
    if(current.createdBy===input.actorUserId)throw new PlatformFeeInvoiceError("MAKER_CANNOT_ISSUE","The maker cannot issue their own platform-fee invoice.",403);
    const year=financialYear(),sequence=await tx.financialDocumentSequence.upsert({where:{financialYear_documentType:{financialYear:year,documentType:"PLATFORM_FEE"}},create:{id:`PLATFORM_FEE:${year}`,financialYear:year,documentType:"PLATFORM_FEE",nextNumber:2},update:{nextNumber:{increment:1}}});
    const sequenceNumber=sequence.nextNumber-1;if(sequenceNumber>99999)throw new PlatformFeeInvoiceError("INVOICE_SEQUENCE_EXHAUSTED","The annual platform-fee invoice sequence is exhausted.",409);
    const invoiceNumber=`EMPF/${year.slice(2)}/${String(sequenceNumber).padStart(5,"0")}`;
    const issuedAt=new Date();
    const snapshot={invoiceNumber,financialYear:year,sequenceNumber,issuedAt:issuedAt.toISOString(),bookingNumber:current.bookingNumber,paymentNumber:current.paymentNumber,quotationNumber:current.quotationNumber,businessSegment:current.businessSegment,currency:current.currency,commissionBase:number(current.commissionBase),commissionRate:String(current.commissionRate),taxableAmount:number(current.taxableAmount),gstTreatment:current.gstTreatment,gstRate:String(current.gstRate),cgstAmount:number(current.cgstAmount),sgstAmount:number(current.sgstAmount),igstAmount:number(current.igstAmount),totalAmount:number(current.totalAmount),tcsApplicable:current.tcsApplicable,tcsRate:String(current.tcsRate),tcsBase:number(current.tcsBase),tcsAmount:number(current.tcsAmount),placeOfSupplyState:current.placeOfSupplyState,supplierLegalName:current.supplierLegalName,supplierAddress:current.supplierAddress,supplierGstin:current.supplierGstin,serviceAccountingCode:current.serviceAccountingCode,vendorLegalName:current.vendorLegalName,vendorAddress:current.vendorAddress,vendorGstin:current.vendorGstin,vendorPan:current.vendorPan,serviceCompletedAt:current.serviceCompletedAt.toISOString()};
    const changed=await tx.platformFeeInvoice.updateMany({where:{id:current.id,status:PlatformFeeInvoiceStatus.DRAFT},data:{invoiceNumber,financialYear:year,sequenceNumber,status:PlatformFeeInvoiceStatus.ISSUED,issuedAt,issuedBy:input.actorUserId,snapshotJson:snapshot,snapshotChecksum:checksum(snapshot)}});
    if(!changed.count)throw new PlatformFeeInvoiceError("INVOICE_ALREADY_FINAL","Another checker already issued this invoice.",409);
    await tx.crmAuditLog.create({data:{actorUserId:input.actorUserId,action:"PLATFORM_FEE_INVOICE_ISSUED",entityType:"PlatformFeeInvoice",entityId:current.id,metadata:{invoiceNumber,sequenceNumber,financialYear:year}}});
    return tx.platformFeeInvoice.findUniqueOrThrow({where:{id:current.id},select:invoiceSelect});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function getIssuedPlatformFeeInvoice(invoiceId:string){
  const invoice=await prisma.platformFeeInvoice.findUnique({where:{id:invoiceId},select:{...invoiceSelect,snapshotJson:true}});
  if(!invoice)throw new PlatformFeeInvoiceError("INVOICE_NOT_FOUND","Platform-fee invoice was not found.",404);
  if(invoice.status!==PlatformFeeInvoiceStatus.ISSUED)throw new PlatformFeeInvoiceError("INVOICE_NOT_ISSUED","PDF and CSV are available only after checker issuance.",409);
  if(checksum(invoice.snapshotJson)!==invoice.snapshotChecksum)throw new PlatformFeeInvoiceError("INVOICE_INTEGRITY_FAILED","Invoice snapshot integrity validation failed.",409);
  return invoice;
}
