'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Wand2 } from 'lucide-react';

export interface SchedulableMatch {
  id: string;
  round: string;
  teamA: string | null;
  teamB: string | null;
  courtNumber: number | null;
  scheduledAt: string | null; // ISO
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time. toISOString() is UTC,
// so we offset by the timezone before slicing to keep the displayed value
// matching what the organizer actually picked.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export default function MatchScheduleEditor({
  tournamentId,
  matches,
  numberOfCourts,
}: {
  tournamentId: string;
  matches: SchedulableMatch[];
  numberOfCourts: number;
}) {
  const router = useRouter();
  const [autoBusy, setAutoBusy] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { court: string; time: string }>>(() =>
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        { court: m.courtNumber?.toString() ?? '', time: toLocalInput(m.scheduledAt) },
      ])
    )
  );

  const autoAssign = async () => {
    setAutoBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/auto`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to auto-assign courts');
        return;
      }
      const { assigned } = await res.json();
      toast.success(`Assigned ${assigned} ${assigned === 1 ? 'match' : 'matches'} across ${numberOfCourts} ${numberOfCourts === 1 ? 'court' : 'courts'}`);
      router.refresh();
    } finally {
      setAutoBusy(false);
    }
  };

  const save = async (matchId: string) => {
    setSavingId(matchId);
    try {
      const draft = drafts[matchId];
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtNumber: draft.court === '' ? null : Number(draft.court),
          scheduledAt: draft.time === '' ? null : draft.time,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to save');
        return;
      }
      toast.success('Saved');
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  const setDraft = (id: string, patch: Partial<{ court: string; time: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  return (
    <div>
      <button
        type="button"
        onClick={autoAssign}
        disabled={autoBusy}
        className="mb-4 inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      >
        <Wand2 className="h-4 w-4" />
        {autoBusy ? 'Assigning…' : `Auto-assign courts (${numberOfCourts})`}
      </button>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Court</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {matches.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <div className="text-gray-900 dark:text-gray-100">
                    {m.teamA ?? 'TBD'} <span className="text-gray-400">vs</span> {m.teamB ?? 'TBD'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{m.round}</div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="1"
                    max={numberOfCourts}
                    value={drafts[m.id]?.court ?? ''}
                    onChange={(e) => setDraft(m.id, { court: e.target.value })}
                    className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="datetime-local"
                    value={drafts[m.id]?.time ?? ''}
                    onChange={(e) => setDraft(m.id, { time: e.target.value })}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => save(m.id)}
                    disabled={savingId === m.id}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {savingId === m.id ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
