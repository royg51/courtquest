// Double-elimination bracket engine.
//
// Structure: a Winners Bracket (WB) built exactly like single elimination, a
// Losers Bracket (LB) that every WB loser drops into, and a Grand Final
// between the WB champion and the LB champion. If the LB-side finalist wins
// the Grand Final, both finalists are tied at one loss each, so a second
// "bracket reset" match is created on demand to decide the tournament.
//
// Losers bracket shape (k = number of WB rounds, P = 2^k entrants):
//   LB round 1            : WB round-1 losers paired up               (size P/4)
//   LB round 2 (drop-in)  : LB round-1 winners vs WB round-2 losers   (size P/4)
//   LB round 3            : LB round-2 winners paired up              (size P/8)
//   LB round 4 (drop-in)  : LB round-3 winners vs WB round-3 losers   (size P/8)
//   ...
//   LB round 2(k-1)       : LB Final — its winner advances to the Grand Final
//
// Byes (when the team count isn't a power of 2) only ever occur in WB round
// 1, exactly like single elimination. A bye produces no loser, so the
// corresponding slot it would have fed in the losers bracket can never be
// filled by a real team — `deadSlotA`/`deadSlotB` mark those slots. When the
// real team in the other slot eventually arrives (via score submission
// elsewhere), it walks over automatically instead of waiting forever for an
// opponent who doesn't exist. This dead-slot situation can only arise in LB
// round 1 (both slots fed by WB round-1 losers, either of which might be a
// bye) and LB round 2 (one slot carried from LB round 1, which might not
// exist at all) — every WB round from round 2 onward always produces a real
// loser, so every losers-bracket round from round 3 onward always has at
// least one guaranteed-real input and can never be dead.

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { BracketError, nextPowerOfTwo, seedOrder } from '@/lib/bracket';

type Tx = Prisma.TransactionClient;

function winnersRoundName(totalRounds: number, round: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return 'Winners Final';
  if (fromFinal === 1) return 'Winners Semifinal';
  if (fromFinal === 2) return 'Winners Quarterfinal';
  return `Winners Round ${round}`;
}

function losersRoundName(round: number, totalRounds: number): string {
  return round === totalRounds ? 'Losers Final' : `Losers Round ${round}`;
}

// Places `teamId` into the given slot of `matchId`, then — if that leaves
// the match with one real team and a structurally dead opposite slot —
// resolves it as an automatic walkover and recurses into whatever it feeds.
async function placeTeamAndCascade(tx: Tx, matchId: string, slot: 'A' | 'B', teamId: string) {
  const match = await tx.match.update({
    where: { id: matchId },
    data: slot === 'A' ? { teamAId: teamId } : { teamBId: teamId },
  });

  const otherSlotDead = slot === 'A' ? match.deadSlotB : match.deadSlotA;
  const otherSlotTeamId = slot === 'A' ? match.teamBId : match.teamAId;

  if (otherSlotDead && !otherSlotTeamId && match.status === 'PENDING') {
    const resolved = await tx.match.update({
      where: { id: matchId },
      data: { winnerId: teamId, status: 'BYE', completedAt: new Date() },
    });
    if (resolved.nextMatchId) {
      await placeTeamAndCascade(tx, resolved.nextMatchId, resolved.isSlotA ? 'A' : 'B', teamId);
    }
  }
}

// Advances a completed double-elim match: the winner moves to nextMatchId,
// and (winners-bracket matches only) the loser drops into loserNextMatchId.
// Losers-bracket losers are simply eliminated — loserNextMatchId is null for
// those matches, so the second call below is a no-op.
export async function advanceDoubleElimination(
  tx: Tx,
  match: {
    nextMatchId: string | null;
    isSlotA: boolean;
    loserNextMatchId: string | null;
    loserGoesToSlotA: boolean;
  },
  winnerId: string,
  loserId: string
) {
  if (match.nextMatchId) {
    await placeTeamAndCascade(tx, match.nextMatchId, match.isSlotA ? 'A' : 'B', winnerId);
  }
  if (match.loserNextMatchId) {
    await placeTeamAndCascade(tx, match.loserNextMatchId, match.loserGoesToSlotA ? 'A' : 'B', loserId);
  }
}

