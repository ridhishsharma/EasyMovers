-- Link an approved public application to exactly one inactive Vendor.
-- Nullable columns preserve all existing applications.
ALTER TABLE "public"."VendorApplication"
ADD COLUMN "vendorId" TEXT,
ADD COLUMN "reviewedByUserId" TEXT;

CREATE UNIQUE INDEX "VendorApplication_vendorId_key"
ON "public"."VendorApplication"("vendorId");

CREATE INDEX "VendorApplication_reviewedByUserId_idx"
ON "public"."VendorApplication"("reviewedByUserId");

ALTER TABLE "public"."VendorApplication"
ADD CONSTRAINT "VendorApplication_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."VendorApplication"
ADD CONSTRAINT "VendorApplication_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
