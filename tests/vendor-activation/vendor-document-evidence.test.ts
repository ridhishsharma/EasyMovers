import assert from "node:assert/strict";
import test from "node:test";

import {
  VendorDocumentStatus,
  VendorDocumentType,
} from "../../domains/vendor/models/vendor.model";
import type {
  VendorDocument,
} from "../../domains/vendor/models/vendor.model";
import {
  hasVerifiedVendorDocument,
} from "../../domains/vendor/services/vendor.service";

const observedAt = new Date("2026-09-12T12:00:00.000Z");

function document(
  changes: Partial<VendorDocument> = {}
): VendorDocument {
  return {
    id: "document-test-1",
    documentType: VendorDocumentType.PAN_CARD,
    documentUrl: "https://example.com/staging/test.pdf",
    status: VendorDocumentStatus.VERIFIED,
    createdAt: observedAt,
    updatedAt: observedAt,
    ...changes,
  };
}

test("Verified matching document without expiry is accepted", () => {
  assert.equal(
    hasVerifiedVendorDocument(
      [document()],
      VendorDocumentType.PAN_CARD,
      observedAt
    ),
    true
  );
});

test("Missing or different document type is rejected", () => {
  assert.equal(
    hasVerifiedVendorDocument(
      [],
      VendorDocumentType.PAN_CARD,
      observedAt
    ),
    false
  );

  assert.equal(
    hasVerifiedVendorDocument(
      [document()],
      VendorDocumentType.GST_CERTIFICATE,
      observedAt
    ),
    false
  );
});

test("Pending, rejected and expired statuses are rejected", () => {
  for (const status of [
    VendorDocumentStatus.PENDING,
    VendorDocumentStatus.REJECTED,
    VendorDocumentStatus.EXPIRED,
  ]) {
    assert.equal(
      hasVerifiedVendorDocument(
        [document({ status })],
        VendorDocumentType.PAN_CARD,
        observedAt
      ),
      false
    );
  }
});

test("Future expiry is accepted", () => {
  assert.equal(
    hasVerifiedVendorDocument(
      [
        document({
          expiresAt: new Date("2026-09-12T12:00:00.001Z"),
        }),
      ],
      VendorDocumentType.PAN_CARD,
      observedAt
    ),
    true
  );
});

test("Expiry at or before observation time is rejected", () => {
  for (const expiresAt of [
    new Date("2026-09-12T11:59:59.999Z"),
    new Date("2026-09-12T12:00:00.000Z"),
  ]) {
    assert.equal(
      hasVerifiedVendorDocument(
        [document({ expiresAt })],
        VendorDocumentType.PAN_CARD,
        observedAt
      ),
      false
    );
  }
});

test("Invalid or unconverted expiry dates are rejected", () => {
  for (const expiresAt of [
    new Date("invalid"),
    "2027-09-12T00:00:00.000Z" as unknown as Date,
  ]) {
    assert.equal(
      hasVerifiedVendorDocument(
        [document({ expiresAt })],
        VendorDocumentType.PAN_CARD,
        observedAt
      ),
      false
    );
  }
});

test("Invalid observation date is rejected", () => {
  assert.equal(
    hasVerifiedVendorDocument(
      [document()],
      VendorDocumentType.PAN_CARD,
      new Date("invalid")
    ),
    false
  );
});

test("Rejected evidence does not hide another valid matching document", () => {
  assert.equal(
    hasVerifiedVendorDocument(
      [
        document({ status: VendorDocumentStatus.REJECTED }),
        document({ id: "document-test-2" }),
      ],
      VendorDocumentType.PAN_CARD,
      observedAt
    ),
    true
  );
});