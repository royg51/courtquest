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

// Entry-fee revenue is a different revenue stream than donations and isn't
// tracked on the Donation model — it's derived from paid registrations.
export async function getPaidTeamCount(tournamentId: string) {
  return db.team.count({ where: { tournamentId, paymentStatus: 'PAID' } });
}

export class RegistrationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function registerTeam(
  tournamentId: string,
  data: {
    primaryUserId: string;
    teamName: string;
    skillLevel: string;
    waiverAccepted: boolean;
    partner?: {
      userId?: string;
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

  const alreadyRegistered = await db.teamMember.findFirst({
    where: {
      userId: data.primaryUserId,
      team: { tournamentId, status: { not: 'WITHDRAWN' } },
    },
  });
  if (alreadyRegistered) {
    throw new RegistrationError('ALREADY_REGISTERED', 'You are already registered for this tournament');
  }

  const activeTeamCount = await db.team.count({
    where: { tournamentId, status: { in: ['PENDING', 'CONFIRMED'] } },
  });
  const status = activeTeamCount >= tournament.maxParticipants ? 'WAITLISTED' : 'CONFIRMED';

  return db.team.create({
    data: {
      tournamentId,
      name: data.teamName,
      status,
      members: {
        create: [
          {
            userId: data.primaryUserId,
            isPrimary: true,
            skillLevel: data.skillLevel,
            waiverAccepted: data.waiverAccepted,
          },
          ...(data.partner
            ? [
                {
                  userId: data.partner.userId,
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
