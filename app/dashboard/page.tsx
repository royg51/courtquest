// Player dashboard — auth required.
// Shows tournaments organized (if any), tournaments joined, upcoming
// matches, and recent results — all live data, no mocks.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Trophy, Users } from 'lucide-react';
import { auth } from '@/lib/auth';
import {
  getOrganizedTournaments,
  getJoinedTeams,
  getUpcomingMatchesForUser,
  getRecentResultsForUser,
} from '@/lib/dashboard';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const [organized, joined, upcoming, results] = await Promise.all([
    getOrganizedTournaments(session.user.id),
    getJoinedTeams(session.user.id),
    getUpcomingMatchesForUser(session.user.id),
    getRecentResultsForUser(session.user.id),
  ]);

  const myTeamIds = new Set(joined.map((team) => team.id));

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700">Dashboard</h1>

      {(session.user.role === 'ORGANIZER' || session.user.role === 'ADMIN') && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Organizing</h2>
            <Link href="/organizer" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {organized.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="You haven't created a tournament yet"
              description="Get started from the Organizer page."
            />
          ) : (
            <div className="space-y-2">
              {organized.slice(0, 3).map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/organizer/tournaments/${tournament.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <span className="font-medium text-gray-900">{tournament.name}</span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {tournament.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Your Tournaments</h2>
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
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div>
                  <p className="font-medium text-gray-900">{team.tournament.name}</p>
                  <p className="text-sm text-gray-500">Team: {team.name}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {team.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Upcoming Matches</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming matches.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((match) => (
              <Link
                key={match.id}
                href={`/tournaments/${match.round.bracket.tournament.slug}/bracket`}
                className="block rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:border-brand-200 hover:bg-brand-50/30"
              >
                <p className="text-gray-500">
                  {match.round.bracket.tournament.name} · {match.round.name}
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {match.teamA?.name ?? 'TBD'} vs {match.teamB?.name ?? 'TBD'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Results</h2>
        {results.length === 0 ? (
          <p className="text-sm text-gray-500">No completed matches yet.</p>
        ) : (
          <div className="space-y-2">
            {results.map((match) => {
              const myTeamIsA = !!match.teamA && myTeamIds.has(match.teamA.id);
              const myTeamIsB = !!match.teamB && myTeamIds.has(match.teamB.id);
              const won =
                (myTeamIsA && match.winnerId === match.teamA?.id) ||
                (myTeamIsB && match.winnerId === match.teamB?.id);
              return (
                <div key={match.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                  <p className="text-gray-500">
                    {match.round.bracket.tournament.name} · {match.round.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {match.teamA?.name} {match.scoreA}–{match.scoreB} {match.teamB?.name}
                    </p>
                    {(myTeamIsA || myTeamIsB) && (
                      <span
                        className={`text-xs font-semibold ${won ? 'text-brand-700' : 'text-gray-400'}`}
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
