import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const route = readFileSync("app/api/public/booking-payment-order/route.ts", "utf8");
const verification = readFileSync("lib/payments/razorpay-verification.ts", "utf8");

test("pending order reuse requires independent gateway inspection", () => {
  assert.match(route, /await inspectRazorpayOrder\(existing\.gatewayOrderId, keyId, keySecret\)/);
  assert.match(route, /remote\.requiresReconciliation/);
  assert.ok(route.indexOf("await inspectRazorpayOrder(") < route.indexOf("reused: true"));
});

test("remote order amount must match outstanding advance", () => {
  assert.match(route, /remote\.currency !== "INR" \|\| remote\.amount !== due/);
  assert.match(route, /GATEWAY_ORDER_MISMATCH/);
});

test("multiple active and locally paid orders block checkout", () => {
  assert.match(route, /MULTIPLE_ACTIVE_ORDERS/);
  assert.match(route, /PaymentGatewayOrderStatus\.PAID/);
});

test("gateway lookup failures fail closed", () => {
  assert.match(route, /error instanceof RazorpayVerificationError/);
  assert.match(verification, /GATEWAY_PAYMENTS_INCOMPLETE/);
  assert.match(verification, /order\.status === "paid" \|\| needsReview/);
});
