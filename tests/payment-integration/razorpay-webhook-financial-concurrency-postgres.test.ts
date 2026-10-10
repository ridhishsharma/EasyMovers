import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient, PaymentProvider as PrismaProvider } from "@prisma/client";
import { PaymentProvider } from "../../domains/payment/models/payment.model";
import { createPrismaPaymentRepositoryModule } from "../../domains/payment/repositories/payment.prisma.repository";
import { recordSuccessfulPaymentCollection } from "../../domains/payment/services/payment.service";

// B4.2C financial concurrency integration: REAL isolated PostgreSQL,
// real payment repository and collection transaction, no Razorpay HTTP calls.
// This does not yet exercise the entire HTTP webhook handler.
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
assert.ok(process.env.DATABASE_URL);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const url = new URL(process.env.DATABASE_URL);
assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5432");
assert.equal(url.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(url.username), "easymovers_test_user");
assert.ok(url.password);
assert.equal(url.searchParams.get("schema"), "public");
assert.deepEqual([...url.searchParams.keys()], ["schema"]);
assert.equal(url.hash, "");

type Fixture = {
  prisma: PrismaClient; leadId: string; bookingId: string;
  paymentId: string; suffix: string; gatewayPaymentId: string; gatewayOrderId: string;
};
async function createFixture(): Promise<Fixture> {
  const prisma = new PrismaClient();
  const suffix = randomUUID().replace(/-/g, "");
  let leadId: string | undefined;
  let bookingId: string | undefined;
  try {
    const lead = await prisma.lead.create({
      data: { referenceId: `EM-B42C-LEAD-${suffix}`, name: "Webhook Concurrency Fixture", mobile: "9000000000" },
    });
    leadId = lead.id;
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `EM-B42C-${suffix}`, leadId: lead.id, leadReferenceId: lead.referenceId,
        customerName: "Webhook Concurrency Fixture", customerMobile: "9000000000",
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
        paymentNumber: `EMP-B42C-${suffix}`, bookingId: booking.id,
        amount: 1000, totalAmount: 1000, paidAmount: 0,
        balanceAmount: 1000, paymentPending: 1000,
        currency: "INR", paymentStatus: "PENDING",
      },
    });
    await prisma.paymentGatewayOrder.create({
      data: {
        paymentId: payment.id, provider: PrismaProvider.RAZORPAY,
        gatewayOrderId: `order_${suffix}`, amount: 400, currency: "INR",
        status: "CREATED",
      },
    });
    return {
      prisma, leadId, bookingId, paymentId: payment.id, suffix,
      gatewayPaymentId: `pay_${suffix}`, gatewayOrderId: `order_${suffix}`,
    };
  } catch (error) {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (leadId) await prisma.lead.deleteMany({ where: { id: leadId } });
    await prisma.$disconnect();
    throw error;
  }
}
async function cleanup(f: Fixture) {
  try {
    await f.prisma.paymentWebhook.deleteMany({
      where: { provider: PrismaProvider.RAZORPAY, gatewayPaymentId: f.gatewayPaymentId },
    });
    await f.prisma.payment.deleteMany({ where: { id: f.paymentId } });
    await f.prisma.booking.deleteMany({ where: { id: f.bookingId } });
    await f.prisma.lead.deleteMany({ where: { id: f.leadId } });
  } finally {
    await f.prisma.$disconnect();
  }
}
function collect(f: Fixture, attempt: string) {
  const module = createPrismaPaymentRepositoryModule(f.prisma);
  return recordSuccessfulPaymentCollection(module.transactionManager, {
    paymentId: f.paymentId, amount: 400,
    transactionId: `B42C-TXN-${attempt}-${f.suffix}`,
    provider: PaymentProvider.RAZORPAY,
    gateway: {
      provider: PaymentProvider.RAZORPAY,
      gatewayOrderId: f.gatewayOrderId,
      gatewayPaymentId: f.gatewayPaymentId,
    },
    completedAt: new Date().toISOString(),
    updatedBy: "PAYMENT_INTEGRATION_TEST",
  });
}
async function assertOneCredit(f: Fixture) {
  const payment = await f.prisma.payment.findUniqueOrThrow({ where: { id: f.paymentId } });
  assert.equal(Number(payment.paidAmount), 400);
  assert.equal(Number(payment.balanceAmount), 600);
  const rows = await f.prisma.paymentTransaction.findMany({
    where: { gatewayPaymentId: f.gatewayPaymentId },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].paymentId, f.paymentId);
  assert.equal(rows[0].gatewayOrderId, f.gatewayOrderId);
  assert.equal(rows[0].provider, PrismaProvider.RAZORPAY);
  assert.equal(rows[0].status, "SUCCESS");
  assert.equal(Number(rows[0].amount), 400);
  const sync = await f.prisma.paymentBookingSync.findUnique({
    where: { paymentId: f.paymentId },
  });
  assert.ok(sync, "Collection must persist booking sync");
  assert.equal(sync.bookingId, f.bookingId);
}
test("B4.2C simultaneous Razorpay collections sharing payment ID credit once", async () => {
  const f = await createFixture();
  try {
    const outcomes = await Promise.allSettled([collect(f, "A"), collect(f, "B")]);
    for (const [index, outcome] of outcomes.entries()) {
      if (outcome.status === "rejected") {
        const error = outcome.reason as { name?: unknown; code?: unknown; message?: unknown; cause?: { code?: unknown; message?: unknown } };
        const safe = (v: unknown) => typeof v === "string" ? v.slice(0, 180) : "UNKNOWN";
        console.error("[B4.2C:COLLECTION_REJECTION]", {
          attempt: index + 1,
          name: safe(error?.name),
          code: safe(error?.code),
          message: safe(error?.message),
          causeCode: safe(error?.cause?.code),
          causeMessage: safe(error?.cause?.message),
        });
      }
    }
    assert.equal(outcomes.filter(x => x.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter(x => x.status === "rejected").length, 1);
    await assertOneCredit(f);
  } finally { await cleanup(f); }
});
test("B4.2C two event receipts cannot bypass unique financial payment ID", async () => {
  const f = await createFixture();
  try {
    const eventIds = [`evt_A_${f.suffix}`, `evt_B_${f.suffix}`];
    await f.prisma.paymentWebhook.createMany({
      data: eventIds.map((id, i) => ({
        webhookId: `B42C-${randomUUID()}`,
        provider: PrismaProvider.RAZORPAY, providerEventId: id,
        eventType: "payment.captured", payloadHash: String(i).repeat(64),
        gatewayOrderId: f.gatewayOrderId, gatewayPaymentId: f.gatewayPaymentId,
        paymentId: f.paymentId,
      })),
    });
    const outcomes = await Promise.allSettled([collect(f, "EVENT-A"), collect(f, "EVENT-B")]);
    for (const [index, outcome] of outcomes.entries()) {
      if (outcome.status === "rejected") {
        const error = outcome.reason as { name?: unknown; code?: unknown; message?: unknown; cause?: { code?: unknown; message?: unknown } };
        const safe = (v: unknown) => typeof v === "string" ? v.slice(0, 180) : "UNKNOWN";
        console.error("[B4.2C:COLLECTION_REJECTION]", {
          attempt: index + 1,
          name: safe(error?.name),
          code: safe(error?.code),
          message: safe(error?.message),
          causeCode: safe(error?.cause?.code),
          causeMessage: safe(error?.cause?.message),
        });
      }
    }
    assert.equal(outcomes.filter(x => x.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter(x => x.status === "rejected").length, 1);
    await assertOneCredit(f);
    const receipts = await f.prisma.paymentWebhook.findMany({
      where: { provider: PrismaProvider.RAZORPAY, providerEventId: { in: eventIds } },
    });
    assert.equal(receipts.length, 2);
    assert.ok(receipts.every(r => !r.processed),
      "Receipt must not be marked processed by financial collection alone");
  } finally { await cleanup(f); }
});
