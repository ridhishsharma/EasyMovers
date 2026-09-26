import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("components/brand/app-brand-shell.tsx", "utf8");
const operations = readFileSync(
  "app/api/admin/vendors/[vendorId]/operations/route.ts",
  "utf8",
);

test("admin logout cannot be blocked by audit logging or client navigation", () => {
  assert.match(shell, /keepalive: true/);
  assert.doesNotMatch(shell, /await fetch\("\/api\/admin\/session-events"/);
  assert.match(shell, /signOut\(\{ scope: "local" \}\)/);
  assert.match(shell, /window\.location\.replace\("\/admin\/login"\)/);
  assert.doesNotMatch(shell, /useRouter/);
});

test("operational writes cannot bypass maker checker approval", () => {
  assert.match(operations, /MAKER_CHECKER_ACTIONS/);
  assert.match(operations, /MAKER_CHECKER_REQUIRED/);
  for (const action of [
    "ADD_VEHICLE", "UPDATE_VEHICLE", "DEACTIVATE_VEHICLE",
    "ADD_DOCUMENT", "DEACTIVATE_DOCUMENT",
    "ADD_BANK_ACCOUNT", "DEACTIVATE_BANK_ACCOUNT",
  ]) assert.match(operations, new RegExp(`"${action}"`));
  assert.match(operations, /CRM_PERMISSIONS\.VENDOR_VERIFY/);
});
