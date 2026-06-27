'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  tournamentId: string;
  status: string;
  label: string;
}

export function UpdateStatusButton({ tournamentId, status, label }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const update = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to update tournament');
        return;
      }
      toast.success('Tournament updated');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={update}
      disabled={submitting}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {submitting ? 'Updating…' : label}
    </button>
  );
}
