// TanStack Query hook for bracket data.
// Polls while live so scores appear without a refresh. Default cadence is 30s
// (bracket viewer); the TV / live-event view passes a faster interval.
// tournamentId must be the tournament's DB id (not slug).

import { useQuery } from '@tanstack/react-query';
import type { BracketTree } from '@/types';

export function useBracket(tournamentId: string, isLive = false, intervalMs = 30_000) {
  return useQuery({
    queryKey: ['bracket', tournamentId],
    queryFn: async (): Promise<BracketTree | null> => {
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to load bracket');
      const { bracket } = await res.json();
      return bracket;
    },
    refetchInterval: isLive ? intervalMs : false,
  });
}
