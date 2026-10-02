-- D1: immutable, revision-aware commission tax snapshots.
CREATE TYPE "public"."CommercialTaxTreatment" AS ENUM ('CGST_SGST', 'IGST', 'NOT_APPLICABLE', 'PENDING_REVIEW');

ALTER TABLE "public"."PaymentCommercialTermRequest"
  ADD COLUMN "commissionRate" DECIMAL(7,4),
  ADD COLUMN "commissionBase" DECIMAL(12,2),
  ADD COLUMN "gstTreatment" "public"."CommercialTaxTreatment",
  ADD COLUMN "gstRate" DECIMAL(7,4),
  ADD COLUMN "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "tcsApplicable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tcsRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN "tcsBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "tcsAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "placeOfSupplyState" TEXT,
  ADD COLUMN "vendorGstinSnapshot" TEXT,
  ADD COLUMN "easymoversGstinSnapshot" TEXT,
  ADD COLUMN "taxOverrideReason" TEXT,
  ADD COLUMN "revisedFromId" TEXT,
  ADD COLUMN "revisionNumber" INTEGER NOT NULL DEFAULT 1;

-- Preserve legacy approvals without inventing tax: their tax treatment remains pending review.
UPDATE "public"."PaymentCommercialTermRequest"
SET "commissionBase" = "vendorQuotedAmount",
    "commissionRate" = CASE WHEN "vendorQuotedAmount" = 0 THEN 0 ELSE ROUND(("platformCommissionAmount" / "vendorQuotedAmount") * 100, 4) END,
    "gstTreatment" = 'PENDING_REVIEW',
    "gstRate" = 0;

ALTER TABLE "public"."PaymentCommercialTermRequest"
  ALTER COLUMN "commissionRate" SET NOT NULL,
  ALTER COLUMN "commissionBase" SET NOT NULL,
  ALTER COLUMN "gstTreatment" SET NOT NULL,
  ALTER COLUMN "gstRate" SET NOT NULL;

ALTER TABLE "public"."PaymentCommercialTermRequest"
  ADD CONSTRAINT "PaymentCommercialTermRequest_tax_amounts_check" CHECK (
    "commissionRate" >= 0 AND "commissionRate" <= 100 AND
    "commissionBase" >= 0 AND "gstRate" >= 0 AND "gstRate" <= 100 AND
    "cgstAmount" >= 0 AND "sgstAmount" >= 0 AND "igstAmount" >= 0 AND
    "tcsRate" >= 0 AND "tcsRate" <= 100 AND "tcsBase" >= 0 AND "tcsAmount" >= 0 AND
    "revisionNumber" >= 1 AND
    (("gstTreatment" = 'CGST_SGST' AND "igstAmount" = 0 AND ABS("cgstAmount" - "sgstAmount") <= 0.01) OR
     ("gstTreatment" = 'IGST' AND "cgstAmount" = 0 AND "sgstAmount" = 0) OR
     ("gstTreatment" IN ('NOT_APPLICABLE', 'PENDING_REVIEW') AND "cgstAmount" = 0 AND "sgstAmount" = 0 AND "igstAmount" = 0))
  );

CREATE INDEX "PaymentCommercialTermRequest_revisedFromId_idx" ON "public"."PaymentCommercialTermRequest"("revisedFromId");
ALTER TABLE "public"."PaymentCommercialTermRequest"
  ADD CONSTRAINT "PaymentCommercialTermRequest_revisedFromId_fkey"
  FOREIGN KEY ("revisedFromId") REFERENCES "public"."PaymentCommercialTermRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
