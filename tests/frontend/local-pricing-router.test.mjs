import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync(new URL("../../lib/local-pricing-router.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { exports },
);

const simpleGoods = {
  mode: "LOCAL",
  serviceType: "Goods",
  items: [{ quantity: 2, fragile: false, requiresPacking: false }],
  pickupFloor: "Ground",
  destinationFloor: "Ground",
};

test("small within-city goods can use the instant-rate fleet", () => {
  const result = exports.resolveLocalPricingRoute(simpleGoods);
  assert.equal(result.route, "INSTANT_RATE");
  assert.deepEqual(Array.from(result.reasons), []);
});

test("large, fragile, packed and complex moves require full quotations", () => {
  for (const input of [
    { ...simpleGoods, serviceType: "Household" },
    { ...simpleGoods, items: [{ quantity: 21, requiresPacking: false }] },
    { ...simpleGoods, items: [{ quantity: 1, fragile: true, requiresPacking: false }] },
    { ...simpleGoods, items: [{ quantity: 1, fragile: false, requiresPacking: true }] },
    { ...simpleGoods, additionalServices: "AC uninstall and installation" },
    { ...simpleGoods, pickupFloor: "2", pickupLift: "No" },
  ]) assert.equal(exports.resolveLocalPricingRoute(input).route, "FULL_QUOTATION");
});

test("eligibility thresholds are configurable and safely validated", () => {
  const policy = exports.readLocalPricingPolicy(JSON.stringify({
    version: "city-pilot-2",
    instantServices: ["GOODS"],
    maxItemLines: 2,
    maxTotalUnits: 3,
    allowFragile: true,
    allowPacking: false,
    maxFloorWithoutLift: 1,
  }));
  assert.equal(policy.version, "city-pilot-2");
  assert.equal(exports.resolveLocalPricingRoute({ ...simpleGoods, items: [{ quantity: 1, fragile: true }] }, policy).route, "INSTANT_RATE");
  assert.throws(() => exports.readLocalPricingPolicy('{"instantServices":["HOUSEHOLD"]}'));
});

test("instant fare endpoint enforces eligibility before route pricing", () => {
  const endpoint = readFileSync("app/api/public/local-fare/route.ts", "utf8");
  const enquiry = readFileSync("app/api/public/moving-enquiry/route.ts", "utf8");
  assert.match(endpoint, /FULL_QUOTATION_REQUIRED/);
  assert.match(endpoint, /resolveLocalPricingRoute/);
  assert.match(endpoint, /LOCAL_INSTANT_ELIGIBILITY_POLICY/);
  assert.match(enquiry, /pricingDecision/);
  assert.match(enquiry, /pricingRoute/);
});
