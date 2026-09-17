import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const auth = readFileSync("lib/admin-auth.ts", "utf8");
const reviewService = readFileSync("lib/vendor-application-review.ts", "utf8");
const listRoute = readFileSync("app/api/admin/vendor-applications/route.ts", "utf8");
const detailRoute = readFileSync(
  "app/api/admin/vendor-applications/[applicationId]/route.ts",
  "utf8"
);
const reviewRoute = readFileSync(
  "app/api/admin/vendor-applications/[applicationId]/review/route.ts",
  "utf8"
);
const approvalRoute = readFileSync(
  "app/api/admin/vendor-applications/[applicationId]/approve/route.ts",
  "utf8"
);
const schema = readFileSync("prisma/schema.prisma", "utf8");

test("all Vendor application administration routes require verified administrators", () => {
  for (const source of [listRoute, detailRoute, reviewRoute, approvalRoute]) {
    assert.match(source, /authorizeAdministrator\(request\)/);
    assert.match(source, /Cache-Control/);
  }

  assert.match(auth, /"ADMIN", "SUPER_ADMIN"/);
  assert.match(auth, /resolveApplicationAuthentication/);
  assert.match(auth, /ADMIN_ACCESS_REQUIRED/);
});

test("admin list uses bounded pagination, validated status and selected fields", () => {
  assert.match(listRoute, /pageSize[^\n]+20[^\n]+100/);
  assert.match(listRoute, /Object\.values\(VendorApplicationStatus\)/);
  assert.match(listRoute, /INVALID_PAGINATION/);
  assert.match(listRoute, /INVALID_VENDOR_APPLICATION_STATUS/);
  assert.match(listRoute, /select:\s*\{/);
  assert.doesNotMatch(listRoute, /include:\s*\{/);
});

test("detail route supports internal and public application identifiers", () => {
  assert.match(detailRoute, /OR: \[\{ id: identifier \}, \{ referenceId: identifier \}\]/);
  assert.match(detailRoute, /VENDOR_APPLICATION_NOT_FOUND/);
  assert.match(detailRoute, /reviewedByUser/);
  assert.match(detailRoute, /callbackRequests/);
  assert.match(detailRoute, /take: 20/);
});

test("review workflow requires reasons and protects finalized applications", () => {
  assert.match(reviewService, /START_REVIEW/);
  assert.match(reviewService, /REQUEST_INFORMATION/);
  assert.match(reviewService, /REJECT/);
  assert.match(reviewService, /REVIEW_REASON_REQUIRED/);
  assert.match(reviewService, /VENDOR_APPLICATION_FINALIZED/);
  assert.match(reviewService, /status === "APPROVED"/);
  assert.match(reviewService, /status === "WITHDRAWN"/);
});

test("approval is atomic, serialized, inactive and idempotent", () => {
  assert.match(reviewService, /prisma\.\$transaction/);
  assert.match(reviewService, /pg_advisory_xact_lock/);
  assert.match(reviewService, /candidate\.id/);
  assert.match(reviewService, /new PrismaVendorRepository\(transaction\)/);
  assert.match(reviewService, /createInitialVendorRepositoryInput/);
  assert.match(reviewService, /application\.status === "APPROVED"/);
  assert.match(reviewService, /idempotent: true/);
assert.match(
  reviewService,
  /status: vendor\.active \? "ACTIVE" : "INACTIVE"/
);
  assert.match(reviewService, /vendorId: vendor\.id/);
  assert.doesNotMatch(reviewService, /active:\s*true/);
});

test("schema enforces one application to one created Vendor", () => {
  assert.match(schema, /vendorId\s+String\?\s+@unique/);
  assert.match(schema, /VendorApplicationCreatedVendor/);
  assert.match(schema, /VendorApplicationReviewer/);
});
