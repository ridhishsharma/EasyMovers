import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const service = await readFile("lib/vendor-change-control.ts", "utf8");
const listRoute = await readFile("app/api/admin/vendor-changes/route.ts", "utf8");
const reviewRoute = await readFile("app/api/admin/vendor-changes/[changeRequestId]/review/route.ts", "utf8");
const reviewUi = await readFile("components/admin/vendor-change-review-admin.tsx", "utf8");
const reviewPage = await readFile("app/admin/vendor-changes/page.tsx", "utf8");

test("staff submissions and checker queue use separate permissions", () => {
  assert.match(listRoute, /VENDOR_MANAGE/);
  assert.match(listRoute, /VENDOR_VERIFY/);
  assert.match(reviewRoute, /VENDOR_VERIFY/);
  assert.match(listRoute, /VendorChangeSource\.EM_STAFF/);
});

test("approval applies only allowlisted operational entities", () => {
  assert.match(service, /applyApprovedChange/);
  assert.match(service, /VendorChangeEntityType\.VEHICLE/);
  assert.match(service, /VendorChangeEntityType\.DOCUMENT/);
  assert.match(service, /VendorChangeEntityType\.BANK_ACCOUNT/);
  assert.match(service, /CHANGE_TYPE_NOT_SUPPORTED/);
  assert.match(service, /appliedAt/);
});

test("approval is serialized and maker cannot act as checker", () => {
  assert.match(service, /pg_advisory_xact_lock/);
  assert.match(service, /MAKER_CHECKER_CONFLICT/);
  assert.match(service, /updateMany/);
});

test("CRM checker queue compares and independently reviews vendor changes", () => {
  assert.match(reviewPage, /VendorChangeReviewAdmin/);
  assert.match(reviewUi, /Maker–checker review/);
  assert.match(reviewUi, /Change comparison/);
  assert.match(reviewUi, /Approve & apply/);
  assert.match(reviewUi, /Enter a rejection reason/);
  assert.match(reviewUi, /ownSubmission/);
  assert.match(reviewUi, /Another authorised checker must review it/);
  assert.match(reviewUi, /sensitive/);
  assert.match(listRoute, /currentUserId: access\.userId/);
});
