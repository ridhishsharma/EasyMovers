-- CreateEnum
CREATE TYPE "public"."PaymentBookingSyncStatus" AS ENUM ('PENDING', 'RETRY_PENDING', 'SYNCHRONIZED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."PaymentBookingSync" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "public"."PaymentBookingSyncStatus" NOT NULL DEFAULT 'PENDING',
    "paymentUpdatedAt" TIMESTAMP(3) NOT NULL,
    "paymentSnapshotJson" JSONB NOT NULL,
    "bookingSnapshotJson" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "synchronizedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentBookingSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentBookingSync_paymentId_key" ON "public"."PaymentBookingSync"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentBookingSync_bookingId_idx" ON "public"."PaymentBookingSync"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentBookingSync_status_idx" ON "public"."PaymentBookingSync"("status");

-- CreateIndex
CREATE INDEX "PaymentBookingSync_nextRetryAt_idx" ON "public"."PaymentBookingSync"("nextRetryAt");

-- CreateIndex
CREATE INDEX "PaymentBookingSync_lastAttemptAt_idx" ON "public"."PaymentBookingSync"("lastAttemptAt");

-- CreateIndex
CREATE INDEX "PaymentBookingSync_paymentUpdatedAt_idx" ON "public"."PaymentBookingSync"("paymentUpdatedAt");

-- CreateIndex
CREATE INDEX "PaymentBookingSync_createdAt_idx" ON "public"."PaymentBookingSync"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."PaymentBookingSync" ADD CONSTRAINT "PaymentBookingSync_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentBookingSync" ADD CONSTRAINT "PaymentBookingSync_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
