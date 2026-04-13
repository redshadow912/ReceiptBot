'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield, ShieldAlert, DollarSign, Clock, Activity,
  Search, ChevronDown, ChevronRight, Copy, Download,
  HardDrive, Globe, Bot, Terminal, Footprints,
  ArrowLeft, Check,
} from 'lucide-react';
import type { SerializedReceipt } from '@/lib/receipt';
import type { ReceiptEvent } from '@receiptbot/core';

type FilterStatus = 'all' | 'blocked' | 'success' | 'failed';

// ─── Icon mapper ────────────────────────────────────────────────────
function EventIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'tool.fs':     return <HardDrive className={`${cls} text-accent-blue`} />;
    case 'tool.net':    return <Globe className={`${cls} text-accent-purple`} />;
    case 'llm.call':    return <Bot className={`${cls} text-accent-pink`} />;
    case 'tool.shell':  return <Terminal className={`${cls} text-status-failed`} />;
    case 'agent.step':  return <Footprints className={`${cls} text-text-tertiary`} />;
    default:            return <Activity className={`${cls} text-text-tertiary`} />;
  }
}

// ─── Status pill ────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  if (status === 'BLOCKED_BY_POLICY') {
    return (
      <span className="pill bg-status-blocked/15 text-status-blocked animate-pulse-glow">
        BLOCKED
      </span>
    );
  }
  if (status === 'success') {
    return <span className="pill bg-status-success/10 text-status-success">SUCCESS</span>;
  }
  return <span className="pill bg-status-failed/10 text-status-failed">FAILED</span>;
}

