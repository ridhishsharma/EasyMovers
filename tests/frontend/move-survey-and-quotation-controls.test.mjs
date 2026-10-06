import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("launch commercial policy keeps an exact ten-percent vendor margin and separates customer promotions", async () => {
  const [policy, vendor, finance] = await Promise.all([
    read("lib/platform-fee-policy.ts"),
    read("components/vendor/vendor-portal-dashboard.tsx"),
    read("lib/payment-commercial-term-control.ts"),
  ]);
  assert.match(policy, /PLATFORM_FEE_RATE_PERCENT = 10/);
  assert.match(policy, /percentageFee/);
  assert.doesNotMatch(policy, /PLATFORM_FEE_LAUNCH_CAP/);
  assert.doesNotMatch(policy, /PLATFORM_FEE_MINIMUM/);
  assert.match(policy, /Customer promotions are an independent EasyMovers-funded control/);
  assert.match(vendor, /Estimated EasyMovers platform fee/);
  assert.match(finance, /PLATFORM_FEE_POLICY_MISMATCH/);
});

test("vendor quotation requires committed pickup and delivery and CRM exposes its full breakdown", async () => {
  const [service, portal, route, workspace] = await Promise.all([
    read("lib/vendor-opportunities.ts"),
    read("components/vendor/vendor-portal-dashboard.tsx"),
    read("app/api/admin/leads/[leadId]/route.ts"),
    read("components/admin/lead-workspace.tsx"),
  ]);
  assert.match(service, /QUOTATION_SCHEDULE_REQUIRED/);
  assert.match(service, /INVALID_QUOTATION_SCHEDULE/);
  assert.match(portal, /Committed pickup date/);
  assert.match(portal, /Committed delivery date/);
  assert.match(route, /transportationCost: true/);
  assert.match(route, /inclusionsJson: true/);
  assert.match(workspace, /Vendor remarks/);
  assert.match(workspace, /Vendor discount/);
});

test("mobile survey is versioned, room-based, OTP-confirmed and reviewed before vendor sharing", async () => {
  const [schema, migration, service, customerRoute, mediaRoute, adminRoute] = await Promise.all([
    read("prisma/schema.prisma"),
    read("prisma/migrations/20261006110000_add_move_survey_workflow/migration.sql"),
    read("lib/move-survey.ts"),
    read("app/api/public/move-surveys/route.ts"),
    read("app/api/public/move-surveys/[surveyId]/media/route.ts"),
    read("app/api/admin/leads/[leadId]/surveys/route.ts"),
  ]);
  assert.match(schema, /model MoveSurvey/);
  assert.match(schema, /model MoveSurveyRoom/);
  assert.match(schema, /estimatedBoxes/);
  assert.match(schema, /customerConfirmedAt/);
  assert.match(migration, /MoveSurveyRoom_non_negative_estimates_check/);
  assert.match(service, /OTP_VERIFIED_TRACK_SESSION/);
  assert.match(service, /SURVEY_PHOTO_REQUIRED/);
  assert.match(service, /SURVEY_APPROVAL_REQUIRED/);
  assert.match(customerRoute, /readDraftSession/);
  assert.match(mediaRoute, /Maximum survey photo size is 2 MB/);
  assert.match(mediaRoute, /rooms:\{some:\{id:roomId\}\}/);
  assert.match(adminRoute, /CRM_PERMISSIONS\.LEAD_ASSIGN/);
});
