// Match service layer.
// Handles score submission and automatic winner advancement through the bracket.
//
// Core logic: when a score is submitted, determine the winner, update the match,
// then place the winner into the correct slot (teamA or teamB) of nextMatch.
// If it's the final match, set tournament.status = COMPLETED.

import { db } from '@/lib/db';
import { sendMatchReadyNotification } from '@/lib/email';

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
    },
  });
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
