// Public permanent-team profile — anyone can view. Shows the accepted
// roster (by name only, no contact info) and tournament history. Mirrors
// the public player profile's privacy posture (app/(public)/players/[id]).

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users, Trophy } from 'lucide-react';
import { getPermanentTeamProfile } from '@/lib/permanentTeams';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const team = await getPermanentTeamProfile(params.id);
  if (!team) return { title: 'Team' };
  return {
    title: `${team.name} — Team Profile`,
    description: `${team.name}'s tournament history on CourtQuest.`,
  };
}

export default async function TeamProfilePage({ params }: { params: { id: string } }) {
  const team = await getPermanentTeamProfile(params.id);
  if (!team) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">{team.name}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">{team.sport}</p>

      <h2 className="mb-2 mt-6 flex items-center gap-1.5 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <Users className="h-4 w-4" aria-hidden="true" /> Roster
      </h2>
      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {team.members.map((m) => (
          <li key={m.id}>{m.name}</li>
        ))}
      </ul>

      <h2 className="mb-2 mt-8 flex items-center gap-1.5 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <Trophy className="h-4 w-4" aria-hidden="true" /> Tournament History
      </h2>
      {team.tournamentHistory.length === 0 ? (
        <p className="rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          No tournaments yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {team.tournamentHistory.map((t) => (
            <li
              key={t.teamId}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <Link
                href={`/tournaments/${t.tournamentSlug}`}
                className="font-medium text-gray-900 hover:underline dark:text-gray-100"
              >
                {t.tournamentName}
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t.placement === 1 ? '🏆 Champion' : t.placement === 2 ? 'Runner-up' : t.tournamentStatus}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
