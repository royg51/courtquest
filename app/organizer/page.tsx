// Organizer landing page — ORGANIZER+ role required.
// Shows list of tournaments created by this organizer.
// Implemented in Step 4 (Tournament creation).

import type { Metadata } from 'next';
import { Trophy } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Organizer' };

export default function OrganizerPage() {
  return (
    <EmptyState
      icon={Trophy}
      title="Organizer tools are coming soon"
      description="Tournaments you've created will be listed and manageable from here."
    />
  );
}
