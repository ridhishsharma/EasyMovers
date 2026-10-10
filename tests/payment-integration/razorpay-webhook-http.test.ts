import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { transformSync } from "esbuild";

// Fail closed: this suite is allowed only through the existing guarded runner.
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const db = new URL(process.env.DATABASE_URL || "");
assert.equal(db.hostname, "127.0.0.1");
assert.equal(db.port, "5432");
assert.equal(db.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(db.username), "easymovers_test_user");
assert.ok(db.password);
assert.equal(db.searchParams.get("schema"), "public");

// Execute the real HTTP handler body, replacing only imported dependencies.
// For B4.1B all tested paths return before any DB or Razorpay access.
const source = readFileSync(resolve("app/api/payments/razorpay/webhook/route.ts"), "utf8");
const compiled = transformSync(source, { loader: "ts", format: "cjs", target: "node20" }).code;
let dbCalls = 0;
let gatewayCalls = 0;
const nextResponse = {
  NextResponse: {
    json: (body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) =>
      Response.json(body, { status: init.status ?? 200, headers: init.headers }),
  },
};
const forbidden = () => { dbCalls++; throw new Error("Unexpected database access in B4.1B"); };
const prisma = new Proxy({}, { get: () => new Proxy({}, { get: () => forbidden }) });
const dependencies: Record<string, unknown> = {
  "next/server": nextResponse,
  "@prisma/client": { PaymentProvider: { RAZORPAY: "RAZORPAY" }, Prisma: {} },
  "@/domains/payment/models/payment.model": { PaymentProvider: { RAZORPAY: "RAZORPAY" }, PaymentPurpose: { ADVANCE: "ADVANCE" } },
  "@/lib/prisma": { prisma },
  "@/lib/payments/razorpay-verification": {
    verifyRazorpayWebhookSignature: (raw: string, sig: string, secret: string) =>
      /^[a-fA-F0-9]{64}$/.test(sig) && !!secret &&
      createHmac("sha256", secret).update(raw).digest("hex").toLowerCase() === sig.toLowerCase(),
    fetchCapturedRazorpayPayment: async () => { gatewayCalls++; throw new Error("Unexpected gateway call"); },
  },
  "@/app/api/payments/_lib/payment-api.module": {
    resolvePaymentApiCollectionWorkflowService: async () => { throw new Error("Unexpected collection service"); },
    resolvePaymentApiBookingSyncService: async () => { throw new Error("Unexpected sync service"); },
  },
};
const testModule = { exports: {} as Record<string, unknown> };
const load = (name: string) => {
  if (Object.hasOwn(dependencies, name)) return dependencies[name];
  if (name === "node:crypto") return require("node:crypto");
  throw new Error(`Unexpected module import: ${name}`);
};
new Function("require", "module", "exports", compiled)(load, testModule, testModule.exports);
const POST = testModule.exports.POST as (request: Request) => Promise<Response>;
assert.equal(typeof POST, "function");

const secret = "B4_HTTP_LOCAL_ONLY_WEBHOOK_SECRET";
const old = {
  webhook: process.env.RAZORPAY_WEBHOOK_SECRET,
  key: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
};
function configure() {
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  process.env.RAZORPAY_KEY_ID = "rzp_test_B4LocalOnly";
  process.env.RAZORPAY_KEY_SECRET = "B4_LOCAL_ONLY_KEY_SECRET";
  dbCalls = 0; gatewayCalls = 0;
}
function request(body: string, signature?: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/payments/razorpay/webhook", {
    method: "POST", body,
    headers: { ...(signature ? { "x-razorpay-signature": signature } : {}), ...headers },
  });
}
const sign = (raw: string) => createHmac("sha256", secret).update(raw).digest("hex");
function assertNoSideEffects() {
  assert.equal(dbCalls, 0, "No DB access allowed");
  assert.equal(gatewayCalls, 0, "No Razorpay network access allowed");
}
test.after(() => {
  for (const [key, value] of [
    ["RAZORPAY_WEBHOOK_SECRET", old.webhook],
    ["RAZORPAY_KEY_ID", old.key],
    ["RAZORPAY_KEY_SECRET", old.keySecret],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("B4.1B missing signature returns 401 without side effects", async () => {
  configure();
  const response = await POST(request('{"event":"payment.failed"}'));
  assert.equal(response.status, 401); assertNoSideEffects();
});
test("B4.1B invalid signature returns 401 without side effects", async () => {
  configure();
  const response = await POST(request('{"event":"payment.failed"}', "0".repeat(64)));
  assert.equal(response.status, 401); assertNoSideEffects();
});
test("B4.1B tampered body returns 401 without side effects", async () => {
  configure();
  const original = '{"event":"payment.failed"}';
  const response = await POST(request('{"event":"payment.captured"}', sign(original)));
  assert.equal(response.status, 401); assertNoSideEffects();
});
test("B4.1B signed malformed JSON returns 400", async () => {
  configure();
  const raw = '{"event":';
  const response = await POST(request(raw, sign(raw)));
  assert.equal(response.status, 400); assertNoSideEffects();
});
test("B4.1B oversized signed request returns 413", async () => {
  configure();
  const raw = "x".repeat(131073);
  const response = await POST(request(raw, sign(raw)));
  assert.equal(response.status, 413); assertNoSideEffects();
});
test("B4.1B signed non-capture event returns 200 ignored", async () => {
  configure();
  const raw = '{"event":"payment.failed"}';
  const response = await POST(request(raw, sign(raw)));
  assert.equal(response.status, 200);
  assert.equal((await response.json() as { ignored?: boolean }).ignored, true);
  assertNoSideEffects();
});
test("B4.1B missing Razorpay Test Mode configuration returns 503", async () => {
  configure();
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  const raw = '{"event":"payment.failed"}';
  const response = await POST(request(raw, sign(raw)));
  assert.equal(response.status, 503); assertNoSideEffects();
});
