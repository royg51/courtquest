// Admin panel — ADMIN role only.
// Shows platform stats, user management, all tournaments.
// Implemented in Step 3+ (incrementally).

import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="Admin panel is coming soon"
      description="Platform stats, user management, and all tournaments will live here."
    />
  );
}
