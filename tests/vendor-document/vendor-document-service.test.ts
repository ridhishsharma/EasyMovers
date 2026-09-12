import assert from "node:assert/strict";
import test from "node:test";

import {
  VendorDocumentStatus,
  VendorDocumentType,
} from "../../domains/vendor/models/vendor.model";
import type {
  AddVendorDocumentInput,
  ReviewVendorDocumentInput,
} from "../../domains/vendor/models/vendor.model";
import {
  VendorNestedOperationsService,
} from "../../domains/vendor/services/vendor.service";
import type {
  VendorRepositoryPort,
} from "../../domains/vendor/repositories/vendor.repository";

function document(
  changes: Partial<AddVendorDocumentInput> = {}
): AddVendorDocumentInput {
  return {
    documentType: VendorDocumentType.VEHICLE_REGISTRATION,
    documentNumber: "MP04AB9123",
    documentUrl: "https://example.com/staging/registration.pdf",
    fileName: "registration.pdf",
    mimeType: "application/pdf",
    expiresAt: new Date("2027-09-12T00:00:00.000Z"),
    updatedBy: "STAGING_TEST",
    ...changes,
  };
}

function review(
  changes: Partial<ReviewVendorDocumentInput> = {}
): ReviewVendorDocumentInput {
  return {
    status: VendorDocumentStatus.REJECTED,
    rejectionReason: "Synthetic staging fixture.",
    verifiedBy: "STAGING_ADMIN",
    ...changes,
  };
}

function createHarness() {
  const creates: Array<{
    vendorId: string;
    input: Parameters<VendorRepositoryPort["createDocument"]>[1];
  }> = [];

  const reviews: Array<{
    vendorId: string;
    documentId: string;
    input: Parameters<VendorRepositoryPort["reviewDocument"]>[2];
  }> = [];

  const repository = {
    createDocument: async (
      vendorId: string,
      input: Parameters<VendorRepositoryPort["createDocument"]>[1]
    ) => {
      creates.push({ vendorId, input });
      return { ...input, id: "document-1" };
    },

    reviewDocument: async (
      vendorId: string,
      documentId: string,
      input: Parameters<VendorRepositoryPort["reviewDocument"]>[2]
    ) => {
      reviews.push({ vendorId, documentId, input });
      return { ...document(), ...input, id: documentId };
    },
  };

  const service = new VendorNestedOperationsService({
    repository: repository as unknown as VendorRepositoryPort,
  });

  return { service, creates, reviews };
}

test("Document creation maps metadata and starts pending", async () => {
  const harness = createHarness();

  const result = await harness.service.addDocument({
    vendorId: "vendor-1",
    document: document(),
  });

  assert.equal(result.success, true);
  assert.equal(harness.creates.length, 1);

  const created = harness.creates[0]!;
  assert.equal(created.vendorId, "vendor-1");
  assert.equal(created.input.status, VendorDocumentStatus.PENDING);
  assert.equal(created.input.documentNumber, "MP04AB9123");
  assert.equal(
    created.input.expiresAt?.toISOString(),
    "2027-09-12T00:00:00.000Z"
  );
  assert.ok(created.input.createdAt instanceof Date);
  assert.ok(created.input.updatedAt instanceof Date);
});

test("Registration document without expiry is rejected before persistence", async () => {
  const harness = createHarness();

  const result = await harness.service.addDocument({
    vendorId: "vendor-1",
    document: document({ expiresAt: undefined }),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorCode, "VENDOR_VALIDATION_FAILED");
    assert.ok(
      result.validationErrors?.some(
        (error) =>
          error.field === "expiresAt" &&
          error.code === "DOCUMENT_EXPIRY_DATE_REQUIRED"
      )
    );
  }
  assert.equal(harness.creates.length, 0);
});

test("Document creation requires updatedBy", async () => {
  const harness = createHarness();

  const result = await harness.service.addDocument({
    vendorId: "vendor-1",
    document: document({ updatedBy: "" }),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.validationErrors?.some(
        (error) => error.code === "UPDATED_BY_REQUIRED"
      )
    );
  }
  assert.equal(harness.creates.length, 0);
});

test("Rejection delegates IDs, reason and reviewer", async () => {
  const harness = createHarness();

  const result = await harness.service.reviewDocument({
    vendorId: "vendor-1",
    documentId: "document-1",
    review: review(),
  });

  assert.equal(result.success, true);
  assert.equal(harness.reviews.length, 1);

  const reviewed = harness.reviews[0]!;
  assert.equal(reviewed.vendorId, "vendor-1");
  assert.equal(reviewed.documentId, "document-1");
  assert.equal(reviewed.input.status, VendorDocumentStatus.REJECTED);
  assert.equal(
    reviewed.input.rejectionReason,
    "Synthetic staging fixture."
  );
  assert.equal(reviewed.input.verifiedBy, "STAGING_ADMIN");
  assert.ok(reviewed.input.updatedAt instanceof Date);
});

const invalidReviews: Array<{
  name: string;
  changes: Partial<ReviewVendorDocumentInput>;
  code: string;
}> = [
  {
    name: "Missing rejection reason",
    changes: { rejectionReason: undefined },
    code: "DOCUMENT_REJECTION_REASON_REQUIRED",
  },
  {
    name: "Invalid review status",
    changes: {
      status: "INVALID_STATUS" as VendorDocumentStatus,
    },
    code: "INVALID_DOCUMENT_REVIEW_STATUS",
  },
  {
    name: "Missing reviewer",
    changes: { verifiedBy: "" },
    code: "DOCUMENT_REVIEWER_REQUIRED",
  },
  {
    name: "Return to pending",
    changes: {
      status: VendorDocumentStatus.PENDING,
      rejectionReason: undefined,
    },
    code: "INVALID_DOCUMENT_REVIEW_TRANSITION",
  },
];

for (const invalid of invalidReviews) {
  test(`${invalid.name} is rejected before persistence`, async () => {
    const harness = createHarness();

    const result = await harness.service.reviewDocument({
      vendorId: "vendor-1",
      documentId: "document-1",
      review: review(invalid.changes),
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
    assert.equal(harness.reviews.length, 0);
  });
}