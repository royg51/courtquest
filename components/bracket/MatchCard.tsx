// Single match card within the bracket.
// Shows: teamA/teamB names, scores (if completed), winner highlight.
// In organizer mode: "Enter Score" switches the card into an inline edit state.

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { MatchWithTeams } from '@/types';

interface Props {
  match: MatchWithTeams;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

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
    <div className="w-56 rounded-md border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>{STATUS_LABEL[match.status]}</span>
        {match.courtNumber && <span>Court {match.courtNumber}</span>}
      </div>

      <TeamRow
        name={match.teamA?.name}
        score={match.scoreA}
        isWinner={!!match.winnerId && match.winnerId === match.teamA?.id}
        editing={editing}
        value={scoreA}
        onChange={setScoreA}
      />
      <TeamRow
        name={match.teamB?.name}
        score={match.scoreB}
        isWinner={!!match.winnerId && match.winnerId === match.teamB?.id}
        editing={editing}
        value={scoreB}
        onChange={setScoreB}
      />

      {canScore && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
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
            className="flex-1 rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
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
  score,
  isWinner,
  editing,
  value,
  onChange,
}: {
  name?: string;
  score: number | null;
  isWinner: boolean;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded px-2 py-1 ${
        isWinner ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-700'
      }`}
    >
      <span className="truncate">{name ?? 'TBD'}</span>
      {editing ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 rounded border border-gray-300 px-1 text-right focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        />
      ) : (
        <span>{score ?? '–'}</span>
      )}
    </div>
  );
}
