// ─── Global Node.js Interceptor ─────────────────────────────────────
// Monkey‑patches Node.js core modules (fs, http, https, child_process)
// so that ANY code in the same process — even raw fs.readFileSync()
// from AI‑generated code — gets routed through ReceiptBot governance.
//
// Uses AsyncLocalStorage for multi‑tenant safety: each agent run gets
// its own scoped {policy, receipt} context.
//
// NOTE: We use createRequire() to obtain mutable CJS references to
// core modules. ESM namespace objects are read-only (sealed), so
// direct property assignment on `import * as fs` fails. CJS module
// objects are plain JS objects and can be patched freely. This is the
// same technique used by Datadog dd-trace, New Relic, and OpenTelemetry.

import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire } from 'node:module';
import type { PolicyEngine } from './policy-engine.js';
import type { Receipt } from './receipt.js';
import { PolicyViolationError } from './errors.js';
import type { FsPayload, NetPayload, ShellPayload } from './schema.js';

// Obtain mutable CJS references to core modules
const require = createRequire(import.meta.url);
const fsModule = require('node:fs');
const fsPromisesModule = require('node:fs/promises');
const httpModule = require('node:http');
const httpsModule = require('node:https');
const childProcessModule = require('node:child_process');

// ─── Types ──────────────────────────────────────────────────────────

export interface InterceptorContext {
  policy: PolicyEngine;
  receipt: Receipt;
}

// ─── AsyncLocalStorage ──────────────────────────────────────────────

const interceptorStore = new AsyncLocalStorage<InterceptorContext>();

/**
 * Internal flag to prevent infinite recursion when ReceiptBot's own
 * code performs I/O (e.g. writing receipt JSON to disk).
 */
let _isInternalCall = false;

function withInternalGuard<T>(fn: () => T): T {
  _isInternalCall = true;
  try {
    return fn();
  } finally {
    _isInternalCall = false;
  }
}

/**
 * Helper: get the current interceptor context from AsyncLocalStorage.
 * Returns null if we are outside a `runWithInterceptors` scope or if
 * this is an internal ReceiptBot call (to prevent recursion).
 */
function getContext(): InterceptorContext | null {
  if (_isInternalCall) return null;
  return interceptorStore.getStore() ?? null;
}

// ─── Stored Originals ───────────────────────────────────────────────

let _patched = false;

// Sync FS
const _origReadFileSync = fsModule.readFileSync;
const _origWriteFileSync = fsModule.writeFileSync;
const _origUnlinkSync = fsModule.unlinkSync;

// Async FS (promises)
const _origFsReadFile = fsPromisesModule.readFile;
const _origFsWriteFile = fsPromisesModule.writeFile;
const _origFsUnlink = fsPromisesModule.unlink;

// HTTP / HTTPS
const _origHttpRequest = httpModule.request;
const _origHttpGet = httpModule.get;
const _origHttpsRequest = httpsModule.request;
const _origHttpsGet = httpsModule.get;

// child_process
const _origExecSync = childProcessModule.execSync;
const _origExec = childProcessModule.exec;
const _origSpawn = childProcessModule.spawn;

// fetch
const _origFetch = globalThis.fetch?.bind(globalThis);

// ─── Interceptor Helpers ────────────────────────────────────────────

/**
 * Route a filesystem operation through the policy engine.
 * If blocked, records the event and throws PolicyViolationError.
 */
function interceptFs(
  ctx: InterceptorContext,
  op: 'readFile' | 'writeFile' | 'deleteFile',
  filePath: string,
): void {
  const payload: FsPayload = { op, path: filePath };
  const event = ctx.receipt.addEvent({
    type: 'tool.fs',
    action: `fs.${op}("${filePath}")`,
    payload,
  });

  if (event.status === 'BLOCKED_BY_POLICY') {
    throw new PolicyViolationError('tool.fs', `fs.${op}("${filePath}")`, event.policyTrigger ?? 'Policy violation');
  }
}

/**
 * Route a network request through the policy engine.
 * If blocked, throws PolicyViolationError.
 */
