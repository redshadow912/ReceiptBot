# ReceiptBot 🧾

> **Runtime governance + auditing for AI agents.**  
> Every tool call. Every LLM request. Every dollar. Receipted.

```
╭──────────────────────────────────────────────────────────────────────────────╮
│ 🧾 ReceiptBot — Agent Audit Receipt                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Events: 8  Blocked: 3  Cost: $0.0300  Duration: 12ms                       │
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
pnpm run example:rogue     # file policy demo
pnpm run example:wallet    # cost cap demo
```

## Packages

| Package | Description |
|---------|-------------|
| `@receiptbot/core` | Schema, PolicyEngine, Receipt collector |
| `@receiptbot/adapter-generic` | `withReceipts()` wrapper with simulated tool functions |
| `@receiptbot/ui` | Terminal pretty printer + standalone HTML generator |

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
    ▼
UI: terminal.ts / html.ts
```

## License

MIT
