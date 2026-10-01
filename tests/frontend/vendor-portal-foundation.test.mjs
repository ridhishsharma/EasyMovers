import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile("prisma/schema.prisma", "utf8");
const migration = await readFile("prisma/migrations/20261001100000_add_vendor_portal_availability/migration.sql", "utf8");
const service = await readFile("lib/vendor-portal.ts", "utf8");
const auth = await readFile("lib/vendor-portal-auth.ts", "utf8");
const sharedAuth = await readFile("lib/auth.ts", "utf8");
const dashboard = await readFile("components/vendor/vendor-portal-dashboard.tsx", "utf8");
const login = await readFile("components/vendor/vendor-login.tsx", "utf8");
const shell = await readFile("components/brand/app-brand-shell.tsx", "utf8");

test("operator presence and company enquiry preference are separate durable records", () => {
  assert.match(schema, /model VendorOperatorAvailability/);
  assert.match(schema, /userId\s+String\s+@unique/);
  assert.match(schema, /model VendorEnquiryPreference/);
  assert.match(schema, /acceptingQuotationEnquiries\s+Boolean/);
  assert.match(migration, /VendorOperatorAvailability_state_lastHeartbeatAt_idx/);
  assert.match(schema, /model VendorAvailabilityEvent/);
  assert.match(service, /vendorAvailabilityEvent\.create/);
});

test("only linked vendor identities enter the portal", () => {
  assert.match(auth, /auth\.roles\?\.includes\("VENDOR"\)/);
  assert.match(auth, /auth\.vendorId/);
  assert.match(sharedAuth, /!identity\.emailConfirmed && !identity\.phoneConfirmed/);
  assert.match(sharedAuth, /phone_confirmed_at/);
  assert.match(service, /role: "VENDOR"/);
  assert.match(service, /VENDOR_ACCESS_DENIED/);
  assert.match(login, /\/api\/vendor\/portal/);
});

test("individual instant-rate operators have guarded live availability", () => {
  assert.match(service, /INDIVIDUAL_OWNER_DRIVER/);
  assert.match(service, /INSTANT_RATE/);
  assert.match(service, /HYBRID/);
  assert.match(service, /ELIGIBLE_VEHICLE_REQUIRED/);
  assert.match(service, /insuranceExpiry: \{ gt: now \}/);
  assert.match(service, /heartbeatOperatorAvailability/);
  assert.match(dashboard, /60_000/);
  assert.match(dashboard, /Go online/);
  assert.match(dashboard, /navigator\.geolocation/);
});

test("quotation vendors control enquiries without pretending to be online drivers", () => {
  assert.match(service, /QUOTATION_MODE_NOT_ENABLED/);
  assert.match(service, /setQuotationEnquiries/);
  assert.match(dashboard, /SURVEY & QUOTATION WORK/);
  assert.match(dashboard, /Accept enquiries/);
});

test("vendor portal is centrally protected and has local sign out", () => {
  assert.match(shell, /pathname\.startsWith\("\/vendor"\)/);
  assert.match(shell, /\/vendor\/login/);
  assert.match(shell, /signOut\(\{ scope: "local" \}\)/);
  assert.match(shell, /EasyMovers vendor portal/);
});
