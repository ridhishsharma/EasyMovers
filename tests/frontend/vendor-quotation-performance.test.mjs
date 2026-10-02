import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portal = await readFile("lib/vendor-portal.ts", "utf8");
const dashboard = await readFile("components/vendor/vendor-portal-dashboard.tsx", "utf8");
const css = await readFile("components/vendor/vendor-performance.module.css", "utf8");

test("quotation performance is strictly scoped to the linked vendor", () => {
  assert.match(portal, /getVendorQuotationPerformance\(vendorId\)/);
  assert.match(portal, /where: \{ vendorId \}/);
  assert.match(portal, /where: \{ vendorId, status: QuotationStatus\.ACCEPTED \}/);
  assert.doesNotMatch(portal, /customerName: true/);
  assert.doesNotMatch(portal, /customerMobile: true/);
  assert.doesNotMatch(portal, /customerEmail: true/);
});

test("vendor dashboard distinguishes open accepted and unsuccessful outcomes", () => {
  assert.match(portal, /unsuccessfulQuotationStatuses/);
  assert.match(portal, /QuotationStatus\.REJECTED/);
  assert.match(portal, /QuotationStatus\.EXPIRED/);
  assert.match(portal, /QuotationStatus\.WITHDRAWN/);
  assert.match(portal, /acceptanceRate/);
  assert.match(portal, /totalQuotedValue/);
  assert.match(portal, /totalAcceptedValue/);
  assert.match(dashboard, /Commercial results/);
  assert.match(dashboard, /Not accepted/);
  assert.match(dashboard, /decision win rate/);
  assert.match(dashboard, /quotationFilter/);
});

test("quotation results remain usable on desktop and mobile", () => {
  assert.match(css, /grid-template-columns:repeat\(4/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /\.won/);
  assert.match(css, /\.lost/);
  assert.match(css, /\.pending/);
});
