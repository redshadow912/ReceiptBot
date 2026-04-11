'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileJson, Zap, Shield, Eye } from 'lucide-react';
import { isValidReceipt, storeReceipt, type SerializedReceipt } from '@/lib/receipt';

export default function LandingPage() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!isValidReceipt(data)) {
          setError('Invalid receipt format. Expected events array and totals object.');
          return;
        }
        storeReceipt(data as SerializedReceipt);
        router.push('/view');
      } catch {
        setError('Failed to parse JSON. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tighter text-text-primary">ReceiptBot</span>
          </div>
          <a
            href="https://github.com/redshadow912/ReceiptBot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            GitHub →
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-display text-text-primary mb-4">
              Agent Runtime Audit
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-lg mx-auto">
              Upload a <code className="px-1.5 py-0.5 bg-surface-2 rounded text-sm font-mono text-accent-blue">receipt.json</code> to
              visualize every tool call, policy block, and dollar spent.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
              ${dragging
                ? 'border-accent-blue bg-accent-blue/5 scale-[1.01]'
                : 'border-border hover:border-border-hover hover:bg-surface-1/50'
              }
            `}
          >
            <label className="flex flex-col items-center justify-center py-16 px-8 cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <div className={`
                w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-colors duration-300
                ${dragging ? 'bg-accent-blue/20' : 'bg-surface-2'}
              `}>
                <Upload className={`w-7 h-7 transition-colors ${dragging ? 'text-accent-blue' : 'text-text-tertiary'}`} />
              </div>
              <p className="text-text-primary font-medium mb-1">
                Drop receipt.json here
              </p>
              <p className="text-sm text-text-tertiary">
                or click to browse
              </p>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-status-blocked/10 border border-status-blocked/20 text-status-blocked text-sm">
              {error}
            </div>
          )}

          {/* Demo links */}
          <div className="mt-10">
            <p className="text-xs uppercase tracking-widest text-text-tertiary font-medium mb-4 text-center">
              Or try a demo
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/demo/rogue-dev"
                className="group flex items-center gap-3 px-5 py-3.5 rounded-lg bg-surface-1 hover:bg-surface-2 transition-all"
                style={{ boxShadow: '0px 0px 0px 1px rgba(255,255,255,0.06)' }}
              >
                <div className="w-9 h-9 rounded-lg bg-status-blocked/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-status-blocked" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">Rogue Developer</p>
                  <p className="text-xs text-text-tertiary">File policy enforcement</p>
                </div>
              </a>
              <a
                href="/demo/wallet-drainer"
                className="group flex items-center gap-3 px-5 py-3.5 rounded-lg bg-surface-1 hover:bg-surface-2 transition-all"
                style={{ boxShadow: '0px 0px 0px 1px rgba(255,255,255,0.06)' }}
              >
                <div className="w-9 h-9 rounded-lg bg-status-failed/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-status-failed" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">Wallet Drainer</p>
                  <p className="text-xs text-text-tertiary">Cost cap enforcement</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-text-tertiary">
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
