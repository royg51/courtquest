// Public read-only bracket view for a tournament.
// Polls GET /api/tournaments/[id]/bracket every 30s while IN_PROGRESS.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/tournaments';
import { getCourtQueues } from '@/lib/matches';
import { getRoundRobinStandings } from '@/lib/formats/round-robin';
import { getGroupStandings } from '@/lib/formats/group-stage';
import PublicBracketView from '@/components/bracket/PublicBracketView';
import CourtQueues from '@/components/organizer/CourtQueues';
import StandingsTable from '@/components/bracket/StandingsTable';
import GroupStandingsTable from '@/components/bracket/GroupStandingsTable';
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
  const isGroupStage = tournament.format === 'GROUP_STAGE';
  const [queues, standings, groupStandings] = await Promise.all([
    getCourtQueues(tournament.id),
    isRoundRobin ? getRoundRobinStandings(tournament.id) : Promise.resolve([]),
    isGroupStage ? getGroupStandings(tournament.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">
          {tournament.name} — {isRoundRobin ? 'Standings' : isGroupStage ? 'Groups' : 'Bracket'}
        </h1>
        <Link
          href={`/tournaments/${tournament.slug}/live`}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Live view
        </Link>
      </div>

      {isRoundRobin && standings.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Standings</h2>
          <StandingsTable rows={standings} />
        </section>
      )}

      {isGroupStage && groupStandings.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Group Standings
          </h2>
          <GroupStandingsTable
            groups={groupStandings}
            qualifiersPerGroup={tournament.qualifiersPerGroup ?? 1}
          />
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
