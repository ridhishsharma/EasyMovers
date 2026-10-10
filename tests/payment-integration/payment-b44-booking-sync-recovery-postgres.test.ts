import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { createPrismaPaymentRepositoryModule } from "../../domains/payment/repositories/payment.prisma.repository";
import { createPaymentBookingSyncService } from "../../application/payments/services/payment-booking-sync.service";
import { createPaymentBookingSyncRetryService } from "../../application/payments/services/payment-booking-sync-retry.service";
import type { PaymentService } from "../../domains/payment/services/payment.service";
import type { BookingService } from "../../domains/booking/services/booking.service";

// B4.4C.3: Isolated PostgreSQL + REAL synchronization repository, application
// synchronization service, and retry processor. The Payment read and Booking
// update ports are narrowly adapted to the test database; the full production
// BookingService is not exercised here and requires separate certification.
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
assert.ok(process.env.DATABASE_URL);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const dbUrl = new URL(process.env.DATABASE_URL);
assert.ok(["postgres:", "postgresql:"].includes(dbUrl.protocol));
assert.equal(dbUrl.hostname, "127.0.0.1");
assert.equal(dbUrl.port, "5432");
assert.equal(dbUrl.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(dbUrl.username), "easymovers_test_user");
assert.ok(dbUrl.password);
assert.deepEqual([...dbUrl.searchParams.entries()], [["schema", "public"]]);
assert.equal(dbUrl.hash, "");

