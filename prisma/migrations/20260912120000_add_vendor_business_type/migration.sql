CREATE TYPE "public"."VendorBusinessType" AS ENUM (
  'UNSPECIFIED',
  'INDIVIDUAL_OWNER_DRIVER',
  'SOLE_PROPRIETOR',
  'REGISTERED_BUSINESS'
);

ALTER TABLE "public"."Vendor"
ADD COLUMN "businessType" "public"."VendorBusinessType"
NOT NULL DEFAULT 'UNSPECIFIED';