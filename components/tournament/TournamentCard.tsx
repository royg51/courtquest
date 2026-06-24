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
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">{tournament.name}</h2>
        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          {tournament.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{tournament.sport}</p>
      {tournament.venue && <p className="mt-1 text-sm text-gray-500">{tournament.venue}</p>}
      <p className="mt-2 text-sm text-gray-500">
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
