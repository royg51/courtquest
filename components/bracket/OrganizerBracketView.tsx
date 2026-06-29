'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useBracket } from '@/hooks/useBracket';
import BracketViewer from './BracketViewer';
import DoubleEliminationView from './DoubleEliminationView';
import GroupStageMatchesView from './GroupStageMatchesView';
import { EmptyState } from '@/components/ui/EmptyState';
import { Network } from 'lucide-react';

interface Props {
  tournamentId: string;
}

export default function OrganizerBracketView({ tournamentId }: Props) {
  const { data: bracket, isLoading } = useBracket(tournamentId);
  const queryClient = useQueryClient();

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
        title="No bracket yet"
        description="Generate the bracket from the tournament overview page once registrations are confirmed."
      />
    );
  }

  // See the matching comment in PublicBracketView.tsx — group-stage rounds
  // share their tournament's Bracket row with the playoff rounds that follow,
  // so they're excluded here (a no-op for every other format).
  const playoffRounds = bracket.rounds.filter((round) => round.groupNumber === null);
  const playoffBracket = { ...bracket, rounds: playoffRounds };
  const isDoubleElim = playoffRounds.some((round) => round.bracketSide !== 'MAIN');
  const onScoreSubmit = () => queryClient.invalidateQueries({ queryKey: ['bracket', tournamentId] });

  return (
    <div className="space-y-10">
      <GroupStageMatchesView bracket={bracket} mode="organizer" onScoreSubmit={onScoreSubmit} />
      {playoffRounds.length > 0 &&
        (isDoubleElim ? (
          <DoubleEliminationView bracket={playoffBracket} mode="organizer" onScoreSubmit={onScoreSubmit} />
        ) : (
          <BracketViewer bracket={playoffBracket} mode="organizer" onScoreSubmit={onScoreSubmit} />
        ))}
    </div>
  );
}
