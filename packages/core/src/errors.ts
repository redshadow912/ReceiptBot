// ─── Custom Errors ──────────────────────────────────────────────────
// Typed error for policy violations thrown by the global interceptor.

/**
 * Thrown when a globally-intercepted Node.js call violates a policy rule.
 * Contains forensic metadata for logging and debugging.
 */
export class PolicyViolationError extends Error {
  readonly name = 'PolicyViolationError';

  constructor(
    /** The event category that was violated (e.g. 'tool.fs', 'tool.net'). */
    public readonly eventType: string,
    /** Human-readable description of the attempted action. */
    public readonly action: string,
    /** The policy rule reason that triggered the block. */
    public readonly reason: string,
  ) {
    super(`[ReceiptBot] BLOCKED ${eventType}: ${action} — ${reason}`);
    // Preserve prototype chain for instanceof checks
    Object.setPrototypeOf(this, PolicyViolationError.prototype);
  }
}
