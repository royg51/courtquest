// Organizer landing page — ORGANIZER+ role required.
// Lists tournaments created by this organizer.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Trophy, Users, Activity, CheckCircle2 } from 'lucide-react';
import { auth, requireRole } from '@/lib/auth';
import { listTournaments } from '@/lib/tournaments';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Organizer' };

export default async function OrganizerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/organizer');
  }
  if (!requireRole(session, 'ORGANIZER')) {
    redirect('/dashboard');
  }

  const tournaments = await listTournaments({ organizerId: session.user.id });

  const totalParticipants = tournaments.reduce((sum, t) => sum + t._count.teams, 0);
  const activeCount = tournaments.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const completedCount = tournaments.filter((t) => t.status === 'COMPLETED').length;
  const analytics = [
    { icon: Trophy, label: 'Tournaments Created', value: tournaments.length },
    { icon: Activity, label: 'Active Now', value: activeCount },
    { icon: CheckCircle2, label: 'Completed', value: completedCount },
    { icon: Users, label: 'Total Registrations', value: totalParticipants },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">Your Tournaments</h1>
        <Link
          href="/dashboard/tournaments/new"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          Create Tournament
        </Link>
      </div>

      {tournaments.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {analytics.map(({ icon: Icon, label, value }) => (
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
      )}

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament to start accepting registrations."
        />
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/organizer/tournaments/${tournament.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:hover:border-brand-800 dark:hover:bg-brand-900/10"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{tournament.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tournament.sport} · {tournament._count.teams}/{tournament.maxParticipants}{' '}
                  registered
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                {tournament.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
