// Team / registration service layer.
// Handles all registration logic: capacity checks, status transitions,
// team creation with guest member support.

import { Prisma } from '@prisma/client';
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

  const membersData = [
    primaryMember,
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
  ];

  // For tournaments that require payment, the initial status is PENDING
  // (registered but not yet eligible for bracket generation). The Stripe
  // webhook promotes PENDING → CONFIRMED once payment lands. For free
  // tournaments, the team is CONFIRMED immediately.
  //
  // The capacity count and create run in a SERIALIZABLE transaction so
  // concurrent registrations can't both read "1 slot left" and both become
  // CONFIRMED — PostgreSQL will abort and retry one of them on conflict.
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          // Re-count inside the transaction for a fresh, consistent read.
          const activeTeamCount = await tx.team.count({
            where: { tournamentId, status: { in: ['PENDING', 'CONFIRMED'] } },
          });

          let status: string;
          if (activeTeamCount >= tournament.maxParticipants) {
            status = 'WAITLISTED';
          } else if (tournament.requiresPayment) {
            // Awaiting payment — not yet bracket-eligible.
            status = 'PENDING';
          } else {
            status = 'CONFIRMED';
          }

          return tx.team.create({
            data: {
              tournamentId,
              name: data.teamName,
              status,
              members: { create: membersData },
            },
            include: { members: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      // P2034 = serialization failure — retry up to MAX_RETRIES times.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2034' &&
        attempt < MAX_RETRIES - 1
      ) {
        continue;
      }
      throw e;
    }
  }

  // TypeScript needs this but the loop above always returns or throws.
  throw new RegistrationError('INTERNAL', 'Registration failed after retries');
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
