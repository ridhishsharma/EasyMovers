import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../../prisma/migrations/20260921100000_add_commercial_crm_roles/migration.sql",
    import.meta.url
  ),
  "utf8"
);
const authorization = readFileSync(
  new URL("../../lib/crm-authorization.ts", import.meta.url),
  "utf8"
);

test("commercial CRM roles are seeded", () => {
  for (const role of [
    "SALES_MANAGER",
    "SALES_EXECUTIVE",
    "MARKETING_MANAGER",
    "MARKETING_EXECUTIVE",
    "ADVERTISING_EXECUTIVE",
  ]) {
    assert.match(migration, new RegExp(`'${role}'`));
  }
});

test("commercial permissions are part of the typed authorization contract", () => {
  for (const permission of [
    "lead.read",
    "lead.manage",
    "lead.assign",
    "sales_report.read",
    "campaign.read",
    "campaign.manage",
    "campaign.approve",
    "advertising.read",
    "advertising.manage",
    "marketing_report.read",
  ]) {
    assert.match(authorization, new RegExp(`"${permission.replace(".", "\\.")}"`));
    assert.match(migration, new RegExp(`'${permission.replace(".", "\\.")}'`));
  }
});

test("commercial roles preserve manager approval boundaries", () => {
  const salesExecutive = migration.match(
    /role\."code" = 'SALES_EXECUTIVE'[\s\S]*?ON CONFLICT/
  )?.[0];
  const marketingExecutive = migration.match(
    /role\."code" = 'MARKETING_EXECUTIVE'[\s\S]*?ON CONFLICT/
  )?.[0];
  const advertisingExecutive = migration.match(
    /role\."code" = 'ADVERTISING_EXECUTIVE'[\s\S]*?ON CONFLICT/
  )?.[0];

  assert.ok(salesExecutive);
  assert.doesNotMatch(salesExecutive, /lead\.assign|payment\.|refund\.|vendor_application\.approve/);
  assert.ok(marketingExecutive);
  assert.doesNotMatch(marketingExecutive, /campaign\.approve/);
  assert.ok(advertisingExecutive);
  assert.doesNotMatch(advertisingExecutive, /campaign\.approve|payment\.|refund\./);
});

test("CRM administrators receive the new commercial permissions", () => {
  assert.match(migration, /'SUPER_ADMIN', 'CRM_ADMINISTRATOR'/);
  assert.match(migration, /ON CONFLICT \("roleId", "permissionId"\) DO NOTHING/);
});
