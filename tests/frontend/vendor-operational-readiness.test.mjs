import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync("lib/vendor-operational-readiness.ts", "utf8");
const route = readFileSync("app/api/admin/vendors/[vendorId]/route.ts", "utf8");
const configurationRoute = readFileSync("app/api/admin/vendors/[vendorId]/configuration/route.ts", "utf8");
const ui = readFileSync("components/admin/vendor-operations-admin.tsx", "utf8");

test("vendor readiness detail is permission protected and field bounded", () => {
  assert.match(route, /CRM_PERMISSIONS\.VENDOR_READ/);
  assert.match(route, /CRM_PERMISSIONS\.VENDOR_MANAGE/);
  assert.match(route, /CRM_PERMISSIONS\.VENDOR_ACTIVATE/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.match(service, /select: \{/);
  assert.doesNotMatch(service, /include:/);
});

test("vendor readiness reports operational activation blockers", () => {
  for (const value of ["SERVICE_AREA_REQUIRED", "SERVICE_OFFERING_REQUIRED", "ACTIVE_VEHICLE_REQUIRED", "MANDATORY_DOCUMENTS_PENDING", "BANK_VERIFICATION_REQUIRED"]) assert.match(service, new RegExp(value));
  assert.match(service, /operationallyReady: blockers\.length === 0/);
});

test("vendor CRM provides a responsive readiness workspace", () => {
  assert.match(ui, /Vendor readiness/);
  assert.match(ui, /Activation blockers/);
  assert.match(ui, /Service areas/);
  assert.match(ui, /Service offerings/);
  assert.match(ui, /Save service configuration/);
  assert.match(ui, /Add area/);
  assert.match(ui, /registered EasyMovers service locations/);
});

test("vendor service configuration is validated transactional and audited", () => {
  assert.match(configurationRoute, /CRM_PERMISSIONS\.VENDOR_MANAGE/);
  assert.match(configurationRoute, /replaceVendorServiceConfiguration/);
  assert.match(service, /ACTIVE_VENDOR_CONFIGURATION_LOCKED/);
  assert.match(service, /DUPLICATE_SERVICE_AREA/);
  assert.match(service, /vendorServiceArea\.deleteMany/);
  assert.match(service, /vendorServiceOffering\.upsert/);
  assert.match(service, /VENDOR_SERVICE_CONFIGURATION_REPLACED/);
});
