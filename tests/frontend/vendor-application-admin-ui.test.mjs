import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/vendor-applications/page.tsx", "utf8");
const ui = readFileSync("components/admin/vendor-applications-admin.tsx", "utf8");

test("admin vendor application page uses configured Supabase authentication", () => {
  assert.match(page, /SUPABASE_URL/);
  assert.match(page, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(ui, /signInWithPassword/);
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
  assert.match(shell, /isAdmin \? <span/);
  assert.match(shell, /Office administration/);
  assert.match(ui, /resetPasswordForEmail/);
  assert.match(ui, /updateUser\(\{ password: newPassword \}\)/);
  assert.match(ui, /newPassword\.length < 12/);
});
