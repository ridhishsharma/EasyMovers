import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { transformSync } from "esbuild";

// Isolated handler contract test. DB/workflow/gateway are deterministic in-memory doubles.
// Full PostgreSQL financial certification remains a separate B4.2C gate.
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const db = new URL(process.env.DATABASE_URL || "");
assert.equal(db.hostname, "127.0.0.1");
assert.equal(db.port, "5432");
assert.equal(db.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(db.username), "easymovers_test_user");
assert.ok(db.password);
assert.equal(db.searchParams.get("schema"), "public");
assert.deepEqual([...db.searchParams.keys()], ["schema"]);

const secret = "B43B_LOCAL_ONLY_SECRET";
const previous = {
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};
process.env.RAZORPAY_WEBHOOK_SECRET = secret;
process.env.RAZORPAY_KEY_ID = "rzp_test_B43BLocal";
process.env.RAZORPAY_KEY_SECRET = "B43B_LOCAL_ONLY_KEY_SECRET";
test.after(() => {
  for (const [name, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

class DecimalDouble {
  constructor(private readonly value: number) {}
  mul(n: number) { return new DecimalDouble(this.value * n); }
  toFixed(n: number) { return this.value.toFixed(n); }
}
type Receipt = {
  providerEventId: string; payloadHash: string; gatewayOrderId: string;
  gatewayPaymentId: string; paymentId: string; processed: boolean;
};
type Transaction = { paymentId: string; gatewayOrderId: string; amount: DecimalDouble; currency: string; status: string };
const receipts = new Map<string, Receipt>();
const transactions = new Map<string, Transaction>();
let collectionCalls = 0;
let captureChecks = 0;
let syncCalls = 0;
let synchronized = true;
let failCollectionSync = false;
let failReplaySync = false;
const paymentId = `payment_B43B_${randomUUID().replace(/-/g, "")}`;
const gatewayPaymentId = `pay_${randomUUID().replace(/-/g, "")}`;
const gatewayOrderId = `order_${randomUUID().replace(/-/g, "")}`;
const order = {
  paymentId, provider: "RAZORPAY", amount: new DecimalDouble(10),
  currency: "INR", payment: {
    id: paymentId, bookingId: "booking_B43B", quotationId: "quotation_B43B",
    advanceAmount: new DecimalDouble(10), currency: "INR", commercialReference: "EM-B43B",
  },
};
const prisma = {
  paymentGatewayOrder: { findUnique: async () => order },
  paymentWebhook: {
    findUnique: async ({ where }: any) => receipts.get(where.provider_providerEventId.providerEventId) ?? null,
    create: async ({ data }: any) => {
      if (receipts.has(data.providerEventId)) throw new Error("Duplicate receipt");
      receipts.set(data.providerEventId, { ...data, processed: false });
    },
    updateMany: async ({ where }: any) => {
      const item = receipts.get(where.providerEventId);
      if (!item || item.payloadHash !== where.payloadHash) return { count: 0 };
      item.processed = true;
      return { count: 1 };
    },
  },
  paymentTransaction: {
    findUnique: async ({ where }: any) => transactions.get(where.gatewayPaymentId) ?? null,
  },
  paymentBookingSync: {
    findUnique: async () => ({ status: synchronized ? "SYNCHRONIZED" : "PENDING" }),
  },
};
const dependencies: Record<string, unknown> = {
  "next/server": { NextResponse: { json: (body: unknown, init: any = {}) => Response.json(body, { status: init.status ?? 200, headers: init.headers }) } },
  "@prisma/client": { PaymentProvider: { RAZORPAY: "RAZORPAY" }, Prisma: { PrismaClientKnownRequestError: class extends Error {} } },
  "@/domains/payment/models/payment.model": { PaymentProvider: { RAZORPAY: "RAZORPAY" }, PaymentPurpose: { ADVANCE: "ADVANCE" } },
  "@/lib/prisma": { prisma },
  "@/lib/payments/razorpay-verification": {
    verifyRazorpayWebhookSignature: (raw: string, signature: string, key: string) =>
      createHmac("sha256", key).update(raw).digest("hex") === signature,
    fetchCapturedRazorpayPayment: async () => { captureChecks++; },
  },
  "@/app/api/payments/_lib/payment-api.module": {
    resolvePaymentApiCollectionWorkflowService: async () => ({
      recordSuccessfulCollection: async (input: any) => {
        collectionCalls++;
        if (transactions.has(input.gateway.gatewayPaymentId)) throw new Error("Double collection");
        transactions.set(input.gateway.gatewayPaymentId, {
          paymentId: input.paymentId, gatewayOrderId: input.gateway.gatewayOrderId,
          amount: new DecimalDouble(input.amount), currency: input.currency, status: "SUCCESS",
        });
        return { bookingSynchronization: { success: !failCollectionSync } };
      },
    }),
    resolvePaymentApiBookingSyncService: async () => ({
      syncPaymentToBooking: async () => { syncCalls++; if (failReplaySync) return { success: false }; synchronized = true; return { success: true }; },
    }),
  },
};
const source = readFileSync(resolve("app/api/payments/razorpay/webhook/route.ts"), "utf8");
const compiled = transformSync(source, { loader: "ts", format: "cjs", target: "node20" }).code;
const moduleDouble = { exports: {} as Record<string, unknown> };
new Function("require", "module", "exports", compiled)(
  (name: string) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (name === "node:crypto") return require("node:crypto");
    throw new Error(`Unexpected dependency: ${name}`);
  }, moduleDouble, moduleDouble.exports,
);
const POST = moduleDouble.exports.POST as (request: Request) => Promise<Response>;
assert.equal(typeof POST, "function");
const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: gatewayPaymentId, order_id: gatewayOrderId } } } });
const sign = (raw: string) => createHmac("sha256", secret).update(raw).digest("hex");
function request(eventId: string, raw = body) {
  return new Request("http://localhost/api/payments/razorpay/webhook", {
    method: "POST", body: raw,
    headers: { "x-razorpay-signature": sign(raw), "x-razorpay-event-id": eventId },
  });
}
function reset() {
  receipts.clear(); transactions.clear(); collectionCalls = 0; captureChecks = 0;
  syncCalls = 0; synchronized = true; failCollectionSync = false; failReplaySync = false;
}

