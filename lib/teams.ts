// Team / registration service layer.
// Handles all registration logic: capacity checks, status transitions,
// team creation with guest member support.

import { db } from '@/lib/db';

export async function getTeamsForTournament(
  tournamentId: string,
  filters?: { status?: string | string[] }
) {
  const statusFilter = Array.isArray(filters?.status)
    ? { status: { in: filters.status } }
    : filters?.status
      ? { status: filters.status }
      : {};

  return db.team.findMany({
    where: { tournamentId, ...statusFilter },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { registeredAt: 'asc' },
  });
}

export type TeamWithMembers = Awaited<ReturnType<typeof getTeamsForTournament>>[number];

export async function getUserTeamForTournament(tournamentId: string, userId: string) {
  return db.team.findFirst({
    where: { tournamentId, status: { not: 'WITHDRAWN' }, members: { some: { userId } } },
  });
}

export class RegistrationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// The primary registrant is either a logged-in user (userId) or a guest
// (name + optional contact). Exactly one must be provided — the API route
// picks based on whether there's a session and whether the tournament allows
// guest registration.
export type PrimaryRegistrant =
  | { userId: string }
  | { guestName: string; guestEmail?: string; guestPhone?: string };

export async function registerTeam(
  tournamentId: string,
  data: {
    primary: PrimaryRegistrant;
    teamName: string;
    skillLevel: string;
    waiverAccepted: boolean;
    // Registering on behalf of an existing permanent team copies its
    // current accepted roster in directly (already-consented members, no
    // per-tournament invite needed) instead of using `partner` at all.
    permanentTeamId?: string;
    partner?: {
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
    };
  }
) {
  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    throw new RegistrationError('NOT_FOUND', 'Tournament not found');
  }
  if (tournament.status !== 'OPEN') {
    throw new RegistrationError('REGISTRATION_CLOSED', 'Registration is not open for this tournament');
  }

  const primary = data.primary;

  // Dedup: logged-in users by userId; guests by email (best effort — a guest
  // with no email can't be reliably deduped, so we allow it).
  if ('userId' in primary) {
    const alreadyRegistered = await db.teamMember.findFirst({
      where: { userId: primary.userId, team: { tournamentId, status: { not: 'WITHDRAWN' } } },
    });
    if (alreadyRegistered) {
      throw new RegistrationError('ALREADY_REGISTERED', 'You are already registered for this tournament');
    }
  } else if (primary.guestEmail) {
    const guestAlready = await db.teamMember.findFirst({
      where: {
        guestEmail: primary.guestEmail,
        team: { tournamentId, status: { not: 'WITHDRAWN' } },
      },
    });
    if (guestAlready) {
      throw new RegistrationError(
        'ALREADY_REGISTERED',
        'A registration with this email already exists for this tournament'
      );
    }
  }

  const activeTeamCount = await db.team.count({
    where: { tournamentId, status: { in: ['PENDING', 'CONFIRMED'] } },
  });
  const status = activeTeamCount >= tournament.maxParticipants ? 'WAITLISTED' : 'CONFIRMED';

  const primaryMember =
    'userId' in primary
      ? { userId: primary.userId, isPrimary: true, skillLevel: data.skillLevel, waiverAccepted: data.waiverAccepted }
      : {
          guestName: primary.guestName,
          guestEmail: primary.guestEmail,
          guestPhone: primary.guestPhone,
          isPrimary: true,
          skillLevel: data.skillLevel,
          waiverAccepted: data.waiverAccepted,
        };

  let permanentRosterMembers: Array<{ userId: string; waiverAccepted: boolean }> = [];
  if (data.permanentTeamId) {
    const requestingUserId = 'userId' in primary ? primary.userId : null;
    if (!requestingUserId) {
      throw new RegistrationError('FORBIDDEN', 'Only logged-in users can register a permanent team');
    }
    const permanentTeam = await db.permanentTeam.findUnique({
      where: { id: data.permanentTeamId },
      include: { members: { where: { inviteStatus: 'ACCEPTED' } } },
    });
    if (!permanentTeam || !permanentTeam.members.some((m) => m.userId === requestingUserId)) {
      throw new RegistrationError('FORBIDDEN', 'You are not a member of this team');
    }
    // The requesting user is already the primary member above — copy in
    // everyone else's accepted membership directly, no per-tournament
    // invite needed since they already consented at the team level.
    permanentRosterMembers = permanentTeam.members
      .filter((m) => m.userId && m.userId !== requestingUserId)
      .map((m) => ({ userId: m.userId!, waiverAccepted: data.waiverAccepted }));
  }

  return db.team.create({
    data: {
      tournamentId,
      name: data.teamName,
      status,
      permanentTeamId: data.permanentTeamId,
      members: {
        create: [
          primaryMember,
          ...permanentRosterMembers.map((m) => ({ ...m, isPrimary: false })),
          ...(data.partner
            ? [
                {
                  guestName: data.partner.guestName,
                  guestEmail: data.partner.guestEmail,
                  guestPhone: data.partner.guestPhone,
                  isPrimary: false,
                  waiverAccepted: data.waiverAccepted,
                },
              ]
            : []),
        ],
      },
    },
    include: { members: true },
  });
}

export async function updateTeamStatus(
  teamId: string,
  status: 'CONFIRMED' | 'WAITLISTED' | 'WITHDRAWN'
) {
  return db.team.update({ where: { id: teamId }, data: { status } });
}

export async function withdrawTeam(teamId: string, requestingUserId: string) {
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { members: true, tournament: { select: { organizerId: true } } },
  });
  if (!team) {
    throw new RegistrationError('NOT_FOUND', 'Team not found');
  }

  const isMember = team.members.some((m) => m.userId === requestingUserId);
  const isOrganizer = team.tournament.organizerId === requestingUserId;
  if (!isMember && !isOrganizer) {
    throw new RegistrationError('FORBIDDEN', 'You are not a member of this team');
  }

  return db.team.update({ where: { id: teamId }, data: { status: 'WITHDRAWN' } });
}
