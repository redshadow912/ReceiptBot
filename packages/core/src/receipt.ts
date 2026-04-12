// ─── Receipt Collector ──────────────────────────────────────────────
// Collects ReceiptEvents, maintains running totals, applies redaction.

import { randomUUID } from 'node:crypto';
import type { ReceiptEvent, ReceiptEventType, ReceiptTotals, PayloadFor, ActionStatus } from './schema.js';
import { PolicyEngine, type PolicyResult } from './policy-engine.js';

// ─── Enterprise Secret Registry ─────────────────────────────────────
// Named patterns for forensic clarity. Each match is replaced with
// [REDACTED_<LABEL>] so the audit log tells you WHAT was redacted.

interface SecretPattern {
  label: string;
  pattern: RegExp;
}

const SECRET_REGISTRY: SecretPattern[] = [
  // ── Cloud Provider Keys ────────────────────────────────────────────
  {
    label: 'AWS_ACCESS_KEY',
    pattern: /AKIA[0-9A-Z]{16}/g,
  },
  {
    label: 'AWS_SECRET_KEY',
    // Scoped: only match 40-char base64 strings that appear after known key identifiers
    pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY|secret_?[Aa]ccess_?[Kk]ey)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/g,
  },
  {
    label: 'GCP_API_KEY',
    pattern: /AIza[A-Za-z0-9\-_]{35}/g,
  },
  {
    label: 'GCP_SERVICE_ACCOUNT_KEY',
    pattern: /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
  },

  // ── LLM Providers ─────────────────────────────────────────────────
  {
    label: 'OPENAI_API_KEY',
    pattern: /sk-[A-Za-z0-9]{20,}/g,
  },
  {
    label: 'ANTHROPIC_API_KEY',
    pattern: /sk-ant-api03-[A-Za-z0-9\-_]{20,}/g,
  },

  // ── Payment / SaaS ────────────────────────────────────────────────
  {
    label: 'STRIPE_KEY',
    pattern: /(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}/g,
  },

  // ── Source Control ─────────────────────────────────────────────────
  {
    label: 'GITHUB_TOKEN',
    pattern: /(?:ghp|gho|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/g,
  },

  // ── Messaging ──────────────────────────────────────────────────────
  {
    label: 'SLACK_TOKEN',
    pattern: /xox[bpas]-[A-Za-z0-9\-]{10,}/g,
  },

  // ── Database / BaaS ────────────────────────────────────────────────
  {
    label: 'SUPABASE_KEY',
    // Supabase anon/service keys are JWTs starting with eyJ...
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
  },

  // ── Private Key Blocks ─────────────────────────────────────────────
  {
    label: 'PRIVATE_KEY_PEM',
    pattern: /-----BEGIN (?:RSA |EC |ED25519 |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |ED25519 |DSA |OPENSSH )?PRIVATE KEY-----/g,
  },

  // ── Auth Headers ───────────────────────────────────────────────────
  {
    label: 'BEARER_TOKEN',
    pattern: /Bearer [A-Za-z0-9\-_.~+/]{20,}/g,
  },

  // ── Generic Secret Assignments ─────────────────────────────────────
  {
    label: 'SECRET_ASSIGNMENT',
    pattern: /(?:secret|password|token|api_key|apikey|api_secret|client_secret)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
  },
];

/** Maximum recursion depth for payload redaction to prevent stack overflow. */
const MAX_REDACTION_DEPTH = 20;

function redactString(value: string): string {
  let out = value;
  for (const { label, pattern } of SECRET_REGISTRY) {
    // Create a fresh regex from the pattern to reset lastIndex
    out = out.replace(new RegExp(pattern.source, pattern.flags), `[REDACTED_${label}]`);
  }
  return out;
}

function redactPayload<T>(payload: T, depth = 0): T {
  // Guard against deep/circular structures
  if (depth >= MAX_REDACTION_DEPTH) return payload;

  if (typeof payload === 'string') return redactString(payload) as unknown as T;
  if (typeof payload !== 'object' || payload === null) return payload;

  const clone: any = Array.isArray(payload) ? [...payload] : { ...payload };
  for (const key of Object.keys(clone)) {
    if (typeof clone[key] === 'string') {
      clone[key] = redactString(clone[key]);
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = redactPayload(clone[key], depth + 1);
    }
  }
  return clone as T;
}

export class Receipt {
  readonly events: ReceiptEvent[] = [];
  readonly startedAt: string;
  private endedAt: string | null = null;
  private _totals: Omit<ReceiptTotals, 'costUsdTotal'> = {
    eventsTotal: 0,
    blockedTotal: 0,
    costMicroUsdTotal: 0,
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
      costUsdTotal: this._totals.costMicroUsdTotal / 1_000_000,
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
      this._totals.costMicroUsdTotal += Math.round(event.costImpactUsd * 1_000_000);
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
