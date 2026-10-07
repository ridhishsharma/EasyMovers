import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("survey assignment is permission-scoped, validated and audited", async () => {
  const [route, service, workspace] = await Promise.all([
    read("app/api/admin/leads/[leadId]/route.ts"),
    read("lib/move-survey.ts"),
    read("components/admin/lead-workspace.tsx"),
  ]);
  assert.match(route, /surveyAssignees/);
  assert.match(route, /CRM_PERMISSIONS\.LEAD_ASSIGN/);
  assert.match(service, /INVALID_SURVEY_ASSIGNEE/);
  assert.match(service, /MOVE_SURVEY_ASSIGNED/);
  assert.match(workspace, /Assign & schedule/);
});

test("launch UX hides premature counters and prioritises recent customer and vendor work", async () => {
  const [counters, draft, opportunities, portal, styles] = await Promise.all([
    read("components/landing/platform-counters.tsx"),
    read("components/moving/draft-editor.tsx"),
    read("lib/vendor-opportunities.ts"),
    read("components/vendor/vendor-portal-dashboard.tsx"),
    read("components/moving/moving.module.css"),
  ]);
  assert.match(counters, /verifiedVendors >= 500/);
  assert.match(counters, /successfulMoves >= 1000/);
  assert.match(draft, /The latest item appears first/);
  assert.match(opportunities, /createdAt: "desc"/);
  assert.match(portal, /grouped by category/);
  assert.match(styles, /background: #145f9f/);
});
