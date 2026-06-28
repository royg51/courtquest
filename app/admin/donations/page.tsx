// Admin donation analytics — ADMIN only. Unlike the public /donate page,
// this shows every donation (including anonymous ones) with donor email,
// since the org needs full records for bookkeeping even when a donor asked
// to be hidden from the public list.

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Heart, Hash, EyeOff } from 'lucide-react';
import { auth, requireRole } from '@/lib/auth';
import { getAllDonationsForAdmin, getDonationStats } from '@/lib/donations';

export const metadata: Metadata = { title: 'Donation Analytics' };
export const dynamic = 'force-dynamic';

export default async function AdminDonationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/donations');
  }
  if (!requireRole(session, 'ADMIN')) {
    redirect('/dashboard');
  }

  const [stats, donations] = await Promise.all([
    getDonationStats(),
    getAllDonationsForAdmin(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">Donation Analytics</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Heart className="h-4 w-4" />
            <span className="text-sm">Total Raised</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${(stats.totalCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Hash className="h-4 w-4" />
            <span className="text-sm">Total Donations</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.count}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold text-gray-900 dark:text-gray-100">
        All Donations
      </h2>
      {donations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No donations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {donations.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-1.5">
                      {d.isAnonymous && (
                        <EyeOff className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      )}
                      {d.donorName ?? '(no name provided)'}
                    </div>
                    {d.donorEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{d.donorEmail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    ${(d.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {d.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        <EyeOff className="mr-1 inline h-3 w-3" />
        marks donations hidden from the public donor list on /donate.
      </p>
    </main>
  );
}
