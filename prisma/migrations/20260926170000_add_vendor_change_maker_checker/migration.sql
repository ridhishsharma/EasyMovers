-- Vendor and EM-staff amendments are staged for independent verification.
CREATE TYPE "public"."VendorChangeEntityType" AS ENUM ('PROFILE', 'SERVICE_AREA', 'SERVICE_OFFERING', 'VEHICLE', 'DOCUMENT', 'BANK_ACCOUNT');
CREATE TYPE "public"."VendorChangeAction" AS ENUM ('CREATE', 'UPDATE', 'DEACTIVATE');
CREATE TYPE "public"."VendorChangeSource" AS ENUM ('VENDOR_PORTAL', 'EM_STAFF');
CREATE TYPE "public"."VendorChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED');

CREATE TABLE "public"."VendorChangeRequest" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "entityType" "public"."VendorChangeEntityType" NOT NULL,
  "action" "public"."VendorChangeAction" NOT NULL,
  "entityId" TEXT,
  "source" "public"."VendorChangeSource" NOT NULL,
  "status" "public"."VendorChangeStatus" NOT NULL DEFAULT 'PENDING',
  "proposedData" JSONB NOT NULL,
  "previousData" JSONB,
  "submissionNote" TEXT,
  "reviewNote" TEXT,
  "submittedByUserId" TEXT,
  "reviewedByUserId" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorChangeRequest_vendorId_status_idx" ON "public"."VendorChangeRequest"("vendorId", "status");
CREATE INDEX "VendorChangeRequest_entityType_entityId_idx" ON "public"."VendorChangeRequest"("entityType", "entityId");
CREATE INDEX "VendorChangeRequest_submittedByUserId_idx" ON "public"."VendorChangeRequest"("submittedByUserId");
CREATE INDEX "VendorChangeRequest_reviewedByUserId_idx" ON "public"."VendorChangeRequest"("reviewedByUserId");
CREATE INDEX "VendorChangeRequest_submittedAt_idx" ON "public"."VendorChangeRequest"("submittedAt");

ALTER TABLE "public"."VendorChangeRequest" ADD CONSTRAINT "VendorChangeRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."VendorChangeRequest" ADD CONSTRAINT "VendorChangeRequest_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."VendorChangeRequest" ADD CONSTRAINT "VendorChangeRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "public"."CrmPermission" ("id", "code", "module", "name", "description", "isActive")
VALUES ('crm-permission-vendor-verify', 'vendor.verify', 'vendors', 'Verify vendor changes', 'Independently approve or reject vendor operational changes.', true)
ON CONFLICT ("code") DO UPDATE SET "module" = EXCLUDED."module", "name" = EXCLUDED."name", "description" = EXCLUDED."description", "isActive" = true;

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role, "public"."CrmPermission" permission
WHERE role."code" IN ('SUPER_ADMIN', 'CRM_ADMINISTRATOR', 'VENDOR_REVIEWER') AND permission."code" = 'vendor.verify'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
