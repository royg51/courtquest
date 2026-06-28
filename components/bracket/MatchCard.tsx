// Single match card within the bracket.
// Shows: teamA/teamB names, scores (if completed), winner highlight.
// In organizer mode: "Enter Score" switches the card into an inline edit state.

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import type { MatchWithTeams } from '@/types';

interface Props {
  match: MatchWithTeams;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

const STATUS_STYLE: Record<MatchWithTeams['status'], string> = {
  PENDING: 'text-gray-400 dark:text-gray-500',
  IN_PROGRESS: 'text-brand-600 dark:text-brand-400',
  COMPLETED: 'text-gray-400 dark:text-gray-500',
  BYE: 'italic text-gray-400 dark:text-gray-500',
};

const STATUS_LABEL: Record<MatchWithTeams['status'], string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Final',
  BYE: 'Bye',
};

export default function MatchCard({ match, mode = 'public', onScoreSubmit }: Props) {
  const [editing, setEditing] = useState(false);
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() ?? '');
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() ?? '');
  const [submitting, setSubmitting] = useState(false);

  const canScore =
    mode === 'organizer' && match.status === 'PENDING' && match.teamA && match.teamB;

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreA: Number(scoreA), scoreB: Number(scoreB) }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to submit score');
        return;
      }
      toast.success('Score submitted');
      setEditing(false);
      onScoreSubmit?.(match.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-56 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className={`font-medium ${STATUS_STYLE[match.status]}`}>
          {STATUS_LABEL[match.status]}
        </span>
        {(match.courtNumber || match.scheduledAt) && (
          <span className="text-gray-400 dark:text-gray-500">
            {match.courtNumber ? `Court ${match.courtNumber}` : ''}
            {match.courtNumber && match.scheduledAt ? ' · ' : ''}
            {match.scheduledAt
              ? new Date(match.scheduledAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : ''}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <TeamRow
          name={match.teamA?.name}
          seed={match.teamA?.seed ?? null}
          score={match.scoreA}
          isWinner={!!match.winnerId && match.winnerId === match.teamA?.id}
          editing={editing}
          value={scoreA}
          onChange={setScoreA}
        />
        <TeamRow
          name={match.teamB?.name}
          seed={match.teamB?.seed ?? null}
          score={match.scoreB}
          isWinner={!!match.winnerId && match.winnerId === match.teamB?.id}
          editing={editing}
          value={scoreB}
          onChange={setScoreB}
        />
      </div>

      {canScore && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Enter Score
        </button>
      )}
      {editing && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function TeamRow({
  name,
  seed,
  score,
  isWinner,
  editing,
  value,
  onChange,
}: {
  name?: string;
  seed: number | null;
  score: number | null;
  isWinner: boolean;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 ${
        isWinner
          ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
          : 'text-gray-700 dark:text-gray-300'
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {isWinner && <Check className="h-3.5 w-3.5 shrink-0" />}
        {seed != null && (
          <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">#{seed}</span>
        )}
        <span className="truncate">{name ?? 'TBD'}</span>
      </span>
      {editing ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 shrink-0 rounded border border-gray-300 bg-white px-1 text-right text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      ) : (
        <span className="shrink-0 tabular-nums">{score ?? '–'}</span>
      )}
    </div>
  );
}
