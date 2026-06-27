// Player dashboard — auth required.
// Shows: upcoming matches, my registrations, profile editor.
// Implemented in Step 5 (Registration flow) + Step 7 (Scoring).

import type { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Your dashboard is coming soon"
      description="Upcoming matches, registrations, and your profile will live here."
    />
  );
}
