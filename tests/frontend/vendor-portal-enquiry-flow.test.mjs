import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const accounts = await readFile("lib/vendor-portal-accounts.ts", "utf8");
const accountRoute = await readFile("app/api/admin/vendors/[vendorId]/portal-users/route.ts", "utf8");
const opportunities = await readFile("lib/vendor-opportunities.ts", "utf8");
const quoteRoute = await readFile("app/api/vendor/opportunities/[bookingId]/quotation/route.ts", "utf8");
const dashboard = await readFile("components/vendor/vendor-portal-dashboard.tsx", "utf8");
const admin = await readFile("components/admin/vendor-operations-admin.tsx", "utf8");
const login = await readFile("components/vendor/vendor-login.tsx", "utf8");

test("CRM creates vendor-specific Supabase invitations without shared passwords", () => {
  assert.match(accountRoute, /CRM_PERMISSIONS\.VENDOR_MANAGE/);
  assert.match(accounts, /inviteUserByEmail/);
  assert.match(accounts, /role: "VENDOR"/);
  assert.match(accounts, /vendorId: vendor\.id/);
  assert.match(accounts, /SUPABASE_AUTH_MANAGED/);
  assert.doesNotMatch(accounts, /password:\s*["']/);
  assert.match(admin, /Portal access/);
});

test("vendor invitation accepts a private password and returns to vendor sign in", () => {
  assert.match(accounts, /\/vendor\/login\?mode=recovery/);
  assert.match(login, /Create vendor password/);
  assert.match(login, /updateUser\(\{ password: newPassword \}\)/);
  assert.match(login, /minLength=\{12\}/);
});

test("enquiry queue is scoped by active services coverage and linked vendor", () => {
  assert.match(opportunities, /bookingStatus: \{ in: \["QUOTATION_PENDING", "QUOTATION_RECEIVED"\] \}/);
  assert.match(opportunities, /matchesService/);
  assert.match(opportunities, /matchesArea/);
  assert.match(opportunities, /quotations: \{ none: \{ vendorId/);
  assert.match(opportunities, /ENQUIRIES_PAUSED/);
  assert.doesNotMatch(opportunities, /customerMobile: true/);
});

test("quotation identity fields are forced from authenticated vendor opportunity", () => {
  assert.match(quoteRoute, /authorizeVendorPortal/);
  assert.match(opportunities, /vendorId: input\.vendorId/);
  assert.match(opportunities, /userId: input\.userId/);
  assert.match(opportunities, /leadId: booking\.leadId/);
  assert.match(opportunities, /getOrCreateQuotationModule/);
  assert.match(dashboard, /Prepare quotation/);
  assert.match(dashboard, /Submit quotation/);
});
