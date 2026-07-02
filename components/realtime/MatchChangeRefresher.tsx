'use client';

// Refreshes server-rendered sections that depend on Match data (order-of-play
// queues, round-robin standings) when any match changes. No tournamentId
// filter is possible at the subscription level (Match has no tournamentId
// column — see hooks/useSupabaseRealtime.ts); router.refresh() just re-runs
// this page's own data fetch, so an unrelated tournament's match change costs
// a wasted server round-trip, not an incorrect render.

import { useRealtimeRefresh } from '@/hooks/useSupabaseRealtime';

export function MatchChangeRefresher() {
  useRealtimeRefresh({ table: 'Match' });
  return null;
}
