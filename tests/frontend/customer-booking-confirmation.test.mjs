import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("customer booking confirmation preserves the approved three-stage payment policy", async () => {
  const service = await read("lib/customer-booking-confirmation.ts");
  assert.match(service, /BOOKING_MINIMUM_GST_PERCENT/);
  assert.match(service, /const percentage = 10/);
  assert.match(service, /const minimum = 499/);
  assert.match(service, /minimumWithGst/);
  assert.match(service, /pickupDue/);
  assert.match(service, /unpackingDue/);
  assert.match(service, /tx\.payment\.findUnique/);
  assert.match(service, /tx\.payment\.create/);
  assert.match(service, /PAYMENT_SNAPSHOT_LOCKED/);
  assert.doesNotMatch(service, /payment\.upsert/);
  assert.match(service, /commercialReference/);
  assert.match(service, /TransactionIsolationLevel\.Serializable/);
  assert.match(service, /CUSTOMER_BOOKING_CONFIRMATION_PREPARED/);
});

test("public confirmation requires the verified reference session", async () => {
  const route = await read("app/api/public/booking-confirmation/route.ts");
  assert.match(route, /readDraftSession/);
  assert.match(route, /checkOrigin/);
  assert.match(route, /verificationRequired/);
});

test("quotation comparison exposes the advance preparation stage", async () => {
  const ui = await read("components/moving/customer-quotation-comparison.tsx");
  assert.match(ui, /Confirm details & prepare advance/);
  assert.match(ui, /Secure advance due/);
  assert.match(ui, /No payment has been collected yet/);
});
