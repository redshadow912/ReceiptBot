// ─── Receipt types for the viewer ───────────────────────────────────
// Re-exports from @receiptbot/core where possible, plus the
// serialized receipt shape emitted by Receipt.toJSON().

import type { ReceiptEvent, ReceiptTotals } from '@receiptbot/core';

export type { ReceiptEvent, ReceiptTotals };

/** The shape produced by Receipt.toJSON() in @receiptbot/core. */
export interface SerializedReceipt {
  startedAt: string;
  endedAt: string | null;
  events: ReceiptEvent[];
  totals: ReceiptTotals;
}

// ─── Minimal runtime validation ─────────────────────────────────────

export function isValidReceipt(data: unknown): data is SerializedReceipt {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.events)) return false;
  if (typeof obj.totals !== 'object' || obj.totals === null) return false;

  const totals = obj.totals as Record<string, unknown>;
  if (typeof totals.eventsTotal !== 'number') return false;
  if (typeof totals.blockedTotal !== 'number') return false;

  // Validate at least the first event has the required shape
  if (obj.events.length > 0) {
    const first = obj.events[0] as Record<string, unknown>;
    if (typeof first.id !== 'string') return false;
    if (typeof first.type !== 'string') return false;
    if (typeof first.status !== 'string') return false;
  }

  return true;
}

// ─── localStorage helpers ───────────────────────────────────────────

const STORAGE_KEY = 'receiptbot:receipt';

export function storeReceipt(receipt: SerializedReceipt): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipt));
}

export function loadReceipt(): SerializedReceipt | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return isValidReceipt(data) ? data : null;
  } catch {
    return null;
  }
}

export function clearReceipt(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
