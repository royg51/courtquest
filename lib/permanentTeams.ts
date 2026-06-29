// Permanent team service layer — rosters that exist independent of any one
// tournament. A logged-in player creates one, invites teammates (via
// lib/invites.ts), and can register it directly for tournaments afterward
// (see Team.permanentTeamId / lib/teams.ts's registerTeam).

import { db } from '@/lib/db';

export class PermanentTeamError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createPermanentTeam(creatorUserId: string, name: string, sport: string) {
  return db.permanentTeam.create({
    data: {
      name,
      sport,
      members: { create: [{ userId: creatorUserId, isPrimary: true, inviteStatus: 'ACCEPTED' }] },
    },
    include: { members: { include: { user: { select: { id: true, name: true } } } } },
  });
}

// Teams a user belongs to (any invite status, so they can see pending
// invites alongside teams they're already on).
export async function getMyPermanentTeams(userId: string) {
  return db.permanentTeam.findMany({
    where: { members: { some: { userId } } },
    include: { members: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

// Public team profile — name, sport, accepted roster (by name only, no
// contact info), and tournament history via Team.permanentTeamId. Mirrors
// the public player profile's privacy posture in lib/rankings.ts.
export async function getPermanentTeamProfile(id: string) {
  const team = await db.permanentTeam.findUnique({
    where: { id },
    include: {
      members: {
        where: { inviteStatus: 'ACCEPTED' },
        include: { user: { select: { id: true, name: true } } },
      },
      teams: {
        include: { tournament: { select: { name: true, slug: true, sport: true, status: true } } },
        orderBy: { registeredAt: 'desc' },
      },
    },
  });
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    sport: team.sport,
    members: team.members.map((m) => ({ id: m.id, name: m.user?.name ?? 'Unknown' })),
    tournamentHistory: team.teams.map((t) => ({
      teamId: t.id,
      tournamentName: t.tournament.name,
      tournamentSlug: t.tournament.slug,
      tournamentStatus: t.tournament.status,
      placement: t.placement,
    })),
  };
}

export async function removePermanentTeamMember(permanentTeamId: string, memberId: string, requestingUserId: string) {
  const team = await db.permanentTeam.findUnique({
    where: { id: permanentTeamId },
    include: { members: true },
  });
  if (!team) throw new PermanentTeamError('NOT_FOUND', 'Team not found');

  const requester = team.members.find((m) => m.userId === requestingUserId);
  if (!requester) throw new PermanentTeamError('FORBIDDEN', 'You are not a member of this team');

  const target = team.members.find((m) => m.id === memberId);
  if (!target) throw new PermanentTeamError('NOT_FOUND', 'Member not found');
  if (target.isPrimary) {
    throw new PermanentTeamError('INVALID_OPERATION', "Can't remove the team's primary member");
  }

  return db.permanentTeamMember.delete({ where: { id: memberId } });
}
