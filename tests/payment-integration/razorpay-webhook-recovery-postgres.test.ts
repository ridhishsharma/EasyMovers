import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient, PaymentProvider as PrismaProvider } from "@prisma/client";
import { PaymentProvider } from "../../domains/payment/models/payment.model";
import { createPrismaPaymentRepositoryModule } from "../../domains/payment/repositories/payment.prisma.repository";
import { recordSuccessfulPaymentCollection } from "../../domains/payment/services/payment.service";

// B4.3A financial concurrency integration: REAL isolated PostgreSQL,
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
      data: { referenceId: `EM-B43A-LEAD-${suffix}`, name: "Webhook Concurrency Fixture", mobile: "9000000000" },
    });
    leadId = lead.id;
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `EM-B43A-${suffix}`, leadId: lead.id, leadReferenceId: lead.referenceId,
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
        paymentNumber: `EMP-B43A-${suffix}`, bookingId: booking.id,
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
    transactionId: `B43A-TXN-${attempt}-${f.suffix}`,
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

// Controlled failure is injected after a real transaction insert, inside the
// production repository transaction manager. No application code is modified.
test("B4.3A failure after insert rolls back; retry credits once; replay rejected", async () => {
  const f = await createFixture();
  try {
    const module = createPrismaPaymentRepositoryModule(f.prisma);
    let inserted = false;
    const manager: Pick<typeof module.transactionManager, "runInTransaction"> = {
      runInTransaction: callback => module.transactionManager.runInTransaction(async context => {
        const repository = context.repository;
        const decorated = new Proxy(repository, {
          get(target, property, receiver) {
            if (property === "createTransaction") {
              return async (...args: Parameters<typeof target.createTransaction>) => {
                const transaction = await target.createTransaction(...args);
                inserted = true;
                return transaction;
              };
            }
            if (property === "updateFinancialSummary") {
              return async () => {
                assert.equal(inserted, true, "Must inject after real transaction insert");
                throw new Error("B43A_INJECTED_FAILURE");
              };
            }
            const value = Reflect.get(target, property, receiver);
            return typeof value === "function" ? value.bind(target) : value;
          },
        });
        return callback({ repository: decorated });
      }),
    };
    const input = {
      paymentId: f.paymentId, amount: 400,
      transactionId: `B43A-TXN-${f.suffix}`,
      provider: PaymentProvider.RAZORPAY,
      gateway: {
        provider: PaymentProvider.RAZORPAY,
        gatewayOrderId: f.gatewayOrderId,
        gatewayPaymentId: f.gatewayPaymentId,
      },
      completedAt: new Date().toISOString(),
      updatedBy: "PAYMENT_INTEGRATION_TEST",
    };
    await assert.rejects(() => recordSuccessfulPaymentCollection(manager, input));
    assert.equal(inserted, true);
    const failed = await f.prisma.payment.findUniqueOrThrow({ where: { id: f.paymentId } });
    assert.equal(Number(failed.paidAmount), 0);
    assert.equal(Number(failed.balanceAmount), 1000);
    assert.equal(await f.prisma.paymentTransaction.count({ where: { gatewayPaymentId: f.gatewayPaymentId } }), 0);
    assert.equal(await f.prisma.paymentBookingSync.count({ where: { paymentId: f.paymentId } }), 0);
    const gatewayAfterFailure = await f.prisma.paymentGatewayOrder.findUniqueOrThrow({
      where: { gatewayOrderId: f.gatewayOrderId },
    });
    assert.equal(gatewayAfterFailure.status, "CREATED", "Gateway order update must roll back");
    await recordSuccessfulPaymentCollection(module.transactionManager, input);
    await assertOneCredit(f);
    await assert.rejects(() => recordSuccessfulPaymentCollection(module.transactionManager, input));
    await assertOneCredit(f);
    const gatewayAfterRecovery = await f.prisma.paymentGatewayOrder.findUniqueOrThrow({
      where: { gatewayOrderId: f.gatewayOrderId },
    });
    assert.equal(gatewayAfterRecovery.status, "PAID");
  } finally {
    await cleanup(f);
  }
});
