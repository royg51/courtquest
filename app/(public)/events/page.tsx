// Events page — browse all tournaments and event history.
// Three tabs: Current (live DB tournaments), Upcoming, Past Events (DB + historical content).

import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { listTournaments } from '@/lib/tournaments';
import { PAST_EVENTS } from '@/lib/content/events';
import TournamentCard from '@/components/tournament/TournamentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventsTabs } from '@/components/events/EventsTabs';
import { PhotoGrid } from '@/components/ui/PhotoGrid';
import { HERO_IMAGES } from '@/lib/media';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Events',
  description:
    "Browse CourtQuest's current tournaments, upcoming events, and past tournament results.",
  path: '/events',
});

export const dynamic = 'force-dynamic';

const TABS = ['current', 'upcoming', 'past'] as const;

// Hero banner — sourced from central media config

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
    <main>
      {/* ─── BANNER ────────────────────────────────────────────────────────── */}
      {/* object-top biases toward the upper portion of the image so faces
          and players stay visible regardless of container height */}
      <div className="relative h-64 overflow-hidden sm:h-80">
        <Image
          src={HERO_IMAGES.events.src}
          alt={HERO_IMAGES.events.alt}
          fill
          priority
          className="object-cover object-[center_32%]"
          sizes={HERO_IMAGES.events.sizes}
          quality={85}
        />
        {/* Gradient: dark at bottom (overlaps text area), light at top (shows players) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
            Events
          </h1>
          <p className="mt-2 text-sm font-medium text-white/75 drop-shadow sm:text-base">
            All CourtQuest tournaments &amp; highlights
          </p>
        </div>
      </div>

      {/* ─── TABS ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EventsTabs
          key={activeTab}
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
      description="Our next tournament is currently being planned. Check back soon or follow us on social media for announcements."
      action={{ label: 'View Past Events', href: '/events?tab=past' }}
    />
  );
}

function PastEvents({
  completedTournaments,
}: {
  completedTournaments: Awaited<ReturnType<typeof listTournaments>>;
}) {
  return (
    <div className="space-y-12">
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
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tournament Highlights
        </h2>
        <div className="space-y-12">
          {PAST_EVENTS.map((event) => (
            <article
              key={event.name}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Event header */}
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {event.name}
                    </h3>
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

                <div className="mt-5 flex gap-8">
                  {event.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo gallery */}
              {event.photos && event.photos.length > 0 && (
                <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Tournament Photos
                  </p>
                  <PhotoGrid
                    photos={event.photos}
                    columns={4}
                    className="gap-1.5"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
