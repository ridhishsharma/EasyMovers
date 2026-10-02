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
const portalRoute = await readFile("app/api/vendor/portal/route.ts", "utf8");
const adminCss = await readFile("components/admin/vendor-operations-admin.module.css", "utf8");
const vendorLoginCss = await readFile("components/vendor/vendor-login.module.css", "utf8");
const vendorPortalCss = await readFile("components/vendor/vendor-portal.module.css", "utf8");
const brandShell = await readFile("components/brand/app-brand-shell.tsx", "utf8");

test("CRM creates vendor-specific Supabase invitations without shared passwords", () => {
  assert.match(accountRoute, /CRM_PERMISSIONS\.VENDOR_MANAGE/);
  assert.match(accounts, /inviteUserByEmail/);
  assert.match(accounts, /role: "VENDOR"/);
  assert.match(accounts, /vendorId: vendor\.id/);
  assert.match(accounts, /SUPABASE_AUTH_MANAGED/);
  assert.doesNotMatch(accounts, /password:\s*["']/);
  assert.match(admin, /Portal access/);
  assert.match(admin, /Create access & send activation link/);
  assert.match(admin, /Resend activation link/);
  assert.match(accountRoute, /RESEND_ACTIVATION/);
  assert.match(accounts, /resetPasswordForEmail/);
  assert.match(accounts, /VENDOR_PORTAL_ACTIVATION_RESENT/);
  assert.match(adminCss, /grid-template-columns:\s*repeat\(4, 1fr\)/);
});

test("vendor invitation accepts a private password and returns to vendor sign in", () => {
  assert.match(accounts, /\/vendor\/login\?mode=recovery/);
  assert.match(login, /Create vendor password/);
  assert.match(login, /updateUser\(\{ password: newPassword \}\)/);
  assert.match(login, /minLength=\{12\}/);
  assert.match(login, /resetPasswordForEmail/);
  assert.match(login, /Forgot password\?/);
  assert.match(login, /Send password-reset link/);
  assert.match(login, /type=invite\|type=recovery/);
  assert.match(portalRoute, /emailVerified: true, lastLogin: new Date\(\)/);
});

test("vendor authentication and workspace have a distinct dark-blue identity", () => {
  assert.match(vendorLoginCss, /#06192d/);
  assert.match(vendorPortalCss, /#06192d/);
  assert.match(brandShell, /styles\.vendorHeader/);
  assert.match(brandShell, /variant=\{isVendor \? "vendor" : "default"\}/);
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
