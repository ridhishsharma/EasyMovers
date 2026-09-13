import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const root = new URL("../../", import.meta.url);
const serviceSource = await readFile(new URL("domains/vendor/services/vendor.service.ts", root), "utf8");
const repositorySource = await readFile(new URL("domains/vendor/repositories/prisma-vendor.repository.ts", root), "utf8");

function compile(source, start, end, dependencies, name) {
  const offset = source.indexOf(start);
  assert.ok(offset >= 0, start);
  const limit = source.indexOf(end, offset + start.length);
  assert.ok(limit > offset, end);
  const code = stripTypeScriptTypes(source.slice(offset, limit)).replace(/export /g, "");
  return new Function(...Object.keys(dependencies), code + ";return " + name)(...Object.values(dependencies));
}

const initial = compile(serviceSource,
  "export function createInitialVendorRepositoryInput(",
  "function mapServiceAreaCreateInput(", {}, "createInitialVendorRepositoryInput");

const VendorService = compile(serviceSource, "export class VendorService {",
  "export class VendorNestedOperationsService", {
    createInitialVendorRepositoryInput: initial,
    VendorValidators: {
      validateCompleteVendorOnboardingInput: () => ({ valid: true }),
      calculateVendorProfileCompleteness: () => ({}),
    },
    createVendorServiceSuccess: data => ({ success: true, data }),
    createVendorServiceFailureFromError: error => { throw error; },
  }, "VendorService");

const restore = compile(repositorySource, "export async function restorePrismaVendorRecord(",
  "/**", {
    requirePrismaVendorIdentifier: value => value.trim(),
    mapVendorActiveToPrismaStatus: active => active === false ? "INACTIVE" : "ACTIVE",
    normalizePrismaVendorRepositoryError: error => error,
  }, "restorePrismaVendorRecord");

const vendor = { business: { companyName: "Test Movers" },
  owner: { phone: "9000000000" }, contact: { email: "test@example.invalid" } };

test("Onboarding cannot activate through defaults or an explicit active option", () => {
  for (const active of [undefined, true, false]) {
    assert.equal(initial(vendor, { active }).active, false);
  }
});

test("Actual onboarding service creates an inactive vendor for every active option", async () => {
  for (const active of [undefined, true, false]) {
    const writes = [];
    const service = new VendorService({ repository: {
      checkUniqueness: async () => ({ exists: false }),
      create: async input => { writes.push(input); return input; },
    } });
    const result = await service.createVendor({ vendor, active });
    assert.equal(result.success, true);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].active, false);
  }
});

test("Transactional onboarding also persists inactive status", async () => {
  const writes = [];
  const repository = {
    checkUniqueness: async () => ({ exists: false }),
    create: async input => { writes.push(input); return input; },
  };
  const service = new VendorService({ repository,
    transactionManager: { runInTransaction: callback => callback({ repository }) } });
  assert.equal((await service.createVendor({ vendor, active: true })).success, true);
  assert.equal(writes[0].active, false);
});

test("Restoration resets status in the same write that clears deletion", async () => {
  const writes = [];
  const result = await restore({ vendor: {
    updateMany: async input => { writes.push(input); return { count: 1 }; },
  } }, " vendor-1 ");
  assert.equal(result.restored, true);
  assert.deepEqual(writes, [{
    where: { id: "vendor-1", deletedAt: { not: null } },
    data: { deletedAt: null, status: "INACTIVE" },
  }]);
});

test("Restoration preserves no-op results and propagates failed writes", async () => {
  const result = await restore({ vendor: {
    updateMany: async () => ({ count: 0 }),
  } }, "vendor-1");
  assert.deepEqual(result, { vendorId: "vendor-1", restored: false });
  await assert.rejects(restore({ vendor: {
    updateMany: async () => { throw new Error("Controlled write failure"); },
  } }, "vendor-1"), /Controlled write failure/);
});
