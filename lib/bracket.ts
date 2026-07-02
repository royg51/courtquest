// Bracket generation engine.
// Builds a single-elimination bracket from a list of confirmed teams.
//
// Algorithm:
//   1. Sort teams by seed (or registration order if unseeded)
//   2. Find the next power of 2 >= team count
//   3. Create rounds: log2(teamCount) rounds total
//   4. Assign teams to first-round matches (standard bracket seeding: 1 vs last, 2 vs second-to-last)
//   5. Fill bye matches where team count is not a perfect power of 2
//   6. Link each match's nextMatchId to the correct match in the following round
//   7. Set isSlotA flag so score submission knows which slot the winner fills
//   8. Persist everything in a single Prisma transaction

import { db } from '@/lib/db';
import { sendTournamentStarted } from '@/lib/email';
import type { BracketTree, MatchStatus } from '@/types';

export class BracketError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Helper: next power of 2 >= n
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Helper: round names by position from finals
export function roundName(roundsFromFinal: number): string {
  if (roundsFromFinal === 0) return 'Finals';
  if (roundsFromFinal === 1) return 'Semifinals';
  if (roundsFromFinal === 2) return 'Quarterfinals';
  return `Round of ${Math.pow(2, roundsFromFinal + 1)}`;
}

// Standard bracket seeding order (1 vs N, 2 vs N-1, recursively applied to
// each half) so that bye slots — which always number fewer than size/2 —
// land in distinct first-round matches instead of clustering together.
function seedOrder(size: number): number[] {
  if (size === 1) return [1];
  const prev = seedOrder(size / 2);
  const result: number[] = [];
  for (const s of prev) {
    result.push(s, size + 1 - s);
  }
  return result;
}

export async function generateSingleEliminationBracket(tournamentId: string) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      bracket: true,
      teams: {
        where: { status: 'CONFIRMED' },
        orderBy: [{ seed: 'asc' }, { registeredAt: 'asc' }],
      },
    },
  });

  if (!tournament) throw new BracketError('NOT_FOUND', 'Tournament not found');
  if (tournament.bracket) {
    throw new BracketError('ALREADY_EXISTS', 'Bracket already generated for this tournament');
  }
  // Enforce minParticipants, but never go below the hard minimum of 2.
  const minRequired = Math.max(2, tournament.minParticipants);
  if (tournament.teams.length < minRequired) {
    throw new BracketError(
      'NOT_ENOUGH_TEAMS',
      `Need at least ${minRequired} confirmed team${minRequired === 1 ? '' : 's'} to generate a bracket`
    );
  }

  const teams = tournament.teams;
  const size = nextPowerOfTwo(teams.length);
  const totalRounds = Math.log2(size);
  const order = seedOrder(size);
  // positionTeam[i] = the team placed at bracket position i (0-indexed), or null for a bye
  const positionTeam = order.map((seed) => teams[seed - 1] ?? null);

  return db.$transaction(async (tx) => {
    const bracket = await tx.bracket.create({ data: { tournamentId } });

    // Build from the final round backward so each match's nextMatchId can
    // reference an already-created row (Prisma needs the target to exist).
    let nextRoundMatchIds: string[] = [];
    let firstRoundMatchIds: string[] = [];

    for (let r = totalRounds; r >= 1; r--) {
      const matchCount = size / 2 ** r;
      const round = await tx.round.create({
        data: { bracketId: bracket.id, number: r, name: roundName(totalRounds - r) },
      });

      const currentRoundMatchIds: string[] = [];
      for (let m = 0; m < matchCount; m++) {
        const nextMatchId = r < totalRounds ? nextRoundMatchIds[Math.floor(m / 2)] : null;
        const isSlotA = m % 2 === 0;

        const teamAId = r === 1 ? positionTeam[m * 2]?.id ?? null : null;
        const teamBId = r === 1 ? positionTeam[m * 2 + 1]?.id ?? null : null;
        const isBye = r === 1 && (!teamAId || !teamBId);
        const winnerId = isBye ? teamAId ?? teamBId ?? null : null;

        const match = await tx.match.create({
          data: {
            roundId: round.id,
            position: m,
            teamAId,
            teamBId,
            nextMatchId,
            isSlotA,
            status: isBye ? 'BYE' : 'PENDING',
            winnerId,
            completedAt: isBye ? new Date() : null,
          },
        });
        currentRoundMatchIds.push(match.id);
      }

      if (r === 1) firstRoundMatchIds = currentRoundMatchIds;
      nextRoundMatchIds = currentRoundMatchIds;
    }

    // Propagate round-1 byes into round 2. Single level only — guaranteed
    // sufficient because the seeding order above keeps byes (always fewer
    // than size/2 of them) spread across distinct matches, so no match
    // ever has two bye feeders that would need further cascading.
    const round1Byes = await tx.match.findMany({
      where: { id: { in: firstRoundMatchIds }, status: 'BYE' },
    });
    for (const match of round1Byes) {
      if (match.winnerId && match.nextMatchId) {
        await tx.match.update({
          where: { id: match.nextMatchId },
          data: match.isSlotA ? { teamAId: match.winnerId } : { teamBId: match.winnerId },
        });
      }
    }

    await tx.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });

    return bracket;
  });
}

// Emails every registered participant that the bracket is drawn and play has
// started. Non-blocking by design (each send swallows its own errors) — called
// after a bracket is generated, for any format.
export async function notifyTournamentStarted(tournamentId: string): Promise<void> {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      name: true,
      slug: true,
      teams: { include: { members: { include: { user: true } } } },
    },
  });
  if (!tournament) return;

  for (const team of tournament.teams) {
    for (const member of team.members) {
      const to = member.user?.email ?? member.guestEmail;
      const name = member.user?.name ?? member.guestName;
      if (!to || !name) continue;
      await sendTournamentStarted({
        to,
        name,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
      });
    }
  }
}

// Returns the bracket tree denormalized for the frontend
export async function getBracketTree(tournamentId: string): Promise<BracketTree | null> {
  const bracket = await db.bracket.findUnique({
    where: { tournamentId },
    include: {
      rounds: {
        orderBy: { number: 'asc' },
        include: {
          matches: {
            orderBy: { position: 'asc' },
            include: {
              teamA: { select: { id: true, name: true, seed: true } },
              teamB: { select: { id: true, name: true, seed: true } },
            },
          },
        },
      },
    },
  });

  if (!bracket) return null;

  return {
    id: bracket.id,
    generatedAt: bracket.generatedAt.toISOString(),
    rounds: bracket.rounds.map((round) => ({
      id: round.id,
      number: round.number,
      name: round.name,
      matches: round.matches.map((match) => ({
        id: match.id,
        status: match.status as MatchStatus,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        winnerId: match.winnerId,
        courtNumber: match.courtNumber,
        scheduledAt: match.scheduledAt?.toISOString() ?? null,
        teamA: match.teamA,
        teamB: match.teamB,
      })),
    })),
  };
}
