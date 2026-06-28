// Match service layer.
// Handles score submission and automatic winner advancement through the bracket.
//
// Core logic: when a score is submitted, determine the winner, update the match,
// then place the winner into the correct slot (teamA or teamB) of nextMatch.
// If it's the final match, set tournament.status = COMPLETED.

import { db } from '@/lib/db';
import { sendMatchReadyNotification, sendTournamentResults } from '@/lib/email';

export class MatchError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function getMatchById(matchId: string) {
  return db.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      round: { include: { bracket: { select: { tournamentId: true } } } },
    },
  });
}

// Set/clear a single match's court + scheduled time. BYE matches aren't
// playable, so they can't be scheduled.
export async function updateMatchSchedule(
  matchId: string,
  data: { courtNumber: number | null; scheduledAt: Date | null }
) {
  const match = await db.match.findUnique({ where: { id: matchId }, select: { status: true } });
  if (!match) throw new MatchError('NOT_FOUND', 'Match not found');
  if (match.status === 'BYE') {
    throw new MatchError('INVALID_MATCH', 'Bye matches cannot be scheduled');
  }
  return db.match.update({
    where: { id: matchId },
    data: { courtNumber: data.courtNumber, scheduledAt: data.scheduledAt },
  });
}

// Distributes playable matches across the tournament's available courts,
// round by round (so a single round's matches spread across courts rather
// than piling onto court 1). BYE matches are skipped. Returns how many
// matches were assigned. Idempotent: re-running just re-spreads them.
export async function autoAssignCourts(tournamentId: string): Promise<number> {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { numberOfCourts: true, bracket: { select: { id: true } } },
  });
  if (!tournament) throw new MatchError('NOT_FOUND', 'Tournament not found');
  if (!tournament.bracket) throw new MatchError('NO_BRACKET', 'Generate the bracket first');

  const courts = Math.max(1, tournament.numberOfCourts);
  const matches = await db.match.findMany({
    where: { round: { bracketId: tournament.bracket.id }, status: { not: 'BYE' } },
    orderBy: [{ round: { number: 'asc' } }, { position: 'asc' }],
    select: { id: true },
  });

  await db.$transaction(
    matches.map((m, i) =>
      db.match.update({ where: { id: m.id }, data: { courtNumber: (i % courts) + 1 } })
    )
  );

  return matches.length;
}

export interface CourtQueue {
  court: number;
  matches: {
    id: string;
    round: string;
    teamA: string | null;
    teamB: string | null;
    scheduledAt: string | null;
    status: string;
  }[];
}

// "Next up on each court" — upcoming (not completed, not bye) matches that
// have a court assigned, grouped by court and ordered by scheduled time then
// bracket position. Powers the order-of-play / queue displays.
export async function getCourtQueues(tournamentId: string): Promise<CourtQueue[]> {
  const matches = await db.match.findMany({
    where: {
      round: { bracket: { tournamentId } },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      courtNumber: { not: null },
    },
    orderBy: [{ scheduledAt: 'asc' }, { round: { number: 'asc' } }, { position: 'asc' }],
    include: {
      teamA: { select: { name: true } },
      teamB: { select: { name: true } },
      round: { select: { name: true } },
    },
  });

  const byCourt = new Map<number, CourtQueue['matches']>();
  for (const m of matches) {
    const court = m.courtNumber!;
    if (!byCourt.has(court)) byCourt.set(court, []);
    byCourt.get(court)!.push({
      id: m.id,
      round: m.round.name,
      teamA: m.teamA?.name ?? null,
      teamB: m.teamB?.name ?? null,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      status: m.status,
    });
  }

  return [...byCourt.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([court, queueMatches]) => ({ court, matches: queueMatches }));
}

export async function submitScore(matchId: string, scores: { scoreA: number; scoreB: number }) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { round: { include: { bracket: true } } },
  });

  if (!match) throw new MatchError('NOT_FOUND', 'Match not found');
  if (match.status === 'BYE') {
    throw new MatchError('INVALID_MATCH', 'Bye matches cannot have a score submitted');
  }
  if (!match.teamAId || !match.teamBId) {
    throw new MatchError('TEAMS_NOT_SET', 'Both teams must be set before submitting a score');
  }
  if (scores.scoreA === scores.scoreB) {
    throw new MatchError('TIE_NOT_ALLOWED', 'Elimination matches cannot end in a tie');
  }

  const winnerId = scores.scoreA > scores.scoreB ? match.teamAId : match.teamBId;

  const updatedMatch = await db.$transaction(async (tx) => {
    const updated = await tx.match.update({
      where: { id: matchId },
      data: {
        scoreA: scores.scoreA,
        scoreB: scores.scoreB,
        winnerId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    if (match.nextMatchId) {
      await tx.match.update({
        where: { id: match.nextMatchId },
        data: match.isSlotA ? { teamAId: winnerId } : { teamBId: winnerId },
      });
    } else {
      // No next match — this was the Finals. Tournament is complete.
      await tx.tournament.update({
        where: { id: match.round.bracket.tournamentId },
        data: { status: 'COMPLETED' },
      });
    }

    return updated;
  });

  // Outside the transaction: emailing while holding a DB transaction open
  // would tie up a connection for the duration of the network call.
  if (match.nextMatchId) {
    await notifyIfNextMatchReady(match.nextMatchId, match.round.bracket.tournamentId);
  } else {
    await notifyTournamentResults(match.round.bracket.tournamentId, winnerId);
  }

  return updatedMatch;
}

// Fires once a bracket match has both teams filled in — which may happen
// right after this update, or may have already happened on the sibling
// match earlier. Both cases land here; only the one where both slots end
// up set actually sends anything.
async function notifyIfNextMatchReady(nextMatchId: string, tournamentId: string) {
  const nextMatch = await db.match.findUnique({
    where: { id: nextMatchId },
    include: {
      teamA: { include: { members: { include: { user: true } } } },
      teamB: { include: { members: { include: { user: true } } } },
    },
  });
  if (!nextMatch?.teamA || !nextMatch?.teamB) return;

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, slug: true },
  });
  if (!tournament) return;

  const notifyTeam = async (
    team: NonNullable<typeof nextMatch.teamA>,
    opponentName: string
  ) => {
    for (const member of team.members) {
      const to = member.user?.email ?? member.guestEmail;
      const name = member.user?.name ?? member.guestName;
      if (!to || !name) continue;
      await sendMatchReadyNotification({
        to,
        name,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
        opponentName,
      });
    }
  };

  await notifyTeam(nextMatch.teamA, nextMatch.teamB.name);
  await notifyTeam(nextMatch.teamB, nextMatch.teamA.name);
}

// Fires once, when the finals match completes and the tournament flips to
// COMPLETED — emails every team that played, not just the winner.
async function notifyTournamentResults(tournamentId: string, championTeamId: string) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      name: true,
      slug: true,
      teams: { include: { members: { include: { user: true } } } },
    },
  });
  if (!tournament) return;

  const champion = tournament.teams.find((t) => t.id === championTeamId);
  if (!champion) return;

  for (const team of tournament.teams) {
    for (const member of team.members) {
      const to = member.user?.email ?? member.guestEmail;
      const name = member.user?.name ?? member.guestName;
      if (!to || !name) continue;
      await sendTournamentResults({
        to,
        name,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
        championName: champion.name,
      });
    }
  }
}
