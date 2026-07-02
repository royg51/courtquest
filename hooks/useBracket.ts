// TanStack Query hook for bracket data.
// Primary live-update path is a Supabase Realtime subscription on Match
// (instant); refetchInterval is now just a slow safety net for when Realtime
// isn't configured/enabled or a websocket drops, not the main delivery
// mechanism. Default cadence is 60s (bracket viewer); the TV / live-event
// view passes a faster fallback interval. tournamentId must be the
// tournament's DB id (not slug).

import { useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/hooks/useSupabaseRealtime';
import type { BracketTree } from '@/types';

export function useBracket(tournamentId: string, isLive = false, intervalMs = 60_000) {
  useRealtimeInvalidate({ table: 'Match', enabled: isLive }, ['bracket', tournamentId]);

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
