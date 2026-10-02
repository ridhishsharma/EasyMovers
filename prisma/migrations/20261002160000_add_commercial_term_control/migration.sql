-- C3-C: one-time commission locking through independent finance approval.
CREATE TYPE "public"."CommercialTermRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "public"."PaymentCommercialTermRequest" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "customerPayableAmount" DECIMAL(12,2) NOT NULL,
  "vendorQuotedAmount" DECIMAL(12,2) NOT NULL,
  "platformCommissionAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "public"."CommercialTermRequestStatus" NOT NULL DEFAULT 'PENDING',
  "submissionNote" TEXT,
  "reviewNote" TEXT,
  "submittedBy" TEXT NOT NULL,
  "reviewedBy" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentCommercialTermRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentCommercialTermRequest_amounts_check" CHECK (
    "customerPayableAmount" >= 0 AND
    "vendorQuotedAmount" >= 0 AND
    "platformCommissionAmount" >= 0 AND
    "platformCommissionAmount" <= "vendorQuotedAmount"
  ),
  CONSTRAINT "PaymentCommercialTermRequest_review_check" CHECK (
    ("status" = 'PENDING' AND "reviewedAt" IS NULL AND "appliedAt" IS NULL)
    OR ("status" = 'APPROVED' AND "reviewedAt" IS NOT NULL AND "appliedAt" IS NOT NULL)
    OR ("status" IN ('REJECTED', 'CANCELLED') AND "reviewedAt" IS NOT NULL)
  )
);

CREATE INDEX "PaymentCommercialTermRequest_paymentId_status_idx" ON "public"."PaymentCommercialTermRequest"("paymentId", "status");
CREATE INDEX "PaymentCommercialTermRequest_vendorId_status_idx" ON "public"."PaymentCommercialTermRequest"("vendorId", "status");
CREATE INDEX "PaymentCommercialTermRequest_submittedBy_idx" ON "public"."PaymentCommercialTermRequest"("submittedBy");
CREATE INDEX "PaymentCommercialTermRequest_reviewedBy_idx" ON "public"."PaymentCommercialTermRequest"("reviewedBy");
CREATE INDEX "PaymentCommercialTermRequest_submittedAt_idx" ON "public"."PaymentCommercialTermRequest"("submittedAt");

ALTER TABLE "public"."PaymentCommercialTermRequest" ADD CONSTRAINT "PaymentCommercialTermRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PaymentCommercialTermRequest" ADD CONSTRAINT "PaymentCommercialTermRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PaymentCommercialTermRequest" ADD CONSTRAINT "PaymentCommercialTermRequest_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "public"."CrmPermission" ("id", "code", "module", "name", "description", "isActive")
VALUES ('crm-permission-commission-approve', 'commission.approve', 'finance', 'Approve commission terms', 'Independently approve EasyMovers commission before vendor settlement.', true)
ON CONFLICT ("code") DO UPDATE SET "module" = EXCLUDED."module", "name" = EXCLUDED."name", "description" = EXCLUDED."description", "isActive" = true;

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" IN ('SUPER_ADMIN', 'CRM_ADMINISTRATOR', 'FINANCE_MANAGER')
  AND permission."code" = 'commission.approve'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
