// TanStack Query hook for bracket data.
// Polls every 30 seconds when tournament is IN_PROGRESS so scores appear live.
// tournamentId must be the tournament's DB id (not slug).

import { useQuery } from '@tanstack/react-query';
import type { BracketTree } from '@/types';

export function useBracket(tournamentId: string, isLive = false) {
  return useQuery({
    queryKey: ['bracket', tournamentId],
    queryFn: async (): Promise<BracketTree | null> => {
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to load bracket');
      const { bracket } = await res.json();
      return bracket;
    },
    refetchInterval: isLive ? 30_000 : false,
  });
}
