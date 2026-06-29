// Public player profile — anyone can view. Shows W/L record, tournaments
// joined, titles, total points, and match history. Only the player's name and
// derived stats are public; no email/phone/contact info.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Trophy, Swords, Calendar } from 'lucide-react';
import { getPlayerProfile } from '@/lib/rankings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getPlayerProfile(params.id);
  if (!profile) return { title: 'Player' };
  return {
    title: `${profile.name} — Player Profile`,
    description: `${profile.name}'s record on CourtQuest: ${profile.wins}W–${profile.losses}L, ${profile.titles} ${profile.titles === 1 ? 'title' : 'titles'}.`,
  };
}

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const profile = await getPlayerProfile(params.id);
  if (!profile) notFound();

  const totalDecided = profile.wins + profile.losses;
  const winRate = totalDecided > 0 ? Math.round((profile.wins / totalDecided) * 100) : null;

  const stats = [
    { icon: Swords, label: 'Record', value: `${profile.wins}–${profile.losses}` },
    { icon: Trophy, label: 'Titles', value: profile.titles },
    { icon: Calendar, label: 'Tournaments', value: profile.tournamentsJoined },
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">{profile.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile.points} ranking points
            {winRate !== null ? ` · ${winRate}% win rate` : ''}
          </p>
        </div>
        <Link href="/leaderboard" className="text-sm text-brand-700 hover:underline dark:text-brand-400">
          View leaderboard →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
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
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Match history
      </h2>
      {profile.history.length === 0 ? (
        <p className="rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          No completed matches yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {profile.history.map((m) => (
            <li
              key={m.matchId}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <div className="min-w-0">
                <Link
                  href={`/tournaments/${m.tournamentSlug}`}
                  className="font-medium text-gray-900 hover:underline dark:text-gray-100"
                >
                  {m.tournamentName}
                </Link>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {m.round} · vs {m.opponentName ?? 'TBD'}
                  {m.isFinals ? ' · Finals' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 pl-3">
                <span className="whitespace-nowrap text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {m.scoreFor ?? '–'}–{m.scoreAgainst ?? '–'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    m.won
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {m.won ? 'W' : 'L'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
