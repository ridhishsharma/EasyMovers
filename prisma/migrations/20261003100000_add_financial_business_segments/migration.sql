-- Classify each payment and approved commercial snapshot for stable financial reporting.
CREATE TYPE "public"."FinancialBusinessSegment" AS ENUM (
  'WITHIN_CITY_INSTANT',
  'WITHIN_CITY_QUOTATION',
  'INTERCITY_QUOTATION',
  'CORPORATE_RELOCATION',
  'ADD_ON_SERVICE'
);

ALTER TABLE "public"."Payment"
  ADD COLUMN "businessSegment" "public"."FinancialBusinessSegment",
  ADD COLUMN "businessSegmentLockedAt" TIMESTAMP(3);

ALTER TABLE "public"."PaymentCommercialTermRequest"
  ADD COLUMN "businessSegment" "public"."FinancialBusinessSegment";

-- Historical classification is intentionally conservative: local work with no
-- persisted instant-rate evidence is treated as quotation work, never guessed.
UPDATE "public"."Payment" payment
SET "businessSegment" = CASE
      WHEN UPPER(booking."serviceType") LIKE '%CORPORATE%' THEN 'CORPORATE_RELOCATION'::"public"."FinancialBusinessSegment"
      WHEN UPPER(booking."serviceType") IN ('PACKING_ONLY', 'LOADING_UNLOADING', 'INSTALLATION_UNINSTALLATION') THEN 'ADD_ON_SERVICE'::"public"."FinancialBusinessSegment"
      WHEN UPPER(booking."moveType") IN ('WITHIN_CITY', 'LOCAL', 'INTRACITY', 'INTRA_CITY') THEN 'WITHIN_CITY_QUOTATION'::"public"."FinancialBusinessSegment"
      ELSE 'INTERCITY_QUOTATION'::"public"."FinancialBusinessSegment"
    END,
    "businessSegmentLockedAt" = COALESCE(payment."paidAt", payment."createdAt")
FROM "public"."Booking" booking
WHERE booking."id" = payment."bookingId";

UPDATE "public"."PaymentCommercialTermRequest" request
SET "businessSegment" = payment."businessSegment"
FROM "public"."Payment" payment
WHERE payment."id" = request."paymentId";

-- Defensive fallback for any legacy orphaned classification.
UPDATE "public"."PaymentCommercialTermRequest"
SET "businessSegment" = 'INTERCITY_QUOTATION'
WHERE "businessSegment" IS NULL;

ALTER TABLE "public"."PaymentCommercialTermRequest"
  ALTER COLUMN "businessSegment" SET NOT NULL;

CREATE INDEX "Payment_businessSegment_idx" ON "public"."Payment"("businessSegment");
CREATE INDEX "PaymentCommercialTermRequest_businessSegment_appliedAt_idx"
  ON "public"."PaymentCommercialTermRequest"("businessSegment", "appliedAt");
