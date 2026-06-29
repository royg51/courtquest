'use client';

import { useBracket } from '@/hooks/useBracket';
import BracketViewer from './BracketViewer';
import DoubleEliminationView, { getDoubleEliminationChampion } from './DoubleEliminationView';
import { EmptyState } from '@/components/ui/EmptyState';
import { Network, Trophy } from 'lucide-react';

interface Props {
  tournamentId: string;
  isLive: boolean;
}

export default function PublicBracketView({ tournamentId, isLive }: Props) {
  const { data: bracket, isLoading } = useBracket(tournamentId, isLive);

  if (isLoading) {
    return (
      <p className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading bracket…
      </p>
    );
  }

  if (!bracket) {
    return (
      <EmptyState
        icon={Network}
        title="Bracket not generated yet"
        description="The organizer hasn't started the bracket for this tournament."
      />
    );
  }

  const completedMatches = bracket.rounds
    .flatMap((round) => round.matches.map((match) => ({ ...match, roundName: round.name })))
    .filter((match) => match.status === 'COMPLETED');

  const isDoubleElim = bracket.rounds.some((round) => round.bracketSide !== 'MAIN');

  let champion = null;
  if (isDoubleElim) {
    champion = getDoubleEliminationChampion(bracket);
  } else {
    const finalsRound = bracket.rounds[bracket.rounds.length - 1];
    champion = finalsRound?.matches[0]?.winnerId
      ? finalsRound.matches[0].teamA?.id === finalsRound.matches[0].winnerId
        ? finalsRound.matches[0].teamA
        : finalsRound.matches[0].teamB
      : null;
  }

  return (
    <div className="space-y-10">
      {champion && (
        <div className="flex items-center justify-center gap-2 rounded-md bg-brand-50 px-4 py-3 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          <Trophy className="h-5 w-5" />
          <span className="font-semibold">{champion.name} wins the tournament!</span>
        </div>
      )}

      {isDoubleElim ? (
        <DoubleEliminationView bracket={bracket} mode="public" />
      ) : (
        <BracketViewer bracket={bracket} mode="public" />
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Completed Matches
        </h2>
        {completedMatches.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No matches completed yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {completedMatches.map((match) => (
              <li
                key={match.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800"
              >
                <span className="text-gray-500 dark:text-gray-400">{match.roundName}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {match.teamA?.name} {match.scoreA}–{match.scoreB} {match.teamB?.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
