// ─── wallet-drainer.ts ──────────────────────────────────────────────
// Scenario: An agent loops LLM calls at $0.10 each until it blows
//           past the $0.50 cost cap → blocked by cost policy.
// ─────────────────────────────────────────────────────────────────────

import { PolicyEngine } from '@receiptbot/core';
import { withReceipts } from '@receiptbot/adapter-generic';
import { printReceipt, generateHtml } from '@receiptbot/ui';

async function main() {
  console.log('\n💸 wallet-drainer scenario: agent loops LLM calls until cost cap hit\n');

  // Set up policies — cap spending at $0.50
  const policy = new PolicyEngine()
    .maxCost(0.50);

  // Create governed agent
  const agent = withReceipts(policy);

  // ── Agent actions ────────────────────────────────────────────────

  const prompts = [
    'Summarize all customer complaints',
    'Generate marketing copy for Q3',
    'Translate the annual report to Spanish',
    'Create a sentiment analysis of reviews',
    'Draft investor presentation slides',
    'Analyze competitor pricing strategy',
    'Write a blog post about AI governance',
    'Rewrite the terms of service',
    'Generate test data for load testing',
    'Summarize all Slack messages from last week',
  ];

  for (let i = 0; i < prompts.length; i++) {
    const result = await agent.llm.generate('gpt-4-turbo', prompts[i], 0.10);

    if (result.blocked) {
      console.log(`  🛑 Call ${i + 1} blocked: ${result.reason}`);
      break;
    } else {
      console.log(`  ✅ Call ${i + 1} succeeded — running total: $${agent.receipt.totals.costUsdTotal.toFixed(2)}`);
    }
  }

  // ── Finalize & output ───────────────────────────────────────────

  agent.receipt.finalize();
  printReceipt(agent.receipt);
  generateHtml(agent.receipt, 'receipt-wallet-drainer.html');
  console.log('📄 HTML receipt saved to receipt-wallet-drainer.html\n');
}

main().catch(console.error);
