import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const route = readFileSync("app/api/public/booking-payment-status/route.ts", "utf8");
test("payment status requires verified customer session", () => {
  assert.match(route, /readDraftSession\(request, reference\)/);
  assert.match(route, /leadId: session\.id, leadReferenceId: reference/);
});
test("verified advance is based on successful transactions and paid gateway orders", () => {
  assert.match(route, /PaymentTransactionStatus\.SUCCESS/);
  assert.match(route, /PaymentGatewayOrderStatus\.PAID/);
  assert.match(route, /verifiedAmount >= advance/);
});
test("status endpoint cannot mutate booking or claim confirmation", () => {
  assert.doesNotMatch(route, /prisma\.booking\.update/);
  assert.match(route, /bookingConfirmed: false/);
  assert.match(route, /Cache-Control": "no-store"/);
});
