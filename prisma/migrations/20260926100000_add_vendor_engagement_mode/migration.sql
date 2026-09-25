CREATE TYPE "public"."VendorEngagementMode" AS ENUM ('QUOTATION', 'INSTANT_RATE', 'HYBRID');

ALTER TABLE "public"."Vendor"
ADD COLUMN "engagementMode" "public"."VendorEngagementMode" NOT NULL DEFAULT 'QUOTATION';

ALTER TABLE "public"."VendorApplication"
ADD COLUMN "engagementMode" "public"."VendorEngagementMode" NOT NULL DEFAULT 'QUOTATION';

UPDATE "public"."Vendor"
SET "engagementMode" = 'INSTANT_RATE'
WHERE "businessType" = 'INDIVIDUAL_OWNER_DRIVER';

UPDATE "public"."VendorApplication"
SET "engagementMode" = 'INSTANT_RATE'
WHERE "businessType" = 'INDIVIDUAL_OWNER_DRIVER';

CREATE INDEX "Vendor_engagementMode_idx" ON "public"."Vendor"("engagementMode");
CREATE INDEX "VendorApplication_engagementMode_idx" ON "public"."VendorApplication"("engagementMode");