test("B4.3B initial collection succeeds but booking sync fails; receipt stays pending", async () => {
  reset();
  failCollectionSync = true;
  synchronized = false;
  const id = `evt_${randomUUID().replace(/-/g, "")}`;
  const response = await POST(request(id));
  assert.equal(response.status, 503);
  assert.equal((await response.json() as any).code, "BOOKING_SYNC_PENDING");
  assert.equal(collectionCalls, 1);
  assert.equal(transactions.size, 1);
  assert.equal(receipts.get(id)?.processed, false);
  assert.equal(syncCalls, 0);
});
test("B4.3B retry after initial sync failure repairs booking without second collection", async () => {
  reset();
  failCollectionSync = true;
  synchronized = false;
  const id = `evt_${randomUUID().replace(/-/g, "")}`;
  assert.equal((await POST(request(id))).status, 503);
  failCollectionSync = false;
  const retry = await POST(request(id));
  assert.equal(retry.status, 200);
  assert.equal((await retry.json() as any).duplicate, true);
  assert.equal(collectionCalls, 1);
  assert.equal(transactions.size, 1);
  assert.equal(syncCalls, 1);
  assert.equal(synchronized, true);
  assert.equal(receipts.get(id)?.processed, true);
});
test("B4.3B failed replay sync stays pending; later retry recovers once", async () => {
  reset();
  failCollectionSync = true;
  failReplaySync = true;
  synchronized = false;
  const id = `evt_${randomUUID().replace(/-/g, "")}`;
  assert.equal((await POST(request(id))).status, 503);
  const pending = await POST(request(id));
  assert.equal(pending.status, 503);
  assert.equal((await pending.json() as any).code, "BOOKING_SYNC_PENDING");
  assert.equal(collectionCalls, 1);
  assert.equal(receipts.get(id)?.processed, false);
  failReplaySync = false;
  const recovered = await POST(request(id));
  assert.equal(recovered.status, 200);
  assert.equal(collectionCalls, 1);
  assert.equal(syncCalls, 2);
  assert.equal(receipts.get(id)?.processed, true);
});
test("B4.3B repeat after successful recovery remains idempotent", async () => {
  reset();
  failCollectionSync = true;
  synchronized = false;
  const id = `evt_${randomUUID().replace(/-/g, "")}`;
  assert.equal((await POST(request(id))).status, 503);
  failCollectionSync = false;
  assert.equal((await POST(request(id))).status, 200);
  const replay = await POST(request(id));
  assert.equal(replay.status, 200);
  assert.equal((await replay.json() as any).duplicate, true);
  assert.equal(collectionCalls, 1);
  assert.equal(transactions.size, 1);
  assert.equal(syncCalls, 1);
  assert.equal(receipts.get(id)?.processed, true);
});
