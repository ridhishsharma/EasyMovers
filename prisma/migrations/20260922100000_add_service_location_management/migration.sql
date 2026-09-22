-- Canonical launch locations and their independently controlled service matrix.
CREATE TYPE "public"."ServiceLocationStatus" AS ENUM ('DRAFT', 'READY', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "public"."LocationServiceStatus" AS ENUM ('DRAFT', 'READY', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "public"."ServiceFulfilmentMode" AS ENUM ('INSTANT_RATE', 'QUOTATION', 'SURVEY_AND_QUOTATION');

CREATE TABLE "public"."ServiceLocation" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL DEFAULT 'IN',
  "serviceablePostalCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "public"."ServiceLocationStatus" NOT NULL DEFAULT 'DRAFT',
  "operationsContactName" TEXT,
  "operationsContactMobile" TEXT,
  "operationsContactEmail" TEXT,
  "plannedLaunchAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "activatedByUserId" TEXT,
  "activatedAt" TIMESTAMP(3),
  "suspendedByUserId" TEXT,
  "suspendedAt" TIMESTAMP(3),
  "suspensionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."ServiceLocationService" (
  "id" TEXT NOT NULL,
  "serviceLocationId" TEXT NOT NULL,
  "scope" "public"."VendorServiceScope" NOT NULL,
  "serviceType" "public"."VendorServiceType" NOT NULL,
  "fulfilmentMode" "public"."ServiceFulfilmentMode" NOT NULL,
  "status" "public"."LocationServiceStatus" NOT NULL DEFAULT 'DRAFT',
  "instantPricingAvailable" BOOLEAN NOT NULL DEFAULT false,
  "surveyRequired" BOOLEAN NOT NULL DEFAULT false,
  "minimumVerifiedVendors" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceLocationService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceLocationService_minimumVerifiedVendors_check" CHECK ("minimumVerifiedVendors" >= 1),
  CONSTRAINT "ServiceLocationService_instantPricing_check" CHECK (NOT "instantPricingAvailable" OR "fulfilmentMode" = 'INSTANT_RATE')
);

CREATE TABLE "public"."ServiceLocationStatusHistory" (
  "id" TEXT NOT NULL,
  "serviceLocationId" TEXT NOT NULL,
  "fromStatus" "public"."ServiceLocationStatus",
  "toStatus" "public"."ServiceLocationStatus" NOT NULL,
  "changedByUserId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceLocationStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceLocation_code_key" ON "public"."ServiceLocation"("code");
CREATE UNIQUE INDEX "ServiceLocation_city_state_countryCode_key" ON "public"."ServiceLocation"("city", "state", "countryCode");
CREATE INDEX "ServiceLocation_status_idx" ON "public"."ServiceLocation"("status");
CREATE INDEX "ServiceLocation_state_idx" ON "public"."ServiceLocation"("state");
CREATE INDEX "ServiceLocation_plannedLaunchAt_idx" ON "public"."ServiceLocation"("plannedLaunchAt");
CREATE UNIQUE INDEX "ServiceLocationService_location_scope_type_key" ON "public"."ServiceLocationService"("serviceLocationId", "scope", "serviceType");
CREATE INDEX "ServiceLocationService_status_idx" ON "public"."ServiceLocationService"("status");
CREATE INDEX "ServiceLocationService_scope_type_idx" ON "public"."ServiceLocationService"("scope", "serviceType");
CREATE INDEX "ServiceLocationStatusHistory_location_createdAt_idx" ON "public"."ServiceLocationStatusHistory"("serviceLocationId", "createdAt");
CREATE INDEX "ServiceLocationStatusHistory_changedByUserId_idx" ON "public"."ServiceLocationStatusHistory"("changedByUserId");

ALTER TABLE "public"."ServiceLocationService"
  ADD CONSTRAINT "ServiceLocationService_serviceLocationId_fkey"
  FOREIGN KEY ("serviceLocationId") REFERENCES "public"."ServiceLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ServiceLocationStatusHistory"
  ADD CONSTRAINT "ServiceLocationStatusHistory_serviceLocationId_fkey"
  FOREIGN KEY ("serviceLocationId") REFERENCES "public"."ServiceLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Location activation remains explicit. Existing environment-configured pilot
-- cities are intentionally not auto-activated by this migration.
