CREATE TYPE "public"."ServiceLocationSource" AS ENUM ('CATALOG', 'POSTAL_LOOKUP', 'MANUAL_REVIEW');

ALTER TABLE "public"."ServiceLocation"
  ADD COLUMN "district" TEXT,
  ADD COLUMN "stateCode" TEXT,
  ADD COLUMN "verificationPostalCode" TEXT,
  ADD COLUMN "locationSource" "public"."ServiceLocationSource" NOT NULL DEFAULT 'MANUAL_REVIEW',
  ADD COLUMN "locationVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "locationVerifiedByUserId" TEXT;

CREATE INDEX "ServiceLocation_stateCode_idx" ON "public"."ServiceLocation"("stateCode");
CREATE INDEX "ServiceLocation_district_idx" ON "public"."ServiceLocation"("district");

-- Existing records are intentionally marked MANUAL_REVIEW. They remain usable,
-- but are not falsely represented as having passed the new canonical workflow.
