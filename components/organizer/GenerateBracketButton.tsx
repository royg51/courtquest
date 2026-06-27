'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function GenerateBracketButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const generate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket/generate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to generate bracket');
        return;
      }
      toast.success('Bracket generated');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={submitting}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
    >
      {submitting ? 'Generating…' : 'Generate Bracket'}
    </button>
  );
}
