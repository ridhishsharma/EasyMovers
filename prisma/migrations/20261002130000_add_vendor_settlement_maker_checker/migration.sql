-- C3-B: independent approval and operational audit for vendor settlements.
ALTER TYPE "public"."VendorSettlementStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "public"."VendorSettlement"
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "statusUpdatedBy" TEXT;

CREATE INDEX "VendorSettlement_createdBy_idx" ON "public"."VendorSettlement"("createdBy");
CREATE INDEX "VendorSettlement_reviewedBy_idx" ON "public"."VendorSettlement"("reviewedBy");

-- Preserve compatibility if C3 ledger rows were created before C3-B deployment.
UPDATE "public"."VendorSettlement"
SET "reviewedAt" = "updatedAt",
    "reviewNote" = COALESCE("reviewNote", 'Legacy settlement migrated before maker-checker controls.')
WHERE "status" <> 'PENDING' AND "reviewedAt" IS NULL;

ALTER TABLE "public"."VendorSettlement"
  ADD CONSTRAINT "VendorSettlement_review_state_check" CHECK (
    ("status" = 'PENDING' AND "reviewedAt" IS NULL)
    OR ("status" <> 'PENDING' AND "reviewedAt" IS NOT NULL)
  );

INSERT INTO "public"."CrmPermission" ("id", "code", "module", "name", "description", "isActive")
VALUES (
  'crm-permission-settlement-approve',
  'settlement.approve',
  'finance',
  'Approve vendor settlements',
  'Independently approve or reject vendor settlement requests.',
  true
)
ON CONFLICT ("code") DO UPDATE SET
  "module" = EXCLUDED."module",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isActive" = true;

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" IN ('SUPER_ADMIN', 'CRM_ADMINISTRATOR', 'FINANCE_MANAGER')
  AND permission."code" = 'settlement.approve'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
