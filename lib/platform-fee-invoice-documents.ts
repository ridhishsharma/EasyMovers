type InvoiceDocument={invoiceNumber:string|null;issuedAt:Date|null;financialYear:string;bookingNumber:string;paymentNumber:string;quotationNumber:string;businessSegment:string;currency:string;commissionBase:unknown;commissionRate:unknown;taxableAmount:unknown;gstTreatment:string;gstRate:unknown;cgstAmount:unknown;sgstAmount:unknown;igstAmount:unknown;totalAmount:unknown;tcsApplicable:boolean;tcsRate:unknown;tcsBase:unknown;tcsAmount:unknown;placeOfSupplyState:string|null;supplierLegalName:string;supplierAddress:string;supplierGstin:string|null;serviceAccountingCode:string;vendorLegalName:string;vendorAddress:string;vendorGstin:string|null;vendorPan:string|null;snapshotChecksum:string};
const money=(value:unknown)=>`INR ${Number(value).toFixed(2)}`;
const clean=(value:unknown)=>String(value??"").replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim();
const escapePdf=(value:string)=>clean(value).replaceAll("\\","\\\\").replaceAll("(","\\(").replaceAll(")","\\)");
const csv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;

export function platformFeeInvoiceCsv(invoice:InvoiceDocument){
  const fields: Array<[string,unknown]>=[
    ["Invoice number",invoice.invoiceNumber],["Invoice date",invoice.issuedAt?.toISOString()],["Financial year",invoice.financialYear],["Booking number",invoice.bookingNumber],["Payment number",invoice.paymentNumber],["Quotation number",invoice.quotationNumber],["Business segment",invoice.businessSegment],["Supplier",invoice.supplierLegalName],["Supplier GSTIN",invoice.supplierGstin],["SAC",invoice.serviceAccountingCode],["Vendor",invoice.vendorLegalName],["Vendor GSTIN",invoice.vendorGstin],["Vendor PAN",invoice.vendorPan],["Place of supply",invoice.placeOfSupplyState],["Commission base",invoice.commissionBase],["Commission rate %",invoice.commissionRate],["Taxable commission",invoice.taxableAmount],["GST treatment",invoice.gstTreatment],["GST rate %",invoice.gstRate],["CGST",invoice.cgstAmount],["SGST",invoice.sgstAmount],["IGST",invoice.igstAmount],["Invoice total",invoice.totalAmount],["TCS applicable",invoice.tcsApplicable],["TCS rate %",invoice.tcsRate],["TCS base",invoice.tcsBase],["TCS amount",invoice.tcsAmount],["Snapshot checksum",invoice.snapshotChecksum],
  ];
  return Buffer.from(`${fields.map(item=>csv(item[0])).join(",")}\r\n${fields.map(item=>csv(item[1])).join(",")}\r\n`,"utf8");
}

export function platformFeeInvoicePdf(invoice:InvoiceDocument){
  const lines=[
    ["EASYMOVERS - TAX INVOICE",16],[`Invoice: ${invoice.invoiceNumber}`,11],[`Date: ${invoice.issuedAt?.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}`,10],[`Financial year: ${invoice.financialYear}`,10],["",8],
    [`Supplier: ${invoice.supplierLegalName}`,11],[`Address: ${invoice.supplierAddress}`,9],[`GSTIN: ${invoice.supplierGstin||"Not recorded"}`,9],["",8],
    [`Bill to vendor: ${invoice.vendorLegalName}`,11],[`Address: ${invoice.vendorAddress}`,9],[`GSTIN: ${invoice.vendorGstin||"Not registered"}    PAN: ${invoice.vendorPan||"Not recorded"}`,9],[`Place of supply: ${invoice.placeOfSupplyState||"Not recorded"}`,9],["",8],
    [`Booking: ${invoice.bookingNumber}    Quotation: ${invoice.quotationNumber}`,9],[`Payment: ${invoice.paymentNumber}    Segment: ${invoice.businessSegment}`,9],["",8],
    ["Description                                      Rate             Amount",10],[`EasyMovers platform / commission service (SAC ${invoice.serviceAccountingCode})`,10],[`Commission base: ${money(invoice.commissionBase)}       ${Number(invoice.commissionRate).toFixed(2)}%       ${money(invoice.taxableAmount)}`,10],
    [`CGST: ${money(invoice.cgstAmount)}    SGST: ${money(invoice.sgstAmount)}    IGST: ${money(invoice.igstAmount)}`,10],[`GST treatment: ${invoice.gstTreatment} at ${Number(invoice.gstRate).toFixed(2)}%`,9],["",8],[`TOTAL TAX INVOICE: ${money(invoice.totalAmount)}`,14],["",8],
    [`TCS information (not part of invoice total): ${invoice.tcsApplicable?`${Number(invoice.tcsRate).toFixed(2)}% on ${money(invoice.tcsBase)} = ${money(invoice.tcsAmount)}`:"Not applicable"}`,9],["",8],
    ["This document was generated from an immutable EasyMovers finance snapshot.",8],[`Integrity reference: ${invoice.snapshotChecksum}`,7],["Computer-generated invoice. Authorised electronic record.",8],
  ] as Array<[string,number]>;
  let y=800;const commands=["BT","/F1 16 Tf","50 815 Td"];
  for(const[line,size]of lines){commands.push(`/F1 ${size} Tf`,`0 ${y===800?0:-18} Td`,`(${escapePdf(line).slice(0,105)}) Tj`);y-=18;}commands.push("ET");
  const stream=commands.join("\n");
  const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let pdf="%PDF-1.4\n";const offsets=[0];objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(value=>`${String(value).padStart(10,"0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf,"ascii");
}
