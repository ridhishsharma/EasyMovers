import assert from "node:assert/strict";
import test from "node:test";

import {
  VendorBusinessType,
  VendorCategory,
} from "../../domains/vendor/models/vendor.model";
import {
  mapVendorBusinessDetails,
  mapVendorBusinessType,
} from "../../domains/vendor/mappers/vendor.mapper";
import {
  mapVendorUpdateToPrismaData,
} from "../../domains/vendor/repositories/prisma-vendor.repository";
import {
  validateVendorBusinessDetails,
} from "../../domains/vendor/validators/vendor.validator";
import {
  VendorService,
} from "../../domains/vendor/services/vendor.service";
import type {
  VendorRepositoryPort,
} from "../../domains/vendor/repositories/vendor.repository";

test("Missing business type maps to UNSPECIFIED", () => {
  assert.equal(
    mapVendorBusinessType(undefined),
    VendorBusinessType.UNSPECIFIED
  );
  assert.equal(
    mapVendorBusinessType(null),
    VendorBusinessType.UNSPECIFIED
  );
});

test("Business type normalizes supported values", () => {
  assert.equal(
    mapVendorBusinessType(" individual_owner_driver "),
    VendorBusinessType.INDIVIDUAL_OWNER_DRIVER
  );
});

test("Invalid business types are rejected", () => {
  assert.throws(() => mapVendorBusinessType("INVALID_TYPE"));
  assert.throws(() => mapVendorBusinessType(123));
  assert.throws(() => mapVendorBusinessType(""));
});

test("Business-details mapper preserves explicit classification", () => {
  const result = mapVendorBusinessDetails({
    companyName: "Test Local Transport",
    category: VendorCategory.LOCAL,
    businessType: VendorBusinessType.INDIVIDUAL_OWNER_DRIVER,
  });

  assert.equal(
    result.businessType,
    VendorBusinessType.INDIVIDUAL_OWNER_DRIVER
  );
});

test("Repository update omits classification when it was not supplied", () => {
  const result = mapVendorUpdateToPrismaData({
    businessDetails: {
      companyName: "Updated Transport Name",
      category: VendorCategory.LOCAL,
    },
  });

  assert.equal(
    Object.prototype.hasOwnProperty.call(result, "businessType"),
    false
  );
});

test("Repository update writes an explicitly supplied classification", () => {
  const result = mapVendorUpdateToPrismaData({
    businessDetails: {
      companyName: "Test Local Transport",
      category: VendorCategory.LOCAL,
      businessType: VendorBusinessType.SOLE_PROPRIETOR,
    },
  });

  assert.equal(
    result.businessType,
    VendorBusinessType.SOLE_PROPRIETOR
  );
});
test("Registration accepts an omitted business type for compatibility", () => {
  const result = validateVendorBusinessDetails({
    companyName: "Test Local Transport",
    category: VendorCategory.LOCAL,
  });

  assert.equal(result.valid, true);
});

test("Registration accepts an explicit owner-driver business type", () => {
  const result = validateVendorBusinessDetails({
    companyName: "Test Local Transport",
    category: VendorCategory.LOCAL,
    businessType: VendorBusinessType.INDIVIDUAL_OWNER_DRIVER,
  });

  assert.equal(result.valid, true);
});

test("Registration rejects an unsupported business type", () => {
  const result = validateVendorBusinessDetails({
    companyName: "Test Local Transport",
    category: VendorCategory.LOCAL,
    businessType: "INVALID_TYPE" as VendorBusinessType,
  });

  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some(
      (error) => error.code === "INVALID_VENDOR_BUSINESS_TYPE"
    )
  );
});
test("Invalid classification is rejected before the repository update", async () => {
  let updateCalled = false;

  const service = new VendorService({
    repository: {
      update: async () => {
        updateCalled = true;
        throw new Error("Repository must not be called");
      },
    } as unknown as VendorRepositoryPort,
  });

  const result = await service.updateVendor({
    vendorId: "vendor-1",
    changes: {
      businessDetails: {
        companyName: "Test Local Transport",
        category: VendorCategory.LOCAL,
        businessType: "INVALID_TYPE" as VendorBusinessType,
      },
    },
  });

  assert.equal(updateCalled, false);
  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_VALIDATION_FAILED");
    assert.ok(
      result.validationErrors?.some(
        (error) =>
          error.field === "businessDetails.businessType" &&
          error.code === "INVALID_VENDOR_BUSINESS_TYPE"
      )
    );
  }
});

test("Omitted classification remains omitted when the service delegates update", async () => {
  let captured:
    Parameters<VendorRepositoryPort["update"]>[1] | undefined;

  const service = new VendorService({
    repository: {
      update: async (
        _vendorId: string,
        changes: Parameters<VendorRepositoryPort["update"]>[1]
      ) => {
        captured = changes;
        return null;
      },
    } as unknown as VendorRepositoryPort,
  });

  const result = await service.updateVendor({
    vendorId: "vendor-1",
    changes: {
      businessDetails: {
        companyName: "Updated Transport Name",
        category: VendorCategory.LOCAL,
      },
    },
  });

  assert.equal(result.success, true);
  assert.ok(captured);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      captured.businessDetails,
      "businessType"
    ),
    false
  );
});