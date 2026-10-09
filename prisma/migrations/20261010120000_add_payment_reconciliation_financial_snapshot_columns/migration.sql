-- Bring PaymentReconciliation into alignment with the existing Prisma schema.
-- Nullable fields preserve existing reconciliation history without fabricated values.
ALTER TABLE "public"."PaymentReconciliation"
  ADD COLUMN "expectedBalanceAmount" DECIMAL(12,2),
  ADD COLUMN "expectedTotalAmount" DECIMAL(12,2);
