// ─── withReceipts() — Generic Adapter ───────────────────────────────
// Wraps simulated tool functions with ReceiptBot governance.
// Every call flows through the PolicyEngine before "executing".

import {
  PolicyEngine,
  Receipt,
  type FsPayload,
  type NetPayload,
  type LlmPayload,
  type ShellPayload,
  type ReceiptEvent,
} from '@receiptbot/core';

// ─── Result types ───────────────────────────────────────────────────

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  blocked?: boolean;
  reason?: string;
  event: ReceiptEvent;
}

// ─── Simulated tool interfaces ──────────────────────────────────────

export interface FsTools {
  readFile(path: string): Promise<ToolResult<string>>;
  writeFile(path: string, content: string): Promise<ToolResult<void>>;
  deleteFile(path: string): Promise<ToolResult<void>>;
}

export interface NetTools {
  get(url: string): Promise<ToolResult<string>>;
  post(url: string, body?: unknown): Promise<ToolResult<string>>;
}

export interface LlmTools {
  generate(model: string, prompt: string, costUsd?: number): Promise<ToolResult<string>>;
}

export interface ShellTools {
  exec(command: string, args?: string[]): Promise<ToolResult<string>>;
}

export interface AgentTools {
  fs: FsTools;
  net: NetTools;
  llm: LlmTools;
  shell: ShellTools;
  /** Access the receipt for inspection / finalization. */
  receipt: Receipt;
}

// ─── Factory ────────────────────────────────────────────────────────

/**
 * Create a governed agent tool-set.
 * Every simulated call is recorded as a ReceiptEvent and checked against policies.
 */
export function withReceipts(policy: PolicyEngine): AgentTools {
  const receipt = new Receipt(policy);

  // ── Helpers ─────────────────────────────────────────────────────

  function makeResult<T>(event: ReceiptEvent, data?: T): ToolResult<T> {
    if (event.status === 'BLOCKED_BY_POLICY') {
      return { ok: false, blocked: true, reason: event.policyTrigger, event };
    }
    return { ok: true, data, event };
  }

  // ── FS ──────────────────────────────────────────────────────────

  const fs: FsTools = {
    async readFile(path) {
      const payload: FsPayload = { op: 'readFile', path };
      const event = receipt.addEvent({
        type: 'tool.fs',
        action: `fs.readFile("${path}")`,
        payload,
      });
      return makeResult(event, event.status === 'BLOCKED_BY_POLICY' ? undefined : `[simulated content of ${path}]`);
    },

    async writeFile(path, content) {
      const payload: FsPayload = { op: 'writeFile', path, bytes: Buffer.byteLength(content) };
      const event = receipt.addEvent({
        type: 'tool.fs',
        action: `fs.writeFile("${path}", ${Buffer.byteLength(content)} bytes)`,
        payload,
      });
      return makeResult(event);
    },

    async deleteFile(path) {
      const payload: FsPayload = { op: 'deleteFile', path };
      const event = receipt.addEvent({
        type: 'tool.fs',
        action: `fs.deleteFile("${path}")`,
        payload,
      });
      return makeResult(event);
    },
  };

  // ── NET ─────────────────────────────────────────────────────────

  const net: NetTools = {
    async get(url) {
      const payload: NetPayload = { method: 'GET', url };
      const event = receipt.addEvent({
        type: 'tool.net',
        action: `net.GET ${url}`,
        payload,
      });
      return makeResult(event, event.status === 'BLOCKED_BY_POLICY' ? undefined : `[simulated GET response from ${url}]`);
    },

    async post(url, body?) {
      const payload: NetPayload = { method: 'POST', url };
      const event = receipt.addEvent({
        type: 'tool.net',
        action: `net.POST ${url}`,
        payload,
      });
      return makeResult(event, event.status === 'BLOCKED_BY_POLICY' ? undefined : `[simulated POST response from ${url}]`);
    },
  };

  // ── LLM ─────────────────────────────────────────────────────────

  const llm: LlmTools = {
    async generate(model, prompt, costUsd = 0) {
      const payload: LlmPayload = { model, prompt };
      const event = receipt.addEvent({
        type: 'llm.call',
        action: `llm.generate(${model})`,
        payload,
        costImpactUsd: costUsd,
      });
      return makeResult(event, event.status === 'BLOCKED_BY_POLICY' ? undefined : `[simulated ${model} response]`);
    },
  };

  // ── Shell ───────────────────────────────────────────────────────

  const shell: ShellTools = {
    async exec(command, args?) {
      const payload: ShellPayload = { command, args };
      const event = receipt.addEvent({
        type: 'tool.shell',
        action: `shell.exec("${command}${args ? ' ' + args.join(' ') : ''}")`,
        payload,
      });
      return makeResult(event, event.status === 'BLOCKED_BY_POLICY' ? undefined : `[simulated shell output]`);
    },
  };

  return { fs, net, llm, shell, receipt };
}
