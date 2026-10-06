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
  assert.match(service, /DEDUCTIONS_EXCEED_QUOTE/);
  assert.match(service, /TransactionIsolationLevel\.Serializable/);
  assert.match(service, /COMMISSION_TERMS_APPROVED/);
});

test("commercial terms calculate an immutable GST and TCS snapshot with revisions", async () => {
  const [schema, migration, service, component, collection] = await Promise.all([
    read("prisma/schema.prisma"),
    read("prisma/migrations/20261002200000_add_commercial_tax_snapshot/migration.sql"),
    read("lib/payment-commercial-term-control.ts"),
    read("components/admin/commercial-term-admin.tsx"),
    read("app/api/admin/commercial-terms/route.ts"),
  ]);
  assert.match(schema, /enum CommercialTaxTreatment/);
  assert.match(schema, /commissionRate\s+Decimal/);
  assert.match(schema, /revisedFromId\s+String\?/);
  assert.match(migration, /PaymentCommercialTermRequest_tax_amounts_check/);
  assert.match(service, /calculateCommercialTaxes/);
  assert.match(service, /calculatePlatformFee/);
  assert.match(service, /PLATFORM_FEE_POLICY_MISMATCH/);
  assert.match(service, /COMMISSION_TERMS_REVISED/);
  assert.match(service, /commercialTermRevision/);
  assert.match(collection, /taxOverrideReason/);
  assert.match(component, /CGST \+ SGST \(intra-state\)/);
  assert.match(component, /Revise and resubmit/);
  assert.match(component, /numbered tax invoice will be generated only after the platform fee becomes earned/i);
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
  const [component, dashboard, settlement, styles, permissionRepair] = await Promise.all([
    read("components/admin/commercial-term-admin.tsx"),
    read("components/admin/crm-dashboard.tsx"),
    read("components/admin/vendor-settlement-admin.tsx"),
    read("components/admin/vendor-settlement-admin.module.css"),
    read("prisma/migrations/20261002170000_reconcile_finance_permissions/migration.sql"),
  ]);
  assert.match(component, /Vendor quotation/);
  assert.match(component, /Estimated vendor net/);
  assert.match(component, /Another authorised checker must review it/);
  assert.match(component, /approved commercial and tax snapshot is locked for settlement/i);
  assert.match(dashboard, /Commission terms awaiting checker/);
  assert.match(settlement, /\/admin\/commercial-terms/);
  assert.match(component, /vendor-settlement-admin\.module\.css/);
  assert.match(styles, /headerActions/);
  assert.match(permissionRepair, /FINANCE_EXECUTIVE/);
  assert.match(permissionRepair, /payment\.read/);
});
