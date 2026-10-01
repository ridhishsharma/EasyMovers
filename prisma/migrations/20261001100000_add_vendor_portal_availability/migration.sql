-- Separate real-time operator presence from company quotation preferences.
CREATE TYPE "public"."VendorOperatorPresenceState" AS ENUM ('OFFLINE', 'ONLINE', 'PAUSED', 'BUSY');

CREATE TABLE "public"."VendorOperatorAvailability" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "state" "public"."VendorOperatorPresenceState" NOT NULL DEFAULT 'OFFLINE',
  "currentLatitude" DECIMAL(10,7),
  "currentLongitude" DECIMAL(10,7),
  "lastHeartbeatAt" TIMESTAMP(3),
  "stateChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorOperatorAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."VendorEnquiryPreference" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "acceptingQuotationEnquiries" BOOLEAN NOT NULL DEFAULT true,
  "pausedUntil" TIMESTAMP(3),
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorEnquiryPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."VendorAvailabilityEvent" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "state" "public"."VendorOperatorPresenceState" NOT NULL,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorAvailabilityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorOperatorAvailability_userId_key" ON "public"."VendorOperatorAvailability"("userId");
CREATE INDEX "VendorOperatorAvailability_vendorId_state_idx" ON "public"."VendorOperatorAvailability"("vendorId", "state");
CREATE INDEX "VendorOperatorAvailability_state_lastHeartbeatAt_idx" ON "public"."VendorOperatorAvailability"("state", "lastHeartbeatAt");
CREATE UNIQUE INDEX "VendorEnquiryPreference_vendorId_key" ON "public"."VendorEnquiryPreference"("vendorId");
CREATE INDEX "VendorEnquiryPreference_acceptingQuotationEnquiries_idx" ON "public"."VendorEnquiryPreference"("acceptingQuotationEnquiries");
CREATE INDEX "VendorEnquiryPreference_pausedUntil_idx" ON "public"."VendorEnquiryPreference"("pausedUntil");
CREATE INDEX "VendorAvailabilityEvent_vendorId_occurredAt_idx" ON "public"."VendorAvailabilityEvent"("vendorId", "occurredAt");
CREATE INDEX "VendorAvailabilityEvent_userId_occurredAt_idx" ON "public"."VendorAvailabilityEvent"("userId", "occurredAt");

ALTER TABLE "public"."VendorOperatorAvailability"
  ADD CONSTRAINT "VendorOperatorAvailability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "VendorOperatorAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."VendorEnquiryPreference"
  ADD CONSTRAINT "VendorEnquiryPreference_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "VendorEnquiryPreference_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."VendorAvailabilityEvent"
  ADD CONSTRAINT "VendorAvailabilityEvent_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "VendorAvailabilityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
