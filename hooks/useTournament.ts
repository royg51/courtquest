// TanStack Query hooks for tournament data.
// Centralizes all tournament fetching so components don't construct fetch calls directly.

import { useQuery } from '@tanstack/react-query';

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error('Failed to load tournament');
      const { tournament } = await res.json();
      return tournament;
    },
  });
}

export function useTournamentList(filters?: { status?: string; sport?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.sport) params.set('sport', filters.sport);

  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load tournaments');
      const { tournaments } = await res.json();
      return tournaments;
    },
  });
}
