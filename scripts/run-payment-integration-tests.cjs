/**
 * Local-only payment integration test launcher.
 * The guard runs before any application or Prisma code is imported.
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const envFile = path.join(root, ".env.payment-test");

function fail(message) {
  console.error(`[payment-integration] REFUSED: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(envFile)) {
  fail(".env.payment-test does not exist.");
}

function readTestDatabaseUrl(contents) {
  const matches = [];
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^TEST_DATABASE_URL\s*=\s*(.*)$/.exec(trimmed);
    if (!match) continue;
    let value = match[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    matches.push(value);
  }
  if (matches.length !== 1 || !matches[0]) {
    fail("Expected exactly one nonempty TEST_DATABASE_URL in .env.payment-test.");
  }
  return matches[0];
}

const raw = readTestDatabaseUrl(fs.readFileSync(envFile, "utf8"));
let url;
try {
  url = new URL(raw);
} catch {
  fail("TEST_DATABASE_URL is not a valid URL.");
}

if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
  fail("Only PostgreSQL connections are allowed.");
}
if (url.hostname !== "127.0.0.1" || url.port !== "5432") {
  fail("Database must be at 127.0.0.1:5432.");
}
if (url.pathname !== "/easymovers_payment_test") {
  fail("Database must be easymovers_payment_test.");
}
if (decodeURIComponent(url.username) !== "easymovers_test_user") {
  fail("Database user must be easymovers_test_user.");
}
if (!url.password) {
  fail("Database password is missing.");
}
if (url.searchParams.get("schema") !== "public") {
  fail("Connection must specify schema=public.");
}
for (const key of url.searchParams.keys()) {
  if (key !== "schema") {
    fail(`Unexpected connection parameter: ${key}`);
  }
}
if (url.hash) {
  fail("Connection URL must not contain a fragment.");
}

// This script deliberately refuses arbitrary test paths. Add approved suites
// here only after they have been reviewed for local-test isolation.
const suites = {
  smoke: [
    "tests/payment-integration/runner-smoke.test.ts",
  ],
  concurrency: [
    "tests/payment-integration/postgres-serializable.test.ts",
  ],
  collection: [
    "tests/payment-integration/payment-collection-postgres.test.ts",
  ],
  collectionConcurrency: [
    "tests/payment-integration/payment-concurrent-collections-postgres.test.ts",
  ],
webhookSecurity: [
  "tests/payment-integration/razorpay-webhook-security.test.ts",
],
webhookHttp: [
  "tests/payment-integration/razorpay-webhook-http.test.ts",
],
webhookReceipt: [
  "tests/payment-integration/razorpay-webhook-receipt-postgres.test.ts",
],
webhookReplay: [
  "tests/payment-integration/razorpay-webhook-replay-handler.test.ts",
],
webhookFinancialConcurrency: [
  "tests/payment-integration/razorpay-webhook-financial-concurrency-postgres.test.ts",
],
webhookRecovery: [
  "tests/payment-integration/razorpay-webhook-recovery-postgres.test.ts",
],
webhookBookingRecovery: [
  "tests/payment-integration/razorpay-webhook-booking-sync-recovery.test.ts",
],
webhookRetryLifecycle: [
  "tests/payment-integration/razorpay-webhook-retry-lifecycle.test.ts",
],
};
const suite = process.argv[2] || "smoke";
if (process.argv.length > 3 || !Object.hasOwn(suites, suite)) {
  fail(`Unknown suite. Allowed: ${Object.keys(suites).join(", ")}`);
}

const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
if (!fs.existsSync(tsx)) {
  fail("tsx is missing. Run npm install first.");
}

console.log(`[payment-integration] SAFE LOCAL DB: ${url.hostname}:${url.port}${url.pathname}`);
console.log(`[payment-integration] Running approved suite: ${suite}`);

const result = spawnSync(
  process.execPath,
  [tsx, "--test", ...suites[suite]],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: raw,
      TEST_DATABASE_URL: raw,
      PAYMENT_INTEGRATION_TEST: "1",
    },
    stdio: "inherit",
    windowsHide: true,
  }
);
if (result.error) fail(`Could not launch tests: ${result.error.message}`);
process.exit(result.status === null ? 1 : result.status);
