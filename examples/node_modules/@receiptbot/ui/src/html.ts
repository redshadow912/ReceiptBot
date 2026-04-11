// ─── HTML Receipt Generator ─────────────────────────────────────────
// Generates a single‑file receipt.html with embedded CSS.
// Design: Sleek Vercel Dark Mode with timeline + totals header.

import { writeFileSync } from 'node:fs';
import type { Receipt } from '@receiptbot/core';
import type { ReceiptEvent } from '@receiptbot/core';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status: string): string {
  if (status === 'BLOCKED_BY_POLICY') return '<span class="badge badge-blocked">BLOCKED</span>';
  if (status === 'success') return '<span class="badge badge-success">SUCCESS</span>';
  return '<span class="badge badge-failed">FAILED</span>';
}

function typeIcon(type: string): string {
  if (type === 'llm.call')    return '🤖';
  if (type === 'tool.fs')     return '📁';
  if (type === 'tool.net')    return '🌐';
  if (type === 'tool.shell')  return '⚡';
  if (type === 'agent.step')  return '🎯';
  return '📋';
}

/**
 * Generate a self‑contained receipt.html and write it to `outputPath`.
 */
export function generateHtml(receipt: Receipt, outputPath: string): void {
  const totals = receipt.totals;
  const events = receipt.events;

  const eventsHtml = events.map((e, i) => {
    const ts = new Date(e.timestamp).toISOString().slice(11, 23);
    const isBlocked = e.status === 'BLOCKED_BY_POLICY';

    return `
      <div class="event ${isBlocked ? 'event-blocked' : ''}" style="animation-delay: ${i * 0.06}s">
        <div class="event-header">
          <div class="event-left">
            <span class="event-icon">${typeIcon(e.type)}</span>
            <span class="event-type">${escapeHtml(e.type)}</span>
            <span class="event-ts">${ts}</span>
          </div>
          <div class="event-right">
            ${e.costImpactUsd != null ? `<span class="event-cost">$${e.costImpactUsd.toFixed(2)}</span>` : ''}
            ${statusBadge(e.status)}
          </div>
        </div>
        <div class="event-action">${escapeHtml(e.action)}</div>
        ${e.policyTrigger ? `<div class="event-policy">⚠ ${escapeHtml(e.policyTrigger)}</div>` : ''}
        <div class="event-payload"><code>${escapeHtml(JSON.stringify(e.payload, null, 2))}</code></div>
      </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ReceiptBot — Agent Audit Receipt</title>
  <style>
    /* ── Reset & Base ───────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:           #0a0a0a;
      --surface:      #111111;
      --surface-2:    #1a1a1a;
      --border:       #262626;
      --border-hover: #333333;
      --text:         #ededed;
      --text-dim:     #888888;
      --accent:       #0070f3;
      --accent-glow:  rgba(0, 112, 243, 0.15);
      --success:      #00c853;
      --success-bg:   rgba(0, 200, 83, 0.1);
      --danger:       #ff4444;
      --danger-bg:    rgba(255, 68, 68, 0.08);
      --warn:         #ff9800;
      --warn-bg:      rgba(255, 152, 0, 0.1);
      --radius:       12px;
      --radius-sm:    6px;
      --font:         'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --mono:         'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.6;
      min-height: 100vh;
      padding: 2rem;
    }

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ── Container ──────────────────────────────────────────── */
    .container {
      max-width: 860px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
      background: linear-gradient(135deg, #fff 0%, #888 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header .subtitle {
      color: var(--text-dim);
      font-size: 0.875rem;
    }

    /* ── Totals Grid ────────────────────────────────────────── */
    .totals {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .stat {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      text-align: center;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .stat:hover {
      border-color: var(--border-hover);
      box-shadow: 0 0 0 1px var(--border-hover);
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .stat-value.danger { color: var(--danger); }
    .stat-value.success { color: var(--success); }
    .stat-value.accent { color: var(--accent); }

    /* ── Timeline ───────────────────────────────────────────── */
    .timeline-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    .event {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      margin-bottom: 0.75rem;
      transition: border-color 0.2s, transform 0.2s;
      animation: slideIn 0.3s ease-out both;
    }

    .event:hover {
      border-color: var(--border-hover);
      transform: translateX(4px);
    }

    .event-blocked {
      border-left: 3px solid var(--danger);
      background: var(--danger-bg);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .event-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .event-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .event-icon { font-size: 1.1rem; }

    .event-type {
      font-family: var(--mono);
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--accent);
      background: var(--accent-glow);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .event-ts {
      font-family: var(--mono);
      font-size: 0.75rem;
      color: var(--text-dim);
    }

    .event-cost {
      font-family: var(--mono);
      font-size: 0.8rem;
      color: var(--warn);
      background: var(--warn-bg);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .event-action {
      font-size: 0.875rem;
      color: var(--text);
      margin: 0.25rem 0;
    }

    .event-policy {
      font-size: 0.8rem;
      color: var(--danger);
      font-weight: 600;
      margin: 0.35rem 0;
      padding: 0.35rem 0.6rem;
      background: var(--danger-bg);
      border-radius: var(--radius-sm);
      border-left: 2px solid var(--danger);
    }

    .event-payload {
      margin-top: 0.5rem;
    }

    .event-payload code {
      display: block;
      font-family: var(--mono);
      font-size: 0.75rem;
      color: var(--text-dim);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.8rem;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* ── Badges ─────────────────────────────────────────────── */
    .badge {
      display: inline-block;
      font-family: var(--mono);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-sm);
    }

    .badge-success {
      color: var(--success);
      background: var(--success-bg);
    }

    .badge-blocked {
      color: #fff;
      background: var(--danger);
    }

    .badge-failed {
      color: var(--warn);
      background: var(--warn-bg);
    }

    /* ── Footer ─────────────────────────────────────────────── */
    .footer {
      text-align: center;
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      color: var(--text-dim);
      font-size: 0.75rem;
    }

    .footer a {
      color: var(--accent);
      text-decoration: none;
    }

    /* ── Animations ─────────────────────────────────────────── */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 640px) {
      body { padding: 1rem; }
      .totals { grid-template-columns: repeat(2, 1fr); }
      .stat-value { font-size: 1.35rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>🧾 ReceiptBot</h1>
      <p class="subtitle">Agent Runtime Audit Receipt &middot; Generated ${new Date().toISOString()}</p>
    </header>

    <section class="totals">
      <div class="stat">
        <div class="stat-value accent">${totals.eventsTotal}</div>
        <div class="stat-label">Total Events</div>
      </div>
      <div class="stat">
        <div class="stat-value ${totals.blockedTotal > 0 ? 'danger' : 'success'}">${totals.blockedTotal}</div>
        <div class="stat-label">Blocked</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: var(--warn)">$${totals.costUsdTotal.toFixed(4)}</div>
        <div class="stat-label">Total Cost (USD)</div>
      </div>
      <div class="stat">
        <div class="stat-value">${totals.durationMs}<span style="font-size:0.7em;color:var(--text-dim)">ms</span></div>
        <div class="stat-label">Duration</div>
      </div>
    </section>

    <h2 class="timeline-title">Event Timeline</h2>

    ${eventsHtml}

    <footer class="footer">
      Powered by <a href="https://github.com/redshadow912/ReceiptBot">ReceiptBot</a> &middot; Runtime governance for AI agents
    </footer>
  </div>
</body>
</html>`;

  writeFileSync(outputPath, html, 'utf-8');
}
