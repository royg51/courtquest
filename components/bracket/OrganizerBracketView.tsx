'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useBracket } from '@/hooks/useBracket';
import BracketViewer from './BracketViewer';
import DoubleEliminationView from './DoubleEliminationView';
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

  const isDoubleElim = bracket.rounds.some((round) => round.bracketSide !== 'MAIN');
  const onScoreSubmit = () => queryClient.invalidateQueries({ queryKey: ['bracket', tournamentId] });

  return isDoubleElim ? (
    <DoubleEliminationView bracket={bracket} mode="organizer" onScoreSubmit={onScoreSubmit} />
  ) : (
    <BracketViewer bracket={bracket} mode="organizer" onScoreSubmit={onScoreSubmit} />
  );
}
