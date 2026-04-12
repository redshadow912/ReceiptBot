<div align="center">

# 🧾 ReceiptBot

### A Flight Recorder and Seatbelt for Node.js AI Agents.

*Monkey-patching isn't a hard OS sandbox—but ReceiptBot is your in-process flight recorder. It intercepts rogue fs reads, caps LLM spend, and redacts secrets before they leak.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue)](https://www.typescriptlang.org/)

[**View on GitHub**](https://github.com/redshadow912/ReceiptBot) · [**Quickstart**](#quickstart) · [**Architecture**](#the-architecture-v2)

---

<!-- Animated demo GIF placeholder -->
![ReceiptBot Demo](assets/demo.gif)

</div>

---

## Why this exists

Prompt injection isn't just an output format issue—it's a **supply chain attack**.

AI agents operate autonomously. They execute code, read files, call APIs, spawn processes, and spend your money. If an agent loops infinitely or is hijacked by a malicious prompt, it can easily exfiltrate secrets (`.env`, SSH keys) using standard libraries like `axios` or native `fs` commands.

Agents don't need a wrapper around specific LLM tools—they need a global, in-process audit trail. You wouldn't fly a commercial plane without a black box. ReceiptBot provides the same for your agents: an immutable JSON receipt that proves exactly what happened, step by step, alongside granular policy enforcement.

---

## The Architecture (V2)

ReceiptBot operates as a transparent overlay in your Node.js application.

### 1. Global Monkey-Patching for Syscall Interception
We didn't just wrap `agent.fs.readFile()`. We use Node's `createRequire()` to inject mutable CJS patches into raw Node module internals (`node:fs`, `node:child_process`, `node:net`, `node:tls`, `node:http`, and `globalThis.fetch`).
If hijacked code uses `axios`, `got`, or raw `node:https` to steal an API key, we catch it.

### 2. AsyncLocalStorage for Multi-Tenant Safety
Global monkey-patching usually fails in concurrent web servers. We solved this with Node's `AsyncLocalStorage`. When `runWithInterceptors` is called, the specific `Receipt` and `PolicyEngine` instances are scoped tightly to that async execution context. Agent A and Agent B can run concurrently in the same Node instance without contaminating each other's audit trails or sharing policies.

### 3. Enterprise Secret Redaction
Before any JSON is serialized or payload emitted, ReceiptBot recursively scans action payloads against a dictionary of 15 named enterprise secrets (Stripe, Anthropic, Github PATs, PEM keys, etc.), replacing leaks with forensic labels (e.g., `[REDACTED_ANTHROPIC_API_KEY]`).

---

## Quickstart

```bash
# Install the core governing library
pnpm install @receiptbot/core
```

Wrap `runWithInterceptors` around your agent execution function to start governing it immediately.

```typescript
import { PolicyEngine, Receipt, runWithInterceptors } from '@receiptbot/core';

// 1. Define your seatbelt rules
const policy = new PolicyEngine()
  .allowDomains(['api.openai.com', 'huggingface.co'])
  .denyPathGlobs(['**/.env', '**/*.pem', '**/*.key'])
  .maxCostUsd(5.00)
  .redactSecrets(true);

const receipt = new Receipt(policy);

// 2. Wrap your autonomous agent
await runWithInterceptors(policy, receipt, async () => {
  // EVERYTHING in this async context is now governed.
  // Standard third-party modules like Axios or native node:fs will trigger policies.

  await myAutonomousAgent.start();
});

// 3. Finalize and inspect
receipt.finalize();
console.log(receipt.toJSON());
```

---

## Features

- 🛡️ **Policy Enforcement** — Deny path globs, enforce specific domain allow-lists, intercept process spawning
- 💰 **LLM Cost Caps** — Prevent run-away token loops from draining your wallet; fails fast when caps are hit
- 🔍 **Full Audit Trail** — Every filesystem read, network request, and LLM call is receipted as cryptographically pure structured JSON
- 🔒 **In-Memory Secret Redaction** — Industry-standard scraping removes AWS keys, OAuth tokens, and Supabase JWTs before logs exist
- 🌐 **Visual Viewer** — Drag-and-drop `receipt.json` into a blazing fast local Next.js GUI

---

## Contributing

```bash
pnpm install
pnpm run build

# Run the interceptor demo
pnpm run example:interceptor

# Start the local UI viewer on port 3939
pnpm run dev
```

Repository: [https://github.com/redshadow912/ReceiptBot](https://github.com/redshadow912/ReceiptBot)

---

## License

MIT © [redshadow912](https://github.com/redshadow912)
