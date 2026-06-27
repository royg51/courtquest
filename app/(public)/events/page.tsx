// Real-world event history — separate from /tournaments, which is the
// live, database-backed tournament system. These are marketing/recap
// content for events that happened (or will happen) outside the app.

import type { Metadata } from 'next';
import { Calendar, MapPin, CheckCircle2, ImageIcon } from 'lucide-react';
import { PAST_EVENTS } from '@/lib/content/events';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Events',
  description: "CourtQuest's upcoming and past community sports tournaments.",
};

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">Events</h1>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Events</h2>
        <EmptyState
          icon={Calendar}
          title="Stay tuned!"
          description="Our next tournament is currently being planned."
        />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Past Tournaments</h2>
        <div className="space-y-6">
          {PAST_EVENTS.map((event) => (
            <div key={event.name} className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{event.name}</h3>
                  {event.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{event.subtitle}</p>}
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

              {event.cause && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{event.cause}</p>}

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
    </main>
  );
}
