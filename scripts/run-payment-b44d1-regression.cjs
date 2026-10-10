#!/usr/bin/env node
"use strict";

/**
 * B4.4D.1: sequential, fail-fast payment-domain regression orchestration.
 * Delegates every database guard and test environment setup to the existing
 * scripts/run-payment-integration-tests.cjs runner.
 * Does not run migrations, seed databases, deploy, or modify source files.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "..");
const runner = path.join(root, "scripts", "run-payment-integration-tests.cjs");
if (!fs.existsSync(runner)) {
  console.error("[B4.4D.1] REFUSED: existing guarded payment integration runner not found.");
  process.exit(2);
}

const suites = [
  "smoke",
  "concurrency",
  "collection",
  "collectionConcurrency",
  "webhookSecurity",
  "webhookHttp",
  "webhookReceipt",
  "webhookReplay",
  "webhookFinancialConcurrency",
  "webhookRecovery",
  "webhookBookingRecovery",
  "webhookRetryLifecycle",
  "webhookHttpPostgres",
  "webhookHttpCollection",
  "webhookHttpConcurrency",
  "webhookFinalRecovery",
  "reconciliationAudit",
  "reconciliationRules",
  "webhookExceptions",
  "webhookExceptionRules",
  "webhookExceptionsPostgres",
  "bookingSyncRules",
  "bookingSyncRecoveryPostgres",
  "bookingSyncConcurrencyPostgres",
];

const started = Date.now();
const results = [];
console.log(`[B4.4D.1] Starting ${suites.length} suites, sequentially, using the existing guarded runner.`);
console.log("[B4.4D.1] Stop-on-failure enabled. Production deployment is NOT performed.");

for (let i = 0; i < suites.length; i++) {
  const suite = suites[i];
  const start = Date.now();
  console.log(`\n[B4.4D.1] (${i + 1}/${suites.length}) ${suite}`);
  const run = spawnSync(process.execPath, [runner, suite], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
  const exitCode = run.status === null ? 1 : run.status;
  results.push({ suite, exitCode, seconds: Math.round((Date.now() - start) / 1000) });
  if (run.error || exitCode !== 0) {
    console.error(`\n[B4.4D.1] FAILED: ${suite}; exit code ${exitCode}${run.error ? `; ${run.error.message}` : ""}`);
    console.error("[B4.4D.1] Remaining suites NOT run. Correct the failure, then rerun.");
    printSummary();
    process.exitCode = 1;
    break;
  }
}

if (results.length === suites.length && results.every(r => r.exitCode === 0)) {
  console.log("\n[B4.4D.1] ALL SUITES PASSED. Run npm run build separately.");
  printSummary();
}

function printSummary() {
  console.log("\n[B4.4D.1] Regression summary");
  for (const r of results) console.log(`  ${r.exitCode === 0 ? "PASS" : "FAIL"}  ${r.suite}  (${r.seconds}s)`);
  console.log(`Completed ${results.length}/${suites.length} suites in ${Math.round((Date.now() - started) / 1000)}s`);
}
