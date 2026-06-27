// Tournament list page — public, server component.

import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { listTournaments } from '@/lib/tournaments';
import TournamentCard from '@/components/tournament/TournamentCard';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Tournaments',
  description: 'Browse upcoming and ongoing pickleball tournaments on CourtQuest.',
};

// Without this, Next statically prerenders the list at build time and new
// tournaments wouldn't show up until the next deploy.
export const dynamic = 'force-dynamic';

export default async function TournamentsPage() {
  const tournaments = await listTournaments({ isPublic: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Tournaments</h1>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Check back soon, or create one if you're an organizer."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.slug}`}
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <TournamentCard tournament={tournament} registeredCount={tournament._count.teams} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