// Creates the bracket-reset (game two) of the Grand Final, called when the
// losers-bracket finalist wins game one. Both game-one finalists replay;
// whoever wins this one is champion outright, win-by-2-losses already moot.
export async function createGrandFinalReset(
  tx: Tx,
  bracketId: string,
  gfRoundNumber: number,
  teamAId: string,
  teamBId: string
) {
  const round = await tx.round.create({
    data: {
      bracketId,
      number: gfRoundNumber + 1,
      name: 'Grand Finals: Reset',
      bracketSide: 'GRAND_FINALS',
      isBracketReset: true,
    },
  });
  return tx.match.create({
    data: { roundId: round.id, position: 0, teamAId, teamBId, status: 'PENDING' },
  });
}

export async function generateDoubleEliminationBracket(tournamentId: string) {
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
  if (tournament.teams.length < 2) {
    throw new BracketError(
      'NOT_ENOUGH_TEAMS',
      'Need at least 2 confirmed teams to generate a bracket'
    );
  }

  const teams = tournament.teams;
  const P = nextPowerOfTwo(teams.length);
  const k = Math.log2(P);
  const order = seedOrder(P);
  const positionTeam = order.map((seed) => teams[seed - 1] ?? null);

  // The winners/losers/grand-finals graph needs many more sequential
  // round-trips than single elimination's single-pass build (a two-pass
  // create-then-wire, plus a separate losers bracket) — large team counts
  // can exceed Prisma's 5s default interactive-transaction timeout, so it's
  // raised explicitly here.
  return db.$transaction(async (tx) => {
    const bracket = await tx.bracket.create({ data: { tournamentId } });

    // ---------- Winners bracket ----------
    const wbMatchIds: string[][] = []; // wbMatchIds[r-1][m]
    const wbIsBye: boolean[] = []; // round-1 only, by match index

    for (let r = 1; r <= k; r++) {
      const matchCount = P / 2 ** r;
      const round = await tx.round.create({
        data: {
          bracketId: bracket.id,
          number: r,
          name: winnersRoundName(k, r),
          bracketSide: 'WINNERS',
        },
      });

      const ids: string[] = [];
      for (let m = 0; m < matchCount; m++) {
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
            isSlotA: m % 2 === 0,
            status: isBye ? 'BYE' : 'PENDING',
            winnerId,
            completedAt: isBye ? new Date() : null,
          },
        });
        ids.push(match.id);
        if (r === 1) wbIsBye[m] = isBye;
      }
      wbMatchIds.push(ids);
    }

    // ---------- Losers bracket ----------
    const totalLbRounds = k >= 2 ? 2 * (k - 1) : 0;
    // lbMatches[i-1][m] = { id, deadA, deadB } for LB round i; id is null
    // when both feeders are dead (the match structurally never happens).
    const lbMatches: Array<Array<{ id: string | null; deadA: boolean; deadB: boolean }>> = [];

    for (let i = 1; i <= totalLbRounds; i++) {
      const isDropIn = i % 2 === 0;
      const j = Math.ceil(i / 2);
      const size = P / 2 ** (j + 1);

      const round = await tx.round.create({
        data: {
          bracketId: bracket.id,
          number: i,
          name: losersRoundName(i, totalLbRounds),
          bracketSide: 'LOSERS',
        },
      });

      const roundMatches: Array<{ id: string | null; deadA: boolean; deadB: boolean }> = [];
      for (let m = 0; m < size; m++) {
        let deadA: boolean;
        let deadB: boolean;
        if (i === 1) {
          deadA = wbIsBye[m * 2];
          deadB = wbIsBye[m * 2 + 1];
        } else if (isDropIn) {
          deadA = lbMatches[i - 2][m].id === null; // carried LB winner may not exist
          deadB = false; // fresh WB loser, round >= 2, always real
        } else {
          deadA = false;
          deadB = false; // consolidating round-2 winners, both always real by construction
        }

        if (deadA && deadB) {
          roundMatches.push({ id: null, deadA, deadB });
          continue;
        }

        const match = await tx.match.create({
          data: {
            roundId: round.id,
            position: m,
            status: 'PENDING',
            deadSlotA: deadA,
            deadSlotB: deadB,
          },
        });
        roundMatches.push({ id: match.id, deadA, deadB });
      }
      lbMatches.push(roundMatches);
    }

    // ---------- Grand Finals (game one) ----------
    const gfRound = await tx.round.create({
      data: {
        bracketId: bracket.id,
        number: 1,
        name: 'Grand Finals',
        bracketSide: 'GRAND_FINALS',
      },
    });
    const gfMatch = await tx.match.create({
      data: { roundId: gfRound.id, position: 0, status: 'PENDING' },
    });

    // ---------- Wire advancement (pass 2) ----------
    for (let r = 1; r <= k; r++) {
      const matchCount = P / 2 ** r;
      for (let m = 0; m < matchCount; m++) {
        const matchId = wbMatchIds[r - 1][m];
        const nextMatchId = r < k ? wbMatchIds[r][Math.floor(m / 2)] : gfMatch.id;

        let loserNextMatchId: string | null = null;
        let loserGoesToSlotA = true;
        if (k === 1) {
          // Only WB round is simultaneously round 1 and the final (exactly
          // 2 confirmed teams, no losers bracket at all) — its loser drops
          // straight into the Grand Final as the LB-side finalist.
          loserNextMatchId = gfMatch.id;
          loserGoesToSlotA = false;
        } else if (r === 1) {
          if (!wbIsBye[m]) {
            const lb1Match = lbMatches[0][Math.floor(m / 2)];
            loserNextMatchId = lb1Match.id;
            loserGoesToSlotA = m % 2 === 0;
          }
        } else {
          // WB round r (r>=2) losers drop into LB round 2*(r-1), same index,
          // slot B — including the WB final dropping into the LB final.
          const dropRound = 2 * (r - 1);
          loserNextMatchId = lbMatches[dropRound - 1][m].id;
          loserGoesToSlotA = false;
        }

        await tx.match.update({
          where: { id: matchId },
          data: { nextMatchId, loserNextMatchId, loserGoesToSlotA },
        });
      }
    }

    for (let i = 1; i <= totalLbRounds; i++) {
      const round = lbMatches[i - 1];
      for (let m = 0; m < round.length; m++) {
        if (round[m].id === null) continue;

        let nextMatchId: string;
        let isSlotA: boolean;
        if (i === totalLbRounds) {
          nextMatchId = gfMatch.id;
          isSlotA = false;
        } else {
          const nextIsDropIn = (i + 1) % 2 === 0;
          if (nextIsDropIn) {
            nextMatchId = lbMatches[i][m].id!;
            isSlotA = true;
          } else {
            nextMatchId = lbMatches[i][Math.floor(m / 2)].id!;
            isSlotA = m % 2 === 0;
          }
        }

        await tx.match.update({ where: { id: round[m].id! }, data: { nextMatchId, isSlotA } });
      }
    }

    // Propagate WB round-1 byes forward (and any cascade they trigger).
    for (let m = 0; m < wbIsBye.length; m++) {
      if (!wbIsBye[m]) continue;
      const byeMatchId = wbMatchIds[0][m];
      const byeMatch = await tx.match.findUniqueOrThrow({ where: { id: byeMatchId } });
      if (byeMatch.winnerId && byeMatch.nextMatchId) {
        await placeTeamAndCascade(
          tx,
          byeMatch.nextMatchId,
          byeMatch.isSlotA ? 'A' : 'B',
          byeMatch.winnerId
        );
      }
    }

    await tx.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });

    return bracket;
  }, { timeout: 30000 });
}
