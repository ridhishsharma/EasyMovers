import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile("prisma/schema.prisma", "utf8");
const migration = await readFile("prisma/migrations/20261004100000_add_vendor_quotation_invitations/migration.sql", "utf8");
const service = await readFile("lib/lead-quotation-invitations.ts", "utf8");
const route = await readFile("app/api/admin/leads/[leadId]/quotation-invitations/route.ts", "utf8");
const adminUi = await readFile("components/admin/lead-vendor-invitations.tsx", "utf8");
const leadDetailRoute = await readFile("app/api/admin/leads/[leadId]/route.ts", "utf8");

test("vendor RFQ invitations are durable unique and staff controlled", () => {
  assert.match(schema, /model VendorQuotationInvitation/);
  assert.match(schema, /@@unique\(\[bookingId, vendorId\]\)/);
  assert.match(migration, /VendorQuotationInvitation_bookingId_vendorId_key/);
  assert.match(route, /CRM_PERMISSIONS\.LEAD_ASSIGN/);
  assert.match(service, /Select between one and five eligible vendors/);
  assert.match(service, /RFQ_VENDOR_LIMIT_REACHED/);
  assert.match(service, /TransactionIsolationLevel\.Serializable/);
  assert.match(service, /FOR UPDATE/);
  assert.match(service, /LEAD_VENDOR_RFQ_SENT/);
  assert.match(service, /RFQ_INVITATION_PERSISTENCE_FAILED/);
  assert.match(service, /requestedCount: uniqueVendorIds\.length/);
});

test("staff can verify missing RFQ PIN codes before sending vendors", () => {
  assert.match(leadDetailRoute, /export async function PATCH/);
  assert.match(leadDetailRoute, /CRM_PERMISSIONS\.LEAD_ASSIGN/);
  assert.match(leadDetailRoute, /postalLocationCandidates/);
  assert.match(leadDetailRoute, /PICKUP_PIN_MISMATCH/);
  assert.match(leadDetailRoute, /DESTINATION_PIN_MISMATCH/);
  assert.match(leadDetailRoute, /LEAD_RFQ_ADDRESS_COMPLETED/);
  assert.match(adminUi, /Complete the RFQ address/);
  assert.match(adminUi, /Verify and save RFQ address/);
});

test("automatic eligibility requires active quotation service coverage and portal access", () => {
  assert.match(service, /status: "ACTIVE"/);
  assert.match(service, /VendorEngagementMode\.QUOTATION/);
  assert.match(service, /VendorEngagementMode\.HYBRID/);
  assert.match(service, /serviceOfferings: \{ some:/);
  assert.match(service, /serviceAreas: \{ some:/);
  assert.match(service, /supabaseAuthId: \{ not: null \}/);
  assert.match(service, /acceptingQuotationEnquiries/);
});

test("lead workspace distinguishes invitation from job assignment", () => {
  assert.match(adminUi, /checked vendor is not invited until it appears under Invitation progress/);
  assert.match(adminUi, /Refresh eligibility/);
  assert.match(adminUi, /Selected — not sent/);
  assert.match(adminUi, /Sending and verifying/);
  assert.match(adminUi, /Invitation progress/);
  assert.match(adminUi, /Recommended/);
  assert.doesNotMatch(adminUi, /filter\(\(candidate: Candidate\) => candidate\.recommended/);
});
