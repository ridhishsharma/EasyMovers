import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("checkout replay retries booking sync without collecting twice", async () => {
  const source = await read("app/api/public/booking-payment-verify/route.ts");
  assert.match(source, /if \(prior\) \{[\s\S]*?resolvePaymentApiBookingSyncService/);
  assert.match(source, /BOOKING_SYNC_PENDING/);
  assert.match(source, /result\.bookingSynchronization\.success/);
});

test("webhook replay retries booking sync and delays acknowledgement", async () => {
  const source = await read("app/api/payments/razorpay/webhook/route.ts");
  assert.match(source, /if \(!existing\)[\s\S]*?else \{[\s\S]*?resolvePaymentApiBookingSyncService/);
  assert.match(source, /if \(!result\.success\) return respond\(\{ success: false, code: "BOOKING_SYNC_PENDING" \}, 503\)/);
  assert.match(source, /result\.bookingSynchronization\.success/);
  assert.ok(source.indexOf('data: { processed: true') > source.indexOf('resolvePaymentApiBookingSyncService()'));
});
