-- Immutable EasyMovers platform-fee invoices issued to vendors.
CREATE TYPE "public"."PlatformFeeInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

CREATE TABLE "public"."PlatformFeeInvoice" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT,
  "financialYear" TEXT NOT NULL,
  "sequenceNumber" INTEGER,
  "status" "public"."PlatformFeeInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "paymentId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "commercialTermRequestId" TEXT NOT NULL,
  "businessSegment" "public"."FinancialBusinessSegment" NOT NULL,
  "bookingNumber" TEXT NOT NULL,
  "paymentNumber" TEXT NOT NULL,
  "quotationNumber" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "commissionBase" DECIMAL(12,2) NOT NULL,
  "commissionRate" DECIMAL(7,4) NOT NULL,
  "taxableAmount" DECIMAL(12,2) NOT NULL,
  "gstTreatment" "public"."CommercialTaxTreatment" NOT NULL,
  "gstRate" DECIMAL(7,4) NOT NULL,
  "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "tcsApplicable" BOOLEAN NOT NULL DEFAULT false,
  "tcsRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
  "tcsBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "tcsAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "placeOfSupplyState" TEXT,
  "supplierLegalName" TEXT NOT NULL,
  "supplierAddress" TEXT NOT NULL,
  "supplierGstin" TEXT,
  "serviceAccountingCode" TEXT NOT NULL,
  "vendorLegalName" TEXT NOT NULL,
  "vendorAddress" TEXT NOT NULL,
  "vendorGstin" TEXT,
  "vendorPan" TEXT,
  "issuedAt" TIMESTAMP(3),
  "serviceCompletedAt" TIMESTAMP(3) NOT NULL,
  "snapshotJson" JSONB NOT NULL,
  "snapshotChecksum" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "issuedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformFeeInvoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformFeeInvoice_amounts_check" CHECK (
    "commissionBase" >= 0 AND "commissionRate" >= 0 AND "commissionRate" <= 100 AND
    "taxableAmount" >= 0 AND "gstRate" >= 0 AND "gstRate" <= 100 AND
    "cgstAmount" >= 0 AND "sgstAmount" >= 0 AND "igstAmount" >= 0 AND
    "totalAmount" = "taxableAmount" + "cgstAmount" + "sgstAmount" + "igstAmount" AND
    "tcsRate" >= 0 AND "tcsRate" <= 100 AND "tcsBase" >= 0 AND "tcsAmount" >= 0
  ),
  CONSTRAINT "PlatformFeeInvoice_issue_check" CHECK (
    ("status" = 'DRAFT' AND "invoiceNumber" IS NULL AND "sequenceNumber" IS NULL AND "issuedAt" IS NULL AND "issuedBy" IS NULL)
    OR ("status" = 'ISSUED' AND "invoiceNumber" IS NOT NULL AND "sequenceNumber" IS NOT NULL AND "issuedAt" IS NOT NULL AND "issuedBy" IS NOT NULL)
    OR ("status" = 'CANCELLED')
  ),
  CONSTRAINT "PlatformFeeInvoice_maker_checker_check" CHECK (
    "issuedBy" IS NULL OR "issuedBy" <> "createdBy"
  ),
  CONSTRAINT "PlatformFeeInvoice_number_format_check" CHECK (
    "invoiceNumber" IS NULL OR "invoiceNumber" ~ '^EMPF/[0-9]{2}-[0-9]{2}/[0-9]{5}$'
  ),
  CONSTRAINT "PlatformFeeInvoice_sac_format_check" CHECK (
    "serviceAccountingCode" ~ '^[0-9]{6}$'
  )
);

CREATE TABLE "public"."FinancialDocumentSequence" (
  "id" TEXT NOT NULL,
  "financialYear" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialDocumentSequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformFeeInvoice_invoiceNumber_key" ON "public"."PlatformFeeInvoice"("invoiceNumber");
CREATE UNIQUE INDEX "PlatformFeeInvoice_paymentId_key" ON "public"."PlatformFeeInvoice"("paymentId");
CREATE UNIQUE INDEX "PlatformFeeInvoice_commercialTermRequestId_key" ON "public"."PlatformFeeInvoice"("commercialTermRequestId");
CREATE UNIQUE INDEX "PlatformFeeInvoice_financialYear_sequenceNumber_key" ON "public"."PlatformFeeInvoice"("financialYear", "sequenceNumber");
CREATE INDEX "PlatformFeeInvoice_status_createdAt_idx" ON "public"."PlatformFeeInvoice"("status", "createdAt");
CREATE INDEX "PlatformFeeInvoice_vendorId_issuedAt_idx" ON "public"."PlatformFeeInvoice"("vendorId", "issuedAt");
CREATE INDEX "PlatformFeeInvoice_businessSegment_issuedAt_idx" ON "public"."PlatformFeeInvoice"("businessSegment", "issuedAt");
CREATE UNIQUE INDEX "FinancialDocumentSequence_financialYear_documentType_key" ON "public"."FinancialDocumentSequence"("financialYear", "documentType");

ALTER TABLE "public"."PlatformFeeInvoice" ADD CONSTRAINT "PlatformFeeInvoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PlatformFeeInvoice" ADD CONSTRAINT "PlatformFeeInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PlatformFeeInvoice" ADD CONSTRAINT "PlatformFeeInvoice_commercialTermRequestId_fkey" FOREIGN KEY ("commercialTermRequestId") REFERENCES "public"."PaymentCommercialTermRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
