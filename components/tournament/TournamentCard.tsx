// Tournament summary card used in list and dashboard views.
// Shows: name, dates, sport, format badge, status badge, registration count, CTA button.

import type { Tournament } from '@prisma/client';

interface Props {
  tournament: Pick<
    Tournament,
    | 'id'
    | 'slug'
    | 'name'
    | 'sport'
    | 'format'
    | 'status'
    | 'startDate'
    | 'venue'
    | 'teamSize'
    | 'maxParticipants'
  >;
  registeredCount?: number;
}

export default function TournamentCard({ tournament, registeredCount }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800 dark:hover:bg-brand-900/10 dark:hover:shadow-brand-900/20">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{tournament.name}</h2>
        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {tournament.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{tournament.sport}</p>
      {tournament.venue && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tournament.venue}</p>
      )}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {new Date(tournament.startDate).toLocaleDateString()}
        {typeof registeredCount === 'number' && (
          <>
            {' '}
            · {registeredCount}/{tournament.maxParticipants} registered
          </>
        )}
      </p>
    </div>
  );
}
