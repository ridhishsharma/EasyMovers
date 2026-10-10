import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { createPrismaPaymentRepositoryModule } from "../../domains/payment/repositories/payment.prisma.repository";

// B4.4C.4: Real PostgreSQL repository concurrency and optimistic-version guards.
// This suite does NOT simulate gateway collections or invoke production BookingService.
// It certifies the repository claim/lease and stale-write protection boundaries.
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

async function withFixture(run: (prisma: PrismaClient, paymentId: string, bookingId: string) => Promise<void>) {
  const prisma = new PrismaClient();
  const suffix = randomUUID().replace(/-/g, "");
  let leadId: string | undefined;
  let bookingId: string | undefined;
  let paymentId: string | undefined;
  try {
    const lead = await prisma.lead.create({
      data: { referenceId: `EM-B44C4-LEAD-${suffix}`, name: "B44C4 Fixture", mobile: "9000000000" },
    });
    leadId = lead.id;
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `EM-B44C4-${suffix}`,
        leadId: lead.id,
        leadReferenceId: lead.referenceId,
        customerName: "B44C4 Fixture",
        customerMobile: "9000000000",
        serviceType: "HOUSEHOLD_SHIFTING",
        moveType: "WITHIN_CITY",
        moveDate: new Date("2027-01-01T09:00:00Z"),
        pickupCity: "Bhopal", pickupState: "MP", pickupPincode: "462001",
        dropCity: "Bhopal", dropState: "MP", dropPincode: "462001",
        pickupAddress: "Test Pickup", dropAddress: "Test Drop",
        contactJson: {}, pickupAddressJson: {}, dropAddressJson: {},
        scheduleJson: {}, inventoryJson: [], inventorySummaryJson: {},
        servicesJson: {}, timelineJson: [], auditJson: [], totalAmount: 1000,
      },
    });
    bookingId = booking.id;
    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `EMP-B44C4-${suffix}`, bookingId: booking.id,
        amount: 1000, totalAmount: 1000, paidAmount: 400,
        balanceAmount: 600, paymentPending: 600,
        currency: "INR", paymentStatus: "PARTIALLY_PAID",
      },
    });
    paymentId = payment.id;
    await run(prisma, payment.id, booking.id);
  } finally {
    try {
      if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
      if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
      if (leadId) await prisma.lead.deleteMany({ where: { id: leadId } });
    } finally {
      await prisma.$disconnect();
    }
  }
}

function snapshot(paidAmount: number) {
  return {
    totalAmount: 1000,
    paidAmount,
    balanceAmount: 1000 - paidAmount,
    paymentPending: 1000 - paidAmount,
    refundedAmount: 0,
    refundPendingAmount: 0,
    currency: "INR",
  };
}

test("B4.4C.4A simultaneous PostgreSQL workers claim one pending sync only once", async () => {
  await withFixture(async (prisma, paymentId, bookingId) => {
    const repository = createPrismaPaymentRepositoryModule(prisma).repository;
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const paymentUpdatedAt = payment.updatedAt.toISOString();
    await repository.upsertPendingBookingSync({
      paymentId, bookingId, paymentUpdatedAt, paymentSnapshot: snapshot(400),
      requestedBy: "B44C4_SETUP",
    });
    const dueAt = new Date(Date.now() + 10_000).toISOString();
    const leaseUntil = new Date(Date.now() + 300_000).toISOString();
    // Independent repository instances represent competing worker processes.
    const workerA = createPrismaPaymentRepositoryModule(prisma).repository;
    const workerB = createPrismaPaymentRepositoryModule(prisma).repository;
    const [claimedA, claimedB] = await Promise.all([
      workerA.claimRetryableBookingSyncs({ dueAt, leaseUntil, limit: 1 }),
      workerB.claimRetryableBookingSyncs({ dueAt, leaseUntil, limit: 1 }),
    ]);
    assert.equal(claimedA.length + claimedB.length, 1, "Exactly one worker must acquire the lease");
    assert.equal((claimedA[0] ?? claimedB[0]).paymentId, paymentId);
    const duringLease = await repository.claimRetryableBookingSyncs({ dueAt, leaseUntil, limit: 1 });
    assert.equal(duringLease.length, 0, "Leased sync cannot be reclaimed before expiry");
    const record = await prisma.paymentBookingSync.findUniqueOrThrow({ where: { paymentId } });
    assert.equal(record.status, "PENDING");
    assert.equal(record.nextRetryAt?.toISOString(), leaseUntil);
    assert.equal(record.attemptCount, 0);
    assert.equal(await prisma.paymentTransaction.count({ where: { paymentId } }), 0);
  });
});

