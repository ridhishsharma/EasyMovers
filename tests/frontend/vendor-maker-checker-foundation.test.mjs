import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile("prisma/schema.prisma", "utf8");
const migration = await readFile(
  "prisma/migrations/20260926170000_add_vendor_change_maker_checker/migration.sql",
  "utf8",
);
const service = await readFile("lib/vendor-change-control.ts", "utf8");
const auth = await readFile("lib/crm-authorization.ts", "utf8");

test("vendor amendments are staged with source, actor and review history", () => {
  assert.match(schema, /model VendorChangeRequest/);
  assert.match(schema, /VENDOR_PORTAL/);
  assert.match(schema, /EM_STAFF/);
  assert.match(schema, /submittedByUserId/);
  assert.match(schema, /reviewedByUserId/);
  assert.match(migration, /VendorChangeRequest_vendorId_status_idx/);
});

test("vendor portal submissions are limited to the linked vendor", () => {
  assert.match(service, /VENDOR_OWNERSHIP_REQUIRED/);
  assert.match(service, /OFFICE_USER_REQUIRED/);
  assert.match(service, /submitter\.vendorId !== input\.vendorId/);
  assert.match(service, /CHANGE_ALREADY_PENDING/);
});

test("independent checker review is serialized and audited", () => {
  assert.match(auth, /VENDOR_VERIFY: "vendor\.verify"/);
  assert.match(service, /pg_advisory_xact_lock/);
  assert.match(service, /MAKER_CHECKER_CONFLICT/);
  assert.match(service, /VENDOR_CHANGE_APPROVED/);
  assert.match(service, /VENDOR_CHANGE_REJECTED/);
  assert.match(migration, /VENDOR_REVIEWER/);
});
