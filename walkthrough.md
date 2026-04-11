# ReceiptBot Viewer — Build Walkthrough

## What Was Built

A **Next.js 14 App Router** viewer (`apps/viewer`) wired into the existing pnpm monorepo, featuring a Vercel-inspired dark mode UI for visualizing AI agent audit receipts.

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing with drag-and-drop upload + demo links |
| `/view` | Viewer loaded from localStorage |
| `/demo/rogue-dev` | Bundled file-policy demo |
| `/demo/wallet-drainer` | Bundled cost-cap demo |

## Screenshots

````carousel
![Landing Page](C:/Users/vyshn/.gemini/antigravity/brain/e2869abf-4b6b-4c37-a970-435bf64cad8a/viewer_landing_page_1775868598591.png)
<!-- slide -->
![Rogue Dev Demo](C:/Users/vyshn/.gemini/antigravity/brain/e2869abf-4b6b-4c37-a970-435bf64cad8a/viewer_demo_rogue_dev_1775868611958.png)
<!-- slide -->
![Wallet Drainer Demo](C:/Users/vyshn/.gemini/antigravity/brain/e2869abf-4b6b-4c37-a970-435bf64cad8a/viewer_demo_wallet_drainer_1775868634364.png)
````

## Files Created/Modified

### New Files (apps/viewer)
| File | Purpose |
|------|---------|
| [package.json](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/package.json) | Workspace package with Next.js + Tailwind + lucide-react |
| [tsconfig.json](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/tsconfig.json) | Next.js TypeScript config with `@/*` path alias |
| [next.config.mjs](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/next.config.mjs) | Static export + transpile @receiptbot/core |
| [tailwind.config.ts](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/tailwind.config.ts) | Custom Vercel dark design tokens |
| [postcss.config.mjs](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/postcss.config.mjs) | Tailwind PostCSS config |
| [globals.css](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/app/globals.css) | Tailwind directives + custom component classes |
| [layout.tsx](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/app/layout.tsx) | Root layout with dark mode |
| [page.tsx](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/app/page.tsx) | Landing page with upload zone |
| [view/page.tsx](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/app/view/page.tsx) | Viewer page (localStorage) |
| [demo/rogue-dev/page.tsx](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/app/demo/rogue-dev/page.tsx) | Demo page |
| [demo/wallet-drainer/page.tsx](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/app/demo/wallet-drainer/page.tsx) | Demo page |
| [ReceiptViewer.tsx](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/components/ReceiptViewer.tsx) | Core viewer component (totals, filters, timeline) |
| [receipt.ts](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/src/lib/receipt.ts) | Types, validation, localStorage helpers |
| [receipt-rogue-dev.json](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/public/samples/receipt-rogue-dev.json) | Sample data |
| [receipt-wallet-drainer.json](file:///c:/Users/vyshn/ReceiptBot/apps/viewer/public/samples/receipt-wallet-drainer.json) | Sample data |

### Modified Files
| File | Change |
|------|--------|
| [pnpm-workspace.yaml](file:///c:/Users/vyshn/ReceiptBot/pnpm-workspace.yaml) | Added `apps/*` workspace |
| [package.json](file:///c:/Users/vyshn/ReceiptBot/package.json) | Added `dev`, `viewer:dev`, `viewer:build` scripts |
| [README.md](file:///c:/Users/vyshn/ReceiptBot/README.md) | Updated with viewer usage, routes, and architecture |
| Core/adapter `package.json` files | Added `require`/`default` export conditions for broader compatibility |

## Verification

- ✅ `pnpm --filter @receiptbot/viewer dev` starts on port 3939
- ✅ All 3 pages render correctly (landing, rogue-dev demo, wallet-drainer demo)
- ✅ `pnpm run example:rogue` and `pnpm run example:wallet` still work
- ✅ Git tree is clean, all `node_modules/` and `dist/` properly gitignored
- ✅ Sample JSON files match exact `Receipt.toJSON()` shape

## How to Run

```bash
pnpm install
pnpm run dev           # → http://localhost:3939
```
