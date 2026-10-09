import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { PaymentProvider } from "../../domains/payment/models/payment.model";
import { createPrismaPaymentRepositoryModule } from "../../domains/payment/repositories/payment.prisma.repository";
import { recordSuccessfulPaymentCollection } from "../../domains/payment/services/payment.service";

// Never create a Prisma client unless the guarded local runner selected the
// isolated database. These checks must remain above new PrismaClient().
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
assert.ok(process.env.DATABASE_URL);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const target = new URL(process.env.DATABASE_URL);
assert.ok(["postgres:", "postgresql:"].includes(target.protocol));
assert.equal(target.hostname, "127.0.0.1");
assert.equal(target.port, "5432");
assert.equal(target.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(target.username), "easymovers_test_user");
assert.ok(target.password);
assert.equal(target.searchParams.get("schema"), "public");
assert.deepEqual([...target.searchParams.keys()], ["schema"]);
assert.equal(target.hash, "");

type Fixture = { prisma: PrismaClient; paymentId: string; bookingId: string; leadId: string; suffix: string };

async function fixture(): Promise<Fixture> {
  const prisma = new PrismaClient();
  const suffix = randomUUID().replace(/-/g, "");
  let leadId: string | undefined;
  let bookingId: string | undefined;
  try {
    const lead = await prisma.lead.create({
      data: { referenceId: `EM-B3-LEAD-${suffix}`, name: "Payment Concurrency Fixture", mobile: "9000000000" },
    });
    leadId = lead.id;
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `EM-B3-${suffix}`, leadId: lead.id, leadReferenceId: lead.referenceId,
        customerName: "Payment Concurrency Fixture", customerMobile: "9000000000",
        serviceType: "HOUSEHOLD_SHIFTING", moveType: "WITHIN_CITY",
        moveDate: new Date("2027-01-01T09:00:00Z"),
        pickupCity: "Bhopal", pickupState: "MP", pickupPincode: "462001",
        dropCity: "Bhopal", dropState: "MP", dropPincode: "462001",
        pickupAddress: "Integration Test Pickup", dropAddress: "Integration Test Drop",
        contactJson: {}, pickupAddressJson: {}, dropAddressJson: {},
        scheduleJson: {}, inventoryJson: [], inventorySummaryJson: {},
        servicesJson: {}, timelineJson: [], auditJson: [], totalAmount: 1000,
      },
    });
    bookingId = booking.id;
    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `EMP-B3-${suffix}`, bookingId: booking.id,
        amount: 1000, totalAmount: 1000, paidAmount: 0,
        balanceAmount: 1000, paymentPending: 1000,
        currency: "INR", paymentStatus: "PENDING",
      },
    });
    return { prisma, paymentId: payment.id, bookingId: booking.id, leadId: lead.id, suffix };
  } catch (error) {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (leadId) await prisma.lead.deleteMany({ where: { id: leadId } });
    await prisma.$disconnect();
    throw error;
  }
}

async function cleanup(f: Fixture) {
  try {
    await f.prisma.payment.deleteMany({ where: { id: f.paymentId } });
    await f.prisma.booking.deleteMany({ where: { id: f.bookingId } });
    await f.prisma.lead.deleteMany({ where: { id: f.leadId } });
  } finally {
    await f.prisma.$disconnect();
  }
}

async function verify(f: Fixture, paid: number, count: number) {
  const payment = await f.prisma.payment.findUniqueOrThrow({ where: { id: f.paymentId } });
  const transactions = await f.prisma.paymentTransaction.findMany({
    where: { paymentId: f.paymentId, status: "SUCCESS" },
  });
  assert.equal(Number(payment.totalAmount), 1000);
  assert.equal(Number(payment.paidAmount), paid);
  assert.equal(Number(payment.balanceAmount), 1000 - paid);
  assert.equal(transactions.length, count);
  assert.equal(transactions.reduce((sum, row) => sum + Number(row.amount), 0), paid);
  assert.ok(paid <= 1000, "Concurrent collections must not overpay");
  const sync = await f.prisma.paymentBookingSync.findUnique({ where: { paymentId: f.paymentId } });
  assert.ok(sync, "A successful collection must persist booking sync");
  assert.equal(sync.bookingId, f.bookingId);
}

function collector(f: Fixture) {
  const module = createPrismaPaymentRepositoryModule(f.prisma);
  return (amount: number, token: string, gatewayToken = token) =>
    recordSuccessfulPaymentCollection(module.transactionManager, {
      paymentId: f.paymentId, amount,
      transactionId: `B3-TXN-${token}-${f.suffix}`,
      provider: PaymentProvider.OTHER,
      gateway: {
        provider: PaymentProvider.OTHER,
        gatewayPaymentId: `B3-GW-${gatewayToken}-${f.suffix}`,
      },
      completedAt: new Date().toISOString(),
      updatedBy: "PAYMENT_INTEGRATION_TEST",
    });
}

// These requests start together. They test concurrent API-level operations,
// but are NOT a deterministic DB-interleaving barrier; see B3 certification
// plan for the stronger controlled-overlap test still required.
test("B3 competing INR 700 collections never exceed INR 1000", async () => {
  const f = await fixture();
  try {
    const collect = collector(f);
    const outcomes = await Promise.allSettled([
      collect(700, "COMPETE-A"), collect(700, "COMPETE-B"),
    ]);
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
    await verify(f, 700, 1);
  } finally {
    await cleanup(f);
  }
});

test("B3 concurrent INR 400 and INR 600 collections preserve both writes", async () => {
  const f = await fixture();
  try {
    const collect = collector(f);
    const outcomes = await Promise.allSettled([
      collect(400, "SPLIT-A"), collect(600, "SPLIT-B"),
    ]);
    const rejected = outcomes.filter(
      (outcome): outcome is PromiseRejectedResult => outcome.status === "rejected",
    );
    if (rejected.length) {
      // Only log bounded metadata; never serialize raw Prisma errors or details.
      for (const outcome of rejected) {
        const reason = outcome.reason as { name?: unknown; code?: unknown } | null;
        console.error("[B3:SPLIT_COLLECTION_REJECTION]", {
          name: typeof reason?.name === "string" ? reason.name : "UNKNOWN",
          code: typeof reason?.code === "string" ? reason.code : "UNKNOWN",
        });
      }
    }
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 2,
      "Both valid collections must eventually commit; inspect safe rejection code above");
    await verify(f, 1000, 2);
  } finally {
    await cleanup(f);
  }
});

test("B3 concurrent duplicate gateway payment IDs cannot double-credit", async () => {
  const f = await fixture();
  try {
    const collect = collector(f);
    const outcomes = await Promise.allSettled([
      collect(400, "DUP-A", "SAME"), collect(400, "DUP-B", "SAME"),
    ]);
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
    await verify(f, 400, 1);
    assert.equal(await f.prisma.paymentTransaction.count({
      where: { gatewayPaymentId: `B3-GW-SAME-${f.suffix}` },
    }), 1);
  } finally {
    await cleanup(f);
  }
});
