'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient, isSupabaseRealtimeConfigured } from '@/lib/supabase-client';

// Subscribes to new rows on the Donation table and refreshes the page's
// server-rendered data (Recent Donations / Top Donors / total raised) when
// one arrives, so a donation from another visitor shows up without a
// manual reload. Requires Supabase Realtime to be enabled for the
// Donation table (Supabase dashboard: Database -> Replication) — silently
// does nothing if that hasn't been turned on, rather than erroring.
export function LiveDonationsRefresher() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseRealtimeConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('donations-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Donation' },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