test("B4.4C.4B stale payment version cannot overwrite or complete newer sync", async () => {
  await withFixture(async (prisma, paymentId, bookingId) => {
    const repository = createPrismaPaymentRepositoryModule(prisma).repository;
    const originalPayment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const oldVersion = originalPayment.updatedAt.toISOString();
    await repository.upsertPendingBookingSync({
      paymentId, bookingId, paymentUpdatedAt: oldVersion,
      paymentSnapshot: snapshot(400), requestedBy: "B44C4_OLD_VERSION",
    });
    // Force a deterministic later payment version without sleeps.
    const newVersionDate = new Date(originalPayment.updatedAt.getTime() + 60_000);
    await prisma.payment.update({
      where: { id: paymentId },
      data: { paidAmount: 600, balanceAmount: 400, paymentPending: 400, updatedAt: newVersionDate },
    });
    const newVersion = (await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })).updatedAt.toISOString();
    assert.ok(new Date(newVersion).getTime() > new Date(oldVersion).getTime());
    await repository.upsertPendingBookingSync({
      paymentId, bookingId, paymentUpdatedAt: newVersion,
      paymentSnapshot: snapshot(600), requestedBy: "B44C4_NEW_VERSION",
    });
    // An older worker must not restore the old snapshot.
    await repository.upsertPendingBookingSync({
      paymentId, bookingId, paymentUpdatedAt: oldVersion,
      paymentSnapshot: snapshot(400), requestedBy: "B44C4_STALE_WORKER",
    });
    const attemptedAt = new Date().toISOString();
    const staleCompletion = await repository.markBookingSyncSynchronized({
      paymentId, paymentUpdatedAt: oldVersion, bookingSnapshot: snapshot(400),
      attemptedAt, synchronizedAt: attemptedAt,
    });
    assert.equal(staleCompletion, null, "Old version must not mark newer version synchronized");
    const staleFailure = await repository.markBookingSyncRetryPending({
      paymentId, paymentUpdatedAt: oldVersion, attemptedAt,
      nextRetryAt: new Date(Date.now() + 30_000).toISOString(),
      errorCode: "STALE_TEST", errorMessage: "stale worker failure",
    });
    assert.equal(staleFailure, null, "Old version must not overwrite newer retry state");
    const current = await prisma.paymentBookingSync.findUniqueOrThrow({ where: { paymentId } });
    assert.equal(current.paymentUpdatedAt.toISOString(), newVersion);
    assert.equal(current.status, "PENDING");
    assert.equal(current.attemptCount, 0);
    const financials = current.paymentSnapshotJson as Record<string, number>;
    assert.equal(financials.paidAmount, 600);
    assert.equal(financials.balanceAmount, 400);
    assert.equal(await prisma.paymentTransaction.count({ where: { paymentId } }), 0);
    const newCompletion = await repository.markBookingSyncSynchronized({
      paymentId, paymentUpdatedAt: newVersion, bookingSnapshot: snapshot(600),
      attemptedAt, synchronizedAt: attemptedAt,
    });
    assert.ok(newCompletion, "Current version must be allowed to complete");
    const completed = await prisma.paymentBookingSync.findUniqueOrThrow({ where: { paymentId } });
    assert.equal(completed.status, "SYNCHRONIZED");
    assert.equal(completed.attemptCount, 1);
    assert.equal(completed.paymentUpdatedAt.toISOString(), newVersion);
  });
});
