'use client';

// Refreshes a server-rendered tournament page when the Tournament row
// changes (status DRAFT -> OPEN -> IN_PROGRESS -> COMPLETED/CANCELLED, or any
// other edit) — e.g. a "Live view" link appearing the moment an organizer
// starts the bracket, with no manual reload. Same pattern as
// LiveDonationsRefresher; requires Realtime enabled for Tournament.

import { useRealtimeRefresh } from '@/hooks/useSupabaseRealtime';

export function TournamentStatusRefresher({ tournamentId }: { tournamentId: string }) {
  useRealtimeRefresh({ table: 'Tournament', filter: `id=eq.${tournamentId}`, event: 'UPDATE' });
  return null;
}
