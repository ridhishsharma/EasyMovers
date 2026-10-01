import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile("prisma/schema.prisma", "utf8");
const migration = await readFile("prisma/migrations/20261001170000_link_vehicle_compliance_documents/migration.sql", "utf8");
const service = await readFile("lib/vendor-change-control.ts", "utf8");
const readiness = await readFile("lib/vendor-operational-readiness.ts", "utf8");
const ui = await readFile("components/admin/vendor-operations-admin.tsx", "utf8");
const css = await readFile("components/admin/vendor-operations-admin.module.css", "utf8");

test("vehicle compliance documents have an explicit vehicle relationship", () => {
  assert.match(schema, /vehicleId\s+String\?/);
  assert.match(schema, /vehicle\s+VendorVehicle\?/);
  assert.match(migration, /VendorDocument_vehicleId_fkey/);
  assert.match(migration, /VendorDocument_active_vehicle_type_key/);
});

test("approved RC and insurance evidence is validated against its vehicle", () => {
  assert.match(service, /VEHICLE_REQUIRED/);
  assert.match(service, /INSURANCE_MISMATCH/);
  assert.match(service, /INSURANCE_EXPIRED/);
  assert.match(readiness, /document\.vehicleId === vehicle\.id/);
  assert.match(readiness, /vehicleCompliance/);
  assert.match(readiness, /RC verification/);
  assert.match(readiness, /Add insurance policy details/);
  assert.match(readiness, /Insurance document verification/);
});

test("CRM selects a corresponding vehicle and displays visible action feedback", () => {
  assert.match(ui, /Corresponding vehicle/);
  assert.match(ui, /Select registered vehicle/);
  assert.match(ui, /RC book details submitted for independent checker approval/);
  assert.match(ui, /Insurance details submitted for independent checker approval/);
  assert.match(ui, /Vehicle compliance/);
  assert.match(ui, /UPDATE_DOCUMENT/);
  assert.match(ui, /Submit for checker approval/);
  assert.doesNotMatch(ui, /Original checked manually/);
  assert.match(css, /\.compliancePanel/);
  assert.match(ui, /role="status" aria-live="polite"/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /z-index:\s*1000/);
});
