// Events page — the single place to browse tournaments and event history.
// Three tabs: Current Tournaments (live, DB-backed, open or in progress),
// Upcoming Events (announced future events — no real data source yet, see
// note below), and Past Events (completed DB tournaments + historical
// recap content that predates the live tournament system).

import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, CheckCircle2, ImageIcon } from 'lucide-react';
import { listTournaments } from '@/lib/tournaments';
import { PAST_EVENTS } from '@/lib/content/events';
import TournamentCard from '@/components/tournament/TournamentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventsTabs } from '@/components/events/EventsTabs';

export const metadata: Metadata = {
  title: 'Events',
  description:
    "Browse CourtQuest's current tournaments, upcoming events, and past tournament results.",
};

// Without this, Next statically prerenders the tournament lists at build
// time and new/updated tournaments wouldn't show up until the next deploy.
export const dynamic = 'force-dynamic';

const TABS = ['current', 'upcoming', 'past'] as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const activeTab = TABS.find((t) => t === searchParams.tab) ?? 'current';

  const [currentTournaments, completedTournaments] = await Promise.all([
    listTournaments({ isPublic: true, status: ['OPEN', 'IN_PROGRESS'] }),
    listTournaments({ isPublic: true, status: ['COMPLETED'] }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">Events</h1>

      <div className="mt-8">
        <EventsTabs
          initialTab={activeTab}
          tabs={[
            {
              key: 'current',
              label: 'Current Tournaments',
              content: <CurrentTournaments tournaments={currentTournaments} />,
            },
            {
              key: 'upcoming',
              label: 'Upcoming Events',
              content: <UpcomingEvents />,
            },
            {
              key: 'past',
              label: 'Past Events',
              content: <PastEvents completedTournaments={completedTournaments} />,
            },
          ]}
        />
      </div>
    </main>
  );
}

function CurrentTournaments({
  tournaments,
}: {
  tournaments: Awaited<ReturnType<typeof listTournaments>>;
}) {
  if (tournaments.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No tournaments open right now"
        description="Check back soon, or take a look at past tournaments for what's been hosted before."
      />
    );
  }

  return (
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
  );
}

function UpcomingEvents() {
  return (
    <EmptyState
      icon={Calendar}
      title="Stay tuned!"
      description="Our next tournament is currently being planned."
    />
  );
}

function PastEvents({
  completedTournaments,
}: {
  completedTournaments: Awaited<ReturnType<typeof listTournaments>>;
}) {
  return (
    <div className="space-y-10">
      {completedTournaments.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Results
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completedTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.slug}/bracket`}
                className="rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <TournamentCard tournament={tournament} registeredCount={tournament._count.teams} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Past Events
        </h2>
        <div className="space-y-6">
          {PAST_EVENTS.map((event) => (
            <div key={event.name} className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{event.name}</h3>
                  {event.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{event.subtitle}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {event.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  {event.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  {event.venue}, {event.location}
                </span>
              </div>

              {event.cause && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{event.cause}</p>
              )}

              <div className="mt-4 flex gap-6">
                {event.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                {event.photoAlbumUrl ? (
                  <a
                    href={event.photoAlbumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                  >
                    <ImageIcon className="h-4 w-4" />
                    View Photos
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    Photos coming soon
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
