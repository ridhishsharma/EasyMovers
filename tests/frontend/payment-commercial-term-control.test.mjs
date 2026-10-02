import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("commercial terms persist an independently reviewed commission snapshot", async () => {
  const [schema, migration, service] = await Promise.all([
    read("prisma/schema.prisma"),
    read("prisma/migrations/20261002160000_add_commercial_term_control/migration.sql"),
    read("lib/payment-commercial-term-control.ts"),
  ]);
  assert.match(schema, /model PaymentCommercialTermRequest/);
  assert.match(migration, /commission\.approve/);
  assert.match(service, /QuotationStatus\.ACCEPTED/);
  assert.match(service, /selectedQuotationId !== quotation\.id/);
  assert.match(service, /MAKER_CANNOT_APPROVE/);
  assert.match(service, /COMMISSION_ALREADY_LOCKED/);
  assert.match(service, /COMMISSION_EXCEEDS_QUOTE/);
  assert.match(service, /TransactionIsolationLevel\.Serializable/);
  assert.match(service, /COMMISSION_TERMS_APPROVED/);
});

test("commercial term APIs separate maker and checker permissions", async () => {
  const [collection, review, auth] = await Promise.all([
    read("app/api/admin/commercial-terms/route.ts"),
    read("app/api/admin/commercial-terms/[requestId]/review/route.ts"),
    read("lib/crm-authorization.ts"),
  ]);
  assert.match(collection, /CRM_PERMISSIONS\.PAYMENT_MANAGE/);
  assert.match(collection, /CRM_PERMISSIONS\.PAYMENT_READ/);
  assert.match(review, /CRM_PERMISSIONS\.COMMISSION_APPROVE/);
  assert.match(auth, /COMMISSION_APPROVE: "commission\.approve"/);
});

test("finance UI explains commission math and settlement readiness", async () => {
  const [component, dashboard, settlement] = await Promise.all([
    read("components/admin/commercial-term-admin.tsx"),
    read("components/admin/crm-dashboard.tsx"),
    read("components/admin/vendor-settlement-admin.tsx"),
  ]);
  assert.match(component, /Customer payable/);
  assert.match(component, /Vendor net after commission/);
  assert.match(component, /Another authorised checker must review it/);
  assert.match(component, /available in the vendor settlement dropdown/);
  assert.match(dashboard, /Commission terms awaiting checker/);
  assert.match(settlement, /\/admin\/commercial-terms/);
});