function interceptNet(
  ctx: InterceptorContext,
  method: 'GET' | 'POST',
  url: string,
): void {
  const payload: NetPayload = { method, url };
  const event = ctx.receipt.addEvent({
    type: 'tool.net',
    action: `net.${method} ${url}`,
    payload,
  });

  if (event.status === 'BLOCKED_BY_POLICY') {
    throw new PolicyViolationError('tool.net', `net.${method} ${url}`, event.policyTrigger ?? 'Policy violation');
  }
}

/**
 * Route a shell command through the policy engine.
 * If blocked, throws PolicyViolationError.
 */
function interceptShell(
  ctx: InterceptorContext,
  command: string,
  args?: string[],
): void {
  const payload: ShellPayload = { command, args };
  const event = ctx.receipt.addEvent({
    type: 'tool.shell',
    action: `shell.exec("${command}${args ? ' ' + args.join(' ') : ''}")`,
    payload,
  });

  if (event.status === 'BLOCKED_BY_POLICY') {
    throw new PolicyViolationError('tool.shell', `shell.exec("${command}")`, event.policyTrigger ?? 'Policy violation');
  }
}

/**
 * Extract the full URL string from http.request / https.request arguments.
 */
function extractUrlFromHttpArgs(
  protocol: 'http' | 'https',
  args: any[],
): string | null {
  const first = args[0];
  if (typeof first === 'string') return first;
  if (first instanceof URL) return first.toString();
  if (typeof first === 'object' && first !== null) {
    const host = first.hostname || first.host || 'unknown';
    const port = first.port ? `:${first.port}` : '';
    const path = first.path || '/';
    return `${protocol}://${host}${port}${path}`;
  }
  return null;
}

// ─── Patch Functions ────────────────────────────────────────────────

function patchFs(): void {
  // ── Sync ──
  fsModule.readFileSync = function patchedReadFileSync(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const filePath = String(args[0]);
      interceptFs(ctx, 'readFile', filePath);
    }
    return withInternalGuard(() => _origReadFileSync.apply(fsModule, args));
  };

  fsModule.writeFileSync = function patchedWriteFileSync(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const filePath = String(args[0]);
      interceptFs(ctx, 'writeFile', filePath);
    }
    return withInternalGuard(() => _origWriteFileSync.apply(fsModule, args));
  };

  fsModule.unlinkSync = function patchedUnlinkSync(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const filePath = String(args[0]);
      interceptFs(ctx, 'deleteFile', filePath);
    }
    return withInternalGuard(() => _origUnlinkSync.apply(fsModule, args));
  };

  // ── Async (promises) ──
  fsPromisesModule.readFile = async function patchedReadFile(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const filePath = String(args[0]);
      interceptFs(ctx, 'readFile', filePath);
    }
    return withInternalGuard(() => _origFsReadFile.apply(fsPromisesModule, args));
  };

  fsPromisesModule.writeFile = async function patchedWriteFile(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const filePath = String(args[0]);
      interceptFs(ctx, 'writeFile', filePath);
    }
    return withInternalGuard(() => _origFsWriteFile.apply(fsPromisesModule, args));
  };

  fsPromisesModule.unlink = async function patchedUnlink(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const filePath = String(args[0]);
      interceptFs(ctx, 'deleteFile', filePath);
    }
    return withInternalGuard(() => _origFsUnlink.apply(fsPromisesModule, args));
  };
}

function patchHttp(): void {
  function createPatchedRequest(
    protocol: 'http' | 'https',
    originalFn: (...args: any[]) => any,
    mod: any,
  ) {
    return function patchedRequest(this: any, ...args: any[]) {
      const ctx = getContext();
      if (ctx) {
        const url = extractUrlFromHttpArgs(protocol, args);
        if (url) {
          interceptNet(ctx, 'GET', url);
        }
      }
      return withInternalGuard(() => originalFn.apply(mod, args));
    };
  }

  httpModule.request = createPatchedRequest('http', _origHttpRequest, httpModule);
  httpModule.get = createPatchedRequest('http', _origHttpGet, httpModule);
  httpsModule.request = createPatchedRequest('https', _origHttpsRequest, httpsModule);
  httpsModule.get = createPatchedRequest('https', _origHttpsGet, httpsModule);
}

