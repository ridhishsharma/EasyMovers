import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Prisma, PrismaClient, PaymentProvider } from "@prisma/client";

// B4.2A: isolated PostgreSQL webhook receipt uniqueness, NOT full route certification.
// Refuse to instantiate Prisma unless launched by the guarded local test runner.
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

const prisma = new PrismaClient();
test.after(async () => { await prisma.$disconnect(); });
const isUnique = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

test("B4.2A identical provider event IDs cannot create two webhook receipts", async () => {
  const eventId = `evt_b42_${randomUUID().replace(/-/g, "")}`;
  const webhookId = `B42-${randomUUID()}`;
  const data = {
    provider: PaymentProvider.RAZORPAY,
    providerEventId: eventId,
    eventType: "payment.captured",
    payloadHash: "a".repeat(64),
    gatewayOrderId: `order_${randomUUID().replace(/-/g, "")}`,
    gatewayPaymentId: `pay_${randomUUID().replace(/-/g, "")}`,
  };
  try {
    const outcomes = await Promise.allSettled([
      prisma.paymentWebhook.create({ data: { ...data, webhookId } }),
      prisma.paymentWebhook.create({ data: { ...data, webhookId: `B42-${randomUUID()}` } }),
    ]);
    assert.equal(outcomes.filter(x => x.status === "fulfilled").length, 1);
    const failures = outcomes.filter(x => x.status === "rejected");
    assert.equal(failures.length, 1);
    assert.ok(isUnique((failures[0] as PromiseRejectedResult).reason));
    assert.equal(await prisma.paymentWebhook.count({
      where: { provider: PaymentProvider.RAZORPAY, providerEventId: eventId },
    }), 1);
    const receipt = await prisma.paymentWebhook.findUnique({
      where: { provider_providerEventId: { provider: PaymentProvider.RAZORPAY, providerEventId: eventId } },
    });
    assert.equal(receipt?.processed, false, "receipt is not processed merely by being inserted");
  } finally {
    await prisma.paymentWebhook.deleteMany({
      where: { provider: PaymentProvider.RAZORPAY, providerEventId: eventId },
    });
  }
});

test("B4.2A different event IDs can reference one payment: financial dedupe must be separate", async () => {
  const suffix = randomUUID().replace(/-/g, "");
  const ids = [`evt_b42_a_${suffix}`, `evt_b42_b_${suffix}`];
  const gatewayPaymentId = `pay_${suffix}`;
  try {
    await prisma.paymentWebhook.createMany({ data: ids.map((eventId, index) => ({
      webhookId: `B42-${randomUUID()}`,
      provider: PaymentProvider.RAZORPAY,
      providerEventId: eventId,
      eventType: "payment.captured",
      payloadHash: String(index).repeat(64),
      gatewayPaymentId,
      gatewayOrderId: `order_${suffix}`,
    })) });
    assert.equal(await prisma.paymentWebhook.count({
      where: { provider: PaymentProvider.RAZORPAY, providerEventId: { in: ids } },
    }), 2);
    // Different receipt IDs do NOT guarantee financial idempotency.
    // B4.2B must exercise the actual route and PaymentTransaction uniqueness.
  } finally {
    await prisma.paymentWebhook.deleteMany({
      where: { provider: PaymentProvider.RAZORPAY, providerEventId: { in: ids } },
    });
  }
});
