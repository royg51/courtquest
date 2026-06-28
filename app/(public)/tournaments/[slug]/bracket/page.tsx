// Public read-only bracket view for a tournament.
// Polls GET /api/tournaments/[id]/bracket every 30s while IN_PROGRESS.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/tournaments';
import { getCourtQueues } from '@/lib/matches';
import { getRoundRobinStandings } from '@/lib/formats/round-robin';
import PublicBracketView from '@/components/bracket/PublicBracketView';
import CourtQueues from '@/components/organizer/CourtQueues';
import StandingsTable from '@/components/bracket/StandingsTable';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) return {};
  return pageMetadata({
    title: `${tournament.name} — Bracket`,
    description: `Live bracket and results for ${tournament.name}.`,
    path: `/tournaments/${params.slug}/bracket`,
  });
}

export default async function BracketPage({ params }: { params: { slug: string } }) {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) {
    notFound();
  }

  const isRoundRobin = tournament.format === 'ROUND_ROBIN';
  const [queues, standings] = await Promise.all([
    getCourtQueues(tournament.id),
    isRoundRobin ? getRoundRobinStandings(tournament.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700 dark:text-brand-400">
        {tournament.name} — {isRoundRobin ? 'Standings' : 'Bracket'}
      </h1>

      {isRoundRobin && standings.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Standings</h2>
          <StandingsTable rows={standings} />
        </section>
      )}

      {queues.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Order of play
          </h2>
          <CourtQueues queues={queues} />
        </section>
      )}

      <PublicBracketView
        tournamentId={tournament.id}
        isLive={tournament.status === 'IN_PROGRESS'}
      />
    </main>
  );
}
