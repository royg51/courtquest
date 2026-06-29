// GET  /api/tournaments/[id]/teams  — list registrations (organizer/admin)
// POST /api/tournaments/[id]/teams  — register a team (any authenticated user)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { getTeamsForTournament, registerTeam, RegistrationError, type PrimaryRegistrant } from '@/lib/teams';
import { registerTeamSchema, guestRegisterTeamSchema } from '@/lib/schemas/team';
import { inviteTeamMemberByEmail, InviteError } from '@/lib/invites';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { sendRegistrationConfirmation, sendOrganizerNewRegistrationNotification } from '@/lib/email';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = session?.user?.id === tournament.organizerId;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const teams = await getTeamsForTournament(params.id);
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Two paths: a logged-in user, or a guest when the tournament explicitly
  // allows guest registration. Anything else is unauthorized.
  const isGuest = !session?.user;
  if (isGuest && !tournament.allowGuestRegistration) {
    return NextResponse.json(
      { error: 'Sign in to register for this tournament', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Rate limit by user id when logged in, by IP for guests.
  const rateKey = session?.user?.id ?? getClientIp(request);
  const { success, reset } = await checkRateLimit('registration', rateKey, RATE_LIMIT_CONFIG.registration);
  if (!success) return rateLimitResponse(reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = isGuest
    ? guestRegisterTeamSchema.safeParse(body)
    : registerTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  // Build the primary registrant + who the confirmation email goes to.
  let primary: PrimaryRegistrant;
  let registrantName: string;
  let registrantEmail: string | null;
  if (isGuest) {
    const g = (parsed.data as import('@/lib/schemas/team').GuestRegisterTeamInput).guestPrimary;
    const email = g.guestEmail && g.guestEmail !== '' ? g.guestEmail : undefined;
    primary = { guestName: g.guestName, guestEmail: email, guestPhone: g.guestPhone };
    registrantName = g.guestName;
    registrantEmail = email ?? null;
  } else {
    primary = { userId: session!.user.id };
    registrantName = session!.user.name ?? 'Player';
    registrantEmail = session!.user.email ?? null;
  }

  const partner = (parsed.data as { partner?: { guestName?: string; guestEmail?: string; guestPhone?: string; inviteEmail?: string } }).partner;
  if (isGuest && partner?.inviteEmail) {
    return NextResponse.json(
      { error: 'Sign in to invite a partner by email', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const { guestPrimary: _omit, ...teamFields } = parsed.data as Record<string, unknown>;
    void _omit;
    const team = await registerTeam(params.id, {
      primary,
      teamName: teamFields.teamName as string,
      skillLevel: teamFields.skillLevel as string,
      waiverAccepted: teamFields.waiverAccepted as boolean,
      permanentTeamId: teamFields.permanentTeamId as string | undefined,
      partner: partner?.inviteEmail ? undefined : partner,
    });

    if (partner?.inviteEmail) {
      await inviteTeamMemberByEmail(team.id, session!.user.id, partner.inviteEmail);
    }

    if (registrantEmail) {
      await sendRegistrationConfirmation({
        to: registrantEmail,
        name: registrantName,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
        teamName: team.name,
      });
    }

    const organizer = await db.user.findUnique({
      where: { id: tournament.organizerId },
      select: { email: true, name: true },
    });
    if (organizer?.email) {
      await sendOrganizerNewRegistrationNotification({
        to: organizer.email,
        organizerName: organizer.name,
        tournamentName: tournament.name,
        tournamentId: tournament.id,
        teamName: team.name,
        playerName: registrantName,
        paid: !tournament.requiresPayment,
      });
    }

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    if (error instanceof RegistrationError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    if (error instanceof InviteError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
