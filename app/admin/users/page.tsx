// Admin user/role management — ADMIN only.

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { listUsers } from '@/lib/users';
import UserRoleTable from '@/components/admin/UserRoleTable';

export const metadata: Metadata = { title: 'Manage Users' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/users');
  }
  if (!requireRole(session, 'ADMIN')) {
    redirect('/dashboard');
  }

  const users = await listUsers();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-brand-700 dark:text-brand-400">Manage Users</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        PLAYER is the default role. ORGANIZER can create and manage their own tournaments. ADMIN
        can manage every tournament and promote other users.
      </p>
      <UserRoleTable users={users} currentUserId={session.user.id} />
    </main>
  );
}
