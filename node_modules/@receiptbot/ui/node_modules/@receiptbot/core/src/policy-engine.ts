// ─── PolicyEngine ───────────────────────────────────────────────────
// Chainable policy evaluator for ReceiptBot events.

import { minimatch } from 'minimatch';
import type { ReceiptEvent, ReceiptTotals } from './schema.js';

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

type PolicyRule = (event: ReceiptEvent, ctx: { totals: ReceiptTotals }) => PolicyResult | null;

export class PolicyEngine {
  private rules: PolicyRule[] = [];

  // ── Chainable policy methods ────────────────────────────────────

  /** Block execution once cumulative USD cost exceeds `amountUsd`. */
  maxCost(amountUsd: number): this {
    this.rules.push((_event, ctx) => {
      if (ctx.totals.costUsdTotal + (_event.costImpactUsd ?? 0) > amountUsd) {
        return {
          allowed: false,
          reason: `Cost cap exceeded: $${ctx.totals.costUsdTotal.toFixed(2)} + $${(_event.costImpactUsd ?? 0).toFixed(2)} > $${amountUsd.toFixed(2)}`,
        };
      }
      return null;
    });
    return this;
  }

  /** Only allow network requests whose hostname matches or is a subdomain of one of `domains`. */
  allowDomains(domains: string[]): this {
    this.rules.push((event) => {
      if (event.type !== 'tool.net') return null;
      const payload = event.payload as { url: string };
      let hostname: string;
      try {
        hostname = new URL(payload.url).hostname;
      } catch {
        return { allowed: false, reason: `Invalid URL: ${payload.url}` };
      }
      const allowed = domains.some(
        (d) => hostname === d || hostname.endsWith(`.${d}`),
      );
      if (!allowed) {
        return { allowed: false, reason: `Domain "${hostname}" not in allow‑list [${domains.join(', ')}]` };
      }
      return null;
    });
    return this;
  }

  /** Block filesystem operations whose path matches any of the provided globs. */
  denyPathGlobs(globs: string[]): this {
    this.rules.push((event) => {
      if (event.type !== 'tool.fs') return null;
      const payload = event.payload as { path: string };
      for (const glob of globs) {
        if (minimatch(payload.path, glob, { dot: true })) {
          return { allowed: false, reason: `Path "${payload.path}" matched deny glob "${glob}"` };
        }
      }
      return null;
    });
    return this;
  }

  /** Enable automatic secret redaction on event payloads. */
  redactSecrets(enabled: boolean): this {
    if (enabled) {
      this.rules.push((event) => {
        // We don't block – just mark that redaction is active (handled at Receipt level)
        // This rule never blocks, it's a passthrough marker.
        return null;
      });
      // Store redaction flag separately for the Receipt collector to read.
      (this as any).__redactSecrets = true;
    }
    return this;
  }

  /** Check whether redaction is enabled on this engine. */
  get isRedactionEnabled(): boolean {
    return (this as any).__redactSecrets === true;
  }

  // ── Evaluation ──────────────────────────────────────────────────

  /** Run all policy rules against an event in order. First deny wins. */
  evaluate(event: ReceiptEvent, ctx: { totals: ReceiptTotals }): PolicyResult {
    for (const rule of this.rules) {
      const result = rule(event, ctx);
      if (result && !result.allowed) return result;
    }
    return { allowed: true };
  }
}