test("B4.4C.3 PostgreSQL retry recovers Booking projection without a second collection", async () => {
  const prisma = new PrismaClient();
  const suffix = randomUUID().replace(/-/g, "");
  let leadId: string | undefined;
  let bookingId: string | undefined;
  let paymentId: string | undefined;

  try {
    const lead = await prisma.lead.create({
      data: {
        referenceId: `EM-B44C3-LEAD-${suffix}`,
        name: "B44C3 Recovery Fixture",
        mobile: "9000000000",
      },
    });
    leadId = lead.id;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `EM-B44C3-${suffix}`,
        leadId: lead.id,
        leadReferenceId: lead.referenceId,
        customerName: "B44C3 Recovery Fixture",
        customerMobile: "9000000000",
        serviceType: "HOUSEHOLD_SHIFTING",
        moveType: "WITHIN_CITY",
        moveDate: new Date("2027-01-01T09:00:00Z"),
        pickupCity: "Bhopal",
        pickupState: "MP",
        pickupPincode: "462001",
        dropCity: "Bhopal",
        dropState: "MP",
        dropPincode: "462001",
        pickupAddress: "Integration Test Pickup",
        dropAddress: "Integration Test Drop",
        contactJson: {},
        pickupAddressJson: {},
        dropAddressJson: {},
        scheduleJson: {},
        inventoryJson: [],
        inventorySummaryJson: {},
        servicesJson: {},
        timelineJson: [],
        auditJson: [],
        totalAmount: 1000,
      },
    });
    bookingId = booking.id;

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `EMP-B44C3-${suffix}`,
        bookingId: booking.id,
        amount: 1000,
        totalAmount: 1000,
        paidAmount: 400,
        balanceAmount: 600,
        paymentPending: 600,
        currency: "INR",
        paymentStatus: "PARTIALLY_PAID",
      },
    });
    paymentId = payment.id;

    let injectFirstBookingFailure = true;
    let bookingWriteCount = 0;

    // This read port deliberately uses the real persisted Payment row.
    const paymentService = {
      getRequiredPayment: async (id: string) => {
        const current = await prisma.payment.findUniqueOrThrow({ where: { id } });
        return {
          paymentId: current.id,
          bookingId: current.bookingId,
          audit: { updatedAt: current.updatedAt.toISOString() },
          payable: {
            totalAmount: Number(current.totalAmount),
            paidAmount: Number(current.paidAmount),
            balanceAmount: Number(current.balanceAmount),
            paymentPending: Number(current.paymentPending),
            currency: current.currency,
          },
          refundSummary: { totalRefundedAmount: 0, refundPendingAmount: 0 },
        };
      },
    } as unknown as PaymentService;

    // The adapter writes a REAL Booking record and injects one controlled
    // failure. It is NOT a replacement for testing the canonical BookingService.
    const bookingService = {
      updatePayment: async (
        id: string,
        summary: Record<string, number>,
        updatedBy: string,
      ) => {
        assert.equal(id, booking.id);
        assert.ok(updatedBy);
        if (injectFirstBookingFailure) {
          injectFirstBookingFailure = false;
          throw new Error("B44C3_INJECTED_BOOKING_UPDATE_FAILURE");
        }
        bookingWriteCount += 1;
        await prisma.booking.update({
          where: { id },
          data: { paymentJson: summary, paymentStatus: "PARTIALLY_PAID" },
        });
        return { success: true, booking: { payment: summary } };
      },
    } as unknown as BookingService;

    const syncRepository = createPrismaPaymentRepositoryModule(prisma).repository;
    const syncService = createPaymentBookingSyncService({
      paymentService,
      bookingService,
      syncRepository,
    });
    const retryService = createPaymentBookingSyncRetryService({
      syncRepository,
      syncService,
    });

    const first = await syncService.syncPaymentToBooking({
      paymentId: payment.id,
      updatedBy: "B44C3_INITIAL_ATTEMPT",
    });
    assert.equal(first.success, false);
    assert.equal(first.retryable, true);
    assert.equal(bookingWriteCount, 0);

    const pending = await prisma.paymentBookingSync.findUniqueOrThrow({
      where: { paymentId: payment.id },
    });
    assert.equal(pending.status, "RETRY_PENDING");
    assert.equal(pending.attemptCount, 1);
    assert.ok(pending.nextRetryAt);
    assert.equal(pending.lastErrorCode, "BOOKING_PAYMENT_SYNC_FAILED");

    // Move only the processor's logical dueAt forward. No sleep, no mutation
    // of another worker's retry state, and no duplicate financial collection.
    const dueAt = new Date(Date.now() + 120_000).toISOString();
    const recovered = await retryService.processRetries({
      processedBy: "B44C3_RECOVERY_PROCESSOR",
      batchSize: 1,
      dueAt,
    });
    assert.equal(recovered.scanned, 1, JSON.stringify(recovered));
    assert.equal(recovered.synchronized, 1, JSON.stringify(recovered));
    assert.equal(recovered.failed, 0);
    assert.equal(bookingWriteCount, 1);

    const synced = await prisma.paymentBookingSync.findUniqueOrThrow({
      where: { paymentId: payment.id },
    });
    assert.equal(synced.status, "SYNCHRONIZED");
    assert.ok(synced.synchronizedAt);
    // One failed attempt plus one successful retry are both counted by the repository.
    assert.equal(synced.attemptCount, 2);

    const savedBooking = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
    });
    const projection = savedBooking.paymentJson as Record<string, number>;
    assert.equal(projection.totalAmount, 1000);
    assert.equal(projection.paidAmount, 400);
    assert.equal(projection.balanceAmount, 600);
    assert.equal(projection.paymentPending, 600);

    const savedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    assert.equal(Number(savedPayment.paidAmount), 400);
    assert.equal(Number(savedPayment.balanceAmount), 600);
    assert.equal(await prisma.paymentTransaction.count({ where: { paymentId: payment.id } }), 0);

    const replay = await retryService.processRetries({
      processedBy: "B44C3_REPLAY_PROCESSOR",
      batchSize: 1,
      dueAt,
    });
    assert.equal(replay.scanned, 0);
    assert.equal(replay.synchronized, 0);
    assert.equal(bookingWriteCount, 1);
    assert.equal(await prisma.paymentTransaction.count({ where: { paymentId: payment.id } }), 0);
    console.log("B4.4C.3: PostgreSQL retry recovered, no extra collection, replay idempotent");
  } finally {
    try {
      // Only delete this test's unique fixture. Never truncate shared tables.
      if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
      if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
      if (leadId) await prisma.lead.deleteMany({ where: { id: leadId } });
    } finally {
      await prisma.$disconnect();
    }
  }
});
