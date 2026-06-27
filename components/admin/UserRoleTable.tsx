'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Role } from '@/types';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLES: Role[] = ['PLAYER', 'ORGANIZER', 'ADMIN'];

export default function UserRoleTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(users);
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateRole = async (userId: string, role: Role) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to update role');
        return;
      }
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('Role updated');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 text-gray-900">
                {user.name}
                {user.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{user.email}</td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  disabled={savingId === user.id}
                  onChange={(e) => updateRole(user.id, e.target.value as Role)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
