import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync("lib/india-location-catalog.ts", "utf8");
const api = readFileSync("app/api/admin/location-catalog/route.ts", "utf8");
const management = readFileSync("lib/service-location-management.ts", "utf8");
const ui = readFileSync("components/admin/service-locations-admin.tsx", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260923100000_add_service_location_identity/migration.sql", "utf8");
const verificationApi = readFileSync("app/api/admin/service-locations/[locationId]/verify/route.ts", "utf8");

test("canonical catalogue contains every Indian state and union territory", () => {
  const entries = [...catalog.matchAll(/\["[A-Z]{2}",\s*"[^"]+"\]/g)];
  assert.equal(entries.length, 36);
  assert.match(catalog, /Madhya Pradesh/);
  assert.match(catalog, /Dadra and Nagar Haveli and Daman and Diu/);
  assert.match(catalog, /canonicalState/);
});

test("office location catalogue requires CRM location access", () => {
  assert.match(api, /SERVICE_LOCATION_READ/);
  assert.match(api, /Cache-Control.*no-store/);
  assert.match(api, /Search by either state or PIN code, not both/);
  assert.match(api, /postalLocationCandidates/);
});

test("city creation requires catalogue or server-verified postal identity", () => {
  assert.match(management, /LOCATION_VERIFICATION_REQUIRED/);
  assert.match(management, /UNVERIFIED_SERVICE_LOCATION/);
  assert.match(management, /POSTAL_LOCATION_MISMATCH/);
  assert.match(management, /verifyPostalLocation/);
  assert.match(management, /locationVerifiedByUserId: actorUserId/);
});

test("verified geographic identity cannot be silently reassigned", () => {
  assert.match(management, /LOCATION_IDENTITY_LOCKED/);
  assert.match(management, /City, state and location code cannot be changed after verification/);
  assert.match(schema, /locationSource\s+ServiceLocationSource/);
  assert.match(schema, /verificationPostalCode/);
  assert.match(schema, /district\s+String\?/);
  assert.match(migration, /Existing records are intentionally marked MANUAL_REVIEW/);
});

test("CRM form separates verification PIN from service coverage PINs", () => {
  assert.match(ui, /Choose state & city/);
  assert.match(ui, /Find city by PIN/);
  assert.match(ui, /City not listed\? Use/);
  assert.match(ui, /Postal locality/);
  assert.match(ui, /Coverage area—not the city-verification PIN/);
  assert.match(ui, /Geography verification/);
});

test("pre-existing locations can be canonically verified without recreation", () => {
  assert.match(management, /verifyExistingServiceLocation/);
  assert.match(management, /SERVICE_LOCATION_GEOGRAPHY_VERIFIED/);
  assert.match(verificationApi, /SERVICE_LOCATION_MANAGE/);
  assert.match(ui, /Verify from catalogue/);
  assert.match(ui, /Verify PIN/);
  assert.match(ui, /existed before canonical location checks/);
});
