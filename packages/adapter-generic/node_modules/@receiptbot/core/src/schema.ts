// ─── ReceiptBot Core Schema ─────────────────────────────────────────
// Canonical types for agent runtime governance & auditing.

/** Result status of an audited action. */
export type ActionStatus = 'success' | 'failed' | 'BLOCKED_BY_POLICY';

/** Categorical event types the receipt system understands. */
export type ReceiptEventType =
  | 'llm.call'
  | 'tool.fs'
  | 'tool.net'
  | 'tool.shell'
  | 'agent.step';

// ─── Typed payloads per event type ──────────────────────────────────

export interface FsPayload {
  op: 'readFile' | 'writeFile' | 'deleteFile';
  path: string;
  bytes?: number;
}

export interface NetPayload {
  method: 'GET' | 'POST';
  url: string;
}

export interface LlmPayload {
  model: string;
  prompt: string;
}

export interface ShellPayload {
  command: string;
  args?: string[];
}

export interface StepPayload {
  name: string;
  detail?: string;
}

/** Discriminated‑union helper – maps event type to its payload shape. */
export type PayloadFor<T extends ReceiptEventType> =
  T extends 'tool.fs'    ? FsPayload :
  T extends 'tool.net'   ? NetPayload :
  T extends 'llm.call'   ? LlmPayload :
  T extends 'tool.shell' ? ShellPayload :
  T extends 'agent.step' ? StepPayload :
  Record<string, unknown>;

// ─── Core event ─────────────────────────────────────────────────────

export interface ReceiptEvent<T extends ReceiptEventType = ReceiptEventType> {
  /** RFC‑4122 UUID (v4) */
  id: string;
  /** ISO‑8601 timestamp */
  timestamp: string;
  /** Event category */
  type: T;
  /** Human‑readable action description */
  action: string;
  /** Structured payload – shape depends on `type` */
  payload: PayloadFor<T>;
  /** Outcome */
  status: ActionStatus;
  /** Estimated cost impact in USD (if known) */
  costImpactUsd?: number;
  /** Populated when a policy blocked or modified the action */
  policyTrigger?: string;
}

// ─── Aggregated totals ──────────────────────────────────────────────

export interface ReceiptTotals {
  eventsTotal: number;
  blockedTotal: number;
  costCentsTotal: number;
  costUsdTotal: number; // Derived for display
  durationMs: number;
}
