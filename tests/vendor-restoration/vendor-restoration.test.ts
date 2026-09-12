import assert from "node:assert/strict";
import test from "node:test";

import { VendorService } from "../../domains/vendor/services/vendor.service";
import {
  DefaultVendorController,
  VENDOR_CONTROLLER_ROUTES,
} from "../../domains/vendor/controllers/vendor.controller";
import {
  createVendorRouteAccessEvaluator,
} from "../../domains/vendor/routes/vendor.routes";

function createService(
  restore: (vendorId: string) => Promise<{
    vendorId: string;
    restored: boolean;
    restoredAt?: Date;
  }>
) {
  return new VendorService({
    repository: { restore } as unknown as
      ConstructorParameters<typeof VendorService>[0]["repository"],
  });
}

function createController(service: VendorService) {
  return new DefaultVendorController({
    vendorService: service,
    nestedOperationsService: {} as
      ConstructorParameters<
        typeof DefaultVendorController
      >[0]["nestedOperationsService"],
  });
}

test("Restoration service delegates directly without an active-vendor lookup", async () => {
  const calls: string[] = [];
  const restoredAt = new Date("2026-09-12T09:00:00.000Z");

  const service = createService(async (vendorId) => {
    calls.push(vendorId);
    return { vendorId, restored: true, restoredAt };
  });

  const result = await service.restoreVendor({
    vendorId: " vendor-1 ",
  });

  assert.deepEqual(calls, ["vendor-1"]);
  assert.deepEqual(result, {
    success: true,
    data: {
      vendorId: "vendor-1",
      restored: true,
      restoredAt,
    },
  });
});

test("Restoration service rejects an empty ID without calling the repository", async () => {
  let called = false;
  const service = createService(async (vendorId) => {
    called = true;
    return { vendorId, restored: true };
  });

  const result = await service.restoreVendor({ vendorId: " " });

  assert.equal(called, false);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_RESTORE_FAILED");
  }
});

test("Restoration service preserves the repository no-op result", async () => {
  const service = createService(async (vendorId) => ({
    vendorId,
    restored: false,
  }));

  assert.deepEqual(
    await service.restoreVendor({ vendorId: "vendor-1" }),
    {
      success: true,
      data: { vendorId: "vendor-1", restored: false },
    }
  );
});

test("Restoration service maps unexpected repository failures", async () => {
  const service = createService(async () => {
    throw new Error("Controlled repository failure");
  });

  const result = await service.restoreVendor({ vendorId: "vendor-1" });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_RESTORE_FAILED");
  }
});

test("Restoration controller returns the result and request ID", async () => {
  const controller = createController(
    createService(async (vendorId) => ({
      vendorId,
      restored: true,
    }))
  );

  const response = await controller.restoreVendor({
    params: { vendorId: "vendor-1" },
    requestId: "RESTORE-TEST-001",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, {
    vendorId: "vendor-1",
    restored: true,
  });
  assert.equal(response.body.meta?.requestId, "RESTORE-TEST-001");
});

test("Restoration controller rejects a missing vendor ID", async () => {
  let called = false;
  const controller = createController(
    createService(async (vendorId) => {
      called = true;
      return { vendorId, restored: true };
    })
  );

  const response = await controller.restoreVendor({
    params: { vendorId: "" },
    requestId: "RESTORE-TEST-002",
  });

  assert.equal(called, false);
  assert.equal(response.status, 400);
  assert.equal(response.body.error?.code, "INVALID_VENDOR_INPUT");
});

test("Restoration is registered once as an ADMIN-only POST route", () => {
  const routes = VENDOR_CONTROLLER_ROUTES.filter(
    (route) => route.name === "restoreVendor"
  );

  assert.equal(routes.length, 1);
  assert.equal(routes[0]?.method, "POST");
  assert.equal(routes[0]?.path, "/vendors/:vendorId/restore");
  assert.equal(routes[0]?.access, "ADMIN");
});

test("Restoration access rejects anonymous and vendor users, but permits ADMIN", async () => {
  const evaluate = createVendorRouteAccessEvaluator({
    ownershipResolver: async () => {
      throw new Error("ADMIN access must not require vendor ownership");
    },
  });

  const params = { vendorId: "vendor-1" };

  const anonymous = await evaluate("ADMIN", undefined, params);
  assert.equal(anonymous.allowed, false);
  assert.equal(anonymous.status, 401);

  const vendor = await evaluate(
    "ADMIN",
    { authenticated: true, userId: "owner-1", roles: ["VENDOR"] },
    params
  );
  assert.equal(vendor.allowed, false);
  assert.equal(vendor.status, 403);

  const admin = await evaluate(
    "ADMIN",
    { authenticated: true, userId: "admin-1", roles: ["ADMIN"] },
    params
  );
  assert.equal(admin.allowed, true);
});