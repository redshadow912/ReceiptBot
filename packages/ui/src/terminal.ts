// ─── Terminal Pretty Printer ────────────────────────────────────────
// Box‑drawing + ANSI color output for ReceiptBot receipts.

import type { Receipt } from '@receiptbot/core';
import type { ReceiptEvent } from '@receiptbot/core';

// ─── ANSI helpers ───────────────────────────────────────────────────
const esc = (code: string) => `\x1b[${code}m`;
const reset   = esc('0');
const bold     = esc('1');
const dim      = esc('2');
const red      = esc('31');
const green    = esc('32');
const yellow   = esc('33');
const blue     = esc('34');
const magenta  = esc('35');
const cyan     = esc('36');
const white    = esc('37');
const bgRed    = esc('41');
const bgGreen  = esc('42');
const bgBlue   = esc('44');
const bgMagenta = esc('45');

// ─── Box drawing chars ──────────────────────────────────────────────
const TL = '╭'; const TR = '╮'; const BL = '╰'; const BR = '╯';
const H  = '─'; const V  = '│';
const ML = '├'; const MR = '┤';

function hLine(width: number, left = TL, right = TR): string {
  return left + H.repeat(width - 2) + right;
}

function padLine(text: string, width: number): string {
  // Strip ANSI for length calculation
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  const pad = Math.max(0, width - 4 - stripped.length);
  return `${V} ${text}${' '.repeat(pad)} ${V}`;
}

function statusColor(status: string): string {
  if (status === 'BLOCKED_BY_POLICY') return `${bgRed}${white}${bold} BLOCKED ${reset}`;
  if (status === 'success') return `${green}✓ success${reset}`;
  return `${yellow}✗ failed${reset}`;
}

function typeColor(type: string): string {
  if (type.startsWith('llm'))  return `${magenta}${type}${reset}`;
  if (type.startsWith('tool.fs'))  return `${blue}${type}${reset}`;
  if (type.startsWith('tool.net')) return `${cyan}${type}${reset}`;
  if (type.startsWith('tool.shell')) return `${yellow}${type}${reset}`;
  return `${dim}${type}${reset}`;
}

/**
 * Print a receipt to stdout with pretty box formatting.
 */
export function printReceipt(receipt: Receipt): void {
  const W = 80;
  const totals = receipt.totals;

  console.log('');
  console.log(`${bold}${cyan}${hLine(W)}${reset}`);
  console.log(`${bold}${cyan}${padLine(`${bold}🧾 ReceiptBot — Agent Audit Receipt${reset}`, W)}${reset}`);
  console.log(`${bold}${cyan}${hLine(W, ML, MR)}${reset}`);

  // Totals header
  const costStr = `$${totals.costUsdTotal.toFixed(4)}`;
  const durationStr = `${totals.durationMs}ms`;
  const blockedStr = totals.blockedTotal > 0
    ? `${red}${bold}${totals.blockedTotal} blocked${reset}`
    : `${green}0 blocked${reset}`;

  console.log(`${cyan}${padLine(`${bold}Events:${reset} ${totals.eventsTotal}  ${bold}Blocked:${reset} ${blockedStr}  ${bold}Cost:${reset} ${yellow}${costStr}${reset}  ${bold}Duration:${reset} ${dim}${durationStr}${reset}`, W)}${reset}`);
  console.log(`${cyan}${hLine(W, ML, MR)}${reset}`);

  // Events timeline
  for (const event of receipt.events) {
    const ts = new Date(event.timestamp).toISOString().slice(11, 23);
    const status = statusColor(event.status);
    const type  = typeColor(event.type);
    const cost = event.costImpactUsd != null ? ` ${dim}($${event.costImpactUsd.toFixed(2)})${reset}` : '';

    console.log(`${cyan}${V}${reset} ${dim}${ts}${reset}  ${type}  ${status}${cost}`);
    console.log(`${cyan}${V}${reset}   ${dim}→${reset} ${event.action}`);

    if (event.policyTrigger) {
      console.log(`${cyan}${V}${reset}   ${red}${bold}⚠ ${event.policyTrigger}${reset}`);
    }
    console.log(`${cyan}${V}${reset}`);
  }

  console.log(`${bold}${cyan}${hLine(W, BL, BR)}${reset}`);
  console.log('');
}
