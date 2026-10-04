CREATE TABLE "public"."VendorQuotationInvitation" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "invitedByUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'INVITED',
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "viewedAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "declineReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorQuotationInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorQuotationInvitation_bookingId_vendorId_key"
ON "public"."VendorQuotationInvitation"("bookingId", "vendorId");
CREATE INDEX "VendorQuotationInvitation_vendorId_status_expiresAt_idx"
ON "public"."VendorQuotationInvitation"("vendorId", "status", "expiresAt");
CREATE INDEX "VendorQuotationInvitation_bookingId_status_idx"
ON "public"."VendorQuotationInvitation"("bookingId", "status");
CREATE INDEX "VendorQuotationInvitation_invitedByUserId_idx"
ON "public"."VendorQuotationInvitation"("invitedByUserId");

ALTER TABLE "public"."VendorQuotationInvitation"
ADD CONSTRAINT "VendorQuotationInvitation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."VendorQuotationInvitation"
ADD CONSTRAINT "VendorQuotationInvitation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."VendorQuotationInvitation"
ADD CONSTRAINT "VendorQuotationInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
