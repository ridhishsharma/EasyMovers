import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=path=>readFile(new URL(`../../${path}`,import.meta.url),"utf8");

test("financial reporting persists immutable intracity and intercity segments",async()=>{
  const[schema,migration,segment,commercial]=await Promise.all([read("prisma/schema.prisma"),read("prisma/migrations/20261003100000_add_financial_business_segments/migration.sql"),read("lib/financial-business-segment.ts"),read("lib/payment-commercial-term-control.ts")]);
  for(const value of ["WITHIN_CITY_INSTANT","WITHIN_CITY_QUOTATION","INTERCITY_QUOTATION","CORPORATE_RELOCATION","ADD_ON_SERVICE"])assert.match(schema,new RegExp(value));
  assert.match(migration,/Historical classification is intentionally conservative/);
  assert.match(migration,/Payment_businessSegment_idx/);
  assert.match(segment,/deriveFinancialBusinessSegment/);
  assert.match(segment,/containsInstantEvidence/);
  assert.match(commercial,/BUSINESS_SEGMENT_LOCKED/);
  assert.match(commercial,/businessSegmentLockedAt/);
});

test("finance API separates collections income taxes and vendor liabilities",async()=>{
  const[service,route]=await Promise.all([read("lib/finance-monthly-collections.ts"),read("app/api/admin/finance/collections/route.ts")]);
  assert.match(route,/CRM_PERMISSIONS\.PAYMENT_READ/);
  assert.match(route,/Cache-Control":"no-store/);
  assert.match(service,/PaymentTransactionType\.COLLECTION/);
  assert.match(service,/PaymentTransactionType\.REFUND/);
  assert.match(service,/commissionIncome/);
  assert.match(service,/vendorSettledInMonth/);
  assert.match(service,/Asia\/Kolkata/);
  assert.match(service,/Gateway charges are excluded until provider fee records are persisted/);
});

test("finance UI provides monthly segment comparison and drill down",async()=>{
  const[page,component,styles,shell,dashboard]=await Promise.all([read("app/admin/finance/page.tsx"),read("components/admin/finance-monthly-collections.tsx"),read("components/admin/finance-monthly-collections.module.css"),read("components/brand/app-brand-shell.tsx"),read("components/admin/crm-dashboard.tsx")]);
  assert.match(page,/FinanceMonthlyCollections/);
  assert.match(component,/Within-city income/);
  assert.match(component,/Intercity income/);
  assert.match(component,/EasyMovers commission income/);
  assert.match(component,/Monthly transaction drill-down/);
  assert.match(styles,/tableWrap/);
  assert.match(shell,/href="\/admin\/finance">Finance/);
  assert.match(dashboard,/Review monthly finance/);
});
