// Organizer match scheduling — owner organizer or ADMIN only. Auto-assign
// courts, set per-match court + time, and see the per-court "next up" queue.

import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { getBracketTree } from '@/lib/bracket';
import { getCourtQueues } from '@/lib/matches';
import MatchScheduleEditor, {
  type SchedulableMatch,
} from '@/components/organizer/MatchScheduleEditor';
import CourtQueues from '@/components/organizer/CourtQueues';

export const dynamic = 'force-dynamic';

export default async function SchedulePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/organizer/tournaments/${params.id}/schedule`);
  }

  const tournament = await getTournamentById(params.id);
  if (!tournament) notFound();

  const isOwner = tournament.organizerId === session.user.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    redirect('/organizer');
  }

  const [bracket, queues] = await Promise.all([
    getBracketTree(params.id),
    getCourtQueues(params.id),
  ]);

  // Flatten the bracket into a schedulable, playable (non-bye) match list.
  const matches: SchedulableMatch[] = (bracket?.rounds ?? []).flatMap((round) =>
    round.matches
      .filter((m) => m.status !== 'BYE')
      .map((m) => ({
        id: m.id,
        round: round.name,
        teamA: m.teamA?.name ?? null,
        teamB: m.teamB?.name ?? null,
        courtNumber: m.courtNumber,
        scheduledAt: m.scheduledAt,
      }))
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/organizer/tournaments/${params.id}`}
        className="text-sm text-brand-700 hover:underline dark:text-brand-400"
      >
        ← Back to tournament
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-brand-700 dark:text-brand-400">Schedule</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {tournament.numberOfCourts} {tournament.numberOfCourts === 1 ? 'court' : 'courts'} available.
        Auto-assign to spread matches across courts, or set court and time per match.
      </p>

      {!bracket ? (
        <p className="rounded-lg border border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          Generate the bracket first — matches appear here once it exists.
        </p>
      ) : (
        <>
          <MatchScheduleEditor
            tournamentId={params.id}
            matches={matches}
            numberOfCourts={tournament.numberOfCourts}
          />

          <h2 className="mb-3 mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Order of play
          </h2>
          <CourtQueues queues={queues} />
        </>
      )}
    </main>
  );
}
