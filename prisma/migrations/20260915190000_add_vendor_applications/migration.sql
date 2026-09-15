CREATE TYPE "public"."VendorApplicationStatus" AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'NEEDS_INFORMATION',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TABLE "public"."VendorApplication" (
  "id" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "requestId" UUID NOT NULL,
  "companyName" TEXT NOT NULL,
  "businessType" "public"."VendorBusinessType" NOT NULL,
  "operatingCategory" TEXT NOT NULL,
  "gstNumber" TEXT,
  "panNumber" TEXT,
  "contactName" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "status" "public"."VendorApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "consentAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorApplication_referenceId_key" ON "public"."VendorApplication"("referenceId");
CREATE UNIQUE INDEX "VendorApplication_requestId_key" ON "public"."VendorApplication"("requestId");
CREATE INDEX "VendorApplication_mobile_idx" ON "public"."VendorApplication"("mobile");
CREATE INDEX "VendorApplication_email_idx" ON "public"."VendorApplication"("email");
CREATE INDEX "VendorApplication_panNumber_idx" ON "public"."VendorApplication"("panNumber");
CREATE INDEX "VendorApplication_gstNumber_idx" ON "public"."VendorApplication"("gstNumber");
CREATE INDEX "VendorApplication_status_idx" ON "public"."VendorApplication"("status");
CREATE INDEX "VendorApplication_createdAt_idx" ON "public"."VendorApplication"("createdAt");

ALTER TABLE "public"."CallbackRequest" ADD COLUMN "vendorApplicationId" TEXT;
CREATE INDEX "CallbackRequest_vendorApplicationId_idx" ON "public"."CallbackRequest"("vendorApplicationId");
ALTER TABLE "public"."CallbackRequest"
  ADD CONSTRAINT "CallbackRequest_vendorApplicationId_fkey"
  FOREIGN KEY ("vendorApplicationId") REFERENCES "public"."VendorApplication"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
