'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  tournamentId: string;
  teamId: string;
  entryFeeCents: number;
}

export function PayEntryFeeButton({ tournamentId, teamId, entryFeeCents }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}/checkout`, {
        method: 'POST',
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
    <button
      type="button"
      onClick={pay}
      disabled={submitting}
      className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
    >
      {submitting ? 'Redirecting…' : `Pay Entry Fee ($${(entryFeeCents / 100).toFixed(2)})`}
    </button>
  );
}
