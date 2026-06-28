// Browser-only Supabase client, used solely for Realtime subscriptions
// (e.g. live donation updates on /donate). All actual data reads/writes
// still go through Prisma — this client never queries tables directly.
//
// NOTE: Supabase Realtime must be enabled for a table before subscriptions
// receive anything. In the Supabase dashboard: Database -> Replication ->
// toggle the Donation table on. This can't be done from application code.

import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | null = null;

export function isSupabaseRealtimeConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseBrowserClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
    }
    _client = createClient(url, anonKey);
  }
  return _client;
}
