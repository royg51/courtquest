// Invite-by-email flow, shared by tournament-team partner invites
// (TeamMember) and permanent-team member invites (PermanentTeamMember).
// Both use the same inviteStatus/inviteToken convention: PENDING until
// accepted/declined, a unique token driving the public /invites/[token]
// page. Guest-filled-in partners (no email, no consent step) are untouched —
// this is strictly the new, consent-based path.

import { db } from '@/lib/db';
import { generateSecureToken } from '@/lib/tokens';
import { sendTeamInvite } from '@/lib/email';

export class InviteError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Tournament-team partner invite ---------------------------------------

export async function inviteTeamMemberByEmail(teamId: string, inviterId: string, email: string) {
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      members: true,
      tournament: { select: { name: true, slug: true, teamSize: true, organizerId: true } },
    },
  });
  if (!team) throw new InviteError('NOT_FOUND', 'Team not found');

  const isMember = team.members.some((m) => m.userId === inviterId);
  const isOrganizer = team.tournament.organizerId === inviterId;
  if (!isMember && !isOrganizer) {
    throw new InviteError('FORBIDDEN', 'You are not a member of this team');
  }

  const normalizedEmail = normalizeEmail(email);
  // The primary registrant's slot is fixed — every other slot is "the
  // partner's", regardless of who's sending the invite.
  const partnerSlots = team.members.filter((m) => !m.isPrimary);
  if (partnerSlots.length >= team.tournament.teamSize - 1) {
    // A slot already exists for the partner — reuse it (re-invite) rather
    // than exceeding the tournament's team size.
    const existing = partnerSlots[0];
    if (existing.inviteStatus === 'ACCEPTED' && existing.userId) {
      throw new InviteError('TEAM_FULL', 'This team already has a partner');
    }
    const token = generateSecureToken();
    const updated = await db.teamMember.update({
      where: { id: existing.id },
      data: { guestEmail: normalizedEmail, inviteStatus: 'PENDING', inviteToken: token, userId: null },
    });
    await sendInviteEmail(inviterId, team.name, `the ${team.tournament.name} tournament`, normalizedEmail, token);
    return updated;
  }

  const token = generateSecureToken();
  const created = await db.teamMember.create({
    data: {
      teamId,
      guestEmail: normalizedEmail,
      inviteStatus: 'PENDING',
      inviteToken: token,
      isPrimary: false,
    },
  });
  await sendInviteEmail(inviterId, team.name, `the ${team.tournament.name} tournament`, normalizedEmail, token);
  return created;
}

// Permanent-team member invite ------------------------------------------

export async function invitePermanentTeamMemberByEmail(
  permanentTeamId: string,
  inviterId: string,
  email: string
) {
  const team = await db.permanentTeam.findUnique({
    where: { id: permanentTeamId },
    include: { members: true },
  });
  if (!team) throw new InviteError('NOT_FOUND', 'Team not found');

  const isMember = team.members.some((m) => m.userId === inviterId);
  if (!isMember) {
    throw new InviteError('FORBIDDEN', 'You are not a member of this team');
  }

  const normalizedEmail = normalizeEmail(email);
  const alreadyInvited = team.members.find((m) => m.guestEmail === normalizedEmail);
  if (alreadyInvited && alreadyInvited.inviteStatus === 'ACCEPTED') {
    throw new InviteError('ALREADY_MEMBER', 'This person is already on the team');
  }

  const token = generateSecureToken();
  const member = alreadyInvited
    ? await db.permanentTeamMember.update({
        where: { id: alreadyInvited.id },
        data: { inviteStatus: 'PENDING', inviteToken: token },
      })
    : await db.permanentTeamMember.create({
        data: { permanentTeamId, guestEmail: normalizedEmail, inviteStatus: 'PENDING', inviteToken: token },
      });

  await sendInviteEmail(inviterId, team.name, 'a permanent team', normalizedEmail, token);
  return member;
}

