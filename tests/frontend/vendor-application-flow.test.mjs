import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync("components/moving/partner-registration.tsx", "utf8");
const applicationRoute = readFileSync("app/api/public/vendor-applications/route.ts", "utf8");
const callbackRoute = readFileSync("app/api/public/vendor-applications/callback/route.ts", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");

test("company form submits a pending public application without Supabase sign-in", () => {
  assert.match(component, /\/api\/public\/vendor-applications/);
  assert.doesNotMatch(component, /signInWithPassword|\/api\/vendors/);
  assert.match(component, /Request callback/);
  assert.match(component, /tel:\+918959591603/);
});

test("public routes enforce origin, size, validation and rate controls", () => {
  for (const source of [applicationRoute, callbackRoute]) {
    assert.match(source, /checkOrigin/);
    assert.match(source, /content-length/);
    assert.match(source, /Cache-Control/);
  }
  assert.match(applicationRoute, /VENDOR_APPLICATION_RATE_LIMITED/);
  assert.match(callbackRoute, /CALLBACK_RATE_LIMITED/);
});

test("vendor applications remain separate from active vendors", () => {
  assert.match(schema, /model VendorApplication/);
  assert.match(schema, /status\s+VendorApplicationStatus\s+@default\(PENDING\)/);
  assert.match(schema, /vendorApplicationId/);
});

test("city and state reject numeric values in the browser and API", () => {
  assert.match(component, /placeNameInput/);
  assert.match(component, /pattern=\{PLACE_NAME_PATTERN\}/);

  const validator = readFileSync("lib/vendor-application.ts", "utf8");
  assert.match(validator, /function placeName/);
  assert.match(validator, /city: placeName\(data, "city"\)/);
  assert.match(validator, /state: placeName\(data, "state"\)/);
});
