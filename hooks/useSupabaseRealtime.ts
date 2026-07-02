// Generic Supabase Realtime subscription hooks, built on the same browser
// client lib/supabase-client.ts already established for live donations.
// Two flavors for the two data-fetching styles this app uses:
//   - useRealtimeRefresh: server-rendered pages — calls router.refresh()
//   - useRealtimeInvalidate: TanStack Query data — invalidates a query key
//
// Both no-op silently if Realtime env vars aren't configured, and — same
// caveat as lib/supabase-client.ts — only fire once Realtime replication is
// turned on for the given table (Supabase dashboard: Database -> Replication;
// this can't be done from application code, only a project-level setting).
//
// Match doesn't carry a tournamentId column directly (it's reached through
// round -> bracket -> tournament), so its subscription can't filter at the
// Postgres-replication level the way Team/Tournament/AuditLog can — any
// Match change anywhere invalidates the bracket query for whichever
// tournament is currently mounted. That's a wasted refetch when the change
// belonged to a different tournament, not a correctness problem (the API
// route still scopes the response correctly) — adding a denormalized column
// just to filter a subscription isn't worth it at this app's scale.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { getSupabaseBrowserClient, isSupabaseRealtimeConfigured } from '@/lib/supabase-client';

interface SubscribeOptions {
  table: string;
  filter?: string; // e.g. "tournamentId=eq.abc123"
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  // Lets a caller conditionally want the subscription (e.g. only while a
  // tournament is live) without conditionally calling the hook itself —
  // React's rules of hooks require every render to call the same hooks.
  enabled?: boolean;
}

export function useRealtimeRefresh({ table, filter, event = '*', enabled = true }: SubscribeOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !isSupabaseRealtimeConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`${table}-refresh-${filter ?? 'all'}`)
      .on('postgres_changes', { event, schema: 'public', table, filter }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, event, enabled]);
}

export function useRealtimeInvalidate(
  { table, filter, event = '*', enabled = true }: SubscribeOptions,
  queryKey: QueryKey
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !isSupabaseRealtimeConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`${table}-invalidate-${filter ?? 'all'}`)
      .on('postgres_changes', { event, schema: 'public', table, filter }, () =>
        queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, event, enabled, JSON.stringify(queryKey)]);
}
