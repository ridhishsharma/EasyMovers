import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../prisma/migrations/20260922100000_add_service_location_management/migration.sql", import.meta.url), "utf8");

test("service locations separate city state from individual service readiness", () => {
  assert.match(schema, /model ServiceLocation \{/);
  assert.match(schema, /model ServiceLocationService \{/);
  assert.match(schema, /@@unique\(\[serviceLocationId, scope, serviceType\]\)/);
  assert.match(schema, /status\s+LocationServiceStatus\s+@default\(DRAFT\)/);
});

test("within-city services support quotation survey and instant-rate fulfilment", () => {
  for (const mode of ["INSTANT_RATE", "QUOTATION", "SURVEY_AND_QUOTATION"]) assert.match(schema, new RegExp(mode));
  assert.match(schema, /scope\s+VendorServiceScope/);
  assert.match(schema, /serviceType\s+VendorServiceType/);
  assert.match(schema, /instantPricingAvailable\s+Boolean\s+@default\(false\)/);
  assert.match(migration, /ServiceLocationService_instantPricing_check/);
});

test("location activation is auditable and never automatic", () => {
  assert.match(schema, /model ServiceLocationStatusHistory \{/);
  assert.match(schema, /activatedByUserId/);
  assert.match(schema, /suspendedByUserId/);
  assert.match(migration, /intentionally not auto-activated/);
  assert.doesNotMatch(migration, /INSERT INTO "public"\."ServiceLocation"/);
});

test("service readiness requires at least one verified vendor", () => {
  assert.match(schema, /minimumVerifiedVendors\s+Int\s+@default\(1\)/);
  assert.match(migration, /minimumVerifiedVendors" >= 1/);
});
