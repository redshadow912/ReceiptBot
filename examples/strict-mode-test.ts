// ─── strict-mode-test.ts ────────────────────────────────────────────
// Verification script for ReceiptBot opt-in strict mode.
// Tests 3 scenarios: fail-open (default), fail-closed (strict), and
// strict mode with a valid ALS context (inside runWithInterceptors).
// ─────────────────────────────────────────────────────────────────────

import { fileURLToPath } from 'node:url';
import {
  setupGlobalPatches,
  teardownGlobalPatches,
  runWithInterceptors,
  PolicyEngine,
  Receipt,
  PolicyViolationError,
} from '@receiptbot/core';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fs = require('node:fs');

// examples/ is one level deep from repo root, so ../package.json is correct
const knownFile = fileURLToPath(new URL('../package.json', import.meta.url));

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`✅ ${label}`);
  passed++;
}

function fail(label: string, detail?: unknown) {
  console.error(`❌ ${label}`, detail ?? '');
  failed++;
}

// ── Test 1: Default fail-open — outside context, must NOT throw ──────
setupGlobalPatches({ requireContext: false });
try {
  fs.readFileSync(knownFile, 'utf8');
  pass('Test 1: fail-open allows outside-context fs.readFileSync');
} catch (e) {
  fail('Test 1: fail-open should not throw outside context', e);
}
teardownGlobalPatches();

// ── Test 2: Strict mode — outside context, MUST throw PolicyViolationError
setupGlobalPatches({ requireContext: true });
try {
  fs.readFileSync(knownFile, 'utf8');
  fail('Test 2: strict mode should have thrown on outside-context read');
} catch (e) {
  if (e instanceof PolicyViolationError) {
    pass('Test 2: strict mode blocked outside-context fs.readFileSync');
  } else {
    fail('Test 2: wrong error type thrown in strict mode', e);
  }
}
teardownGlobalPatches();

// ── Test 3: Strict mode ON, inside runWithInterceptors — MUST succeed ─
setupGlobalPatches({ requireContext: true });
const policy = new PolicyEngine(); // no deny rules — allow everything
const receipt = new Receipt(policy);
await runWithInterceptors(policy, receipt, async () => {
  try {
    fs.readFileSync(knownFile, 'utf8');
    pass('Test 3: strict mode allows fs.readFileSync inside ALS context');
  } catch (e) {
    fail('Test 3: strict mode should not block inside ALS context', e);
  }
});
teardownGlobalPatches();

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests run — ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
