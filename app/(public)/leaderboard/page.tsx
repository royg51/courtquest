// Public per-sport leaderboard. Anyone (logged in or not) can view. Points:
// match win +10, finals +50, champion +100. Sport is chosen via ?sport= and
// defaults to the first configured sport.

import Link from 'next/link';
import { Trophy, Medal } from 'lucide-react';
import { getLeaderboard } from '@/lib/rankings';
import { SPORTS } from '@/lib/sports';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'Leaderboard',
  description: 'Global player rankings by sport — points from wins, finals, and championships.',
  path: '/leaderboard',
});

const RANK_TONE = ['text-amber-500', 'text-gray-400', 'text-amber-700'];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { sport?: string };
}) {
  const sport = SPORTS.includes(searchParams.sport as (typeof SPORTS)[number])
    ? (searchParams.sport as string)
    : SPORTS[0];
  const entries = await getLeaderboard(sport);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-brand-700 dark:text-brand-400">Leaderboard</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Points: match win +10 · reaching the finals +50 · winning it +100.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {SPORTS.map((s) => (
          <Link
            key={s}
            href={`/leaderboard?sport=${encodeURIComponent(s)}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              s === sport
                ? 'bg-brand-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          No ranked players for {sport} yet. Rankings appear once tournaments are played and matches
          are scored.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3 text-right">Wins</th>
                <th className="px-4 py-3 text-right">Titles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry, i) => (
                <tr key={entry.userId}>
                  <td className="px-4 py-3">
                    {i < 3 ? (
                      <Medal className={`h-4 w-4 ${RANK_TONE[i]}`} aria-label={`Rank ${i + 1}`} />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/players/${entry.userId}`}
                      className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {entry.points}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {entry.wins}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.titles > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Trophy className="h-3.5 w-3.5" />
                        {entry.titles}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
