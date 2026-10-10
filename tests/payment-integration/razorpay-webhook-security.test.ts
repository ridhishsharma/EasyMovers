import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

// B4.1 deliberately tests the pure HMAC verification boundary only.
// It must not instantiate Prisma, call Razorpay, or import the webhook route.
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

// The production verifier has a Next.js "server-only" sentinel import.
// Intercept that sentinel only while loading the pure verification functions.
// This avoids requiring the server-only package in this standalone Node test.
import { createRequire } from "node:module";
import Module from "node:module";
const require = createRequire(import.meta.url);
const moduleLoader = Module as typeof Module & { _load: (...args: unknown[]) => unknown };
const originalLoad = moduleLoader._load;
let verification: typeof import("../../lib/payments/razorpay-verification");
try {
  moduleLoader._load = function (request: unknown, ...args: unknown[]) {
    if (request === "server-only") return {};
    return originalLoad.call(this, request, ...args);
  };
  verification = require("../../lib/payments/razorpay-verification") as typeof import("../../lib/payments/razorpay-verification");
} finally {
  moduleLoader._load = originalLoad;
}
const { verifyRazorpayWebhookSignature, verifyRazorpayCheckoutSignature } = verification;

const secret = "B4_LOCAL_TEST_SECRET_NOT_A_REAL_CREDENTIAL";
const body = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_test123", order_id: "order_test123" } } },
});
const sign = (payload: string, key: string) =>
  createHmac("sha256", key).update(payload).digest("hex");

test("B4.1 valid signed raw webhook body is accepted", () => {
  assert.equal(verifyRazorpayWebhookSignature(body, sign(body, secret), secret), true);
  assert.equal(verifyRazorpayWebhookSignature(body, sign(body, secret).toUpperCase(), secret), true);
});

test("B4.1 missing and malformed signatures are rejected", () => {
  for (const signature of ["", "invalid", "a".repeat(63), "z".repeat(64)]) {
    assert.equal(verifyRazorpayWebhookSignature(body, signature, secret), false);
  }
  assert.equal(verifyRazorpayWebhookSignature(body, sign(body, secret), ""), false);
});

test("B4.1 modified payload and wrong secret are rejected", () => {
  const signature = sign(body, secret);
  assert.equal(verifyRazorpayWebhookSignature(body + " ", signature, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(body.replace("payment.captured", "payment.failed"), signature, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(body, signature, "WRONG_SECRET"), false);
});

test("B4.1 checkout signature is distinct from webhook signature", () => {
  const orderId = "order_test123";
  const paymentId = "pay_test123";
  const checkoutSignature = sign(`${orderId}|${paymentId}`, secret);
  assert.equal(verifyRazorpayCheckoutSignature(orderId, paymentId, checkoutSignature, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(body, checkoutSignature, secret), false);
  assert.equal(verifyRazorpayCheckoutSignature(orderId, paymentId, sign(body, secret), secret), false);
});
