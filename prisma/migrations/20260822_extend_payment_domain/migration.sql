-- CreateEnum
CREATE TYPE "public"."PaymentGatewayOrderStatus" AS ENUM ('CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentPurpose" AS ENUM ('ADVANCE', 'BALANCE', 'FULL_PAYMENT', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "public"."PaymentTransactionType" AS ENUM ('COLLECTION', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."PaymentTransactionStatus" AS ENUM ('INITIATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('RAZORPAY', 'MANUAL', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentSource" AS ENUM ('WEB', 'ANDROID', 'IOS', 'ADMIN', 'CORPORATE', 'API', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "public"."PaymentActorType" AS ENUM ('CUSTOMER', 'CORPORATE', 'ADMIN', 'VENDOR', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentMethod" ADD VALUE 'CARD';
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'BANK_TRANSFER';
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'OTHER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PARTIALLY_PAID';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'REFUND_PENDING';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentType" ADD VALUE 'BALANCE';
ALTER TYPE "public"."PaymentType" ADD VALUE 'FULL_PAYMENT';
ALTER TYPE "public"."PaymentType" ADD VALUE 'ADDITIONAL';

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "advanceAmount" DECIMAL(12,2),
ADD COLUMN     "auditJson" JSONB,
ADD COLUMN     "balanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commercialReference" JSONB,
ADD COLUMN     "internalRemarks" TEXT,
ADD COLUMN     "latestSuccessfulTransactionId" TEXT,
ADD COLUMN     "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "payableJson" JSONB,
ADD COLUMN     "paymentPending" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "refundPendingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "refundSummaryJson" JSONB,
ADD COLUMN     "source" "public"."PaymentSource" NOT NULL DEFAULT 'API',
ADD COLUMN     "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "paymentMethod" DROP NOT NULL,
ALTER COLUMN "paymentType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."PaymentTransaction" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "transactionType" "public"."PaymentTransactionType" NOT NULL,
    "purpose" "public"."PaymentPurpose",
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "public"."PaymentTransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "method" "public"."PaymentMethod",
    "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'OTHER',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewayReferenceId" TEXT,
    "bankReference" TEXT,
    "failureReason" TEXT,
    "failureMessage" TEXT,
    "providerErrorCode" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "recordedByType" "public"."PaymentActorType",
    "recordedById" TEXT,
    "recordedByName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentGatewayOrder" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "gatewayOrderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "public"."PaymentGatewayOrderStatus" NOT NULL DEFAULT 'CREATED',
    "receiptReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentWebhook" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT,
    "payloadHash" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "duplicate" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "transactionId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "expectedCollectedAmount" DECIMAL(12,2) NOT NULL,
    "expectedRefundedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observedCollectedAmount" DECIMAL(12,2) NOT NULL,
    "observedRefundedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "differences" JSONB NOT NULL,
    "providerReference" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_gatewayPaymentId_key" ON "public"."PaymentTransaction"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentId_idx" ON "public"."PaymentTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionType_idx" ON "public"."PaymentTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "PaymentTransaction_purpose_idx" ON "public"."PaymentTransaction"("purpose");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "public"."PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_method_idx" ON "public"."PaymentTransaction"("method");

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_idx" ON "public"."PaymentTransaction"("provider");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gatewayOrderId_idx" ON "public"."PaymentTransaction"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gatewayPaymentId_idx" ON "public"."PaymentTransaction"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_bankReference_idx" ON "public"."PaymentTransaction"("bankReference");

-- CreateIndex
CREATE INDEX "PaymentTransaction_initiatedAt_idx" ON "public"."PaymentTransaction"("initiatedAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "public"."PaymentTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayOrder_gatewayOrderId_key" ON "public"."PaymentGatewayOrder"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "PaymentGatewayOrder_paymentId_idx" ON "public"."PaymentGatewayOrder"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentGatewayOrder_provider_idx" ON "public"."PaymentGatewayOrder"("provider");

-- CreateIndex
CREATE INDEX "PaymentGatewayOrder_status_idx" ON "public"."PaymentGatewayOrder"("status");

-- CreateIndex
CREATE INDEX "PaymentGatewayOrder_receiptReference_idx" ON "public"."PaymentGatewayOrder"("receiptReference");

-- CreateIndex
CREATE INDEX "PaymentGatewayOrder_createdAt_idx" ON "public"."PaymentGatewayOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhook_webhookId_key" ON "public"."PaymentWebhook"("webhookId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_paymentId_idx" ON "public"."PaymentWebhook"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_provider_idx" ON "public"."PaymentWebhook"("provider");

-- CreateIndex
CREATE INDEX "PaymentWebhook_eventType_idx" ON "public"."PaymentWebhook"("eventType");

-- CreateIndex
CREATE INDEX "PaymentWebhook_gatewayOrderId_idx" ON "public"."PaymentWebhook"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_gatewayPaymentId_idx" ON "public"."PaymentWebhook"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_providerEventId_idx" ON "public"."PaymentWebhook"("providerEventId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_payloadHash_idx" ON "public"."PaymentWebhook"("payloadHash");

-- CreateIndex
CREATE INDEX "PaymentWebhook_processed_idx" ON "public"."PaymentWebhook"("processed");

-- CreateIndex
CREATE INDEX "PaymentWebhook_receivedAt_idx" ON "public"."PaymentWebhook"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhook_provider_providerEventId_key" ON "public"."PaymentWebhook"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReconciliation_reconciliationId_key" ON "public"."PaymentReconciliation"("reconciliationId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_paymentId_idx" ON "public"."PaymentReconciliation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_provider_idx" ON "public"."PaymentReconciliation"("provider");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_reconciled_idx" ON "public"."PaymentReconciliation"("reconciled");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_providerReference_idx" ON "public"."PaymentReconciliation"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_observedAt_idx" ON "public"."PaymentReconciliation"("observedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_reconciledAt_idx" ON "public"."PaymentReconciliation"("reconciledAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_createdAt_idx" ON "public"."PaymentReconciliation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_referenceId_key" ON "public"."Payment"("referenceId");

-- CreateIndex
CREATE INDEX "Payment_referenceId_idx" ON "public"."Payment"("referenceId");

-- CreateIndex
CREATE INDEX "Payment_source_idx" ON "public"."Payment"("source");

-- CreateIndex
CREATE INDEX "Payment_gatewayOrderId_idx" ON "public"."Payment"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "Payment_gatewayPaymentId_idx" ON "public"."Payment"("gatewayPaymentId");

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentGatewayOrder" ADD CONSTRAINT "PaymentGatewayOrder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentWebhook" ADD CONSTRAINT "PaymentWebhook_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
