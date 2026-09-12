import assert from "node:assert/strict";
import test from "node:test";

import {
  VendorBankAccountType,
} from "../../domains/vendor/models/vendor.model";
import type {
  UpdateVendorBankDetailsInput,
} from "../../domains/vendor/models/vendor.model";
import {
  VendorNestedOperationsService,
} from "../../domains/vendor/services/vendor.service";
import type {
  VendorRepositoryPort,
} from "../../domains/vendor/repositories/vendor.repository";

function bank(
  changes: Partial<UpdateVendorBankDetailsInput> = {}
): UpdateVendorBankDetailsInput {
  return {
    accountHolderName: "Staging Test Owner",
    bankName: "Synthetic Staging Bank",
    accountNumber: "999999999001",
    accountType: VendorBankAccountType.SAVINGS,
    ifscCode: "TEST0000001",
    branchName: "Staging Test Branch",
    updatedBy: "STAGING_TEST",
    ...changes,
  };
}

function createHarness(duplicateAccount = false) {
  const checks: Array<{
    accountNumber: string;
    excludeVendorId?: string;
  }> = [];

  const writes: Array<{
    vendorId: string;
    input: Parameters<VendorRepositoryPort["upsertBankDetails"]>[1];
  }> = [];

  const verifications: Array<{
    vendorId: string;
    input: Parameters<VendorRepositoryPort["verifyBankDetails"]>[1];
  }> = [];

  const repository = {
    bankAccountExists: async (
      accountNumber: string,
      excludeVendorId?: string
    ) => {
      checks.push({ accountNumber, excludeVendorId });
      return duplicateAccount;
    },

    upsertBankDetails: async (
      vendorId: string,
      input: Parameters<VendorRepositoryPort["upsertBankDetails"]>[1]
    ) => {
      writes.push({ vendorId, input });
      return { ...input, verified: false };
    },

    verifyBankDetails: async (
      vendorId: string,
      input: Parameters<VendorRepositoryPort["verifyBankDetails"]>[1]
    ) => {
      verifications.push({ vendorId, input });
      return {
        ...bank(),
        verified: input.verified,
        verifiedAt: input.verifiedAt,
      };
    },
  };

  const service = new VendorNestedOperationsService({
    repository: repository as unknown as VendorRepositoryPort,
  });

  return { service, checks, writes, verifications };
}

test("Bank update excludes its own vendor from duplicate checks and maps fields", async () => {
  const harness = createHarness();

  const result = await harness.service.updateBankDetails({
    vendorId: "vendor-1",
    bankDetails: bank(),
  });

  assert.equal(result.success, true);
  assert.deepEqual(harness.checks, [
    {
      accountNumber: "999999999001",
      excludeVendorId: "vendor-1",
    },
  ]);
  assert.equal(harness.writes.length, 1);

  const saved = harness.writes[0]!;
  assert.equal(saved.vendorId, "vendor-1");
  assert.equal(saved.input.accountHolderName, "Staging Test Owner");
  assert.equal(saved.input.accountNumber, "999999999001");
  assert.equal(saved.input.accountType, VendorBankAccountType.SAVINGS);
  assert.equal(saved.input.ifscCode, "TEST0000001");

  if (result.success) {
    assert.equal(result.data.verified, false);
  }
});

test("Another vendor's bank account blocks persistence", async () => {
  const harness = createHarness(true);

  const result = await harness.service.updateBankDetails({
    vendorId: "vendor-1",
    bankDetails: bank(),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_ALREADY_EXISTS");
  }
  assert.equal(harness.writes.length, 0);
});

const invalidCases: Array<{
  name: string;
  changes: Partial<UpdateVendorBankDetailsInput>;
  code: string;
}> = [
  {
    name: "Invalid IFSC",
    changes: { ifscCode: "INVALID" },
    code: "INVALID_IFSC_CODE",
  },
  {
    name: "Eight-digit account number",
    changes: { accountNumber: "12345678" },
    code: "INVALID_ACCOUNT_NUMBER",
  },
  {
    name: "Nineteen-digit account number",
    changes: { accountNumber: "1234567890123456789" },
    code: "INVALID_ACCOUNT_NUMBER",
  },
  {
    name: "Invalid account type",
    changes: {
      accountType: "INVALID_TYPE" as VendorBankAccountType,
    },
    code: "INVALID_ACCOUNT_TYPE",
  },
  {
    name: "Missing updatedBy",
    changes: { updatedBy: "" },
    code: "UPDATED_BY_REQUIRED",
  },
];

for (const invalid of invalidCases) {
  test(`${invalid.name} is rejected before repository access`, async () => {
    const harness = createHarness();

    const result = await harness.service.updateBankDetails({
      vendorId: "vendor-1",
      bankDetails: bank(invalid.changes),
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.errorCode, "VENDOR_VALIDATION_FAILED");
      assert.ok(
        result.validationErrors?.some(
          (error) => error.code === invalid.code
        )
      );
    }

    assert.equal(harness.checks.length, 0);
    assert.equal(harness.writes.length, 0);
  });
}

test("Setting verification false delegates without generating a timestamp", async () => {
  const harness = createHarness();

  const result = await harness.service.verifyBankDetails({
    vendorId: "vendor-1",
    verified: false,
  });

  assert.equal(result.success, true);
  assert.equal(harness.verifications.length, 1);
  assert.equal(harness.verifications[0]?.vendorId, "vendor-1");
  assert.equal(harness.verifications[0]?.input.verified, false);
  assert.equal(
    harness.verifications[0]?.input.verifiedAt,
    undefined
  );
});

test("Successful verification generates a timestamp in the mock-only test", async () => {
  const harness = createHarness();

  const result = await harness.service.verifyBankDetails({
    vendorId: "vendor-1",
    verified: true,
  });

  assert.equal(result.success, true);
  assert.equal(harness.verifications[0]?.input.verified, true);
  assert.ok(
    harness.verifications[0]?.input.verifiedAt instanceof Date
  );
});