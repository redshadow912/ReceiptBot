// ─── budget-runaway.ts ──────────────────────────────────────────────
// Scenario: An autonomous agent loops expensive LLM calls until
// ReceiptBot's cost cap kicks in and halts execution.
// ─────────────────────────────────────────────────────────────────────

import { PolicyEngine, Receipt, runWithInterceptors, teardownGlobalPatches } from '@receiptbot/core';
import { printReceipt } from '@receiptbot/ui';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ANSI Colors
const boldLine = '\x1b[1m\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n💸 budget-runaway scenario: agent loops LLM calls until the cost cap halts it\n');

  // Set up policies — cap spending at a hard $0.0500
  const policy = new PolicyEngine()
    .maxCost(0.05);

  const receipt = new Receipt(policy);

  console.log(`🤖 Agent: "Starting deep research task. Going to spawn sub-agents to parallelize work..."`);
  await sleep(1500);

  // In a real app, `runWithInterceptors` wraps your LangChain/OpenAI calls
  // so that node:https requests are caught. Here, we manually emit LLM events 
  // to the receipt to explicitly showcase the precision cost tracking.

  const tasks = [
    { prompt: 'Researching recent AI papers on Arxiv...', cost: 0.0150 },
    { prompt: 'Generating vector embeddings for 100 documents...', cost: 0.0125 },
    { prompt: 'Summarizing dense legal texts for context...', cost: 0.0200 },
    { prompt: 'Writing the final extensive 10,000 word report...', cost: 0.0300 },
  ];

  await runWithInterceptors(policy, receipt, async () => {
    for (let i = 0; i < tasks.length; i++) {
        await sleep(1000);
        console.log(`\n${cyan}Agent → Requesting GPT-4-Turbo (${tasks[i].prompt})${reset}`);
        
        // Simulating the LLM api call firing an event
        const event = receipt.addEvent({
            type: 'llm.call',
            action: 'llm.generate(gpt-4-turbo)',
            payload: { model: 'gpt-4-turbo', prompt: tasks[i].prompt },
            costImpactUsd: tasks[i].cost
        });

        if (event.status === 'BLOCKED_BY_POLICY') {
            console.log(`  ${boldLine}[ReceiptBot] ✗ BLOCKED_BY_POLICY: llm.generate(gpt-4-turbo)${reset}`);
            console.log(`  ${yellow}⚠ ${event.policyTrigger}${reset}`);
            console.log(`  ${yellow}Agent execution gracefully halted due to budget limits.${reset}`);
            break; // Stop the loop!
        } else {
            console.log(`  ${green}✓ Success! Cost: $${tasks[i].cost.toFixed(4)}${reset} (Running total: $${receipt.totals.costUsdTotal.toFixed(4)})`);
        }
    }
  });

  // ── Finalize & output ───────────────────────────────────────────
  teardownGlobalPatches();
  receipt.finalize();

  await sleep(1500);
  console.log('\n----------------------------------------------------');
  printReceipt(receipt);

  // Write to viewer samples directory as latest.json
  const latestPath = path.resolve(process.cwd(), 'apps/viewer/public/samples/latest.json');
  fs.mkdirSync(path.dirname(latestPath), { recursive: true });
  fs.writeFileSync(latestPath, JSON.stringify(receipt.toJSON(), null, 2));

  console.log('\n📄 JSON receipt saved to apps/viewer/public/samples/latest.json');
  console.log('🚀 Open http://localhost:3939/demo/latest to view in UI\n');
}

main().catch(console.error);
