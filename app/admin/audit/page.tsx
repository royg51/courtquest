// Admin audit log viewer — ADMIN only. Read-only trail of privileged
// actions (role changes, score overrides, bracket generation, tournament
// edits/deletes) with before/after values and who did them.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { listAuditLogs } from '@/lib/audit';
import AuditLogTable from '@/components/admin/AuditLogTable';

export const metadata: Metadata = { title: 'Audit Log' };
export const dynamic = 'force-dynamic';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/audit');
  }
  if (!requireRole(session, 'ADMIN')) {
    redirect('/dashboard');
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const { logs, total, totalPages } = await listAuditLogs({ page });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-brand-700 dark:text-brand-400">Audit Log</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Every privileged action — role changes, match-score overrides, bracket generation, and
        tournament edits/deletes — is recorded here with who did it and the before/after values.
        This log is append-only. {total} {total === 1 ? 'entry' : 'entries'} total.
      </p>

      <AuditLogTable logs={logs} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-md border border-gray-300 px-3 py-1.5 dark:border-gray-700 ${
              page <= 1
                ? 'pointer-events-none opacity-40'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            ← Newer
          </Link>
          <span className="text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-md border border-gray-300 px-3 py-1.5 dark:border-gray-700 ${
              page >= totalPages
                ? 'pointer-events-none opacity-40'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Older →
          </Link>
        </div>
      )}
    </main>
  );
}
