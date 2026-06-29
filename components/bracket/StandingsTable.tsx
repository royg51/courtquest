// Round-robin standings table. Read-only; ordered by wins then point
// differential (the order getRoundRobinStandings already returns). Once the
// tournament completes, placement medals appear on the top finishers.

import { Medal } from 'lucide-react';
import type { StandingRow } from '@/lib/formats/round-robin';

const RANK_TONE = ['text-amber-500', 'text-gray-400', 'text-amber-700'];

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) return null;

  const completed = rows.some((r) => r.placement != null);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">W</th>
            <th className="px-4 py-3 text-right">L</th>
            <th className="px-4 py-3 text-right">Diff</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr key={row.teamId}>
              <td className="px-4 py-3">
                {completed && i < 3 ? (
                  <Medal className={`h-4 w-4 ${RANK_TONE[i]}`} aria-label={`Place ${i + 1}`} />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{i + 1}</span>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                {row.teamName}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {row.wins}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {row.losses}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