function patchChildProcess(): void {
  childProcessModule.execSync = function patchedExecSync(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const command = String(args[0]);
      interceptShell(ctx, command);
    }
    return withInternalGuard(() => _origExecSync.apply(childProcessModule, args));
  };

  childProcessModule.exec = function patchedExec(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const command = String(args[0]);
      interceptShell(ctx, command);
    }
    return withInternalGuard(() => _origExec.apply(childProcessModule, args));
  };

  childProcessModule.spawn = function patchedSpawn(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      const command = String(args[0]);
      const spawnArgs = Array.isArray(args[1]) ? args[1] : undefined;
      interceptShell(ctx, command, spawnArgs);
    }
    return withInternalGuard(() => _origSpawn.apply(childProcessModule, args));
  };
}

function patchFetch(): void {
  if (typeof globalThis.fetch !== 'function') return;

  globalThis.fetch = async function patchedFetch(...args: any[]) {
    const ctx = getContext();
    if (ctx) {
      let url = '';
      if (typeof args[0] === 'string') url = args[0];
      else if (args[0] instanceof URL) url = args[0].toString();
      else if (args[0] instanceof Request) url = args[0].url;

      if (url) {
        const method = (args[1]?.method ?? 'GET').toUpperCase();
        interceptNet(ctx, method === 'POST' ? 'POST' : 'GET', url);
      }
    }
    return withInternalGuard(() => _origFetch!.apply(globalThis, args as [input: string | URL | Request, init?: RequestInit]));
  } as typeof fetch;
}

// ─── Restore Functions ──────────────────────────────────────────────

function restoreFs(): void {
  fsModule.readFileSync = _origReadFileSync;
  fsModule.writeFileSync = _origWriteFileSync;
  fsModule.unlinkSync = _origUnlinkSync;
  fsPromisesModule.readFile = _origFsReadFile;
  fsPromisesModule.writeFile = _origFsWriteFile;
  fsPromisesModule.unlink = _origFsUnlink;
}

function restoreHttp(): void {
  httpModule.request = _origHttpRequest;
  httpModule.get = _origHttpGet;
  httpsModule.request = _origHttpsRequest;
  httpsModule.get = _origHttpsGet;
}

function restoreChildProcess(): void {
  childProcessModule.execSync = _origExecSync;
  childProcessModule.exec = _origExec;
  childProcessModule.spawn = _origSpawn;
}

function restoreFetch(): void {
  if (_origFetch) {
    globalThis.fetch = _origFetch;
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Apply global monkey-patches to Node.js core modules.
 * Idempotent — safe to call multiple times.
 */
export function setupGlobalPatches(): void {
  if (_patched) return;
  patchFs();
  patchHttp();
  patchChildProcess();
  patchFetch();
  _patched = true;
}

/**
 * Restore all original Node.js core module functions.
 * Safe to call even if patches were never applied.
 */
export function teardownGlobalPatches(): void {
  restoreFs();
  restoreHttp();
  restoreChildProcess();
  restoreFetch();
  _patched = false;
}

/**
 * Run a function within a scoped interceptor context.
 *
 * All Node.js core module calls made within `fn` (including calls from
 * third-party libraries like axios, got, etc.) will be routed through
 * the provided PolicyEngine and recorded to the provided Receipt.
 *
 * Multiple concurrent calls to `runWithInterceptors` with different
 * policy/receipt pairs are safe — AsyncLocalStorage ensures each async
 * chain gets its own context.
 *
 * @example
 * ```ts
 * const policy = new PolicyEngine().denyPathGlobs(['**\/.env']);
 * const receipt = new Receipt(policy);
 *
 * await runWithInterceptors(policy, receipt, async () => {
 *   // Even raw Node.js calls are governed here!
 *   fs.readFileSync('.env'); // → throws PolicyViolationError
 * });
 *
 * receipt.finalize();
 * ```
 */
export async function runWithInterceptors(
  policy: PolicyEngine,
  receipt: Receipt,
  fn: () => Promise<void> | void,
): Promise<void> {
  // Ensure patches are applied (idempotent)
  setupGlobalPatches();

  // Run the user function within a scoped context
  return interceptorStore.run({ policy, receipt }, async () => {
    await fn();
  });
}
