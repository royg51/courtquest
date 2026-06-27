// Organizer landing page — ORGANIZER+ role required.
// Lists tournaments created by this organizer.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { auth, requireRole } from '@/lib/auth';
import { listTournaments } from '@/lib/tournaments';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Organizer' };

export default async function OrganizerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/organizer');
  }
  if (!requireRole(session, 'ORGANIZER')) {
    redirect('/dashboard');
  }

  const tournaments = await listTournaments({ organizerId: session.user.id });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Your Tournaments</h1>
        <Link
          href="/dashboard/tournaments/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          Create Tournament
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament to start accepting registrations."
        />
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/organizer/tournaments/${tournament.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <div>
                <p className="font-semibold text-gray-900">{tournament.name}</p>
                <p className="text-sm text-gray-500">
                  {tournament.sport} · {tournament._count.teams}/{tournament.maxParticipants}{' '}
                  registered
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {tournament.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
