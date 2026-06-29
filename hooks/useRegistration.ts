// TanStack Query hooks for registration/team data.
// tournamentId must be the tournament's DB id (not slug) — the API routes
// these call are keyed by id.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RegisterTeamInput, GuestRegisterTeamInput } from '@/lib/schemas/team';
import type { TeamWithMembers } from '@/lib/teams';

export function useTeams(tournamentId: string) {
  return useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: async (): Promise<TeamWithMembers[]> => {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`);
      if (!res.ok) throw new Error('Failed to load teams');
      const { teams } = await res.json();
      return teams;
    },
  });
}

export function useRegisterTeam(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegisterTeamInput | GuestRegisterTeamInput) => {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to register');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] });
    },
  });
}
