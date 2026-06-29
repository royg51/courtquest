// "Next up on each court" — read-only order-of-play display. Used on both the
// organizer schedule page and the public bracket page. The first match in
// each court's list is highlighted as "Now / Next".

import type { CourtQueue } from '@/lib/matches';

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CourtQueues({ queues }: { queues: CourtQueue[] }) {
  if (queues.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        No matches are assigned to courts yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {queues.map((queue) => (
        <div
          key={queue.court}
          className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
        >
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
            Court {queue.court}
          </h3>
          <ol className="space-y-2">
            {queue.matches.map((m, i) => {
              const time = formatTime(m.scheduledAt);
              return (
                <li
                  key={m.id}
                  className={`rounded-md px-3 py-2 text-sm ${
                    i === 0
                      ? 'bg-brand-50 dark:bg-brand-900/20'
                      : 'bg-gray-50 dark:bg-gray-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-gray-900 dark:text-gray-100">
                      {m.teamA ?? 'TBD'} <span className="text-gray-400">vs</span>{' '}
                      {m.teamB ?? 'TBD'}
                    </span>
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                        {m.status === 'IN_PROGRESS' ? 'Live' : 'Next'}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {m.round}
                    {time ? ` · ${time}` : ''}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
