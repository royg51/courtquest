'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const SUGGESTED_AMOUNTS = [25, 50, 100, 250];

export default function DonationForm() {
  const [selected, setSelected] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountDollars = customAmount ? Number(customAmount) : selected;

  const onSubmit = async () => {
    if (!amountDollars || amountDollars <= 0) {
      toast.error('Enter a donation amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: Math.round(amountDollars * 100) }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to start checkout');
        return;
      }

      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUGGESTED_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => {
              setSelected(amount);
              setCustomAmount('');
            }}
            className={`rounded-md border px-4 py-3 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
              selected === amount && !customAmount
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700">
          Or enter a custom amount
        </label>
        <div className="relative mt-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">$</span>
          <input
            id="customAmount"
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelected(null);
            }}
            placeholder="Custom amount"
            className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      >
        {submitting ? 'Redirecting…' : `Donate${amountDollars ? ` $${amountDollars}` : ''}`}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Securely processed by Stripe. You&apos;ll be redirected to complete payment.
      </p>
    </div>
  );
}
