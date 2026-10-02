import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile("prisma/schema.prisma", "utf8");
const migration = await readFile("prisma/migrations/20261002100000_add_vendor_settlement_ledger/migration.sql", "utf8");
const ledger = await readFile("lib/vendor-financial-ledger.ts", "utf8");
const portal = await readFile("lib/vendor-portal.ts", "utf8");
const dashboard = await readFile("components/vendor/vendor-portal-dashboard.tsx", "utf8");

test("vendor settlements are separate durable financial records", () => {
  assert.match(schema, /model VendorSettlement/);
  assert.match(schema, /enum VendorSettlementStatus/);
  assert.match(schema, /settlementReference\s+String\?\s+@unique/);
  assert.match(migration, /VendorSettlement_amount_positive_check/);
  assert.match(migration, /VendorSettlement_settled_timestamp_check/);
  assert.match(migration, /FOREIGN KEY \("vendorId"\)/);
  assert.match(migration, /FOREIGN KEY \("paymentId"\)/);
});

test("vendor financial ledger separates customer and vendor balances", () => {
  assert.match(ledger, /customerReceived/);
  assert.match(ledger, /customerOutstanding/);
  assert.match(ledger, /commissionAmount/);
  assert.match(ledger, /vendorNetPayable/);
  assert.match(ledger, /settledAmount/);
  assert.match(ledger, /vendorOutstanding/);
  assert.match(ledger, /PENDING_CONFIGURATION/);
  assert.match(ledger, /platformCommissionAmount/);
  assert.match(ledger, /vendorQuotedAmount/);
});

test("ledger remains vendor scoped and hides customer identity", () => {
  assert.match(ledger, /\{ quotation: \{ vendorId \} \}/);
  assert.match(ledger, /entry\.status === VendorSettlementStatus\.SETTLED/);
  assert.doesNotMatch(ledger, /customerName: true/);
  assert.doesNotMatch(ledger, /customerMobile: true/);
  assert.doesNotMatch(ledger, /customerEmail: true/);
  assert.match(portal, /getVendorFinancialLedger\(vendorId\)/);
});

test("vendor dashboard explains collection commission and settlement", () => {
  assert.match(dashboard, /Collections and vendor settlement/);
  assert.match(dashboard, /Customer received/);
  assert.match(dashboard, /EasyMovers commission/);
  assert.match(dashboard, /Vendor net payable/);
  assert.match(dashboard, /Settlement remaining/);
  assert.match(dashboard, /commission snapshot/);
  assert.match(dashboard, /COMMISSION_PENDING/);
});
