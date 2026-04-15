// ─── Global Node.js Interceptor ─────────────────────────────────────
// Monkey‑patches Node.js core modules (fs, http, https, child_process)
// so that ANY code in the same process — even raw fs.readFileSync()
// from AI‑generated code — gets routed through ReceiptBot governance.
//
// Uses AsyncLocalStorage for multi‑tenant safety: each agent run gets
// its own scoped {policy, receipt} context.
//
// Strict mode: set requireContext: true in setupGlobalPatches() to
// fail-closed outside a runWithInterceptors() scope. Default is
// fail-open (intentional — non-agent code paths must not be broken).
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
const netModule = require('node:net');
const tlsModule = require('node:tls');

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

/**
 * Strict mode flag. When true, any call intercepted outside a
 * runWithInterceptors() scope throws PolicyViolationError instead of
 * silently passing through. Default: false (fail-open for compatibility).
 *
 * First explicit boolean set wins — subsequent setupGlobalPatches()
 * calls without { requireContext } do NOT reset this flag.
 */
let _requireContext = false;

/**
 * Optional callback invoked when strict mode blocks an outside-context
 * call. No receipt exists at this point. Use for external logging.
 */
let _onViolation: ((err: PolicyViolationError) => void) | undefined;

function withInternalGuard<T>(fn: () => T): T {
  _isInternalCall = true;
  try {
    return fn();
  } finally {
    _isInternalCall = false;
  }
}

/**
 * Check whether the current call is an internal ReceiptBot call.
 * Must be called BEFORE getContext() in every patched function.
 */
function isInternal(): boolean {
  return _isInternalCall;
}

/**
 * Helper: get the current interceptor context from AsyncLocalStorage.
 * Returns null if we are outside a `runWithInterceptors` scope.
 * NOTE: Do NOT call this for the internal-call check — use isInternal().
 */
function getContext(): InterceptorContext | null {
  return interceptorStore.getStore() ?? null;
}

/**
 * Enforce strict mode: throw if no ALS context and requireContext is true.
 * Call AFTER isInternal() check, BEFORE policy evaluation.
 */
function enforceStrictMode(
  type: 'tool.fs' | 'tool.net' | 'tool.shell',
  action: string,
): void {
  if (_requireContext) {
    const err = new PolicyViolationError(
      type,
      action,
      'Call intercepted outside governance context — wrap your agent in runWithInterceptors()',
    );
    _onViolation?.(err);
    throw err;
  }
}

// ─── Stored Originals ───────────────────────────────────────────────

let _patched = false;

// Sync FS
const _origReadFileSync = fsModule.readFileSync;
const _origWriteFileSync = fsModule.writeFileSync;
const _origUnlinkSync = fsModule.unlinkSync;

// Callback/Stream FS
const _origFsReadFileCb = fsModule.readFile;
const _origFsCreateReadStream = fsModule.createReadStream;
const _origFsCreateWriteStream = fsModule.createWriteStream;

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
const _origExecFile = childProcessModule.execFile;
const _origExecFileSync = childProcessModule.execFileSync;
const _origSpawnSync = childProcessModule.spawnSync;

// net / tls
const _origNetConnect = netModule.connect;
const _origNetCreateConnection = netModule.createConnection;
const _origTlsConnect = tlsModule.connect;

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

/**
 * Extract the host/port/path from net.connect / tls.connect arguments.
 */
function extractUrlFromNetArgs(protocol: 'tcp' | 'tls', args: any[]): string | null {
  const first = args[0];
  if (typeof first === 'object' && first !== null) {
    const host = first.host || first.hostname || 'localhost';
    const port = first.port ? `:${first.port}` : '';
    return `${protocol}://${host}${port}`;
  } else if (typeof first === 'number') {
    const host = typeof args[1] === 'string' ? args[1] : 'localhost';
    return `${protocol}://${host}:${first}`;
  } else if (typeof first === 'string') {
    return `${protocol}://unix:${first}`;
  }
  return null;
}

// ─── Patch Functions ────────────────────────────────────────────────

