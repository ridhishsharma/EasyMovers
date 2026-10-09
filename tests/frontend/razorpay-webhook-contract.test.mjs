import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const route = readFileSync("app/api/payments/razorpay/webhook/route.ts", "utf8");
test("Razorpay webhook verifies raw body before parsing JSON", () => {
  assert.match(route, /await request\.text\(\)/);
  assert.match(route, /verifyRazorpayWebhookSignature\(raw,/);
  assert.ok(route.indexOf("verifyRazorpayWebhookSignature(raw,") < route.indexOf("JSON.parse(raw)"));
});
test("Razorpay webhook independently verifies captured payment and uses canonical collection workflow", () => {
  assert.match(route, /fetchCapturedRazorpayPayment\(paymentId, orderId, amount, keyId, keySecret\)/);
  assert.match(route, /resolvePaymentApiCollectionWorkflowService\(\)/);
  assert.match(route, /recordSuccessfulCollection\(/);
  assert.match(route, /gatewayPaymentId: paymentId/);
});
test("Razorpay webhook only records captures and acknowledges after processing", () => {
  assert.match(route, /event\.event !== "payment\.captured"/);
  assert.match(route, /processed: true/);
  assert.match(route, /PAYMENT_RECONCILIATION_REQUIRED/);
});
