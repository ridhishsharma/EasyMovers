import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("verified customer selection delegates to the canonical quotation domain", async () => {
  const [route, comparison] = await Promise.all([
    read("app/api/public/quotation-comparison/route.ts"),
    read("lib/customer-quotation-comparison.ts"),
  ]);
  assert.match(route, /checkOrigin\(request\)/);
  assert.match(route, /readDraftSession\(request, reference\)/);
  assert.match(route, /quotation\.bookingId !== booking\.id/);
  assert.match(route, /quotation\.validUntil\.getTime\(\) < Date\.now\(\)/);
  assert.match(route, /module\.service\.selectCustomerSafe/);
  assert.match(route, /CUSTOMER_QUOTATION_SELECTED/);
  assert.match(comparison, /selectedQuotationId: booking\?\.selectedQuotationId/);
});

test("quotation comparison requires explicit confirmation and reflects the locked choice", async () => {
  const ui = await read("components/moving/customer-quotation-comparison.tsx");
  assert.match(ui, /Confirm your quotation choice/);
  assert.match(ui, /It does not collect payment yet/);
  assert.match(ui, /Another offer selected/);
  assert.match(ui, /Confirm the booking details to calculate and prepare the secure advance/);
  assert.doesNotMatch(ui, /Secure quotation acceptance will be enabled in the next step/);
});
