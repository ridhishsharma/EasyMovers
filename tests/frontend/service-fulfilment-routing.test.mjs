import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routing = readFileSync("lib/service-fulfilment-routing.ts", "utf8");
const partner = readFileSync("app/partner/page.tsx", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");
const locationManagement = readFileSync("lib/service-location-management.ts", "utf8");

test("customer services route between instant fleet and quotation operations", () => {
  assert.match(routing, /INSTANT_VERIFIED_FLEET/);
  assert.match(routing, /SURVEY_QUOTATION/);
  assert.match(routing, /complexServices/);
  assert.match(routing, /INSTANT_RATE.*HYBRID/s);
  assert.match(routing, /QUOTATION.*HYBRID/s);
});

test("partner choice preserves individual carrier and company models", () => {
  assert.match(partner, /Register Individual Carrier/);
  assert.match(partner, /verified within-city instant fleet/);
  assert.match(partner, /surveyed quotations/);
});

test("vendor engagement mode is persisted and used for service capacity", () => {
  assert.match(schema, /enum VendorEngagementMode/);
  assert.match(schema, /QUOTATION/);
  assert.match(schema, /INSTANT_RATE/);
  assert.match(schema, /HYBRID/);
  assert.match(locationManagement, /fulfilmentMode === ServiceFulfilmentMode\.INSTANT_RATE/);
  assert.match(locationManagement, /INSTANT_RATE", "HYBRID/);
  assert.match(locationManagement, /QUOTATION", "HYBRID/);
  assert.match(locationManagement, /vehicles: \{ some:/);
});
