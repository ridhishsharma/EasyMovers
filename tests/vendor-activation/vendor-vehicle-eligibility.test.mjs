import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const root = new URL("../../", import.meta.url);
const source = stripTypeScriptTypes(await readFile(new URL(
  "domains/vendor/services/vendor-vehicle-eligibility.ts", root), "utf8"));
const { hasActivationEligibleTransportVehicle: eligible, requiresTransportVehicle: required } =
  await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const now = new Date("2026-09-13T18:00:00Z");
const future = new Date("2099-01-01T00:00:00Z");
function fixture() {
  const vehicle = { id: "vehicle-1", active: true, status: "AVAILABLE",
    registrationNumber: "MP04AB1234", insuranceNumber: "POLICY123",
    insuranceExpiryDate: future };
  const documents = [
    { documentType: "VEHICLE_REGISTRATION", documentNumber: "MP04AB1234",
      status: "VERIFIED", documentUrl: "https://example.invalid/registration" },
    { documentType: "INSURANCE_POLICY", documentNumber: "POLICY123",
      status: "VERIFIED", expiresAt: future, documentUrl: "https://example.invalid/insurance" },
  ];
  return { vehicle, documents };
}

test("Matching registration and current insurance qualify the same available vehicle", () => {
  const { vehicle, documents } = fixture();
  vehicle.registrationNumber = "mp04-ab 1234";
  assert.equal(eligible([vehicle], documents, now), true);
});
test("Missing vehicles or evidence fail eligibility", () => {
  const { vehicle, documents } = fixture();
  assert.equal(eligible([], documents, now), false);
  assert.equal(eligible([vehicle], [], now), false);
  for (const document of documents) assert.equal(eligible([vehicle], [document], now), false);
});
test("Evidence for a different vehicle or policy is rejected", () => {
  for (const index of [0, 1]) {
    const { vehicle, documents } = fixture();
    documents[index].documentNumber = "OTHER123";
    assert.equal(eligible([vehicle], documents, now), false);
  }
});
test("Pending rejected and expired documents do not qualify", () => {
  for (const index of [0, 1]) for (const status of ["PENDING", "REJECTED", "EXPIRED"]) {
    const { vehicle, documents } = fixture();
    documents[index].status = status;
    assert.equal(eligible([vehicle], documents, now), false);
  }
});
test("Inactive assigned and maintenance vehicles do not qualify", () => {
  for (const changes of [{ active: false }, { status: "ASSIGNED" }, { status: "MAINTENANCE" }]) {
    const { vehicle, documents } = fixture();
    assert.equal(eligible([{ ...vehicle, ...changes }], documents, now), false);
  }
});
test("Missing expired equal-boundary invalid and unconverted insurance dates fail", () => {
  for (const expiry of [undefined, now, new Date(now.getTime() - 1),
    new Date("invalid"), "2099-01-01"]) {
    const { vehicle, documents } = fixture();
    vehicle.insuranceExpiryDate = expiry;
    assert.equal(eligible([vehicle], documents, now), false);
    vehicle.insuranceExpiryDate = future;
    documents[1].expiresAt = expiry;
    assert.equal(eligible([vehicle], documents, now), false);
  }
});
test("Registration expiry future issuance and missing file URL fail", () => {
  for (const changes of [{ expiresAt: now }, { issuedAt: future },
    { issuedAt: new Date("invalid") }, { documentUrl: "" }]) {
    const { vehicle, documents } = fixture();
    documents[0] = { ...documents[0], ...changes };
    assert.equal(eligible([vehicle], documents, now), false);
  }
});
test("Evidence cannot combine two individually ineligible vehicles", () => {
  const { vehicle, documents } = fixture();
  const first = { ...vehicle, insuranceNumber: "OTHER" };
  const second = { ...vehicle, registrationNumber: "OTHER" };
  assert.equal(eligible([first, second], documents, now), false);
  assert.equal(eligible([first, second, vehicle], documents, now), true);
});
test("Only active transport offerings require a vehicle", () => {
  for (const serviceType of ["HOUSEHOLD_RELOCATION", "OFFICE_RELOCATION",
    "CORPORATE_RELOCATION", "VEHICLE_TRANSPORT", "COMMERCIAL_GOODS"]) {
    assert.equal(required([{ serviceType, active: true }]), true);
    assert.equal(required([{ serviceType, active: false }]), false);
  }
  for (const serviceType of ["PACKING_ONLY", "LOADING_UNLOADING",
    "WAREHOUSING", "INSTALLATION_UNINSTALLATION"]) {
    assert.equal(required([{ serviceType, active: true }]), false);
  }
});
test("Invalid observation time fails closed", () => {
  const { vehicle, documents } = fixture();
  assert.equal(eligible([vehicle], documents, new Date("invalid")), false);
});

// Exercise the actual activation method with mocked persistence.
const serviceText = await readFile(new URL("domains/vendor/services/vendor.service.ts", root), "utf8");
const start = serviceText.indexOf("export class VendorService {");
const end = serviceText.indexOf("export class VendorNestedOperationsService", start);
const classCode = stripTypeScriptTypes(serviceText.slice(start, end)).replace("export ", "");
const VendorService = new Function("requireServiceString", "VendorBusinessType",
  "VendorDocumentType", "hasVerifiedVendorDocument", "requiresTransportVehicle",
  "hasActivationEligibleTransportVehicle", "createVendorServiceFailure",
  "createVendorServiceSuccess", "createVendorServiceFailureFromError",
  classCode + ";return VendorService;")(
    value => value.trim(), { UNSPECIFIED: "UNSPECIFIED" }, { PAN_CARD: "PAN_CARD" },
    docs => docs.some(d => d.documentType === "PAN_CARD" && d.status === "VERIFIED"),
    required, eligible,
    (errorCode, errorMessage) => ({ success: false, errorCode, errorMessage }),
    data => ({ success: true, data }), error => { throw error; });

async function activate(serviceType, vehicles, documents, active = true) {
  const writes = [];
  const vendor = { businessDetails: { businessType: "SOLE_PROPRIETOR" },
    serviceAreas: [{ active: true }], services: [{ serviceType, active: true }],
    bankDetails: { verified: true }, vehicles,
    documents: [{ documentType: "PAN_CARD", status: "VERIFIED" }, ...documents] };
  const service = new VendorService({ repository: {
    findById: async () => vendor,
    update: async (id, input) => { writes.push(input); return { ...vendor, ...input }; },
  } });
  return { result: await service.setVendorActiveStatus({ vendorId: "vendor-1", active }), writes };
}
test("Actual transport activation denies missing compliance before writing status", async () => {
  const { result, writes } = await activate("HOUSEHOLD_RELOCATION", [], []);
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "VENDOR_OPERATION_NOT_ALLOWED");
  assert.equal(writes.length, 0);
});
test("Actual activation allows qualified transport and vehicle-free labour services", async () => {
  const { vehicle, documents } = fixture();
  for (const [type, fleet, evidence] of [["VEHICLE_TRANSPORT", [vehicle], documents],
    ["LOADING_UNLOADING", [], []]]) {
    const { result, writes } = await activate(type, fleet, evidence);
    assert.equal(result.success, true);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].active, true);
  }
});
test("Deactivation remains possible without compliant vehicles", async () => {
  const { result, writes } = await activate("HOUSEHOLD_RELOCATION", [], [], false);
  assert.equal(result.success, true);
  assert.equal(writes[0].active, false);
});
