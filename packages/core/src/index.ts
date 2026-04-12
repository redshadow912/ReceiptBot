// ─── @receiptbot/core barrel export ─────────────────────────────────
export type {
  ActionStatus,
  ReceiptEventType,
  FsPayload,
  NetPayload,
  LlmPayload,
  ShellPayload,
  StepPayload,
  PayloadFor,
  ReceiptEvent,
  ReceiptTotals,
} from './schema.js';

export { PolicyEngine, type PolicyResult } from './policy-engine.js';
export { Receipt } from './receipt.js';
export { PolicyViolationError } from './errors.js';
export {
  setupGlobalPatches,
  teardownGlobalPatches,
  runWithInterceptors,
} from './interceptor.js';
