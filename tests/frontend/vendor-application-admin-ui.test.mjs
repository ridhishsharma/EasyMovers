import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/vendor-applications/page.tsx", "utf8");
const ui = readFileSync("components/admin/vendor-applications-admin.tsx", "utf8");
const loginPage = readFileSync("app/admin/login/page.tsx", "utf8");
const login = readFileSync("components/admin/office-login.tsx", "utf8");

test("admin vendor application page uses configured Supabase authentication", () => {
  assert.match(page, /SUPABASE_URL/);
  assert.match(page, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(loginPage, /SUPABASE_URL/);
  assert.match(loginPage, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(login, /signInWithPassword/);
  assert.match(ui, /Authorization: `Bearer \$\{token\}`/);
});

test("admin vendor application UI covers list, detail and review APIs", () => {
  assert.match(ui, /\/api\/admin\/vendor-applications\?\$\{query\}/);
  assert.match(ui, /\/review/);
  assert.match(ui, /\/approve/);
  assert.match(ui, /START_REVIEW/);
  assert.match(ui, /REQUEST_INFORMATION/);
  assert.match(ui, /REJECT/);
});

test("admin vendor application UI preserves approval safety", () => {
  assert.match(ui, /selected\.status !== "UNDER_REVIEW"/);
  assert.match(ui, /create an inactive vendor profile/);
  assert.match(ui, /reason\.trim\(\)\.length < 3/);
  assert.match(ui, /window\.confirm/);
});

test("admin login is office-only and supports secure password recovery", () => {
  const shell = readFileSync("components/brand/app-brand-shell.tsx", "utf8");
  assert.match(shell, /isAdminLogin \? <span/);
  assert.match(shell, /Office administration/);
  assert.match(login, /resetPasswordForEmail/);
  assert.match(login, /updateUser\(\{ password: newPassword \}\)/);
  assert.match(login, /newPassword\.length < 12/);
  assert.match(login, /Office sign in/);
  assert.match(login, /EasyMovers CRM/);
  assert.match(login, /Authorised EasyMovers personnel only/);
  assert.match(login, /New_Logo_NBG\.png/);
  assert.match(login, /showPassword \? "text" : "password"/);
});

test("admin modules use one central login with a safe return destination", () => {
  assert.match(ui, /\/admin\/login\?returnTo=\/admin\/vendor-applications/);
  assert.match(login, /requested\?\.startsWith\("\/admin\/"\)/);
  assert.match(login, /!requested\.startsWith\("\/\/"\)/);
  assert.match(login, /router\.replace\(safeDestination\(\)\)/);
  assert.match(login, /mode=recovery&returnTo=/);
  assert.match(login, /verifyOfficeAccess/);
  assert.match(login, /not linked to an active EasyMovers administrator/);
  assert.match(login, /response\.status === 401 \|\| response\.status === 403/);
});
