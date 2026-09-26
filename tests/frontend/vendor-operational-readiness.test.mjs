import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync("lib/vendor-operational-readiness.ts", "utf8");
const route = readFileSync("app/api/admin/vendors/[vendorId]/route.ts", "utf8");
const configurationRoute = readFileSync(
  "app/api/admin/vendors/[vendorId]/configuration/route.ts",
  "utf8",
);
const operationsRoute = readFileSync(
  "app/api/admin/vendors/[vendorId]/operations/route.ts",
  "utf8",
);
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
  for (const value of [
    "SERVICE_AREA_REQUIRED",
    "SERVICE_OFFERING_REQUIRED",
    "ACTIVE_VEHICLE_REQUIRED",
    "MANDATORY_DOCUMENTS_PENDING",
    "BANK_VERIFICATION_REQUIRED",
  ])
    assert.match(service, new RegExp(value));
  assert.match(service, /operationallyReady: blockers\.length === 0/);
  assert.match(service, /engagementMode !== "QUOTATION"/);
  assert.match(service, /quotationEligible/);
  assert.match(service, /instantRateEligible/);
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
  assert.match(service, /ACTIVE_VENDOR_MINIMUM_CONFIGURATION_REQUIRED/);
  assert.doesNotMatch(service, /Suspend the vendor before changing service areas or offerings/);
  assert.match(service, /DUPLICATE_SERVICE_AREA/);
  assert.match(service, /vendorServiceArea\.deleteMany/);
  assert.match(service, /vendorServiceOffering\.upsert/);
  assert.match(service, /VENDOR_SERVICE_CONFIGURATION_REPLACED/);
});

test("vendor operational evidence and activation are permission guarded and audited", () => {
  assert.match(operationsRoute, /CRM_PERMISSIONS\.VENDOR_MANAGE/);
  assert.match(operationsRoute, /CRM_PERMISSIONS\.VENDOR_ACTIVATE/);
  assert.match(service, /ADD_VEHICLE/);
  assert.match(service, /UPDATE_VEHICLE/);
  assert.match(service, /Superseded by a manually verified document record/);
  assert.match(service, /ADD_DOCUMENT/);
  assert.match(service, /REVIEW_DOCUMENT/);
  assert.match(service, /ADD_BANK_ACCOUNT/);
  assert.match(service, /VERIFY_BANK_ACCOUNT/);
  assert.match(service, /DEACTIVATE_VEHICLE/);
  assert.match(service, /DEACTIVATE_DOCUMENT/);
  assert.match(service, /DEACTIVATE_BANK_ACCOUNT/);
  assert.match(service, /pg_advisory_xact_lock/);
  assert.match(service, /VENDOR_NOT_READY/);
  assert.match(service, /VENDOR_ACTIVATED/);
  assert.match(ui, /Operational verification/);
  assert.match(ui, /Activate vendor/);
  assert.match(ui, /Operational records/);
  assert.match(ui, /Original checked manually/);
  assert.match(ui, /Save & verify document/);
  assert.match(ui, /Update vehicle/);
  assert.match(ui, /setActivePanel/);
  assert.match(ui, /Resolve →/);
  assert.match(ui, /createdWithin/);
  assert.match(ui, /coverage/);
  assert.doesNotMatch(ui, /selected\.vendor\.status !== "ACTIVE"/);
});
