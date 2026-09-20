import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const listRoute = readFileSync("app/api/admin/crm-users/route.ts", "utf8");
const updateRoute = readFileSync("app/api/admin/crm-users/[userId]/route.ts", "utf8");
const service = readFileSync("lib/crm-user-management.ts", "utf8");
const page = readFileSync("app/admin/users/page.tsx", "utf8");
const ui = readFileSync("components/admin/crm-users-admin.tsx", "utf8");
const shell = readFileSync("components/brand/app-brand-shell.tsx", "utf8");

test("CRM user APIs enforce separate read and manage permissions", () => {
  assert.match(listRoute, /CRM_USER_READ/);
  assert.match(updateRoute, /CRM_USER_MANAGE/);
  assert.match(updateRoute, /SYSTEM_MANAGE/);
  assert.match(listRoute, /Cache-Control/);
  assert.match(updateRoute, /Cache-Control/);
});

test("office user listing exposes bounded selected fields and active roles", () => {
  assert.match(listRoute, /take: 100/);
  assert.match(listRoute, /revokedAt: null/);
  assert.match(listRoute, /expiresAt: \{ gt: new Date\(\) \}/);
  assert.match(listRoute, /select: \{/);
  assert.doesNotMatch(listRoute, /passwordHash/);
});

test("role changes are transactional, audited and protect administrators", () => {
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /SELF_DEACTIVATION_NOT_ALLOWED/);
  assert.match(service, /SYSTEM_PERMISSION_REQUIRED/);
  assert.match(service, /LAST_SUPER_ADMIN_REQUIRED/);
  assert.match(service, /CRM_USER_ACCESS_UPDATED/);
  assert.match(service, /crmAuditLog\.create/);
  assert.match(service, /revokedAt: now/);
});

test("office invitations use server-only Supabase administration and compensate failed persistence", () => {
  assert.match(listRoute, /export async function POST/);
  assert.match(service, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(service, /inviteUserByEmail/);
  assert.match(service, /SUPABASE_AUTH_MANAGED/);
  assert.match(service, /CRM_USER_INVITED/);
  assert.match(service, /deleteUser\(data\.user\.id\)/);
  assert.match(service, /Only a Super Administrator can create another Super Administrator/);
});

test("CRM user interface uses central authentication and role controls", () => {
  assert.match(page, /SUPABASE_URL/);
  assert.match(page, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(ui, /Authorization: `Bearer \$\{await token\(client\)\}`/);
  assert.match(ui, /\/api\/admin\/crm-users/);
  assert.match(ui, /method: "PATCH"/);
  assert.match(ui, /method: "POST"/);
  assert.match(ui, /Add office user/);
  assert.match(ui, /Create user & send invitation/);
  assert.match(ui, /You cannot deactivate your own office account/);
  assert.match(shell, /href="\/admin\/users"/);
});
