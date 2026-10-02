import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile("prisma/schema.prisma", "utf8");
const migration = await readFile("prisma/migrations/20261002130000_add_vendor_settlement_maker_checker/migration.sql", "utf8");
const service = await readFile("lib/vendor-settlement-management.ts", "utf8");
const listRoute = await readFile("app/api/admin/vendor-settlements/route.ts", "utf8");
const reviewRoute = await readFile("app/api/admin/vendor-settlements/[settlementId]/review/route.ts", "utf8");
const completeRoute = await readFile("app/api/admin/vendor-settlements/[settlementId]/complete/route.ts", "utf8");
const ui = await readFile("components/admin/vendor-settlement-admin.tsx", "utf8");
const shell = await readFile("components/brand/app-brand-shell.tsx", "utf8");
const dashboard = await readFile("components/admin/crm-dashboard.tsx", "utf8");
const dashboardRoute = await readFile("app/api/admin/dashboard/route.ts", "utf8");

test("settlement workflow persists independent review evidence", () => {
  assert.match(schema, /reviewedBy\s+String\?/);
  assert.match(schema, /reviewedAt\s+DateTime\?/);
  assert.match(schema, /REJECTED/);
  assert.match(migration, /VendorSettlement_review_state_check/);
  assert.match(migration, /Legacy settlement migrated before maker-checker controls/);
  assert.match(migration, /settlement\.approve/);
  assert.match(migration, /FINANCE_MANAGER/);
});

test("maker cannot approve and settlement cannot exceed funded vendor payable", () => {
  assert.match(service, /MAKER_CANNOT_APPROVE/);
  assert.match(service, /TransactionIsolationLevel\.Serializable/);
  assert.match(service, /SETTLEMENT_EXCEEDS_AVAILABLE/);
  assert.match(service, /Math\.min\(vendorNet, Number\(payment\.paidAmount\) - totalDeduction\)/);
  assert.match(service, /snapshot\.totalSettlementDeduction/);
  assert.match(service, /status: \{ in: \[VendorSettlementStatus\.PENDING, VendorSettlementStatus\.PROCESSING, VendorSettlementStatus\.SETTLED\] \}/);
});

test("settlement APIs separate maker checker and completion permissions", () => {
  assert.match(listRoute, /CRM_PERMISSIONS\.PAYMENT_MANAGE/);
  assert.match(reviewRoute, /CRM_PERMISSIONS\.SETTLEMENT_APPROVE/);
  assert.match(completeRoute, /CRM_PERMISSIONS\.PAYMENT_MANAGE/);
  assert.match(completeRoute, /outcome !== "SETTLED" && outcome !== "FAILED"/);
});

test("finance interface exposes request review and payout result controls", () => {
  assert.match(ui, /Create payout request/);
  assert.match(ui, /Independent checker decision/);
  assert.match(ui, /Record payout result/);
  assert.match(ui, /Another authorised checker must review it/);
  assert.match(ui, /Create a new request to retry/);
  assert.match(shell, /href="\/admin\/vendor-settlements">Settlements/);
  assert.match(dashboard, /Vendor settlements/);
  assert.match(dashboard, /settlement\.approve/);
  assert.match(dashboardRoute, /prisma\.vendorSettlement\.groupBy/);
  assert.match(dashboard, /Settlements awaiting checker/);
  assert.match(dashboard, /Approved payouts to process/);
  assert.match(dashboard, /Failed vendor payouts/);
});

test("vendor ledger surfaces failed payouts without reducing the outstanding balance", async () => {
  const ledger = await readFile("lib/vendor-financial-ledger.ts", "utf8");
  assert.match(ledger, /VendorSettlementStatus\.FAILED/);
  assert.match(ledger, /failedAmount/);
  assert.match(ledger, /totalSettlementDeduction/);
  assert.match(ui, /Vendor payout marked failed/);
});
