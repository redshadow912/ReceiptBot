# ReceiptBot 🧾

> **Runtime governance + auditing for AI agents.**
> Every tool call. Every LLM request. Every dollar. Receipted.

```
╭──────────────────────────────────────────────────────────────────────────────╮
│ 🧾 ReceiptBot — Agent Audit Receipt                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Events: 8  Blocked: 4  Cost: $0.0300  Duration: 12ms                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ 00:00:00.001  tool.fs    ✓ success                                         │
│   → fs.readFile("src/index.ts")                                            │
│                                                                            │
│ 00:00:00.002  tool.fs    BLOCKED ($0.00)                                   │
│   → fs.deleteFile(".env")                                                  │
│   ⚠ Path ".env" matched deny glob "**/.env"                               │
╰──────────────────────────────────────────────────────────────────────────────╯
```

## Quick Start

```bash
pnpm install

# Run CLI examples
pnpm run example:rogue      # file policy demo
pnpm run example:wallet     # cost cap demo

# Run the Next.js viewer
pnpm run dev                # → http://localhost:3939
```

## Packages

| Package | Description |
|---------|-------------|
| `@receiptbot/core` | Schema, PolicyEngine, Receipt collector |
| `@receiptbot/adapter-generic` | `withReceipts()` wrapper with simulated tool functions |
| `@receiptbot/ui` | Terminal pretty printer + standalone HTML generator |
| `@receiptbot/viewer` | Next.js viewer app (Vercel dark mode aesthetic) |

## Viewer

The **viewer** (`apps/viewer`) is a React/Next.js app for visually auditing receipts.

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — drag & drop `receipt.json` or pick a demo |
| `/view` | Viewer — renders receipt from localStorage |
| `/demo/rogue-dev` | Demo — file policy enforcement scenario |
| `/demo/wallet-drainer` | Demo — cost cap enforcement scenario |

### Upload Flow

1. Drop or select a `receipt.json` on the landing page
2. The file is parsed and validated client-side
3. Stored in `localStorage` — no backend required
4. Redirected to `/view` for the full audit UI

### Running the Viewer

```bash
# From repo root
pnpm run dev                   # or:
pnpm --filter @receiptbot/viewer dev

# Build for production
pnpm --filter @receiptbot/viewer build
```

## Architecture

```
PolicyEngine (chainable rules)
    │
    ▼
withReceipts(policy) → agent.fs / agent.net / agent.llm / agent.shell
    │
    ▼
Receipt (event collector + totals)
    │
    ├─→ UI: terminal.ts / html.ts (CLI output)
    └─→ Viewer: Next.js app (visual audit)
```

## License

MIT
