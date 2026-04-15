import Link from 'next/link';
import { Shield, Book, Terminal, Zap, Lock, Globe, Code, ChevronRight, Package, Settings, Eye, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'ReceiptBot — Docs & Tutorial',
  description: 'Complete guide to installing, configuring, and using ReceiptBot for AI agent governance.',
};

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      {children}
    </section>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <pre className="bg-surface-0 rounded-xl px-5 py-4 text-sm font-mono text-text-secondary overflow-x-auto border border-border/40 my-4 leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors py-1">
      <ChevronRight size={12} />
      {children}
    </a>
  );
}

function Callout({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-accent-blue/8 border-accent-blue/20 text-accent-blue',
    warning: 'bg-status-failed/8 border-status-failed/20 text-status-failed',
    tip: 'bg-status-success/8 border-status-success/20 text-status-success',
  };
  const icons = { info: Shield, warning: AlertTriangle, tip: Zap };
  const Icon = icons[type];
  return (
    <div className={`flex gap-3 px-4 py-3.5 rounded-xl border my-5 ${styles[type]}`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed opacity-90">{children}</div>
    </div>
  );
}

function ApiRow({ method, desc }: { method: string; desc: string }) {
  return (
    <tr className="border-b border-border/30 last:border-0">
      <td className="py-3 pr-6 font-mono text-xs text-accent-blue whitespace-nowrap">{method}</td>
      <td className="py-3 text-sm text-text-secondary">{desc}</td>
    </tr>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 sticky top-0 bg-surface-0/90 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-text-primary">ReceiptBot</span>
            </Link>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <Book size={14} />
              Documentation
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-text-tertiary hover:text-text-secondary transition-colors">Try Demo</Link>
            <a
              href="https://github.com/redshadow912/ReceiptBot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full px-6 py-10 gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-28 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-text-tertiary font-semibold mb-2">Getting Started</p>
              <div className="space-y-0.5">
                <NavLink href="#what-is-receiptbot">What is ReceiptBot?</NavLink>
                <NavLink href="#installation">Installation</NavLink>
                <NavLink href="#first-run">First Run (Demos)</NavLink>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-text-tertiary font-semibold mb-2">Core Concepts</p>
              <div className="space-y-0.5">
                <NavLink href="#how-it-works">How It Works</NavLink>
                <NavLink href="#policy-engine">Policy Engine</NavLink>
                <NavLink href="#cost-limits">Cost Limits</NavLink>
                <NavLink href="#secret-redaction">Secret Redaction</NavLink>
                <NavLink href="#the-receipt">The Receipt</NavLink>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-text-tertiary font-semibold mb-2">Integration</p>
              <div className="space-y-0.5">
                <NavLink href="#your-project">Add to Your Project</NavLink>
                <NavLink href="#with-openai">With OpenAI SDK</NavLink>
                <NavLink href="#with-langchain">With LangChain</NavLink>
                <NavLink href="#viewer-ui">Visual Viewer UI</NavLink>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-text-tertiary font-semibold mb-2">Reference</p>
              <div className="space-y-0.5">
                <NavLink href="#api-reference">Full API Reference</NavLink>
                <NavLink href="#receipt-schema">Receipt JSON Schema</NavLink>
                <NavLink href="#intercepted-modules">Intercepted Modules</NavLink>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-16">

          {/* Hero */}
          <div>
            <div className="inline-flex items-center gap-2 bg-surface-2 rounded-full px-3 py-1 text-xs text-text-tertiary mb-5">
              <Book size={12} />
              Full Documentation & Tutorial
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-text-primary mb-4">
              ReceiptBot Docs
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
              Everything you need to know to install, configure, and integrate ReceiptBot&apos;s
              in-process flight recorder into your AI agent stack.
            </p>
          </div>

          {/* What is ReceiptBot */}
          <Section id="what-is-receiptbot">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                <Shield size={16} className="text-accent-blue" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">What is ReceiptBot?</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              ReceiptBot is a <strong className="text-text-primary">runtime governance library</strong> for Node.js AI agents.
              It sits transparently inside your existing process and enforces rules on every I/O operation your agent performs — before the operation executes.
            </p>
            <p className="text-text-secondary leading-relaxed mb-6">
              Think of it as two things working together:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { icon: Lock, color: 'text-status-blocked', bg: 'bg-status-blocked/10', title: 'The Seatbelt', desc: 'A policy engine that evaluates every action before it executes. Denied actions throw a PolicyViolationError and are never carried out.' },
                { icon: Eye, color: 'text-accent-blue', bg: 'bg-accent-blue/10', title: 'The Flight Recorder', desc: 'An append-only event log (a "receipt") that captures every fs read, network call, LLM invocation, and shell command with timestamps and costs.' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="stat-card">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon size={16} className={color} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">{title}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <Callout type="info">
              ReceiptBot does not require a VM, Docker container, or OS sandbox. It operates 100% inside your Node.js process using standard built-in APIs.
            </Callout>
          </Section>

          {/* Installation */}
          <Section id="installation">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                <Package size={16} className="text-accent-purple" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Installation</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              ReceiptBot is a pnpm monorepo. Clone it and install in one step:
            </p>
            <CodeBlock code={`git clone https://github.com/redshadow912/ReceiptBot.git
cd ReceiptBot
pnpm install`} />
            <p className="text-text-secondary leading-relaxed mb-4">
              To use <code className="text-accent-blue bg-surface-2 px-1.5 py-0.5 rounded text-xs">@receiptbot/core</code> in your own project, link it via pnpm workspace or copy the <code className="text-accent-blue bg-surface-2 px-1.5 py-0.5 rounded text-xs">packages/core/src</code> directory.
            </p>
            <Callout type="tip">
              <strong>Requirements:</strong> Node.js ≥ 18 (for native AsyncLocalStorage and fetch support), TypeScript ≥ 5.0, pnpm ≥ 8.
            </Callout>
          </Section>

          {/* First Run */}
          <Section id="first-run">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-success/10 flex items-center justify-center">
                <Terminal size={16} className="text-status-success" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">First Run — The Demos</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-6">
              Two built-in demos let you see the system in action immediately, no API key required.
            </p>

            <div className="space-y-6">
              <div className="event-card p-5">
                <p className="text-sm font-semibold text-text-primary mb-1">Demo 1: Prompt Injection Scenario</p>
                <p className="text-sm text-text-secondary mb-3">A simulated hijacked agent tries to read your <code className="text-accent-blue bg-surface-2 px-1 rounded text-xs">.env</code> file, then falls back to a raw TCP connection to an evil domain. Both are blocked.</p>
                <CodeBlock code="pnpm run demo:rogue" />
              </div>

              <div className="event-card p-5">
                <p className="text-sm font-semibold text-text-primary mb-1">Demo 2: Budget Runaway Scenario</p>
                <p className="text-sm text-text-secondary mb-3">An agent loops through expensive LLM tasks. Watch the running cost climb until it hits your $0.05 cap and is gracefully halted.</p>
                <CodeBlock code="pnpm run example:wallet" />
              </div>

              <div className="event-card p-5">
                <p className="text-sm font-semibold text-text-primary mb-1">Visual UI</p>
                <p className="text-sm text-text-secondary mb-3">Start the local Next.js viewer to inspect receipts visually with filtering, search, and JSON drill-down.</p>
                <CodeBlock code={`pnpm run dev
# → http://localhost:3939`} />
                <p className="text-sm text-text-tertiary">After running a demo, visit <code className="text-accent-blue bg-surface-2 px-1 rounded text-xs">/demo/latest</code> to immediately see its receipt in the UI.</p>
              </div>
            </div>
          </Section>

          {/* How It Works */}
          <Section id="how-it-works">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-failed/10 flex items-center justify-center">
                <Code size={16} className="text-status-failed" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">How It Works</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-5">
              When you call <code className="text-accent-blue bg-surface-2 px-1.5 py-0.5 rounded text-xs">runWithInterceptors()</code>, ReceiptBot:
            </p>
            <ol className="space-y-4 mb-6">
              {[
                { n: '1', title: 'Patches Node.js core', desc: 'Uses createRequire() to obtain mutable CJS references to fs, http, https, child_process, net, and tls. Replaces their methods with governed wrappers.' },
                { n: '2', title: 'Opens an ALS context', desc: 'Binds your { policy, receipt } instance to an AsyncLocalStorage cell scoped to the current async execution tree. Concurrent agents in the same process get completely separate contexts.' },
                { n: '3', title: 'Runs your agent fn()', desc: 'Calls your async function. Any I/O inside it — from your code or any third-party library — hits the patched methods.' },
                { n: '4', title: 'Evaluates every action', desc: 'The patched method reads the current ALS context, runs the event through PolicyEngine.evaluate(), and either allows or throws PolicyViolationError.' },
                { n: '5', title: 'Records the event', desc: 'Whether allowed or blocked, the event is appended to the Receipt with a timestamp, status, payload (redacted if enabled), and cost impact.' },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-3 text-xs font-mono text-text-tertiary flex items-center justify-center mt-0.5">{n}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-0.5">{title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* Policy Engine */}
          <Section id="policy-engine">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-blocked/10 flex items-center justify-center">
                <Settings size={16} className="text-status-blocked" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Policy Engine</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              <code className="text-accent-blue bg-surface-2 px-1.5 py-0.5 rounded text-xs">PolicyEngine</code> is a chainable rule builder.
              Rules are evaluated in order — the first matching deny rule wins.
            </p>
            <CodeBlock lang="typescript" code={`import { PolicyEngine } from '@receiptbot/core';

const policy = new PolicyEngine()

  // Network: only allow these exact domains (and their subdomains)
  .allowDomains([
    'api.openai.com',
    'api.anthropic.com',
    'huggingface.co',
  ])

  // Filesystem: block access to these path globs (minimatch syntax)
  .denyPathGlobs([
    '**/.env',           // any .env file anywhere
    '**/.env.*',         // .env.local, .env.production, etc.
    '**/*.pem',          // TLS certificates
    '**/*.key',          // Private keys
    '**/secrets/**',     // secrets/ directory
    '**/node_modules/**' // dependency source (large attack surface)
  ])

  // Budget: hard stop if cumulative LLM spend exceeds this
  .maxCost(1.00)         // $1.00 per agent run

  // Secrets: strip sensitive values from all event payloads
  .redactSecrets(true);`} />
            <Callout type="warning">
              If you call <code>.allowDomains()</code>, ALL outbound HTTP/HTTPS/TCP is blocked by default. You must explicitly list every domain your agent legitimately needs.
            </Callout>
          </Section>

          {/* Cost Limits */}
          <Section id="cost-limits">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-failed/10 flex items-center justify-center">
                <Zap size={16} className="text-status-failed" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Cost Limits</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              ReceiptBot tracks cumulative LLM spend internally in <strong className="text-text-primary">micro-dollars</strong> (1,000,000 µUSD = $1.00) to avoid floating-point rounding errors on sub-cent API calls.
            </p>
            <CodeBlock lang="typescript" code={`// Set a $0.25 per-run budget
const policy = new PolicyEngine().maxCost(0.25);
const receipt = new Receipt(policy);

await runWithInterceptors(policy, receipt, async () => {
  // Emit LLM events manually, or let your LLM adapter emit them
  receipt.addEvent({
    type: 'llm.call',
    action: 'llm.generate(gpt-4o)',
    payload: { model: 'gpt-4o', prompt: 'Summarize...' },
    costImpactUsd: 0.015,   // ← This gets tracked
  });
  // If the next event would push total over $0.25,
  // a PolicyViolationError is thrown before the call fires.
});`} />
            <p className="text-text-secondary leading-relaxed">
              The cost check runs <em>pre-emptively</em> — the event is evaluated before being recorded. This means the cap is enforced before the API call is made (assuming your adapter emits the event first).
            </p>
          </Section>

          {/* Secret Redaction */}
          <Section id="secret-redaction">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                <Lock size={16} className="text-accent-purple" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Secret Redaction</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              When <code className="text-accent-blue bg-surface-2 px-1 py-0.5 rounded text-xs">.redactSecrets(true)</code> is set, ReceiptBot recursively walks every event payload and replaces matched secrets with a forensic label — <em>before</em> the event is added to the receipt.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left text-xs uppercase tracking-wider text-text-tertiary pb-3 pr-6 font-medium">Label</th>
                    <th className="text-left text-xs uppercase tracking-wider text-text-tertiary pb-3 font-medium">Pattern Example</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['AWS_ACCESS_KEY', 'AKIAIOSFODNN7EXAMPLE'],
                    ['OPENAI_API_KEY', 'sk-proj-abc123...'],
                    ['ANTHROPIC_API_KEY', 'sk-ant-api03-...'],
                    ['STRIPE_KEY', 'sk_live_... / rk_live_...'],
                    ['GITHUB_TOKEN', 'ghp_... / gho_...'],
                    ['SLACK_TOKEN', 'xoxb-...'],
                    ['GCP_API_KEY', 'AIza...'],
                    ['SUPABASE_KEY', 'eyJhbGci... (JWT)'],
                    ['PRIVATE_KEY_PEM', '-----BEGIN RSA PRIVATE KEY-----'],
                    ['BEARER_TOKEN', 'Bearer eyJ...'],
                  ].map(([label, example]) => (
                    <tr key={label} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 pr-6 font-mono text-xs text-status-blocked">[REDACTED_{label}]</td>
                      <td className="py-2.5 text-xs text-text-tertiary font-mono">{example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout type="tip">
              Receipts are safe to share publicly even if your agent accidentally included API keys in its prompts. The redaction happens at record time — the raw value never appears in any log or file.
            </Callout>
          </Section>

          {/* The Receipt */}
          <Section id="the-receipt">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                <Eye size={16} className="text-accent-blue" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">The Receipt</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              The <code className="text-accent-blue bg-surface-2 px-1 py-0.5 rounded text-xs">Receipt</code> class is an append-only event log. It evaluates new events against the policy, applies redaction, and tracks cost and block totals.
            </p>
            <CodeBlock lang="typescript" code={`const receipt = new Receipt(policy);

// Read the live snapshot of totals at any time
receipt.totals;
// → {
//     eventsTotal: 3,
//     blockedTotal: 1,
//     costUsdTotal: 0.0275,    // display value (4 decimal places)
//     costMicroUsdTotal: 27500, // internal integer (÷ 1,000,000 = USD)
//     durationMs: 4201
//   }

// Stamp the end time
receipt.finalize();

// Serialize to plain object (write to disk, send to API, drag into viewer)
const json = receipt.toJSON();
// → { startedAt, endedAt, events: [...], totals: {...} }

// Save to disk
import { writeFileSync } from 'node:fs';
writeFileSync('my-receipt.json', JSON.stringify(json, null, 2));`} />
          </Section>

          {/* Add to your project */}
          <Section id="your-project">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                <Package size={16} className="text-accent-purple" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Add to Your Project</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              The minimal integration is three steps: patch early, define a policy, and wrap your agent in <code className="text-accent-blue bg-surface-2 px-1 py-0.5 rounded text-xs">runWithInterceptors</code>.
            </p>
            <Callout type="warning">
              <strong>ESM Note:</strong> Static <code>import</code> statements execute before runtime code. You cannot call <code>setupGlobalPatches()</code> after importing other modules in the same file. Use a dedicated entrypoint script that patches first, then dynamically imports the rest of your app.
            </Callout>
            <CodeBlock lang="typescript" code={`// entrypoint.ts
import { setupGlobalPatches } from '@receiptbot/core';

// 1. Patch FIRST (opt-in to strict mode if desired)
setupGlobalPatches({ requireContext: true });

// 2. Dynamically import the rest of your app
await import('./main.js');`} />
            <div className="my-6 border-b border-border/20" />
            <CodeBlock lang="typescript" code={`// main.ts
import {
  PolicyEngine,
  Receipt,
  runWithInterceptors,
  teardownGlobalPatches,
  PolicyViolationError,
} from '@receiptbot/core';
import { printReceipt } from '@receiptbot/ui';

// 1. Define your rules
const policy = new PolicyEngine()
  .allowDomains(['api.openai.com'])
  .denyPathGlobs(['**/.env', '**/*.key'])
  .maxCost(2.00)
  .redactSecrets(true);

const receipt = new Receipt(policy);

// 2. Wrap your agent execution
try {
  await runWithInterceptors(policy, receipt, async () => {
    await myAgent.run();
  });
} catch (e) {
  if (e instanceof PolicyViolationError) {
    console.error('Agent was blocked:', e.message);
  }
}

// 3. Inspect results
receipt.finalize();
printReceipt(receipt);                       // ANSI terminal output
console.log(receipt.toJSON());               // Raw JSON

// 4. Clean up (for long-lived servers handling multiple runs)
teardownGlobalPatches();`} />
          </Section>

          {/* With OpenAI */}
          <Section id="with-openai">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-success/10 flex items-center justify-center">
                <Globe size={16} className="text-status-success" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">With the OpenAI SDK</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              The OpenAI SDK uses Node&apos;s native <code className="text-accent-blue bg-surface-2 px-1 py-0.5 rounded text-xs">node:https</code> internally. Since ReceiptBot patches that module globally, all <code className="text-accent-blue bg-surface-2 px-1 py-0.5 rounded text-xs">client.chat.completions.create()</code> calls are automatically intercepted — no SDK wrapper needed.
            </p>
            <CodeBlock lang="typescript" code={`import OpenAI from 'openai';
import { PolicyEngine, Receipt, runWithInterceptors } from '@receiptbot/core';

const openai = new OpenAI();

const policy = new PolicyEngine()
  .allowDomains(['api.openai.com'])
  .maxCost(0.50);

const receipt = new Receipt(policy);

await runWithInterceptors(policy, receipt, async () => {
  // This HTTPS call goes through the ReceiptBot net interceptor.
  // If you add .allowDomains() without 'api.openai.com',
  // the request is blocked before the TCP connection is made.
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  console.log(completion.choices[0].message.content);
});`} />
          </Section>

          {/* With LangChain */}
          <Section id="with-langchain">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-pink/10 flex items-center justify-center">
                <Code size={16} className="text-accent-pink" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">With LangChain</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              The same pattern applies to any framework. Since governance is at the Node.js module level, it doesn&apos;t matter which high-level SDK your agent uses.
            </p>
            <CodeBlock lang="typescript" code={`import { ChatOpenAI } from '@langchain/openai';
import { PolicyEngine, Receipt, runWithInterceptors } from '@receiptbot/core';

const policy = new PolicyEngine()
  .allowDomains(['api.openai.com'])
  .denyPathGlobs(['**/.env'])
  .maxCost(1.00)
  .redactSecrets(true);

const receipt = new Receipt(policy);

await runWithInterceptors(policy, receipt, async () => {
  const llm = new ChatOpenAI({ model: 'gpt-4o' });

  // LangChain's internal HTTP/HTTPS calls are patched
  const response = await llm.invoke('Summarize this document...');
  console.log(response.content);
});

receipt.finalize();
console.log(\`Cost so far: \$\${receipt.totals.costUsdTotal.toFixed(4)}\`);`} />
          </Section>

          {/* Viewer UI */}
          <Section id="viewer-ui">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                <Eye size={16} className="text-accent-blue" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Visual Viewer UI</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              ReceiptBot ships a local Next.js app for inspecting receipts visually.
            </p>
            <CodeBlock code="pnpm run dev   # starts on http://localhost:3939" />
            <div className="space-y-3 mt-4">
              {[
                { title: 'Drag & Drop Upload', desc: 'Drag any receipt.json onto the landing page to view it. Data is stored in localStorage only — nothing is transmitted anywhere.' },
                { title: 'Bundled Demo Receipts', desc: 'Visit /demo/rogue-dev or /demo/budget-runaway to explore pre-baked receipts showing both governance scenarios.' },
                { title: 'Event Timeline', desc: 'Every event is shown in chronological order with its type, timestamp, cost, and status badge. Blocked events are highlighted in red.' },
                { title: 'JSON Drill-Down', desc: 'Click any event row to expand its full typed payload, including any redacted fields shown with forensic labels.' },
                { title: 'Filter & Search', desc: 'Filter by status (All / Blocked / Success / Failed) and full-text search across actions, types, and policy triggers.' },
                { title: 'Export', desc: 'Download the currently loaded receipt.json or copy a Markdown share snippet for documentation or incident reports.' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3">
                  <ChevronRight size={14} className="text-accent-blue flex-shrink-0 mt-1" />
                  <p className="text-sm text-text-secondary"><span className="text-text-primary font-medium">{title} — </span>{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* API Reference */}
          <Section id="api-reference">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
                <Book size={16} className="text-text-secondary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Full API Reference</h2>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-sm font-semibold text-text-primary mb-3 font-mono">PolicyEngine</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <ApiRow method=".allowDomains(domains)" desc="Allowlist outbound HTTP/HTTPS/TCP. Anything not on the list is blocked." />
                      <ApiRow method=".denyPathGlobs(globs)" desc="Block filesystem paths matching minimatch glob patterns." />
                      <ApiRow method=".maxCost(amountUsd)" desc="Throw PolicyViolationError if cumulative cost would exceed this value." />
                      <ApiRow method=".redactSecrets(boolean)" desc="Enable automatic secret scrubbing from all event payloads." />
                      <ApiRow method=".evaluate(event, ctx)" desc="Internal: run all rules against an event. Returns { allowed, reason }." />
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text-primary mb-3 font-mono">Receipt</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <ApiRow method="new Receipt(policy)" desc="Create a new receipt bound to a PolicyEngine instance." />
                      <ApiRow method=".addEvent(params)" desc="Evaluate, redact, and append an event. Throws PolicyViolationError if blocked." />
                      <ApiRow method=".finalize()" desc="Stamp the endedAt timestamp. Call once after agent execution completes." />
                      <ApiRow method=".toJSON()" desc="Serialize to a plain object: { startedAt, endedAt, events, totals }." />
                      <ApiRow method=".totals" desc="Live snapshot: { eventsTotal, blockedTotal, costUsdTotal, durationMs }." />
                      <ApiRow method=".events" desc="Read-only array of all recorded ReceiptEvent objects." />
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text-primary mb-3 font-mono">Functions</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <ApiRow method="runWithInterceptors(policy, receipt, fn)" desc="Patch Node modules, run fn() inside scoped ALS context, return Promise." />
                      <ApiRow method="teardownGlobalPatches()" desc="Restore all patched module methods to their originals." />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Section>

          {/* Receipt Schema */}
          <Section id="receipt-schema">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
                <Code size={16} className="text-text-secondary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Receipt JSON Schema</h2>
            </div>
            <CodeBlock lang="typescript" code={`// Every agent run produces one of these objects
interface SerializedReceipt {
  startedAt: string;        // ISO-8601 start timestamp
  endedAt: string | null;   // ISO-8601 end timestamp (after finalize())
  events: ReceiptEvent[];
  totals: ReceiptTotals;
}

interface ReceiptEvent {
  id: string;               // UUID v4
  timestamp: string;        // ISO-8601
  type: ReceiptEventType;   // 'llm.call' | 'tool.fs' | 'tool.net' | 'tool.shell' | 'agent.step'
  action: string;           // e.g. 'fs.readFile(".env")'
  payload: object;          // Typed by event type (FsPayload, NetPayload, etc.)
  status: ActionStatus;     // 'success' | 'failed' | 'BLOCKED_BY_POLICY'
  costImpactUsd?: number;   // 4-decimal precision
  policyTrigger?: string;   // Reason for block (only present on BLOCKED_BY_POLICY)
}

interface ReceiptTotals {
  eventsTotal: number;
  blockedTotal: number;
  costMicroUsdTotal: number; // Internal: divide by 1,000,000 for USD
  costUsdTotal: number;      // Display value (costMicroUsdTotal / 1_000_000)
  durationMs: number;
}`} />
          </Section>

          {/* Intercepted Modules */}
          <Section id="intercepted-modules">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-blocked/10 flex items-center justify-center">
                <Shield size={16} className="text-status-blocked" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Intercepted Modules</h2>
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">
              Complete list of every Node.js module method patched by ReceiptBot&apos;s global interceptor.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left text-xs uppercase tracking-wider text-text-tertiary pb-3 pr-6 font-medium">Module</th>
                    <th className="text-left text-xs uppercase tracking-wider text-text-tertiary pb-3 font-medium">Methods</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['node:fs', 'readFileSync, writeFileSync, unlinkSync, readFile (cb), writeFile (cb), unlink (cb), createReadStream, createWriteStream'],
                    ['node:fs/promises', 'readFile, writeFile, unlink'],
                    ['node:http', 'request, get'],
                    ['node:https', 'request, get'],
                    ['globalThis', 'fetch'],
                    ['node:child_process', 'exec, execSync, spawn, spawnSync, execFile, execFileSync'],
                    ['node:net', 'connect, createConnection'],
                    ['node:tls', 'connect'],
                  ].map(([mod, methods]) => (
                    <tr key={mod} className="border-b border-border/20 last:border-0">
                      <td className="py-3 pr-6 font-mono text-xs text-accent-blue whitespace-nowrap">{mod}</td>
                      <td className="py-3 text-xs text-text-secondary font-mono">{methods}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Threat Model Boundary */}
          <Section id="threat-model">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-status-failed/10 flex items-center justify-center">
                <AlertTriangle size={16} className="text-status-failed" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Threat Model Boundary</h2>
            </div>
            
            <Callout type="warning">
              <strong>Pragmatic, not bulletproof.</strong> Monkey-patching is an application-level seatbelt, not a hard OS-level sandbox. If you control your deployment infrastructure, Deno or Bun native runtime permissions (<code>--allow-read</code>) are strictly superior security boundaries. ReceiptBot provides governance for the 90% of us stuck in existing Node.js monorepos who can&apos;t easily migrate runtimes.
            </Callout>

            <p className="text-text-secondary leading-relaxed mb-4 mt-6">
              Tools like <a href="https://hermeticsys.com" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Hermetic</a> take a complementary approach: credentials live in an encrypted daemon and agents receive opaque handles instead of raw secrets. ReceiptBot + Hermetic is defense in depth — Hermetic ensures <code>.env</code> contains nothing sensitive, ReceiptBot audits unexpected runtime behavior.
            </p>

            <p className="text-text-secondary leading-relaxed mb-4">
              To be fully transparent, here are the known escape surfaces where an agent could theoretically bypass ReceiptBot&apos;s patching. All of these require specific Node.js APIs or circumstances.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left text-xs uppercase tracking-wider text-text-tertiary pb-3 pr-6 font-medium">Escape Vector</th>
                    <th className="text-left text-xs uppercase tracking-wider text-text-tertiary pb-3 font-medium">Status / Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['vm.runInNewContext()', 'Document only. Gets fresh unpatched builtins. Unfixable from userland JS.'],
                    ['N-API native addons', 'Document only. Can call libuv directly. Unfixable from userland JS.'],
                    ['process.binding(\'fs\')', 'Document only. Deprecated internal C++ binding. Behavior varies by Node version.'],
                    ['Pre-patch captured references', 'Mitigated by patching early using a dedicated entrypoint script. See Add to Your Project section.'],
                    ['setTimeout without ALS context', 'Mitigated by opt-in Strict Mode which forces fail-closed blocks outside an active runWithInterceptors scope.']
                  ].map(([vector, status]) => (
                    <tr key={vector} className="border-b border-border/20 last:border-0">
                      <td className="py-3 pr-6 font-mono text-xs text-status-failed whitespace-nowrap">{vector}</td>
                      <td className="py-3 text-xs text-text-secondary">{status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-4 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-text-tertiary">
          <span>ReceiptBot — Runtime governance for AI agents</span>
          <a
            href="https://github.com/redshadow912/ReceiptBot"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            github.com/redshadow912/ReceiptBot
          </a>
        </div>
      </footer>
    </div>
  );
}
