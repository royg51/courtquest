'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles, Wand2 } from 'lucide-react';
import type { AssistSummary } from '@/lib/ai-assist';

export default function SmartAssistPanel({
  tournamentId,
  summary,
  hasBracket,
  aiAdvice,
}: {
  tournamentId: string;
  summary: AssistSummary;
  hasBracket: boolean;
  aiAdvice: string | null;
}) {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);

  const recommendsDifferent = summary.recommendation.format !== summary.currentFormat;

  const autoSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/seed/auto`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to seed');
        return;
      }
      const { seeded } = await res.json();
      toast.success(`Seeded ${seeded} ${seeded === 1 ? 'team' : 'teams'} by ranking`);
      router.refresh();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-900/50 dark:bg-brand-900/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
        <Sparkles className="h-4 w-4" />
        Smart Assist
      </div>

      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        {summary.confirmedTeams} confirmed {summary.confirmedTeams === 1 ? 'team' : 'teams'}.{' '}
        Recommended format: <strong>{summary.recommendation.label}</strong>.
      </p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
        {aiAdvice ?? summary.recommendation.rationale}
      </p>

      {recommendsDifferent && !hasBracket && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          This tournament is currently set to {summary.currentFormat.replace('_', ' ').toLowerCase()}
          . You can change it in Edit Details.
        </p>
      )}
      {summary.recommendation.format === 'ROUND_ROBIN' && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          A round robin with {summary.confirmedTeams} teams is {summary.matchesIfRoundRobin}{' '}
          {summary.matchesIfRoundRobin === 1 ? 'match' : 'matches'} total.
        </p>
      )}
      {summary.recommendation.format === 'SWISS' && summary.recommendation.suggestedRounds && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Suggested: {summary.recommendation.suggestedRounds} rounds. You can change this on the
          Edit Details page before generating the bracket.
        </p>
      )}

      {!hasBracket && summary.confirmedTeams >= 2 && (
        <button
          type="button"
          onClick={autoSeed}
          disabled={seeding}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          <Wand2 className="h-4 w-4" />
          {seeding ? 'Seeding…' : 'Auto-seed by ranking'}
        </button>
      )}
      {!hasBracket && summary.confirmedTeams >= 2 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Seeds the strongest teams (by their players&apos; ranking points) apart so they meet late,
          not early. Run before generating the bracket.
        </p>
      )}
    </div>
  );
}
