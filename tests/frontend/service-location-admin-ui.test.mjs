import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/service-locations/page.tsx", "utf8");
const ui = readFileSync("components/admin/service-locations-admin.tsx", "utf8");
const styles = readFileSync("components/admin/service-locations-admin.module.css", "utf8");
const shell = readFileSync("components/brand/app-brand-shell.tsx", "utf8");
const listApi = readFileSync("app/api/admin/service-locations/route.ts", "utf8");
const detailApi = readFileSync("app/api/admin/service-locations/[locationId]/route.ts", "utf8");

test("service location page uses central office authentication", () => {
  assert.match(page, /SUPABASE_URL/);
  assert.match(page, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(ui, /Authorization: `Bearer \$\{await token\(client\)\}`/);
  assert.match(ui, /returnTo=\/admin\/service-locations/);
  assert.match(shell, /href="\/admin\/service-locations">Service locations/);
});

test("service location APIs expose permission-aware capabilities", () => {
  for (const source of [listApi, detailApi]) {
    assert.match(source, /SERVICE_LOCATION_MANAGE/);
    assert.match(source, /SERVICE_LOCATION_ACTIVATE/);
    assert.match(source, /canManage: manageAccess\.authorized/);
    assert.match(source, /canActivate: activateAccess\.authorized/);
  }
  assert.match(ui, /capabilities\.canManage/);
  assert.match(ui, /capabilities\.canActivate/);
});

test("location workspace covers creation service readiness and lifecycle actions", () => {
  assert.match(ui, /Add location/);
  assert.match(ui, /Service matrix/);
  assert.match(ui, /Capacity blockers/);
  assert.match(ui, /MARK_READY/);
  assert.match(ui, /ACTIVATE/);
  assert.match(ui, /SUSPEND/);
  assert.match(ui, /Within-city is a geographic scope/);
  assert.match(ui, /Activate .* and publish every ready service/);
});

test("service form supports every move service and fulfilment mode", () => {
  for (const service of ["HOUSEHOLD_RELOCATION", "OFFICE_RELOCATION", "VEHICLE_TRANSPORT", "COMMERCIAL_GOODS", "PACKING_ONLY", "INSTALLATION_UNINSTALLATION"]) assert.match(ui, new RegExp(service));
  for (const mode of ["INSTANT_RATE", "QUOTATION", "SURVEY_AND_QUOTATION"]) assert.match(ui, new RegExp(mode));
  assert.match(ui, /Minimum vendors/);
  assert.match(ui, /Survey required/);
  assert.match(ui, /Instant pricing available/);
  assert.match(ui, /Add all remaining services/);
  assert.match(ui, /standard within-city services are already configured/);
});

test("location workspace is compact responsive and status-coloured", () => {
  assert.match(styles, /align-items:start/);
  assert.match(styles, /max-height:calc\(100vh - 230px\)/);
  assert.match(styles, /grid-auto-rows:max-content/);
  assert.match(styles, /height:52px;min-height:52px/);
  assert.doesNotMatch(styles, /\.detailScroll\{height:100%;/);
  assert.match(styles, /\.DRAFT\{/);
  assert.match(styles, /\.READY\{/);
  assert.match(styles, /\.ACTIVE\{/);
  assert.match(styles, /\.SUSPENDED\{/);
  assert.match(styles, /@media\(max-width:800px\)/);
  assert.match(styles, /@media\(max-width:560px\)/);
});
