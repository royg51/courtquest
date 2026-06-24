// TanStack Query hooks for tournament data.
// Centralizes all tournament fetching so components don't construct fetch calls directly.
// Implemented in Step 3 (Tournament listing).

import { useQuery } from '@tanstack/react-query';

export function useTournament(slug: string) {
  return useQuery({
    queryKey: ['tournament', slug],
    queryFn: async () => {
      // TODO: fetch GET /api/tournaments/[id] (by slug via public page)
      throw new Error('Not implemented');
    },
  });
}

export function useTournamentList(filters?: { status?: string; sport?: string }) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: async () => {
      // TODO: fetch GET /api/tournaments with query params
      throw new Error('Not implemented');
    },
  });
}