// ─── Expandable event row ───────────────────────────────────────────
function EventRow({ event, index }: { event: ReceiptEvent; index: number }) {
  const [open, setOpen] = useState(false);
  const isBlocked = event.status === 'BLOCKED_BY_POLICY';
  const ts = new Date(event.timestamp).toISOString().slice(11, 23);

  return (
    <div
      className={`event-card ${isBlocked ? 'event-card-blocked' : ''} animate-slide-up`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
          <EventIcon type={event.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs text-text-tertiary">{ts}</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-3 text-[10px] font-mono font-medium text-text-secondary uppercase tracking-wider">
              {event.type}
            </span>
          </div>
          <p className="text-sm text-text-primary truncate">{event.action}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {event.costImpactUsd != null && (
            <span className="font-mono text-xs text-status-failed bg-status-failed/10 px-2 py-0.5 rounded">
              ${(event.costImpactUsd || 0).toFixed(4)}
            </span>
          )}
          <StatusPill status={event.status} />
          <span className="text-text-tertiary group-hover:text-text-secondary transition-colors">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30 space-y-3">
          {/* Policy trigger callout */}
          {event.policyTrigger && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-status-blocked/8 border border-status-blocked/15">
              <ShieldAlert className="w-4 h-4 text-status-blocked flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-status-blocked mb-0.5">Policy Triggered</p>
                <p className="text-sm text-status-blocked/80">{event.policyTrigger}</p>
              </div>
            </div>
          )}

          {/* Payload */}
          <div>
            <p className="text-xs font-medium text-text-tertiary mb-1.5 uppercase tracking-wider">Payload</p>
            <pre className="bg-surface-0 rounded-lg px-4 py-3 text-xs font-mono text-text-secondary overflow-x-auto border border-border/30">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main viewer component ──────────────────────────────────────────
export default function ReceiptViewer({ receipt }: { receipt: SerializedReceipt }) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const timestamp = receipt.endedAt || receipt.startedAt || new Date().toISOString();
  const { totals, events } = receipt;

  // ── Filtering + search ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = events;

    if (filter === 'blocked') result = result.filter(e => e.status === 'BLOCKED_BY_POLICY');
    else if (filter === 'success') result = result.filter(e => e.status === 'success');
    else if (filter === 'failed') result = result.filter(e => e.status === 'failed');

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        (e.policyTrigger?.toLowerCase().includes(q)) ||
        JSON.stringify(e.payload).toLowerCase().includes(q)
      );
    }

    return result;
  }, [events, filter, search]);

  // ── Share snippet ─────────────────────────────────────────────────
  const shareSnippet = useMemo(() => {
    const firstBlocked = events.find(e => e.status === 'BLOCKED_BY_POLICY');
    let md = `🧾 ReceiptBot: ${totals.eventsTotal} events • ${totals.blockedTotal} blocked • $${(totals.costUsdTotal || 0).toFixed(4)} • ${totals.durationMs}ms`;
    if (firstBlocked?.policyTrigger) {
      md += `\nTop block: ${firstBlocked.policyTrigger}`;
    }
    return md;
  }, [events, totals]);

  const handleCopyShare = async () => {
    await navigator.clipboard.writeText(shareSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'receipt.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filter pills config ───────────────────────────────────────────
  const filters: { value: FilterStatus; label: string; count?: number }[] = [
    { value: 'all',     label: 'All',     count: events.length },
    { value: 'blocked', label: 'Blocked', count: events.filter(e => e.status === 'BLOCKED_BY_POLICY').length },
    { value: 'success', label: 'Success', count: events.filter(e => e.status === 'success').length },
    { value: 'failed',  label: 'Failed',  count: events.filter(e => e.status === 'failed').length },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 sticky top-0 bg-surface-0/80 backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-text-tertiary hover:text-text-secondary transition-colors text-sm">
              <ArrowLeft size={14} />
              Back
            </Link>
            <div className="w-px h-5 bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-blue" />
                <span className="text-sm font-semibold tracking-tight text-text-primary">ReceiptBot</span>
              </div>
              <p className="text-[11px] text-text-tertiary">Agent Runtime Audit Receipt</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-tertiary hidden sm:inline">
              {new Date(timestamp).toLocaleString()}
            </span>
            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all"
              style={{ boxShadow: '0px 0px 0px 1px rgba(255,255,255,0.06)' }}
            >
              {copied ? <Check size={13} className="text-status-success" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all"
              style={{ boxShadow: '0px 0px 0px 1px rgba(255,255,255,0.06)' }}
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* ── Totals cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-accent-blue" />
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Total Events</span>
              </div>
              <p className="text-3xl font-semibold tracking-tighter text-accent-blue tabular-nums">
                {totals.eventsTotal}
              </p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-status-blocked" />
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Blocked</span>
              </div>
              <p className={`text-3xl font-semibold tracking-tighter tabular-nums ${
                totals.blockedTotal > 0 ? 'text-status-blocked' : 'text-status-success'
              }`}>
                {totals.blockedTotal}
              </p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-status-failed" />
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Total Cost</span>
              </div>
              <p className="text-3xl font-semibold tracking-tighter text-status-failed tabular-nums">
                ${(totals.costUsdTotal || 0).toFixed(4)}
              </p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-text-secondary" />
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Duration</span>
              </div>
              <p className="text-3xl font-semibold tracking-tighter text-text-primary tabular-nums">
                {totals.durationMs}<span className="text-lg text-text-tertiary ml-0.5">ms</span>
              </p>
            </div>
          </div>

          {/* ── Filters + Search ──────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-1.5">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f.value
                      ? 'bg-text-primary text-surface-0'
                      : 'bg-surface-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-3'
                  }`}
                >
                  {f.label}
                  {f.count != null && f.count > 0 && (
                    <span className={`ml-1.5 ${filter === f.value ? 'text-surface-0/60' : 'text-text-tertiary/60'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="glass-input w-full pl-9 text-sm"
              />
            </div>
          </div>

          {/* ── Timeline ──────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-text-tertiary font-medium mb-3">
              Event Timeline
              {filtered.length !== events.length && (
                <span className="ml-2 text-text-tertiary/50">
                  Showing {filtered.length} of {events.length}
                </span>
              )}
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-text-tertiary">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No events match your filters</p>
              </div>
            ) : (
              filtered.map((event, i) => (
                <EventRow key={event.id} event={event} index={i} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-4 mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-text-tertiary">
          <span>ReceiptBot — Runtime governance for AI agents</span>
          <a href="https://github.com/redshadow912/ReceiptBot" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
