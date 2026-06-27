// Player dashboard — auth required, player-focused only.
// Shows tournaments joined, upcoming matches, recent results, personal
// stats, and quick actions. Tournament *management* lives on /organizer —
// this page intentionally does not duplicate that list or its controls.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Trophy, Target, TrendingUp, Compass, Settings } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getJoinedTeams, getUpcomingMatchesForUser, getRecentResultsForUser } from '@/lib/dashboard';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const [joined, upcoming, results] = await Promise.all([
    getJoinedTeams(session.user.id),
    getUpcomingMatchesForUser(session.user.id),
    getRecentResultsForUser(session.user.id),
  ]);

  const myTeamIds = new Set(joined.map((team) => team.id));
  const wins = results.filter((match) => {
    const myTeamIsA = !!match.teamA && myTeamIds.has(match.teamA.id);
    const myTeamIsB = !!match.teamB && myTeamIds.has(match.teamB.id);
    return (
      (myTeamIsA && match.winnerId === match.teamA?.id) ||
      (myTeamIsB && match.winnerId === match.teamB?.id)
    );
  }).length;
  const winRate = results.length > 0 ? Math.round((wins / results.length) * 100) : null;
  const isOrganizer = session.user.role === 'ORGANIZER' || session.user.role === 'ADMIN';

  const stats = [
    { icon: Trophy, label: 'Tournaments Joined', value: joined.length },
    { icon: Target, label: 'Matches Played', value: results.length },
    { icon: TrendingUp, label: 'Win Rate', value: winRate === null ? '—' : `${winRate}%` },
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">Dashboard</h1>

      <section className="grid grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-800"
          >
            <Icon className="mx-auto h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          Browse Tournaments
        </Link>
        {isOrganizer && (
          <Link
            href="/organizer"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Manage Tournaments
          </Link>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Your Tournaments</h2>
        {joined.length === 0 ? (
          <EmptyState
            icon={Users}
            title="You haven't joined any tournaments yet"
            description="Browse tournaments to find one to register for."
          />
        ) : (
          <div className="space-y-2">
            {joined.map((team) => (
              <Link
                key={team.id}
                href={`/tournaments/${team.tournament.slug}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/30 dark:border-gray-800 dark:hover:border-brand-800 dark:hover:bg-brand-900/10"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{team.tournament.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Team: {team.name}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  {team.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Matches</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming matches.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((match) => (
              <Link
                key={match.id}
                href={`/tournaments/${match.round.bracket.tournament.slug}/bracket`}
                className="block rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:border-brand-200 hover:bg-brand-50/30 dark:border-gray-800 dark:hover:border-brand-800 dark:hover:bg-brand-900/10"
              >
                <p className="text-gray-500 dark:text-gray-400">
                  {match.round.bracket.tournament.name} · {match.round.name}
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {match.teamA?.name ?? 'TBD'} vs {match.teamB?.name ?? 'TBD'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Results</h2>
        {results.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No completed matches yet.</p>
        ) : (
          <div className="space-y-2">
            {results.map((match) => {
              const myTeamIsA = !!match.teamA && myTeamIds.has(match.teamA.id);
              const myTeamIsB = !!match.teamB && myTeamIds.has(match.teamB.id);
              const won =
                (myTeamIsA && match.winnerId === match.teamA?.id) ||
                (myTeamIsB && match.winnerId === match.teamB?.id);
              return (
                <div key={match.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">
                    {match.round.bracket.tournament.name} · {match.round.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {match.teamA?.name} {match.scoreA}–{match.scoreB} {match.teamB?.name}
                    </p>
                    {(myTeamIsA || myTeamIsB) && (
                      <span
                        className={`text-xs font-semibold ${won ? 'text-brand-700 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {won ? 'Won' : 'Lost'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
