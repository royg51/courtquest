// Group-stage standings — one table per group, same columns as round robin's
// StandingsTable (each group's stage IS a round robin scoped to its own
// teams). Rows within the qualification cutoff are highlighted; once the
// tournament completes, placement medals appear on the eventual top finishers
// (set once the playoff bracket that follows resolves, not by this table).

import { Medal } from 'lucide-react';
import type { StandingRow } from '@/lib/formats/round-robin';

const RANK_TONE = ['text-amber-500', 'text-gray-400', 'text-amber-700'];

export default function GroupStandingsTable({
  groups,
  qualifiersPerGroup,
}: {
  groups: Array<{ groupNumber: number; rows: StandingRow[] }>;
  qualifiersPerGroup: number;
}) {
  if (groups.length === 0) return null;

  const completed = groups.some((g) => g.rows.some((r) => r.placement != null));

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.groupNumber}>
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Group {group.groupNumber}
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[360px] text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2 text-right">W</th>
                  <th className="px-3 py-2 text-right">L</th>
                  <th className="px-3 py-2 text-right">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {group.rows.map((row, i) => (
                  <tr
                    key={row.teamId}
                    className={
                      i < qualifiersPerGroup
                        ? 'bg-brand-50/50 dark:bg-brand-900/10'
                        : undefined
                    }
                  >
                    <td className="px-3 py-2">
                      {completed && i < 3 ? (
                        <Medal className={`h-4 w-4 ${RANK_TONE[i]}`} aria-label={`Place ${i + 1}`} />
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {row.teamName}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {row.wins}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {row.losses}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                      {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Top {qualifiersPerGroup} advance{qualifiersPerGroup === 1 ? 's' : ''} to playoffs.
          </p>
        </div>
      ))}
    </div>
  );
}
