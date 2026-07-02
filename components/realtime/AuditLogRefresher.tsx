'use client';

// Refreshes the audit log's first page when a new entry is recorded — same
// pattern as LiveDonationsRefresher. Only meaningful on page 1, since new
// entries land at the top, not on older pages.

import { useRealtimeRefresh } from '@/hooks/useSupabaseRealtime';

export function AuditLogRefresher({ enabled }: { enabled: boolean }) {
  useRealtimeRefresh({ table: 'AuditLog', event: 'INSERT', enabled });
  return null;
}
