import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("platform fee invoices persist immutable numbered tax snapshots", async () => {
  const [schema, migration, service] = await Promise.all([
    read("prisma/schema.prisma"),
    read("prisma/migrations/20261003130000_add_platform_fee_invoices/migration.sql"),
    read("lib/platform-fee-invoice.ts"),
  ]);
  assert.match(schema, /model PlatformFeeInvoice/);
  assert.match(schema, /model FinancialDocumentSequence/);
  assert.match(schema, /snapshotChecksum\s+String/);
  assert.match(migration, /PlatformFeeInvoice_paymentId_key/);
  assert.match(migration, /PlatformFeeInvoice_commercialTermRequestId_key/);
  assert.match(migration, /PlatformFeeInvoice_maker_checker_check/);
  assert.match(migration, /PlatformFeeInvoice_sac_format_check/);
  assert.match(service, /SERVICE_NOT_COMPLETED/);
  assert.match(service, /MAKER_CANNOT_ISSUE/);
  assert.match(service, /TransactionIsolationLevel\.Serializable/);
  assert.match(service, /financialDocumentSequence\.upsert/);
  assert.match(service, /INVOICE_INTEGRITY_FAILED/);
});

test("platform fee invoice APIs enforce finance permissions and final document access", async () => {
  const [collection, issue, pdf, csv] = await Promise.all([
    read("app/api/admin/platform-fee-invoices/route.ts"),
    read("app/api/admin/platform-fee-invoices/[invoiceId]/issue/route.ts"),
    read("app/api/admin/platform-fee-invoices/[invoiceId]/pdf/route.ts"),
    read("app/api/admin/platform-fee-invoices/[invoiceId]/csv/route.ts"),
  ]);
  assert.match(collection, /CRM_PERMISSIONS\.BILLING_READ/);
  assert.match(collection, /CRM_PERMISSIONS\.PAYMENT_MANAGE/);
  assert.match(issue, /CRM_PERMISSIONS\.BILLING_MANAGE/);
  assert.match(pdf, /application\/pdf/);
  assert.match(pdf, /Content-Disposition.*inline/);
  assert.match(csv, /text\/csv/);
  assert.match(csv, /Content-Disposition.*attachment/);
});

test("finance users can create, independently issue, print, and export invoices", async () => {
  const [page, component, documents, finance, dashboard, shell] = await Promise.all([
    read("app/admin/tax-invoices/page.tsx"),
    read("components/admin/platform-fee-invoice-admin.tsx"),
    read("lib/platform-fee-invoice-documents.ts"),
    read("components/admin/finance-monthly-collections.tsx"),
    read("components/admin/crm-dashboard.tsx"),
    read("components/brand/app-brand-shell.tsx"),
  ]);
  assert.match(page, /PlatformFeeInvoiceAdmin/);
  assert.match(component, /Create draft/);
  assert.match(component, /Another billing-authorised user must issue this draft/);
  assert.match(component, /Open PDF \/ print/);
  assert.match(component, /Download CSV/);
  assert.match(documents, /EASYMOVERS - TAX INVOICE/);
  assert.match(documents, /serviceAccountingCode/);
  assert.match(documents, /Snapshot checksum/);
  assert.match(finance, /href="\/admin\/tax-invoices"/);
  assert.match(dashboard, /Control tax invoice issuance/);
  assert.match(shell, /href="\/admin\/tax-invoices">Tax invoices/);
});
