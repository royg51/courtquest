// Tournament list page — public, server component.

import Link from 'next/link';
import { listTournaments } from '@/lib/tournaments';
import TournamentCard from '@/components/tournament/TournamentCard';

// Without this, Next statically prerenders the list at build time and new
// tournaments wouldn't show up until the next deploy.
export const dynamic = 'force-dynamic';

export default async function TournamentsPage() {
  const tournaments = await listTournaments({ isPublic: true });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Tournaments</h1>

      {tournaments.length === 0 ? (
        <p className="text-gray-600">No tournaments yet — check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/${tournament.slug}`}>
              <TournamentCard tournament={tournament} registeredCount={tournament._count.teams} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