async function sendInviteEmail(
  inviterId: string,
  teamName: string,
  context: string,
  toEmail: string,
  token: string
) {
  const inviter = await db.user.findUnique({ where: { id: inviterId }, select: { name: true } });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  await sendTeamInvite({
    to: toEmail,
    inviterName: inviter?.name ?? 'Someone',
    teamName,
    context,
    acceptUrl: `${appUrl}/invites/${token}`,
  });
}

// Unified accept/decline, looked up by token regardless of which table it
// belongs to ---------------------------------------------------------------

export interface InviteDetails {
  kind: 'tournament' | 'permanent';
  teamName: string;
  context: string;
  invitedEmail: string | null;
  status: string;
}

export async function getInviteByToken(token: string): Promise<InviteDetails | null> {
  const teamMember = await db.teamMember.findUnique({
    where: { inviteToken: token },
    include: { team: { include: { tournament: { select: { name: true } } } } },
  });
  if (teamMember) {
    return {
      kind: 'tournament',
      teamName: teamMember.team.name,
      context: `the ${teamMember.team.tournament.name} tournament`,
      invitedEmail: teamMember.guestEmail,
      status: teamMember.inviteStatus,
    };
  }

  const permanentMember = await db.permanentTeamMember.findUnique({
    where: { inviteToken: token },
    include: { permanentTeam: { select: { name: true } } },
  });
  if (permanentMember) {
    return {
      kind: 'permanent',
      teamName: permanentMember.permanentTeam.name,
      context: 'a permanent team',
      invitedEmail: permanentMember.guestEmail,
      status: permanentMember.inviteStatus,
    };
  }

  return null;
}

export async function acceptInvite(token: string, userId: string) {
  const teamMember = await db.teamMember.findUnique({ where: { inviteToken: token } });
  if (teamMember) {
    if (teamMember.inviteStatus !== 'PENDING') {
      throw new InviteError('INVALID_STATE', 'This invite has already been responded to');
    }
    return db.teamMember.update({
      where: { id: teamMember.id },
      data: { userId, inviteStatus: 'ACCEPTED' },
    });
  }

  const permanentMember = await db.permanentTeamMember.findUnique({ where: { inviteToken: token } });
  if (permanentMember) {
    if (permanentMember.inviteStatus !== 'PENDING') {
      throw new InviteError('INVALID_STATE', 'This invite has already been responded to');
    }
    return db.permanentTeamMember.update({
      where: { id: permanentMember.id },
      data: { userId, inviteStatus: 'ACCEPTED' },
    });
  }

  throw new InviteError('NOT_FOUND', 'Invite not found');
}

export async function declineInvite(token: string) {
  const teamMember = await db.teamMember.findUnique({ where: { inviteToken: token } });
  if (teamMember) {
    if (teamMember.inviteStatus !== 'PENDING') {
      throw new InviteError('INVALID_STATE', 'This invite has already been responded to');
    }
    return db.teamMember.update({ where: { id: teamMember.id }, data: { inviteStatus: 'DECLINED' } });
  }

  const permanentMember = await db.permanentTeamMember.findUnique({ where: { inviteToken: token } });
  if (permanentMember) {
    if (permanentMember.inviteStatus !== 'PENDING') {
      throw new InviteError('INVALID_STATE', 'This invite has already been responded to');
    }
    return db.permanentTeamMember.update({
      where: { id: permanentMember.id },
      data: { inviteStatus: 'DECLINED' },
    });
  }

  throw new InviteError('NOT_FOUND', 'Invite not found');
}

// Called right after a new account is created (see app/api/auth/signup) —
// links any guest-email TeamMember/PermanentTeamMember rows (whether a
// pending invite or an already-accepted guest a partner filled in) to the
// new account, so the invite page and team listings recognize them. Linking
// userId is not the same as accepting — a PENDING invite still needs an
// explicit accept.
export async function linkGuestRecordsToNewUser(userId: string, email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await db.teamMember.updateMany({
    where: { guestEmail: normalizedEmail, userId: null },
    data: { userId },
  });
  await db.permanentTeamMember.updateMany({
    where: { guestEmail: normalizedEmail, userId: null },
    data: { userId },
  });
}
