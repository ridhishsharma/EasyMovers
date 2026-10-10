import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transformSync } from "esbuild";
import { test } from "node:test";
import { PrismaClient, PaymentProvider as PrismaProvider } from "@prisma/client";
import { PaymentProvider } from "../../domains/payment/models/payment.model";
import { createPrismaPaymentRepositoryModule } from "../../domains/payment/repositories/payment.prisma.repository";
import { recordSuccessfulPaymentCollection } from "../../domains/payment/services/payment.service";

// B4.3D.3 financial concurrency integration: REAL isolated PostgreSQL,
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
      data: { referenceId: `EM-B43D3-LEAD-${suffix}`, name: "Webhook Concurrency Fixture", mobile: "9000000000" },
    });
    leadId = lead.id;
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `EM-B43D3-${suffix}`, leadId: lead.id, leadReferenceId: lead.referenceId,
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
        paymentNumber: `EMP-B43D3-${suffix}`, bookingId: booking.id,
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
    transactionId: `B43D3-TXN-${attempt}-${f.suffix}`,
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

const secret = "B43D3_LOCAL_ONLY_SECRET";
const old = {
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};
process.env.RAZORPAY_WEBHOOK_SECRET = secret;
process.env.RAZORPAY_KEY_ID = "rzp_test_B43D3Local";
process.env.RAZORPAY_KEY_SECRET = "B43D3_LOCAL_KEY_SECRET";
test.after(() => {
  for (const [key, value] of Object.entries(old)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
test("B4.3D.3 simultaneous distinct webhook events eventually converge to one financial collection", async () => {
  const f = await createFixture();
  const eventId = `evt_B43D3_${f.suffix}`;
  let collectionCalls = 0;
  let captureChecks = 0;
  let bookingSyncCalls = 0;
  try {
    // The fixture has no selected quotation. Only the order's commercial
    // authority projection is doubled; financial state and receipt persistence
    // remain real PostgreSQL, using the real collection domain service.
    const deps: Record<string, unknown> = {
      "next/server": {
        NextResponse: { json: (body: unknown, init: {status?: number; headers?: Record<string,string>} = {}) =>
          Response.json(body, {status: init.status ?? 200, headers: init.headers}) },
      },
      "@prisma/client": {
        PaymentProvider: { RAZORPAY: "RAZORPAY" },
        Prisma: { PrismaClientKnownRequestError: class extends Error {} },
      },
      "@/domains/payment/models/payment.model": {
        PaymentProvider: { RAZORPAY: "RAZORPAY" },
        PaymentPurpose: { ADVANCE: "ADVANCE" },
      },
      "@/lib/prisma": {
        prisma: new Proxy(f.prisma, {
          get(target, key, receiver) {
            if (key === "paymentGatewayOrder") {
              return {
                findUnique: async ({where}: any) => {
                  const found = await target.paymentGatewayOrder.findUnique({
                    where: { gatewayOrderId: where.gatewayOrderId },
                  });
                  if (!found) return null;
                  return {
                    ...found,
                    payment: {
                      id: f.paymentId, bookingId: f.bookingId,
                      quotationId: "B43D3_AUTHORITY_FIXTURE",
                      advanceAmount: found.amount, currency: "INR",
                      commercialReference: `EM-B43D3-${f.suffix}`,
                    },
                  };
                },
              };
            }
            const value = Reflect.get(target, key, receiver);
            return typeof value === "function" ? value.bind(target) : value;
          },
        }),
      },
      "@/lib/payments/razorpay-verification": {
        verifyRazorpayWebhookSignature: (raw: string, signature: string, key: string) =>
          createHmac("sha256", key).update(raw).digest("hex") === signature,
        fetchCapturedRazorpayPayment: async () => { captureChecks++; },
      },
      "@/app/api/payments/_lib/payment-api.module": {
        resolvePaymentApiCollectionWorkflowService: async () => ({
          recordSuccessfulCollection: async () => {
            collectionCalls++;
            await collect(f, `HTTP-${collectionCalls}`);
            await f.prisma.paymentBookingSync.update({
              where: {paymentId: f.paymentId}, data: {status: "SYNCHRONIZED"},
            });
            return {bookingSynchronization: {success: true}};
          },
        }),
        resolvePaymentApiBookingSyncService: async () => ({
          syncPaymentToBooking: async () => {
            bookingSyncCalls++;
            await f.prisma.paymentBookingSync.update({
              where: {paymentId: f.paymentId}, data: {status: "SYNCHRONIZED"},
            });
            return {success: true};
          },
        }),
      },
    };
    const source = readFileSync(resolve("app/api/payments/razorpay/webhook/route.ts"), "utf8");
    const compiled = transformSync(source, {loader:"ts", format:"cjs", target:"node20"}).code;
    const moduleDouble = {exports: {} as Record<string, unknown>};
    new Function("require","module","exports",compiled)(
      (name: string) => {
        if (Object.hasOwn(deps,name)) return deps[name];
        if (name === "node:crypto") return require("node:crypto");
        throw new Error(`Unexpected dependency: ${name}`);
      }, moduleDouble, moduleDouble.exports,
    );
    const POST = moduleDouble.exports.POST as (request: Request) => Promise<Response>;
    const raw = JSON.stringify({event:"payment.captured",payload:{payment:{entity:{
      id:f.gatewayPaymentId,order_id:f.gatewayOrderId,
    }}}});
    const signature = createHmac("sha256",secret).update(raw).digest("hex");
    const send = (id: string) => POST(new Request("http://localhost/api/payments/razorpay/webhook",{
      method:"POST",body:raw,headers:{
        "x-razorpay-event-id":id,"x-razorpay-signature":signature,
      },
    }));
    const eventA = eventId;
    const eventB = `evt_B43D3_SECOND_${f.suffix}`;
    const simultaneous = await Promise.all([send(eventA), send(eventB)]);
    const initialStatuses = simultaneous.map(r => r.status);
    assert.ok(initialStatuses.every(status => status === 200 || status === 503),
      `Unexpected concurrent statuses: ${initialStatuses.join(",")}`);
    assert.ok(initialStatuses.includes(200), "At least one delivery must succeed");
    await assertOneCredit(f);
    // Both distinct events may initially race on the financial transaction.
    // A retry must recognize the already recorded payment, not credit twice.
    const retryA = await send(eventA);
    const retryB = await send(eventB);
    assert.equal(retryA.status, 200, JSON.stringify(await retryA.json()));
    assert.equal(retryB.status, 200, JSON.stringify(await retryB.json()));
    await assertOneCredit(f);
    const receipts = await f.prisma.paymentWebhook.findMany({
      where: { provider: PrismaProvider.RAZORPAY,
        providerEventId: { in: [eventA, eventB] } },
    });
    assert.equal(receipts.length, 2);
    assert.ok(receipts.every(row => row.processed));
    assert.equal(await f.prisma.paymentTransaction.count({
      where: { gatewayPaymentId: f.gatewayPaymentId },
    }), 1);
    assert.ok(collectionCalls >= 1);
    assert.ok(captureChecks >= 4);
    const payment = await f.prisma.payment.findUniqueOrThrow({where:{id:f.paymentId}});
    assert.equal(Number(payment.paidAmount), 400);
    assert.equal(Number(payment.balanceAmount), 600);
  } finally {
    await cleanup(f);
  }
});
