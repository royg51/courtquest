// Organizer bracket management page. Generate happens from the tournament
// overview page; this page is for viewing + entering scores.

import { redirect, notFound } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { getRoundRobinStandings } from '@/lib/formats/round-robin';
import { getGroupStandings } from '@/lib/formats/group-stage';
import OrganizerBracketView from '@/components/bracket/OrganizerBracketView';
import StandingsTable from '@/components/bracket/StandingsTable';
import GroupStandingsTable from '@/components/bracket/GroupStandingsTable';

export const dynamic = 'force-dynamic';

export default async function OrganizerBracketPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/organizer/tournaments/${params.id}/bracket`);
  }

  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    notFound();
  }

  const isOwner = tournament.organizerId === session.user.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    redirect('/organizer');
  }

  const isRoundRobin = tournament.format === 'ROUND_ROBIN';
  const isGroupStage = tournament.format === 'GROUP_STAGE';
  const standings = isRoundRobin ? await getRoundRobinStandings(tournament.id) : [];
  const groupStandings = isGroupStage ? await getGroupStandings(tournament.id) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700 dark:text-brand-400">
        {tournament.name} —{' '}
        {isRoundRobin || isGroupStage ? 'Standings & Matches' : 'Bracket'}
      </h1>

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

      <OrganizerBracketView tournamentId={tournament.id} />
    </main>
  );
}