function patchFs(): void {
  // ── Sync ──
  fsModule.readFileSync = function patchedReadFileSync(...args: any[]) {
    if (isInternal()) return _origReadFileSync.apply(fsModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.readFile("${String(args[0])}")`) ; return _origReadFileSync.apply(fsModule, args); }
    interceptFs(ctx, 'readFile', String(args[0]));
    return withInternalGuard(() => _origReadFileSync.apply(fsModule, args));
  };

  fsModule.writeFileSync = function patchedWriteFileSync(...args: any[]) {
    if (isInternal()) return _origWriteFileSync.apply(fsModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.writeFile("${String(args[0])}")`) ; return _origWriteFileSync.apply(fsModule, args); }
    interceptFs(ctx, 'writeFile', String(args[0]));
    return withInternalGuard(() => _origWriteFileSync.apply(fsModule, args));
  };

  fsModule.unlinkSync = function patchedUnlinkSync(...args: any[]) {
    if (isInternal()) return _origUnlinkSync.apply(fsModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.unlink("${String(args[0])}")`) ; return _origUnlinkSync.apply(fsModule, args); }
    interceptFs(ctx, 'deleteFile', String(args[0]));
    return withInternalGuard(() => _origUnlinkSync.apply(fsModule, args));
  };

  // ── Callback / Streams ──
  fsModule.readFile = function patchedReadFileCb(...args: any[]) {
    if (isInternal()) return _origFsReadFileCb.apply(fsModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.readFile("${String(args[0])}")`) ; return _origFsReadFileCb.apply(fsModule, args); }
    interceptFs(ctx, 'readFile', String(args[0]));
    return withInternalGuard(() => _origFsReadFileCb.apply(fsModule, args));
  };

  fsModule.createReadStream = function patchedCreateReadStream(...args: any[]) {
    if (isInternal()) return _origFsCreateReadStream.apply(fsModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.readFile("${String(args[0])}")`) ; return _origFsCreateReadStream.apply(fsModule, args); }
    interceptFs(ctx, 'readFile', String(args[0]));
    return withInternalGuard(() => _origFsCreateReadStream.apply(fsModule, args));
  };

  fsModule.createWriteStream = function patchedCreateWriteStream(...args: any[]) {
    if (isInternal()) return _origFsCreateWriteStream.apply(fsModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.writeFile("${String(args[0])}")`) ; return _origFsCreateWriteStream.apply(fsModule, args); }
    interceptFs(ctx, 'writeFile', String(args[0]));
    return withInternalGuard(() => _origFsCreateWriteStream.apply(fsModule, args));
  };

  // ── Async (promises) ──
  fsPromisesModule.readFile = async function patchedReadFile(...args: any[]) {
    if (isInternal()) return _origFsReadFile.apply(fsPromisesModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.readFile("${String(args[0])}")`) ; return _origFsReadFile.apply(fsPromisesModule, args); }
    interceptFs(ctx, 'readFile', String(args[0]));
    return withInternalGuard(() => _origFsReadFile.apply(fsPromisesModule, args));
  };

  fsPromisesModule.writeFile = async function patchedWriteFile(...args: any[]) {
    if (isInternal()) return _origFsWriteFile.apply(fsPromisesModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.writeFile("${String(args[0])}")`) ; return _origFsWriteFile.apply(fsPromisesModule, args); }
    interceptFs(ctx, 'writeFile', String(args[0]));
    return withInternalGuard(() => _origFsWriteFile.apply(fsPromisesModule, args));
  };

  fsPromisesModule.unlink = async function patchedUnlink(...args: any[]) {
    if (isInternal()) return _origFsUnlink.apply(fsPromisesModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.fs', `fs.unlink("${String(args[0])}")`) ; return _origFsUnlink.apply(fsPromisesModule, args); }
    interceptFs(ctx, 'deleteFile', String(args[0]));
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
      if (isInternal()) return originalFn.apply(mod, args);
      const ctx = getContext();
      if (!ctx) {
        const url = extractUrlFromHttpArgs(protocol, args);
        if (url) enforceStrictMode('tool.net', `net.GET ${url}`);
        return originalFn.apply(mod, args);
      }
      const url = extractUrlFromHttpArgs(protocol, args);
      if (url) interceptNet(ctx, 'GET', url);
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
    if (isInternal()) return _origExecSync.apply(childProcessModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.shell', `shell.exec("${String(args[0])}")`) ; return _origExecSync.apply(childProcessModule, args); }
    interceptShell(ctx, String(args[0]));
    return withInternalGuard(() => _origExecSync.apply(childProcessModule, args));
  };

  childProcessModule.exec = function patchedExec(...args: any[]) {
    if (isInternal()) return _origExec.apply(childProcessModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.shell', `shell.exec("${String(args[0])}")`) ; return _origExec.apply(childProcessModule, args); }
    interceptShell(ctx, String(args[0]));
    return withInternalGuard(() => _origExec.apply(childProcessModule, args));
  };

  childProcessModule.spawn = function patchedSpawn(...args: any[]) {
    if (isInternal()) return _origSpawn.apply(childProcessModule, args);
    const ctx = getContext();
    const spawnArgs = Array.isArray(args[1]) ? args[1] : undefined;
    if (!ctx) { enforceStrictMode('tool.shell', `shell.exec("${String(args[0])}")`) ; return _origSpawn.apply(childProcessModule, args); }
    interceptShell(ctx, String(args[0]), spawnArgs);
    return withInternalGuard(() => _origSpawn.apply(childProcessModule, args));
  };

  childProcessModule.execFile = function patchedExecFile(...args: any[]) {
    if (isInternal()) return _origExecFile.apply(childProcessModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.shell', `shell.exec("${String(args[0])}")`) ; return _origExecFile.apply(childProcessModule, args); }
    interceptShell(ctx, String(args[0]));
    return withInternalGuard(() => _origExecFile.apply(childProcessModule, args));
  };

  childProcessModule.execFileSync = function patchedExecFileSync(...args: any[]) {
    if (isInternal()) return _origExecFileSync.apply(childProcessModule, args);
    const ctx = getContext();
    if (!ctx) { enforceStrictMode('tool.shell', `shell.exec("${String(args[0])}")`) ; return _origExecFileSync.apply(childProcessModule, args); }
    interceptShell(ctx, String(args[0]));
    return withInternalGuard(() => _origExecFileSync.apply(childProcessModule, args));
  };

  childProcessModule.spawnSync = function patchedSpawnSync(...args: any[]) {
    if (isInternal()) return _origSpawnSync.apply(childProcessModule, args);
    const ctx = getContext();
    const spawnArgs = Array.isArray(args[1]) ? args[1] : undefined;
    if (!ctx) { enforceStrictMode('tool.shell', `shell.exec("${String(args[0])}")`) ; return _origSpawnSync.apply(childProcessModule, args); }
    interceptShell(ctx, String(args[0]), spawnArgs);
    return withInternalGuard(() => _origSpawnSync.apply(childProcessModule, args));
  };
}

function patchNet(): void {
  function createPatchedConnect(
    protocol: 'tcp' | 'tls',
    originalFn: (...args: any[]) => any,
    mod: any,
  ) {
    return function patchedConnect(this: any, ...args: any[]) {
      if (isInternal()) return originalFn.apply(mod, args);
      const ctx = getContext();
      if (!ctx) {
        const url = extractUrlFromNetArgs(protocol, args);
        if (url) enforceStrictMode('tool.net', `net.connect("${url}")`);
        return originalFn.apply(mod, args);
      }
      const url = extractUrlFromNetArgs(protocol, args);
      if (url) interceptNet(ctx, 'GET', url);
      return withInternalGuard(() => originalFn.apply(mod, args));
    };
  }

  netModule.connect = createPatchedConnect('tcp', _origNetConnect, netModule);
  netModule.createConnection = createPatchedConnect('tcp', _origNetCreateConnection, netModule);
  tlsModule.connect = createPatchedConnect('tls', _origTlsConnect, tlsModule);
}

function patchFetch(): void {
  if (typeof globalThis.fetch !== 'function') return;

  globalThis.fetch = async function patchedFetch(...args: any[]) {
    if (isInternal()) return _origFetch!.apply(globalThis, args as [input: string | URL | Request, init?: RequestInit]);
    const ctx = getContext();
    let url = '';
    if (typeof args[0] === 'string') url = args[0];
    else if (args[0] instanceof URL) url = args[0].toString();
    else if (args[0] instanceof Request) url = args[0].url;
    if (!ctx) {
      if (url) enforceStrictMode('tool.net', `net.GET ${url}`);
      return _origFetch!.apply(globalThis, args as [input: string | URL | Request, init?: RequestInit]);
    }
    if (url) {
      const method = (args[1]?.method ?? 'GET').toUpperCase();
      interceptNet(ctx, method === 'POST' ? 'POST' : 'GET', url);
    }
    return withInternalGuard(() => _origFetch!.apply(globalThis, args as [input: string | URL | Request, init?: RequestInit]));
  } as typeof fetch;
}

// ─── Restore Functions ──────────────────────────────────────────────

function restoreFs(): void {
  fsModule.readFileSync = _origReadFileSync;
  fsModule.writeFileSync = _origWriteFileSync;
  fsModule.unlinkSync = _origUnlinkSync;
  fsModule.readFile = _origFsReadFileCb;
  fsModule.createReadStream = _origFsCreateReadStream;
  fsModule.createWriteStream = _origFsCreateWriteStream;
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
  childProcessModule.execFile = _origExecFile;
  childProcessModule.execFileSync = _origExecFileSync;
  childProcessModule.spawnSync = _origSpawnSync;
}

function restoreNet(): void {
  netModule.connect = _origNetConnect;
  netModule.createConnection = _origNetCreateConnection;
  tlsModule.connect = _origTlsConnect;
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
 *
 * @param options.requireContext - When true, any intercepted call outside a
 *   runWithInterceptors() scope throws PolicyViolationError (strict mode).
 *   Default: false (fail-open — non-agent code paths are not affected).
 *   First explicit boolean set wins; calling without options does NOT reset this.
 * @param options.onViolation - Optional callback invoked on strict-mode blocks.
 *   No receipt exists at this point. Use for external logging.
 */
export function setupGlobalPatches(options?: {
  requireContext?: boolean;
  onViolation?: (err: PolicyViolationError) => void;
}): void {
  // First explicit boolean wins — do not reset if called without options
  if (typeof options?.requireContext === 'boolean') {
    _requireContext = options.requireContext;
  }
  if (typeof options?.onViolation === 'function') {
    _onViolation = options.onViolation;
  }
  if (_patched) return;
  patchFs();
  patchHttp();
  patchChildProcess();
  patchNet();
  patchFetch();
  _patched = true;
}

/**
 * Restore all original Node.js core module functions and reset strict mode.
 * Safe to call even if patches were never applied.
 */
export function teardownGlobalPatches(): void {
  restoreFs();
  restoreHttp();
  restoreChildProcess();
  restoreNet();
  restoreFetch();
  _patched = false;
  _requireContext = false;
  _onViolation = undefined;
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
