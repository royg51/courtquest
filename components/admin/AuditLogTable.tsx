// Read-only audit trail table. Server component — no interactivity, just
// renders what listAuditLogs() returns. Each row shows who did what, when,
// to which entity, and a compact before -> after summary of the change.

import type { AuditLogRow } from '@/lib/audit';

const ACTION_LABELS: Record<string, string> = {
  ROLE_CHANGED: 'Role changed',
  TOURNAMENT_UPDATED: 'Tournament updated',
  TOURNAMENT_DELETED: 'Tournament deleted',
  MATCH_SCORE_UPDATED: 'Score updated',
  BRACKET_GENERATED: 'Bracket generated',
};

const ACTION_TONE: Record<string, string> = {
  ROLE_CHANGED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  TOURNAMENT_UPDATED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  TOURNAMENT_DELETED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  MATCH_SCORE_UPDATED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  BRACKET_GENERATED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Builds "role: PLAYER → ORGANIZER" style lines from the before/after
// snapshots. Iterates the union of keys so deletes (after = null) and
// creates (before = null) both render sensibly.
function changeLines(before: unknown, after: unknown): string[] {
  const b = asRecord(before);
  const a = asRecord(after);
  const keys = new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})]);
  if (keys.size === 0) return [];
  return Array.from(keys).map((key) => {
    const from = b ? formatValue(b[key]) : '—';
    const to = a ? formatValue(a[key]) : '—';
    return `${key}: ${from} → ${to}`;
  });
}

export default function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  if (logs.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        No audited actions yet. Role changes, score updates, bracket generation, and tournament
        edits/deletes will appear here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map((log) => {
            const lines = changeLines(log.before, log.after);
            return (
              <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {log.actorEmail ?? <span className="text-gray-400">system</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      ACTION_TONE[log.action] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {lines.length > 0 ? (
                    <ul className="space-y-0.5">
                      {lines.map((line, i) => (
                        <li key={i} className="font-mono text-xs">
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
