import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const api = readFileSync(new URL("../../app/api/admin/dashboard/route.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../../components/admin/crm-dashboard.tsx", import.meta.url), "utf8");
const adminPage = readFileSync(new URL("../../app/admin/page.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../../components/brand/app-brand-shell.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../components/admin/crm-dashboard.module.css", import.meta.url), "utf8");

test("CRM dashboard requires dashboard permission and returns no-store data", () => {
  assert.match(api, /CRM_PERMISSIONS\.DASHBOARD_READ/);
  assert.match(api, /Cache-Control": "no-store/);
  assert.match(api, /permissionSet\.has\(CRM_PERMISSIONS\.VENDOR_APPLICATION_READ\)/);
  assert.match(api, /permissionSet\.has\(CRM_PERMISSIONS\.LEAD_READ\)/);
});

test("dashboard reports operational counts and pending-work ageing", () => {
  assert.match(api, /staleBefore/);
  assert.match(api, /oldestOpenAgeDays/);
  assert.match(api, /pendingInvitations/);
  assert.match(api, /activeCities/);
  assert.match(ui, /Applications requiring action/);
  assert.match(ui, /Oldest open application/);
  assert.match(ui, /Only modules permitted for your assigned roles are shown/);
});

test("office entry point and navigation use the central CRM dashboard", () => {
  assert.match(adminPage, /redirect\("\/admin\/dashboard"\)/);
  assert.match(shell, /href="\/admin\/dashboard">Dashboard/);
  assert.match(ui, /returnTo=\/admin\/dashboard/);
});

test("dashboard uses compact responsive cards and semantic status colours", () => {
  assert.match(styles, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /article\.ageing/);
  assert.match(styles, /article\.success/);
  assert.match(styles, /article\.invitations/);
  assert.match(styles, /@media\(max-width:560px\)/);
  assert.match(ui, /oldestOpenAgeDays >= 3/);
});
