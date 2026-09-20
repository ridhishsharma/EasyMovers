import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260920210000_add_office_user_lifecycle/migration.sql", "utf8");
const route = readFileSync("app/api/admin/session-events/route.ts", "utf8");
const login = readFileSync("components/admin/office-login.tsx", "utf8");
const usersRoute = readFileSync("app/api/admin/crm-users/route.ts", "utf8");
const usersUi = readFileSync("components/admin/crm-users-admin.tsx", "utf8");
const vendorUi = readFileSync("components/admin/vendor-applications-admin.tsx", "utf8");

test("office account lifecycle is persisted by the schema migration", () => {
  for (const field of ["officeInvitedAt", "officeInvitationAcceptedAt", "officePasswordSetAt", "officeFirstLoginAt", "officeLastLogoutAt"]) {
    assert.match(schema, new RegExp(`${field}\\s+DateTime\\?`));
    assert.match(migration, new RegExp(`"${field}"`));
  }
});

test("session events require verified authentication and create audit history", () => {
  assert.match(route, /resolveApplicationAuthentication/);
  assert.match(route, /INVITATION_ACCEPTED/);
  assert.match(route, /PASSWORD_SET/);
  assert.match(route, /LOGIN/);
  assert.match(route, /LOGOUT/);
  assert.match(route, /crmAuditLog\.create/);
  assert.match(route, /CRM_USER_\$\{event\}/);
});

test("office authentication records acceptance, password setup, login and logout", () => {
  assert.match(login, /recordSessionEvent/);
  assert.match(login, /"INVITATION_ACCEPTED"/);
  assert.match(login, /"PASSWORD_SET"/);
  assert.match(login, /"LOGIN"/);
  assert.match(login, /"LOGOUT"/);
  assert.match(vendorUi, /signOutOffice/);
  assert.match(vendorUi, /event: "LOGOUT"/);
  assert.match(usersUi, /signOutOffice/);
  assert.match(usersUi, /event: "LOGOUT"/);
});

test("office user administration exposes lifecycle status and timestamps", () => {
  assert.match(usersRoute, /officeInvitationAcceptedAt: true/);
  assert.match(usersRoute, /officePasswordSetAt: true/);
  assert.match(usersUi, /Invitation pending/);
  assert.match(usersUi, /Password pending/);
  assert.match(usersUi, /Password ready/);
  assert.match(usersUi, /First CRM login/);
  assert.match(usersUi, /Last logout/);
  assert.match(usersUi, /Suspended/);
});
