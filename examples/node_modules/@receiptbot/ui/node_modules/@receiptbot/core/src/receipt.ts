// ─── Receipt Collector ──────────────────────────────────────────────
// Collects ReceiptEvents, maintains running totals, applies redaction.

import { randomUUID } from 'node:crypto';
import type { ReceiptEvent, ReceiptEventType, ReceiptTotals, PayloadFor, ActionStatus } from './schema.js';
import { PolicyEngine, type PolicyResult } from './policy-engine.js';

/** Basic AWS secret key regex for payload redaction. */
const SECRET_PATTERNS = [
  /(?:AKIA[0-9A-Z]{16})/g,                             // AWS Access Key ID
  /(?:[A-Za-z0-9/+=]{40})/g,                            // potential AWS Secret Key (40‑char base64)
  /(?:sk-[A-Za-z0-9]{20,})/g,                           // OpenAI-style API keys
];

const REDACTED = '[REDACTED]';

function redactString(value: string): string {
  let out = value;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(new RegExp(pattern.source, pattern.flags), REDACTED);
  }
  return out;
}

function redactPayload<T>(payload: T): T {
  if (typeof payload === 'string') return redactString(payload) as unknown as T;
  if (typeof payload !== 'object' || payload === null) return payload;
  const clone: any = Array.isArray(payload) ? [...payload] : { ...payload };
  for (const key of Object.keys(clone)) {
    if (typeof clone[key] === 'string') {
      clone[key] = redactString(clone[key]);
    } else if (typeof clone[key] === 'object') {
      clone[key] = redactPayload(clone[key]);
    }
  }
  return clone as T;
}

export class Receipt {
  readonly events: ReceiptEvent[] = [];
  readonly startedAt: string;
  private endedAt: string | null = null;
  private _totals: ReceiptTotals = {
    eventsTotal: 0,
    blockedTotal: 0,
    costUsdTotal: 0,
    durationMs: 0,
  };
  private startTime: number;

  constructor(
    private readonly policy: PolicyEngine,
  ) {
    this.startedAt = new Date().toISOString();
    this.startTime = Date.now();
  }

  /** Current totals snapshot. */
  get totals(): ReceiptTotals {
    return {
      ...this._totals,
      durationMs: (this.endedAt ? new Date(this.endedAt).getTime() : Date.now()) - this.startTime,
    };
  }

  /** Create and evaluate a new event. Returns the finalized event. */
  addEvent<T extends ReceiptEventType>(params: {
    type: T;
    action: string;
    payload: PayloadFor<T>;
    costImpactUsd?: number;
  }): ReceiptEvent<T> {
    // Build preliminary event
    let event: ReceiptEvent<T> = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type: params.type,
      action: params.action,
      payload: params.payload,
      status: 'success' as ActionStatus,
      costImpactUsd: params.costImpactUsd,
    };

    // Evaluate policies
    const result: PolicyResult = this.policy.evaluate(
      event as ReceiptEvent,
      { totals: this.totals },
    );

    if (!result.allowed) {
      event = { ...event, status: 'BLOCKED_BY_POLICY', policyTrigger: result.reason };
    }

    // Apply redaction if enabled
    if (this.policy.isRedactionEnabled) {
      event = { ...event, payload: redactPayload(event.payload) };
      if (event.policyTrigger) {
        event = { ...event, policyTrigger: redactString(event.policyTrigger) };
      }
    }

    // Update totals
    this._totals.eventsTotal++;
    if (event.status === 'BLOCKED_BY_POLICY') {
      this._totals.blockedTotal++;
    } else if (event.costImpactUsd) {
      this._totals.costUsdTotal += event.costImpactUsd;
    }

    this.events.push(event as ReceiptEvent);
    return event;
  }

  /** Finalize the receipt – stamps the end time. */
  finalize(): void {
    this.endedAt = new Date().toISOString();
    this._totals.durationMs = new Date(this.endedAt).getTime() - this.startTime;
  }

  /** Serialize receipt to a plain object. */
  toJSON() {
    return {
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      events: this.events,
      totals: this.totals,
    };
  }
}
