-- Vendor payouts are distinct from customer collection transactions.
CREATE TYPE "public"."VendorSettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'FAILED', 'CANCELLED');

CREATE TABLE "public"."VendorSettlement" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "public"."VendorSettlementStatus" NOT NULL DEFAULT 'PENDING',
  "settlementReference" TEXT,
  "expectedAt" TIMESTAMP(3),
  "settledAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "remarks" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorSettlement_settlementReference_key" ON "public"."VendorSettlement"("settlementReference");
CREATE INDEX "VendorSettlement_vendorId_idx" ON "public"."VendorSettlement"("vendorId");
CREATE INDEX "VendorSettlement_paymentId_idx" ON "public"."VendorSettlement"("paymentId");
CREATE INDEX "VendorSettlement_status_idx" ON "public"."VendorSettlement"("status");
CREATE INDEX "VendorSettlement_expectedAt_idx" ON "public"."VendorSettlement"("expectedAt");
CREATE INDEX "VendorSettlement_settledAt_idx" ON "public"."VendorSettlement"("settledAt");
CREATE INDEX "VendorSettlement_createdAt_idx" ON "public"."VendorSettlement"("createdAt");

ALTER TABLE "public"."VendorSettlement"
  ADD CONSTRAINT "VendorSettlement_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."VendorSettlement"
  ADD CONSTRAINT "VendorSettlement_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."VendorSettlement"
  ADD CONSTRAINT "VendorSettlement_amount_positive_check" CHECK ("amount" > 0);

ALTER TABLE "public"."VendorSettlement"
  ADD CONSTRAINT "VendorSettlement_settled_timestamp_check"
  CHECK ("status" <> 'SETTLED' OR "settledAt" IS NOT NULL);
