#!/usr/bin/env node
'use strict';
// B4.4D.3: execute existing security and recovery suites through the guarded runner.
// No migrations, database writes or production deployment are performed by this script.
// Individual integration suites may create and clean up isolated test fixtures.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const runner = path.join(root, 'scripts', 'run-payment-integration-tests.cjs');
const suites = [
  'webhookSecurity',
  'webhookHttp',
  'webhookReceipt',
  'webhookReplay',
  'webhookFinancialConcurrency',
  'webhookRecovery',
  'webhookBookingRecovery',
  'webhookRetryLifecycle',
  'webhookHttpPostgres',
  'webhookHttpCollection',
  'webhookHttpConcurrency',
  'webhookFinalRecovery',
  'webhookExceptionsPostgres',
  'bookingSyncRecoveryPostgres',
  'bookingSyncConcurrencyPostgres',
];

if (!fs.existsSync(runner)) {
  console.error('[B4.4D.3] Missing existing guarded integration runner:', runner);
  process.exit(2);
}
console.log('[B4.4D.3] Security and recovery certification');
console.log('[B4.4D.3] Only the existing guarded runner will launch integration tests.');
console.log('[B4.4D.3] Target suites:', suites.length);
let passed = 0;
for (const suite of suites) {
  console.log(`\n[B4.4D.3] START ${suite} (${passed + 1}/${suites.length})`);
  const result = spawnSync(process.execPath, [runner, suite], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    windowsHide: false,
  });
  if (result.error || result.status !== 0) {
    console.error(`[B4.4D.3] FAILED ${suite}. Passed ${passed}/${suites.length}.`);
    if (result.error) console.error(result.error.message);
    process.exit(result.status && result.status > 0 ? result.status : 1);
  }
  passed += 1;
  console.log(`[B4.4D.3] PASS ${suite}`);
}
console.log(`\n[B4.4D.3] ALL ${passed}/${suites.length} SECURITY/RECOVERY SUITES PASSED.`);
console.log('[B4.4D.3] Manual security and production configuration review remains required.');
