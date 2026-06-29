// User/role management — admin only. Role itself stays a plain DB column
// (no new model); this just gives admins a UI instead of requiring direct
// database access for every role change.

import { db } from '@/lib/db';
import type { Role } from '@/types';

export async function listUsers() {
  return db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function updateUserRole(userId: string, role: Role) {
  return db.user.update({ where: { id: userId }, data: { role } });
}
