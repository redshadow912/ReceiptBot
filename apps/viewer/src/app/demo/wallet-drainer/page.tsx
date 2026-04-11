'use client';

import { useEffect, useState } from 'react';
import { isValidReceipt, type SerializedReceipt } from '@/lib/receipt';
import ReceiptViewer from '@/components/ReceiptViewer';

export default function DemoWalletDrainerPage() {
  const [receipt, setReceipt] = useState<SerializedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/samples/receipt-wallet-drainer.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!isValidReceipt(data)) throw new Error('Invalid receipt shape');
        setReceipt(data);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-status-blocked text-sm">
        Failed to load sample: {error}
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ReceiptViewer receipt={receipt} />;
}
