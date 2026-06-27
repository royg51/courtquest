// Admin panel — ADMIN role only.
// Shows lightweight platform stats. User management and per-tournament
// admin tools are not built yet — flagged as follow-up, not faked here.

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Users, Trophy, Activity, UserCheck } from 'lucide-react';
import { auth, requireRole } from '@/lib/auth';
import { getPlatformStats } from '@/lib/stats';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }
  if (!requireRole(session, 'ADMIN')) {
    redirect('/dashboard');
  }

  const stats = await getPlatformStats();

  const cards = [
    { icon: Trophy, label: 'Tournaments Created', value: stats.tournamentsCreated },
    { icon: Activity, label: 'Active Tournaments', value: stats.activeTournaments },
    { icon: UserCheck, label: 'Participants Joined', value: stats.participantsJoined },
    { icon: Users, label: 'Total Users', value: stats.totalUsers },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
