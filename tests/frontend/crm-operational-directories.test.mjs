import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const vendorsApi = readFileSync(new URL("../../app/api/admin/vendors/route.ts", import.meta.url), "utf8");
const leadsApi = readFileSync(new URL("../../app/api/admin/leads/route.ts", import.meta.url), "utf8");
const directory = readFileSync(new URL("../../components/admin/crm-directory.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../components/admin/crm-dashboard.tsx", import.meta.url), "utf8");

test("vendor directory requires permission and bounded selected fields", () => {
  assert.match(vendorsApi, /CRM_PERMISSIONS\.VENDOR_READ/);
  assert.match(vendorsApi, /pageSize > 100/);
  assert.match(vendorsApi, /select: \{/);
  assert.doesNotMatch(vendorsApi, /findMany\(\{[\s\S]*?include:/);
});

test("lead pipeline requires permission and supports open and today filters", () => {
  assert.match(leadsApi, /CRM_PERMISSIONS\.LEAD_READ/);
  assert.match(leadsApi, /requestedStatus === "OPEN"/);
  assert.match(leadsApi, /period === "today"/);
  assert.match(leadsApi, /pageSize > 100/);
});

test("dashboard cards drill into filtered operational directories", () => {
  assert.match(dashboard, /href="\/admin\/vendors\?status=PENDING"/);
  assert.match(dashboard, /href="\/admin\/leads\?status=OPEN"/);
  assert.match(dashboard, /href="\/admin\/leads\?period=today"/);
  assert.match(dashboard, /className=\{styles\.cardLink\}/);
  assert.match(directory, /window\.history\.replaceState/);
});
