import { strict as assert } from "node:assert";
import { test } from "node:test";
import { logPaymentSecurityFailure } from "../../lib/payments/payment-security-logger";

test("B4.4D.3B.1B logs only approved, non-sensitive fields", () => {
  const original = console.error;
  const output: string[] = [];
  console.error = (...args: unknown[]) => output.push(args.map(String).join(" "));
  try {
    logPaymentSecurityFailure("RAZORPAY_ORDER_CREATE", "123e4567-e89b-12d3-a456-426614174000");
    logPaymentSecurityFailure("RAZORPAY_ADVANCE_VERIFY", "secret-should-not-appear");
  } finally {
    console.error = original;
  }
  assert.equal(output.length, 2);
  const first = JSON.parse(output[0]);
  assert.deepEqual(Object.keys(first).sort(), ["code", "component", "level", "operation", "requestId"].sort());
  assert.equal(first.requestId, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(JSON.parse(output[1]).requestId, "invalid-request-id");
  assert.doesNotMatch(output.join(" "), /secret-should-not-appear|password|stack|authorization/i);
});
