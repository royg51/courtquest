// TanStack Query hook for bracket data.
// Polls every 30 seconds when tournament is IN_PROGRESS so scores appear live.
// Implemented in Step 6 (Bracket viewer).

import { useQuery } from '@tanstack/react-query';

export function useBracket(tournamentId: string, isLive = false) {
  return useQuery({
    queryKey: ['bracket', tournamentId],
    queryFn: async () => {
      // TODO: fetch GET /api/tournaments/[id]/bracket
      throw new Error('Not implemented');
    },
    refetchInterval: isLive ? 30_000 : false,
  });
}
