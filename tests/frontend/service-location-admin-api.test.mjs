import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync("lib/service-location-management.ts", "utf8");
const listRoute = readFileSync("app/api/admin/service-locations/route.ts", "utf8");
const detailRoute = readFileSync("app/api/admin/service-locations/[locationId]/route.ts", "utf8");
const matrixRoute = readFileSync("app/api/admin/service-locations/[locationId]/services/route.ts", "utf8");
const statusRoute = readFileSync("app/api/admin/service-locations/[locationId]/status/route.ts", "utf8");

test("service location routes enforce separate read manage and activation permissions", () => {
  assert.match(listRoute, /SERVICE_LOCATION_READ/);
  assert.match(listRoute, /SERVICE_LOCATION_MANAGE/);
  assert.match(detailRoute, /SERVICE_LOCATION_READ/);
  assert.match(detailRoute, /SERVICE_LOCATION_MANAGE/);
  assert.match(matrixRoute, /SERVICE_LOCATION_MANAGE/);
  assert.match(statusRoute, /SERVICE_LOCATION_ACTIVATE/);
});

test("location listing is bounded and returns selected operational fields", () => {
  assert.match(listRoute, /pageSize > 100/);
  assert.match(listRoute, /select:\s*\{/);
  assert.match(listRoute, /Cache-Control.*no-store/);
  assert.match(listRoute, /INVALID_SERVICE_LOCATION_FILTER/);
});

test("location input rejects arbitrary names and invalid Indian postal codes", () => {
  assert.match(service, /\p\{L\}/);
  assert.match(service, /\^\[1-9\]\[0-9\]\{5\}\$/);
  assert.match(service, /INVALID_OPERATIONS_EMAIL/);
  assert.match(service, /INVALID_OPERATIONS_MOBILE/);
});

test("within-city services remain independent from fulfilment mode", () => {
  assert.match(service, /VendorServiceScope/);
  assert.match(service, /VendorServiceType/);
  assert.match(service, /ServiceFulfilmentMode/);
  assert.match(service, /Instant pricing is available only for instant-rate fulfilment/);
});

test("readiness requires active matching vendors before service launch", () => {
  assert.match(service, /status: "ACTIVE"/);
  assert.match(service, /serviceAreas:/);
  assert.match(service, /serviceOfferings:/);
  assert.match(service, /INSUFFICIENT_VERIFIED_VENDORS/);
  assert.match(service, /minimumVerifiedVendors/);
});

test("activation is serialized audited and requires an explicit ready state", () => {
  assert.match(service, /pg_advisory_xact_lock/);
  assert.match(service, /Mark the location ready before activation/);
  assert.match(service, /serviceLocationStatusHistory\.create/);
  assert.match(service, /crmAuditLog\.create/);
  assert.match(service, /SERVICE_LOCATION_\$\{action\}/);
  assert.match(service, /Suspend the location before changing its service matrix/);
});
