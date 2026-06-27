// Tournament list page — public, server component.

import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { listTournaments } from '@/lib/tournaments';
import TournamentCard from '@/components/tournament/TournamentCard';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Tournaments',
  description: 'Browse upcoming and ongoing pickleball tournaments on CourtQuest.',
};

// Without this, Next statically prerenders the list at build time and new
// tournaments wouldn't show up until the next deploy.
export const dynamic = 'force-dynamic';

const FILTERS = [
  { label: 'All', value: undefined, statuses: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] },
  { label: 'Open', value: 'OPEN', statuses: ['OPEN'] },
  { label: 'In Progress', value: 'IN_PROGRESS', statuses: ['IN_PROGRESS'] },
  { label: 'Completed', value: 'COMPLETED', statuses: ['COMPLETED'] },
] as const;

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const activeFilter = FILTERS.find((f) => f.value === searchParams.status) ?? FILTERS[0];
  const tournaments = await listTournaments({
    isPublic: true,
    status: [...activeFilter.statuses],
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700 dark:text-brand-400">Tournaments</h1>

      <div className="mb-6 flex gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/tournaments?status=${filter.value}` : '/tournaments'}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
              filter.label === activeFilter.label
                ? 'bg-brand-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description="Check back soon, or try a different filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.slug}`}
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <TournamentCard tournament={tournament} registeredCount={tournament._count.teams} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
