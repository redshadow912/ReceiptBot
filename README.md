<div align="center">

# 🧾 ReceiptBot

### A Flight Recorder and Seatbelt for Node.js AI Agents.

*Monkey-patching isn't a hard OS sandbox — but ReceiptBot is your in-process flight recorder. It intercepts rogue `fs` reads, caps LLM spend, and redacts secrets before they leak.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue)](https://www.typescriptlang.org/)

[**View on GitHub**](https://github.com/redshadow912/ReceiptBot) · [**Quickstart**](#quickstart) · [**Architecture**](#the-architecture-v2) · [**Full API Reference**](#api-reference)

---

![ReceiptBot Demo](assets/demo.webp)

</div>

---

## What is ReceiptBot?

ReceiptBot is a **runtime governance library** for Node.js that wraps your AI agent's async execution context with:

1. **A Policy Engine** — rules you define that block dangerous operations before they happen
2. **A Flight Recorder** — an immutable, structured audit trail (a "receipt") of every action taken
3. **A Global Interceptor** — monkey-patches raw Node.js core modules so even rogue third-party library calls are caught

It does **not** require a VM, Docker container, or OS-level sandbox. It operates transparently inside your existing Node.js process using `AsyncLocalStorage` for multi-tenant safety and `createRequire()` for CJS-level monkey-patching.

---

## Why this exists

**Prompt injection is a supply chain attack.**

AI agents operate autonomously — they read files, call APIs, spawn processes, and spend money. A hijacked agent or runaway LLM loop can silently:

- Exfiltrate secrets (`.env`, SSH keys, API tokens)
- Call untrusted domains to exfiltrate data
- Burn through your LLM budget in seconds
- Spawn child processes to escalate privileges

Standard agent SDKs don't help here. They wrap specific tool calls, not raw Node.js syscalls. An agent using `node:fs` directly, or a library routing around your wrapper, is completely ungoverned.

ReceiptBot patches the interpreter-level module system so **there is no escape hatch**.

---

## The Architecture (V2)

### 1. Global Monkey-Patching via `createRequire()`

We use `createRequire(import.meta.url)` to get mutable CJS references to core Node.js modules and replace their functions at the module-object level. This is the same technique used by Datadog dd-trace, New Relic APM, and OpenTelemetry.

The following module methods are patched:

| Module | Methods Patched |
|--------|----------------|
| `node:fs` | `readFileSync`, `writeFileSync`, `unlinkSync`, `readFile` (callback), `writeFile` (callback), `unlink` (callback), `createReadStream`, `createWriteStream` |
| `node:fs/promises` | `readFile`, `writeFile`, `unlink` |
| `node:http` | `request`, `get` |
| `node:https` | `request`, `get` |
| `globalThis` | `fetch` |
| `node:child_process` | `exec`, `execSync`, `spawn`, `spawnSync`, `execFile`, `execFileSync` |
| `node:net` | `connect`, `createConnection` |
| `node:tls` | `connect` |

### 2. `AsyncLocalStorage` for Multi-Tenant Safety

Each `runWithInterceptors(policy, receipt, fn)` call binds a `{ policy, receipt }` context to the async execution tree using Node's `AsyncLocalStorage`. This means two agents running concurrently in the same Node process cannot contaminate each other's audit trails or share policies.

### 3. Enterprise Secret Redaction

Before any event payload is serialized or emitted, ReceiptBot recursively scans strings against a registry of named patterns, replacing matches with forensic labels:

| Pattern Name | Example Match |
|---|---|
| `AWS_ACCESS_KEY` | `AKIAIOSFODNN7EXAMPLE` → `[REDACTED_AWS_ACCESS_KEY]` |
| `OPENAI_API_KEY` | `sk-proj-abc123...` → `[REDACTED_OPENAI_API_KEY]` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` → `[REDACTED_ANTHROPIC_API_KEY]` |
| `STRIPE_KEY` | `sk_live_...` → `[REDACTED_STRIPE_KEY]` |
| `GITHUB_TOKEN` | `ghp_...` → `[REDACTED_GITHUB_TOKEN]` |
| `SLACK_TOKEN` | `xoxb-...` → `[REDACTED_SLACK_TOKEN]` |
| `GCP_API_KEY` | `AIza...` → `[REDACTED_GCP_API_KEY]` |
| `SUPABASE_KEY` | `eyJhbGci...` → `[REDACTED_SUPABASE_KEY]` |
| `PRIVATE_KEY_PEM` | `-----BEGIN RSA...` → `[REDACTED_PRIVATE_KEY_PEM]` |
| `BEARER_TOKEN` | `Bearer eyJ...` → `[REDACTED_BEARER_TOKEN]` |

---

## Quickstart

### Install

```bash
# Clone the repo
git clone https://github.com/redshadow912/ReceiptBot.git
cd ReceiptBot

# Install all workspace dependencies
pnpm install
```

### Run the demos

```bash
# Demo 1: Prompt injection → agent tries to read .env and connect to evil domain
pnpm run demo:rogue

# Demo 2: Agent loops LLM calls until budget limit is hit
pnpm run example:wallet

# Start the visual audit UI on http://localhost:3939
pnpm run dev
```

---

## Using ReceiptBot in Your Project

### Step 1: Import the core primitives

```typescript
import { PolicyEngine, Receipt, runWithInterceptors, teardownGlobalPatches } from '@receiptbot/core';
```

### Step 2: Define your Policy

```typescript
const policy = new PolicyEngine()
  // Only allow outbound HTTP to these specific domains
  .allowDomains(['api.openai.com', 'api.anthropic.com'])

  // Block any filesystem access matching these glob patterns
  .denyPathGlobs(['**/.env', '**/.env.*', '**/*.pem', '**/*.key', '**/secrets/**'])

  // Hard stop if the agent spends more than $1.00 in this run
  .maxCost(1.00)

  // Scrub secrets from all event payloads before they are stored
  .redactSecrets(true);
```

### Step 3: Wrap your agent

```typescript
const receipt = new Receipt(policy);

await runWithInterceptors(policy, receipt, async () => {
  // Everything inside this async scope is now governed.
  // Raw fs.readFileSync(), axios calls, child_process.exec() — all intercepted.

  await myAutonomousAgent.run('Summarize the project and send a report.');
});

// Tear down patches (optional — only needed if you're running multiple
// different policy contexts within the same long-lived process)
teardownGlobalPatches();

// Finalize and inspect the receipt
receipt.finalize();
console.log(receipt.toJSON());
```

### Step 4: Inspect the receipt

```typescript
import { printReceipt } from '@receiptbot/ui';

// Pretty-print to terminal (ANSI box drawing, color-coded status)
printReceipt(receipt);

// Get raw JSON for storage, logging, or display
const json = receipt.toJSON();
// → { startedAt, endedAt, events: [...], totals: { eventsTotal, blockedTotal, costUsdTotal, durationMs } }
```

---

## Setting a Cost Limit

LLM API calls are tracked automatically when you emit `llm.call` events. Set the maximum spend for a single agent run:

```typescript
const policy = new PolicyEngine()
  // Block any LLM call that would push the running total over $0.50
  .maxCost(0.50);
```

The cost check is evaluated **before** each event is recorded. If the new event would exceed the cap, a `PolicyViolationError` is thrown immediately and the event is recorded as `BLOCKED_BY_POLICY`.

> **Precision:** ReceiptBot tracks costs internally in micro-dollars (1/1,000,000 USD) to avoid floating-point rounding errors common with sub-cent LLM prices. Totals are displayed to 4 decimal places (e.g. `$0.0150`).

---

## API Reference

### `PolicyEngine`

Chainable policy builder. Each method returns `this` for fluent chaining.

| Method | Description |
|--------|-------------|
| `.allowDomains(domains: string[])` | **Allowlist** outbound HTTP/HTTPS/net connections. All other domains are blocked. |
| `.denyPathGlobs(globs: string[])` | **Blocklist** filesystem paths using minimatch glob syntax. Matched paths throw on read/write/delete. |
| `.maxCost(amountUsd: number)` | Hard cap on cumulative LLM spend for this agent run. |
| `.redactSecrets(enabled: boolean)` | Enable/disable automatic secret scrubbing from all event payloads. |

### `Receipt`

Collects and evaluates events against the `PolicyEngine`.

```typescript
const receipt = new Receipt(policy);

// Manual event emission (the interceptor calls these automatically)
receipt.addEvent({
  type: 'llm.call',           // 'llm.call' | 'tool.fs' | 'tool.net' | 'tool.shell' | 'agent.step'
  action: 'llm.generate(gpt-4o)',
  payload: { model: 'gpt-4o', prompt: '...' },
  costImpactUsd: 0.005,       // Optional, drives cost cap enforcement
});

receipt.finalize();            // Stamps the end time
receipt.toJSON();              // Serialize to plain object for storage/display
receipt.totals;                // Live snapshot: { eventsTotal, blockedTotal, costUsdTotal, durationMs }
```

### `runWithInterceptors(policy, receipt, fn)`

The main entry point. Patches all Node.js core modules and runs `fn` inside a scoped `AsyncLocalStorage` context.

```typescript
await runWithInterceptors(policy, receipt, async () => {
  // Agent code here
});
```

### `teardownGlobalPatches()`

Restores all monkey-patched functions to their originals. Call this when you're done if you're running multiple different agent sessions in a long-lived process (e.g., a web server).

```typescript
teardownGlobalPatches();
```

### `PolicyViolationError`

Thrown when a policy blocks an action. Extends `Error`.

```typescript
import { PolicyViolationError } from '@receiptbot/core';

try {
  fs.readFileSync('.env');
} catch (e) {
  if (e instanceof PolicyViolationError) {
    console.log('Blocked:', e.message);
  }
}
```

---

## Receipt JSON Schema

```typescript
interface ReceiptEvent {
  id: string;                  // UUID v4
  timestamp: string;           // ISO-8601
  type: ReceiptEventType;      // 'llm.call' | 'tool.fs' | 'tool.net' | 'tool.shell' | 'agent.step'
  action: string;              // Human-readable description
  payload: object;             // Typed by event type
  status: ActionStatus;        // 'success' | 'failed' | 'BLOCKED_BY_POLICY'
  costImpactUsd?: number;      // Estimated cost (4 decimal precision)
  policyTrigger?: string;      // Populated when blocked — explains why
}

interface ReceiptTotals {
  eventsTotal: number;
  blockedTotal: number;
  costMicroUsdTotal: number;   // Internal integer representation (÷ 1,000,000 = USD)
  costUsdTotal: number;        // Display value
  durationMs: number;
}
```

---

## Project Structure

```
receiptbot/
├── packages/
│   ├── core/               @receiptbot/core
│   │   └── src/
│   │       ├── schema.ts           Types: ReceiptEvent, ReceiptTotals
│   │       ├── policy-engine.ts    Chainable policy builder
│   │       ├── receipt.ts          Event collector, redaction, finalization
│   │       ├── interceptor.ts      Global Node.js monkey-patcher
│   │       ├── errors.ts           PolicyViolationError
│   │       └── index.ts
│   ├── adapter-generic/    @receiptbot/adapter-generic
│   │   └── src/
│   │       └── index.ts            withReceipts(policy) legacy adapter
│   └── ui/                 @receiptbot/ui
│       └── src/
│           ├── terminal.ts         ANSI box-drawing terminal printer
│           ├── html.ts             Standalone dark-mode HTML generator
│           └── index.ts
├── apps/
│   └── viewer/             Next.js 14 App Router — visual audit UI
│       ├── src/app/
│       │   ├── page.tsx            Landing (drag & drop upload)
│       │   ├── view/page.tsx       Viewer (from localStorage)
│       │   ├── docs/page.tsx       Full documentation & tutorial
│       │   └── demo/
│       │       ├── rogue-dev/      Prompt injection demo
│       │       ├── wallet-drainer/ Cost cap demo
│       │       └── latest/         Last receipt from pnpm demo:rogue
│       └── public/samples/         Bundled demo receipt JSON files
└── examples/
    ├── rogue-dev.ts                Agent hijacked → .env blocked, evil domain blocked
    ├── wallet-drainer.ts           Agent loops → stopped at $0.05 budget
    └── interceptor-demo.ts         Raw syscall interception showcase
```

---

## Features

- 🛡️ **Policy Enforcement** — Deny path globs, enforce domain allowlists, intercept child processes
- 💰 **LLM Cost Caps** — Sub-cent precision cost tracking that fails fast at your budget
- 🔍 **Full Audit Trail** — Every syscall receipted as typed, structured JSON
- 🔒 **In-Memory Secret Redaction** — 10+ enterprise secret patterns stripped before any log exists
- 🌐 **Visual Viewer** — Local Next.js dark-mode dashboard with drag-and-drop upload
- 🔀 **Multi-Tenant Safe** — `AsyncLocalStorage` scoping prevents cross-agent contamination

---

## Roadmap

| Feature | Status |
|---------|--------|
| Core policy engine (cost, domain, path globs) | ✅ Done |
| Global Node.js interceptor (V2) | ✅ Done |
| Enterprise secret redaction (10+ patterns) | ✅ Done |
| Terminal + HTML receipt output | ✅ Done |
| Next.js visual viewer with drag-and-drop | ✅ Done |
| AsyncLocalStorage multi-tenant safety | ✅ Done |
| Agent adapters (LangChain, AutoGen, OpenAI Assistants) | 🔜 Planned |
| Policy recording — learn policies from a trace | 🔜 Planned |
| GitHub Actions comment bot — post receipt on every PR | 🔜 Planned |
| Cloud share links — ephemeral shareable receipt URLs | 🔜 Planned |

---

## Privacy & Security

- **Secret redaction** happens at event-record time — before JSON, terminal output, or HTML generation
- **Local-only viewer** — receipts loaded via drag-and-drop are stored only in `localStorage`; nothing is transmitted to any server
- **No telemetry** — ReceiptBot never phones home

---

## Contributing

```bash
pnpm install
pnpm run build

pnpm run example:interceptor   # Raw syscall interception demo
pnpm run demo:rogue            # Prompt injection scenario
pnpm run example:wallet        # Budget cap scenario
pnpm run dev                   # Visual viewer → http://localhost:3939
```

PRs welcome. Open an issue first for large changes.

---

## License

MIT © [redshadow912](https://github.com/redshadow912)
