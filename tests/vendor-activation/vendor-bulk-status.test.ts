import assert from "node:assert/strict";
import test from "node:test";

import {
  updatePrismaVendorStatuses,
} from "../../domains/vendor/repositories/prisma-vendor.repository";

type PrismaClientArgument =
  Parameters<typeof updatePrismaVendorStatuses>[0];

function createHarness(count = 1) {
  const writes: Array<{
    where: { id: string; deletedAt: null };
    data: { status: string };
  }> = [];

  const prisma = {
    vendor: {
      updateMany: async (
        input: {
          where: { id: string; deletedAt: null };
          data: { status: string };
        }
      ) => {
        writes.push(input);
        return { count };
      },
    },
  } as unknown as PrismaClientArgument;

  return { prisma, writes };
}

test("Bulk activation is rejected without writing status", async () => {
  const harness = createHarness();

  const result = await updatePrismaVendorStatuses(
    harness.prisma,
    { vendors: [{ vendorId: "vendor-1", active: true }] }
  );

  assert.equal(harness.writes.length, 0);
  assert.equal(result.requestedCount, 1);
  assert.equal(result.updatedCount, 0);
  assert.equal(result.failedCount, 1);
  assert.equal(
    result.failures[0]?.errorCode,
    "INVALID_REPOSITORY_INPUT"
  );
});

test("Bulk deactivation excludes soft-deleted vendors", async () => {
  const harness = createHarness();

  const result = await updatePrismaVendorStatuses(
    harness.prisma,
    { vendors: [{ vendorId: "vendor-1", active: false }] }
  );

  assert.deepEqual(harness.writes, [
    {
      where: { id: "vendor-1", deletedAt: null },
      data: { status: "INACTIVE" },
    },
  ]);
  assert.deepEqual(result.updatedVendorIds, ["vendor-1"]);
  assert.equal(result.updatedCount, 1);
  assert.equal(result.failedCount, 0);
});

test("Missing or deleted vendor is reported as a deactivation failure", async () => {
  const harness = createHarness(0);

  const result = await updatePrismaVendorStatuses(
    harness.prisma,
    { vendors: [{ vendorId: "missing", active: false }] }
  );

  assert.equal(result.updatedCount, 0);
  assert.equal(result.failedCount, 1);
  assert.equal(
    result.failures[0]?.errorCode,
    "VENDOR_NOT_FOUND"
  );
});

test("Mixed bulk requests reject activation but still process deactivation", async () => {
  const harness = createHarness();

  const result = await updatePrismaVendorStatuses(
    harness.prisma,
    {
      vendors: [
        { vendorId: "vendor-1", active: true },
        { vendorId: "vendor-2", active: false },
      ],
    }
  );

  assert.equal(harness.writes.length, 1);
  assert.equal(harness.writes[0]?.where.id, "vendor-2");
  assert.equal(result.requestedCount, 2);
  assert.equal(result.updatedCount, 1);
  assert.equal(result.failedCount, 1);
});

test("Empty bulk input performs no writes", async () => {
  const harness = createHarness();

  const result = await updatePrismaVendorStatuses(
    harness.prisma,
    { vendors: [] }
  );

  assert.equal(harness.writes.length, 0);
  assert.equal(result.requestedCount, 0);
  assert.equal(result.updatedCount, 0);
  assert.equal(result.failedCount, 0);
});