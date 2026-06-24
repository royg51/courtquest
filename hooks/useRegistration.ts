// TanStack Query hooks for registration/team data.
// Implemented in Step 5 (Registration flow).

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTeams(tournamentId: string) {
  return useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: async () => {
      // TODO: fetch GET /api/tournaments/[id]/teams
      throw new Error('Not implemented');
    },
  });
}

export function useRegisterTeam(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_data: unknown) => {
      // TODO: POST /api/tournaments/[id]/teams
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] });
    },
  });
}
