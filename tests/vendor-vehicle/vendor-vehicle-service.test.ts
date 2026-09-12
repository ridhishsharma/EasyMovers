import assert from "node:assert/strict";
import test from "node:test";

import {
  VendorVehicleStatus,
  VendorVehicleType,
} from "../../domains/vendor/models/vendor.model";
import type {
  AddVendorVehicleInput,
} from "../../domains/vendor/models/vendor.model";
import {
  VendorNestedOperationsService,
} from "../../domains/vendor/services/vendor.service";
import type {
  VendorRepositoryPort,
} from "../../domains/vendor/repositories/vendor.repository";

function vehicle(
  changes: Partial<AddVendorVehicleInput> = {}
): AddVendorVehicleInput {
  return {
    registrationNumber: "MP04AB9123",
    vehicleType: VendorVehicleType.MINI_TRUCK,
    manufacturer: "Tata",
    model: "Ace Gold",
    manufacturingYear: 2023,
    capacityInKilograms: 800,
    status: VendorVehicleStatus.INACTIVE,
    active: false,
    updatedBy: "STAGING_TEST",
    ...changes,
  };
}

function createHarness(duplicate = false) {
  const checks: Array<{
    registrationNumber: string;
    excludeVehicleId?: string;
  }> = [];

  const creates: Array<{
    vendorId: string;
    input: Parameters<VendorRepositoryPort["createVehicle"]>[1];
  }> = [];

  const updates: Array<{
    vendorId: string;
    vehicleId: string;
    input: Parameters<VendorRepositoryPort["updateVehicle"]>[2];
  }> = [];

  const repository = {
    vehicleRegistrationExists: async (
      registrationNumber: string,
      excludeVehicleId?: string
    ) => {
      checks.push({ registrationNumber, excludeVehicleId });
      return duplicate;
    },

    createVehicle: async (
      vendorId: string,
      input: Parameters<VendorRepositoryPort["createVehicle"]>[1]
    ) => {
      creates.push({ vendorId, input });
      return { ...input, id: "vehicle-1" };
    },

    updateVehicle: async (
      vendorId: string,
      vehicleId: string,
      input: Parameters<VendorRepositoryPort["updateVehicle"]>[2]
    ) => {
      updates.push({ vendorId, vehicleId, input });
      return { ...vehicle(), ...input, id: vehicleId };
    },
  };

  const service = new VendorNestedOperationsService({
    repository: repository as unknown as VendorRepositoryPort,
  });

  return { service, checks, creates, updates };
}

test("Vehicle creation maps fields and preserves inactive status", async () => {
  const harness = createHarness();

  const result = await harness.service.addVehicle({
    vendorId: "vendor-1",
    vehicle: vehicle(),
  });

  assert.equal(result.success, true);
  assert.equal(harness.checks.length, 1);
  assert.equal(harness.creates.length, 1);

  const created = harness.creates[0]!;
  assert.equal(created.vendorId, "vendor-1");
  assert.equal(created.input.registrationNumber, "MP04AB9123");
  assert.equal(created.input.model, "Ace Gold");
  assert.equal(created.input.capacityInKilograms, 800);
  assert.equal(created.input.status, VendorVehicleStatus.INACTIVE);
  assert.equal(created.input.active, false);
  assert.ok(created.input.createdAt instanceof Date);
  assert.ok(created.input.updatedAt instanceof Date);
});

test("Duplicate registration blocks vehicle creation", async () => {
  const harness = createHarness(true);

  const result = await harness.service.addVehicle({
    vendorId: "vendor-1",
    vehicle: vehicle(),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_ALREADY_EXISTS");
  }
  assert.equal(harness.creates.length, 0);
});

const invalidCases: Array<{
  name: string;
  changes: Partial<AddVendorVehicleInput>;
  field: string;
  code: string;
}> = [
  {
    name: "Negative capacity",
    changes: { capacityInKilograms: -1 },
    field: "capacityInKilograms",
    code: "INVALID_CAPACITY_KG",
  },
  {
    name: "Invalid vehicle type",
    changes: {
      vehicleType: "INVALID_TYPE" as VendorVehicleType,
    },
    field: "vehicleType",
    code: "INVALID_VEHICLE_TYPE",
  },
  {
    name: "Missing updatedBy",
    changes: { updatedBy: "" },
    field: "updatedBy",
    code: "UPDATED_BY_REQUIRED",
  },
];

for (const invalid of invalidCases) {
  test(`${invalid.name} is rejected before repository access`, async () => {
    const harness = createHarness();

    const result = await harness.service.addVehicle({
      vendorId: "vendor-1",
      vehicle: vehicle(invalid.changes),
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.errorCode, "VENDOR_VALIDATION_FAILED");
      assert.ok(
        result.validationErrors?.some(
          (error) =>
            error.field === invalid.field &&
            error.code === invalid.code
        )
      );
    }

    assert.equal(harness.checks.length, 0);
    assert.equal(harness.creates.length, 0);
  });
}

test("Vehicle update excludes itself from duplicate checks and delegates IDs", async () => {
  const harness = createHarness();

  const result = await harness.service.updateVehicle({
    vendorId: "vendor-1",
    vehicleId: "vehicle-1",
    changes: vehicle(),
  });

  assert.equal(result.success, true);
  assert.deepEqual(harness.checks, [
    {
      registrationNumber: "MP04AB9123",
      excludeVehicleId: "vehicle-1",
    },
  ]);
  assert.equal(harness.updates.length, 1);

  const updated = harness.updates[0]!;
  assert.equal(updated.vendorId, "vendor-1");
  assert.equal(updated.vehicleId, "vehicle-1");
  assert.equal(updated.input.model, "Ace Gold");
  assert.equal(updated.input.capacityInKilograms, 800);
  assert.equal(updated.input.active, false);
  assert.ok(updated.input.updatedAt instanceof Date);
});

test("Registration belonging to another vehicle blocks update", async () => {
  const harness = createHarness(true);

  const result = await harness.service.updateVehicle({
    vendorId: "vendor-1",
    vehicleId: "vehicle-1",
    changes: vehicle(),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_ALREADY_EXISTS");
  }
  assert.equal(harness.updates.length, 0);
});