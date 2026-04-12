// ─── interceptor-demo.ts ────────────────────────────────────────────
// Demonstrates the global interceptor catching raw Node.js calls.
// Even though we never use agent.fs, ReceiptBot still blocks .env reads.
//
// NOTE: We use createRequire to get the CJS 'fs' module reference.
// This is the same reference that setupGlobalPatches() patches.
// If we used `import * as fs from 'node:fs'`, we would get an
// immutable ESM namespace object that doesn't reflect our patches.
// ─────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';
import {
  PolicyEngine,
  Receipt,
  runWithInterceptors,
  teardownGlobalPatches,
  PolicyViolationError,
} from '@receiptbot/core';
import { printReceipt } from '@receiptbot/ui';

// Get the mutable CJS fs module (same ref that the interceptor patches)
const require = createRequire(import.meta.url);
const fs = require('node:fs');

async function main() {
  console.log('\n🛡️  Interceptor Demo: raw Node.js calls governed by ReceiptBot\n');

  // 1. Set up policy — deny .env and .key files
  const policy = new PolicyEngine()
    .denyPathGlobs(['**/.env', '**/.env.*', '**/*.key', '**/*.pem'])
    .redactSecrets(true);

  const receipt = new Receipt(policy);

  // 2. Run agent code inside the interceptor scope
  await runWithInterceptors(policy, receipt, async () => {
    // ── Allowed: read package.json (safe file) ──
    try {
      console.log('  ✅ Attempting fs.readFileSync("package.json")...');
      fs.readFileSync('package.json', 'utf8');
      console.log('     → Allowed!\n');
    } catch (e: any) {
      if (e instanceof PolicyViolationError) {
        console.log(`     → BLOCKED: ${e.reason}\n`);
      } else {
        console.log(`     → File error (expected in demo): ${e.code}\n`);
      }
    }

    // ── Blocked: read .env ──
    try {
      console.log('  🚨 Attempting fs.readFileSync(".env")...');
      fs.readFileSync('.env', 'utf8');
      console.log('     → Allowed (unexpected!)');
    } catch (e: any) {
      if (e instanceof PolicyViolationError) {
        console.log(`     → BLOCKED: ${e.reason}\n`);
      } else {
        console.log(`     → Unexpected error: ${e.message}`);
      }
    }

    // ── Blocked: read a private key ──
    try {
      console.log('  🚨 Attempting fs.readFileSync("server.key")...');
      fs.readFileSync('server.key', 'utf8');
      console.log('     → Allowed (unexpected!)');
    } catch (e: any) {
      if (e instanceof PolicyViolationError) {
        console.log(`     → BLOCKED: ${e.reason}\n`);
      } else {
        console.log(`     → Unexpected error: ${e.message}`);
      }
    }

    // ── Allowed: write a safe file ──
    try {
      console.log('  ✅ Attempting fs.writeFileSync("output.txt", ...)...');
      fs.writeFileSync('output.txt', 'Hello from the interceptor demo!');
      console.log('     → Allowed!\n');
    } catch (e: any) {
      if (e instanceof PolicyViolationError) {
        console.log(`     → BLOCKED: ${e.reason}\n`);
      } else {
        console.log(`     → Unexpected error: ${e.message}`);
      }
    }

    // Clean up demo file
    try { fs.unlinkSync('output.txt'); } catch {}
  });

  // 3. Restore originals (important for cleanup)
  teardownGlobalPatches();

  // 4. Finalize and output
  receipt.finalize();
  printReceipt(receipt);

  // Save for the viewer (using the original fs since patches are torn down)
  const jsonPath = 'apps/viewer/public/samples/latest.json';
  fs.writeFileSync(jsonPath, JSON.stringify(receipt.toJSON(), null, 2));
  console.log(`\n🚀 Open http://localhost:3939/demo/latest to view in UI`);
  console.log(`📄 JSON saved to ${jsonPath}\n`);
}

main().catch(console.error);
