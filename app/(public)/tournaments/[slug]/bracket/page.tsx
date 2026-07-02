// Public read-only bracket view for a tournament.
// Bracket/score updates arrive via a Supabase Realtime subscription on Match
// (see hooks/useBracket.ts); this page's own server-rendered sections (order
// of play, standings) refresh via the same mechanism applied to router.refresh.

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTournamentBySlug } from '@/lib/tournaments';
import { getCourtQueues } from '@/lib/matches';
import { getRoundRobinStandings } from '@/lib/formats/round-robin';
import PublicBracketView from '@/components/bracket/PublicBracketView';
import CourtQueues from '@/components/organizer/CourtQueues';
import StandingsTable from '@/components/bracket/StandingsTable';
import { pageMetadata } from '@/lib/seo';

const TournamentStatusRefresher = nextDynamic(
  () => import('@/components/realtime/TournamentStatusRefresher').then((m) => m.TournamentStatusRefresher),
  { ssr: false }
);
const MatchChangeRefresher = nextDynamic(
  () => import('@/components/realtime/MatchChangeRefresher').then((m) => m.MatchChangeRefresher),
  { ssr: false }
);

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [tournament, session] = await Promise.all([getTournamentBySlug(params.slug), auth()]);
  if (!tournament) return {};
  if (!tournament.isPublic) {
    const canView =
      session?.user?.id === tournament.organizer.id || session?.user?.role === 'ADMIN';
    if (!canView) return {};
  }
  return pageMetadata({
    title: `${tournament.name} — Bracket`,
    description: `Live bracket and results for ${tournament.name}.`,
    path: `/tournaments/${params.slug}/bracket`,
  });
}

export default async function BracketPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { invite?: string };
}) {
  const [tournament, session] = await Promise.all([getTournamentBySlug(params.slug), auth()]);
  if (!tournament) {
    notFound();
  }

  // Private tournaments: accessible to organizer, admins, or valid invite-code holders.
  if (!tournament.isPublic) {
    const hasInvite =
      !!searchParams.invite &&
      !!tournament.inviteCode &&
      searchParams.invite.toUpperCase() === tournament.inviteCode;
    const canView =
      hasInvite ||
      session?.user?.id === tournament.organizer.id ||
      session?.user?.role === 'ADMIN';
    if (!canView) notFound();
  }

  const isRoundRobin = tournament.format === 'ROUND_ROBIN';
  const [queues, standings] = await Promise.all([
    getCourtQueues(tournament.id),
    isRoundRobin ? getRoundRobinStandings(tournament.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <TournamentStatusRefresher tournamentId={tournament.id} />
      <MatchChangeRefresher />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">
          {tournament.name} — {isRoundRobin ? 'Standings' : 'Bracket'}
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
