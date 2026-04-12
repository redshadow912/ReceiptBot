<div align="center">

# 🧾 ReceiptBot

### Runtime governance + auditing for AI agents.
**Every tool call. Every LLM request. Every dollar. Receipted.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue)](https://www.typescriptlang.org/)

[**View on GitHub**](https://github.com/redshadow912/ReceiptBot) · [**Quickstart**](#quickstart) · [**Roadmap**](#roadmap)

</div>

---

```
╭──────────────────────────────────────────────────────────────────────────────╮
│ 🧾 ReceiptBot — Agent Audit Receipt                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Events: 8  Blocked: 4  Cost: $0.0300  Duration: 12ms                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ 00:00:00.001  tool.fs    ✓ success                                         │
│   → fs.readFile("src/index.ts")                                            │
│                                                                            │
│ 00:00:00.002  tool.fs    ✗ BLOCKED_BY_POLICY ($0.00)                      │
│   → fs.deleteFile(".env")                                                  │
│   ⚠ Path ".env" matched deny glob "**/.env"                               │
│                                                                            │
│ 00:00:00.007  tool.net   ✗ BLOCKED_BY_POLICY ($0.00)                      │
│   → net.POST evil-exfiltration.io                                          │
│   ⚠ Domain "evil-exfiltration.io" not in allow-list                       │
╰──────────────────────────────────────────────────────────────────────────────╯
```

## Features

- 🛡️ **Policy enforcement** — deny path globs, allow-list domains, cap LLM spend
- 🔍 **Full audit trail** — every fs / net / llm / shell action receipted as structured JSON
- 🔒 **Secret redaction** — AWS keys, tokens, and secrets stripped before serialization
- 🌐 **Visual viewer** — drag-and-drop `receipt.json` into a Vercel-dark Next.js UI
- 📤 **Shareable receipts** — standalone HTML export + copyable Markdown share snippet
- 🔌 **Adapter pattern** — wrap any agent with `withReceipts(policy)` in one line

---

## Screenshots

> **Add your screenshots here!**  Place image files under `assets/` and update the paths below.

```
assets/
  screenshot-terminal.png   ← terminal receipt output
  screenshot-viewer.png     ← Next.js viewer (dark mode)
  demo.gif                  ← animated walkthrough GIF
```

<!-- Uncomment once you have assets:
![Terminal receipt output](assets/screenshot-terminal.png)
![Viewer UI – Vercel dark mode](assets/screenshot-viewer.png)
![Animated demo](assets/demo.gif)
-->

---

## Quickstart

```bash
# 1. Install dependencies (pnpm workspaces)
pnpm install

# 2. Run the rogue-dev example (file & domain policy enforcement)
pnpm run example:rogue

# 3. Run the wallet-drainer example (cost cap enforcement)
pnpm run example:wallet

# 4. Start the visual viewer on port 3939
pnpm run dev
# → http://localhost:3939

# 5. Open a bundled demo receipt in the viewer
# → http://localhost:3939/demo/rogue-dev
# → http://localhost:3939/demo/wallet-drainer
# → http://localhost:3939/demo/latest

# 6. Generate the latest demo receipt and view it live
pnpm run demo:rogue
# Saves to apps/viewer/public/samples/latest.json
# → http://localhost:3939/demo/latest
```

---

## Why ReceiptBot?

AI agents operate autonomously — they read files, call APIs, spawn processes, and spend money on your behalf. Without governance, a single prompt injection or runaway loop can:

- exfiltrate secrets (`.env`, private keys)
- call untrusted domains
- burn through your LLM budget

ReceiptBot wraps your agent with a **policy layer** and produces a cryptographically-auditable, human-readable receipt for every run.

| Capability | Benefit |
|------------|---------|
| **Governance** | Enforce allow/deny rules before actions execute — not after |
| **Audit receipts** | Immutable JSON artifact per agent run — shareable, diff-able, archivable |
| **Shareable artifacts** | One-click Markdown snippet + standalone HTML for incident reports or PRs |
| **Zero infrastructure** | Receipts stored locally; viewer is a static Next.js app |

---

## Project Structure

```
receiptbot/
├── packages/
│   ├── core/               @receiptbot/core
│   │   └── src/
│   │       ├── schema.ts       Types: ReceiptEvent, ReceiptTotals, PolicyEngine input
│   │       ├── policy-engine.ts  Chainable policy builder
│   │       ├── receipt.ts      Event collector + finalization + redaction
│   │       └── index.ts
│   ├── adapter-generic/    @receiptbot/adapter-generic
│   │   └── src/
│   │       └── index.ts    withReceipts(policy) → agent.fs / .net / .llm / .shell
│   └── ui/                 @receiptbot/ui
│       └── src/
│           ├── terminal.ts   ANSI box-drawing terminal printer
│           ├── html.ts       Standalone dark-mode HTML generator
│           └── index.ts
├── apps/
│   └── viewer/             Next.js 14 App Router — visual audit UI
│       ├── src/app/
│       │   ├── page.tsx          Landing (drag & drop upload)
│       │   ├── view/page.tsx     Viewer (from localStorage)
│       │   └── demo/
│       │       ├── rogue-dev/    Bundled file-policy demo
│       │       ├── wallet-drainer/ Bundled cost-cap demo
│       │       └── latest/       Last receipt from pnpm demo:rogue
│       └── public/samples/   Bundled demo receipt JSON files
└── examples/
    ├── rogue-dev.ts        Agent tries to delete .env → blocked
    └── wallet-drainer.ts   Agent loops LLM calls → blocked at cost cap
```

---

## Receipt JSON Schema

Receipts are typed in [`@receiptbot/core`](packages/core/src/schema.ts).

```ts
interface ReceiptEvent<T extends ReceiptEventType> {
  id: string;           // UUID v4
  timestamp: string;    // ISO-8601
  type: ReceiptEventType; // 'llm.call' | 'tool.fs' | 'tool.net' | 'tool.shell' | 'agent.step'
  action: string;       // Human-readable description
  payload: PayloadFor<T>; // Typed by event type (FsPayload, NetPayload, LlmPayload, …)
  status: ActionStatus; // 'success' | 'failed' | 'BLOCKED_BY_POLICY'
  costImpactUsd?: number;
  policyTrigger?: string;  // Populated when blocked — e.g. 'Path matched deny glob **/.env'
}

interface ReceiptTotals {
  eventsTotal: number;
  blockedTotal: number;
  costCentsTotal: number; // Internal integer representation
  costUsdTotal: number;   // Derived display value (costCentsTotal / 100)
  durationMs: number;
}
```

Full type definitions: [`packages/core/src/schema.ts`](packages/core/src/schema.ts)

---

## Roadmap

| Feature | Status |
|---------|--------|
| Core policy engine (cost, domain, path globs) | ✅ Done |
| Secret redaction | ✅ Done |
| Terminal + HTML receipt output | ✅ Done |
| Next.js visual viewer with drag-and-drop | ✅ Done |
| Agent adapters (LangChain, AutoGen, OpenAI Assistants) | 🔜 Planned |
| Policy recording — learn policies from a trace | 🔜 Planned |
| GitHub Actions comment bot — post receipt on every PR | 🔜 Planned |
| Cloud share links — ephemeral shareable receipt URLs | 🔜 Planned |

---

## Security & Privacy

- **Secret redaction** happens at event-record time — before JSON serialization, terminal output, or HTML generation. Your receipts are safe to share.
- **Local-only viewer** — `apps/viewer` is a static Next.js app. Receipts loaded via drag-and-drop are stored only in `localStorage`; no data is sent to any server.
- **No telemetry** — ReceiptBot never phones home.

---

## Contributing

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run a specific example
pnpm run example:rogue
pnpm run example:wallet

# Start the viewer dev server
pnpm run dev          # http://localhost:3939

# Generate a fresh demo receipt and inspect it
pnpm run demo:rogue
# open http://localhost:3939/demo/latest
```

PRs welcome. Please open an issue first for large changes.

Repository: [https://github.com/redshadow912/ReceiptBot](https://github.com/redshadow912/ReceiptBot)

---

## License

MIT © [redshadow912](https://github.com/redshadow912)
