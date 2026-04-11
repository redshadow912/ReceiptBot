'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { loadReceipt, type SerializedReceipt } from '@/lib/receipt';
import ReceiptViewer from '@/components/ReceiptViewer';

export default function ViewPage() {
  const [receipt, setReceipt] = useState<SerializedReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setReceipt(loadReceipt());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-6">
            <Upload className="w-7 h-7 text-text-tertiary" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-2">No receipt loaded</h2>
          <p className="text-sm text-text-secondary mb-6">Upload a receipt.json to get started, or try one of the demos.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-text-primary text-surface-0 text-sm font-medium hover:bg-white transition-colors"
          >
            <Upload size={14} />
            Upload Receipt
          </Link>
        </div>
      </div>
    );
  }

  return <ReceiptViewer receipt={receipt} />;
}
