import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { transformSync } from "esbuild";

// B4.3D.1: real HTTP route + real local PostgreSQL for rejection paths.
// The positive captured-payment/collection path is NOT certified by this suite.
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

const prisma = new PrismaClient();
const secret = "B43D_LOCAL_WEBHOOK_SECRET";
const old = {
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};
process.env.RAZORPAY_WEBHOOK_SECRET = secret;
process.env.RAZORPAY_KEY_ID = "rzp_test_B43DLocal";
process.env.RAZORPAY_KEY_SECRET = "B43D_LOCAL_KEY_SECRET";
test.after(async () => {
  await prisma.$disconnect();
  for (const [key, value] of Object.entries(old)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
let gatewayCalls = 0;
let workflowCalls = 0;
const deps: Record<string, unknown> = {
  "next/server": {
    NextResponse: { json: (body: unknown, init: {status?: number;headers?: Record<string,string>} = {}) =>
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
  "@/lib/prisma": { prisma },
  "@/lib/payments/razorpay-verification": {
    verifyRazorpayWebhookSignature: (raw: string, signature: string, key: string) =>
      createHmac("sha256", key).update(raw).digest("hex") === signature,
    fetchCapturedRazorpayPayment: async () => { gatewayCalls++; throw new Error("Unexpected gateway call"); },
  },
  "@/app/api/payments/_lib/payment-api.module": {
    resolvePaymentApiCollectionWorkflowService: async () => {
      workflowCalls++;
      throw new Error("Unexpected collection workflow call");
    },
    resolvePaymentApiBookingSyncService: async () => {
      workflowCalls++;
      throw new Error("Unexpected booking sync call");
    },
  },
};
const source = readFileSync(resolve("app/api/payments/razorpay/webhook/route.ts"), "utf8");
const compiled = transformSync(source, { loader: "ts", format: "cjs", target: "node20" }).code;
const mod = { exports: {} as Record<string, unknown> };
new Function("require", "module", "exports", compiled)(
  (name: string) => {
    if (Object.hasOwn(deps, name)) return deps[name];
    if (name === "node:crypto") return require("node:crypto");
    throw new Error(`Unexpected dependency: ${name}`);
  }, mod, mod.exports,
);
const POST = mod.exports.POST as (request: Request) => Promise<Response>;
assert.equal(typeof POST, "function");
function signedRequest(eventId: string, event: object, valid = true): Request {
  const raw = JSON.stringify(event);
  const signature = createHmac("sha256", secret).update(raw).digest("hex");
  return new Request("http://localhost/api/payments/razorpay/webhook", {
    method: "POST", body: raw,
    headers: {
      "x-razorpay-event-id": eventId,
      "x-razorpay-signature": valid ? signature : "invalid",
    },
  });
}
function captured(paymentId: string, orderId: string) {
  return { event: "payment.captured", payload: {
    payment: { entity: { id: paymentId, order_id: orderId } },
  } };
}
async function assertNoWrites(eventId: string) {
  const rows = await prisma.paymentWebhook.count({
    where: { provider: "RAZORPAY", providerEventId: eventId },
  });
  assert.equal(rows, 0, "Rejected event must not persist a receipt");
  assert.equal(gatewayCalls, 0);
  assert.equal(workflowCalls, 0);
}
test("B4.3D.1 invalid signature does not write real PostgreSQL receipt", async () => {
  gatewayCalls = 0; workflowCalls = 0;
  const suffix = randomUUID().replace(/-/g, "");
  const eventId = `evt_B43D_INVALID_${suffix}`;
  const result = await POST(signedRequest(eventId, captured(`pay_${suffix}`, `order_${suffix}`), false));
  assert.equal(result.status, 401);
  assert.equal((await result.json() as {code:string}).code, "INVALID_WEBHOOK_SIGNATURE");
  await assertNoWrites(eventId);
});
test("B4.3D.1 signed unknown order returns retryable 503 without a receipt", async () => {
  gatewayCalls = 0; workflowCalls = 0;
  const suffix = randomUUID().replace(/-/g, "");
  const eventId = `evt_B43D_UNKNOWN_${suffix}`;
  const result = await POST(signedRequest(eventId, captured(`pay_${suffix}`, `order_${suffix}`)));
  assert.equal(result.status, 503);
  assert.equal((await result.json() as {code:string}).code, "ORDER_RECONCILIATION_REQUIRED");
  await assertNoWrites(eventId);
});
test("B4.3D.1 signed noncapture event is ignored with no PostgreSQL receipt", async () => {
  gatewayCalls = 0; workflowCalls = 0;
  const suffix = randomUUID().replace(/-/g, "");
  const eventId = `evt_B43D_IGNORED_${suffix}`;
  const result = await POST(signedRequest(eventId, { event: "payment.failed" }));
  assert.equal(result.status, 200);
  assert.equal((await result.json() as {ignored:boolean}).ignored, true);
  await assertNoWrites(eventId);
});
