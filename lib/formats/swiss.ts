// Swiss-system format engine.
//
// Unlike round robin (whose full schedule is known up front) or elimination
// (whose bracket shape is fixed at generation time), Swiss rounds are
// generated one at a time: round N's pairings depend on the standings after
// round N-1, so only round 1 is created at bracket-generation time. Each
// later round is created by advanceSwissTournament(), called from
// submitScore() once every match in the current round has a result.
//
// Pairing: teams are ranked by the same order used for final standings (wins,
// then Buchholz, then resistance, then name) and paired top-down, skipping
// any pairing that would repeat a prior matchup — found via backtracking so
// an unlucky early pairing can't dead-end the whole round. If the bracket is
// "saturated" (more rounds than distinct opponents available, which can only
// happen with very few teams and many configured rounds), backtracking can't
// find any repeat-free pairing, and a plain top-down pairing is used as a
// documented last resort.
//
// Byes: with an odd team count, one team sits out each round. A bye is
// stored as a `BYE`-status Match with only teamA set and winnerId = teamA
// (the same convention elimination byes already use), so it counts as a win
// for standings without needing separate schema support. The bye goes to the
// lowest-ranked team that hasn't already had one this tournament.
//
// Tiebreakers (no draws are possible — submitScore rejects ties):
//   Buchholz   = sum of each opponent's win count (strength of schedule)
//   Resistance = average of each opponent's win percentage

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { BracketError } from '@/lib/bracket';

type Tx = Prisma.TransactionClient;

export interface SwissStandingRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  byes: number;
  buchholz: number;
  resistance: number;
  placement: number | null;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Backtracking pairing: pair the top-ranked unpaired team with the
// highest-ranked remaining team it hasn't played, recursing on the rest;
// backtrack to the next candidate if that leaves the remainder unpairable.
function pairTeams(ranked: string[], playedPairs: Set<string>): Array<[string, string]> | null {
  if (ranked.length === 0) return [];
  const [first, ...rest] = ranked;
  for (let i = 0; i < rest.length; i++) {
    const candidate = rest[i];
    if (playedPairs.has(pairKey(first, candidate))) continue;
    const remaining = [...rest.slice(0, i), ...rest.slice(i + 1)];
    const subPairing = pairTeams(remaining, playedPairs);
    if (subPairing !== null) return [[first, candidate], ...subPairing];
  }
  return null;
}

// Last-resort pairing when no repeat-free pairing exists at all (a
// saturated bracket — more rounds configured than distinct opponents). Pairs
// top-to-bottom, accepting rematches.
function pairTeamsAllowingRepeats(ranked: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < ranked.length; i += 2) {
    pairs.push([ranked[i], ranked[i + 1]]);
  }
  return pairs;
}

// Lowest-ranked team that hasn't had a bye yet; if everyone already has,
// falls back to the lowest-ranked team overall.
function pickByeTeam(ranked: string[], byeCounts: Map<string, number>): string {
  for (let i = ranked.length - 1; i >= 0; i--) {
    if ((byeCounts.get(ranked[i]) ?? 0) === 0) return ranked[i];
  }
  return ranked[ranked.length - 1];
}

export async function getSwissStandings(tournamentId: string): Promise<SwissStandingRow[]> {
  const teams = await db.team.findMany({
    where: { tournamentId, status: { not: 'WITHDRAWN' } },
    select: { id: true, name: true, placement: true },
    orderBy: [{ seed: 'asc' }, { registeredAt: 'asc' }],
  });

  const matches = await db.match.findMany({
    where: { round: { bracket: { tournamentId } }, status: { in: ['COMPLETED', 'BYE'] } },
    select: { teamAId: true, teamBId: true, winnerId: true, status: true },
  });

  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const byes = new Map<string, number>();
  const opponents = new Map<string, string[]>();
  for (const t of teams) {
    wins.set(t.id, 0);
    losses.set(t.id, 0);
    byes.set(t.id, 0);
    opponents.set(t.id, []);
  }

  for (const m of matches) {
    if (m.status === 'BYE') {
      if (m.teamAId) {
        wins.set(m.teamAId, (wins.get(m.teamAId) ?? 0) + 1);
        byes.set(m.teamAId, (byes.get(m.teamAId) ?? 0) + 1);
      }
      continue;
    }
    if (!m.teamAId || !m.teamBId) continue;
    opponents.get(m.teamAId)?.push(m.teamBId);
    opponents.get(m.teamBId)?.push(m.teamAId);
    if (m.winnerId === m.teamAId) {
      wins.set(m.teamAId, (wins.get(m.teamAId) ?? 0) + 1);
      losses.set(m.teamBId, (losses.get(m.teamBId) ?? 0) + 1);
    } else if (m.winnerId === m.teamBId) {
      wins.set(m.teamBId, (wins.get(m.teamBId) ?? 0) + 1);
      losses.set(m.teamAId, (losses.get(m.teamAId) ?? 0) + 1);
    }
  }

  const winPct = (id: string) => {
    const w = wins.get(id) ?? 0;
    const l = losses.get(id) ?? 0;
    return w + l === 0 ? 0 : w / (w + l);
  };

  const rows: SwissStandingRow[] = teams.map((t) => {
    const opp = opponents.get(t.id) ?? [];
    const buchholz = opp.reduce((sum, oid) => sum + (wins.get(oid) ?? 0), 0);
    const resistance = opp.length === 0 ? 0 : opp.reduce((sum, oid) => sum + winPct(oid), 0) / opp.length;
    return {
      teamId: t.id,
      teamName: t.name,
      played: (wins.get(t.id) ?? 0) + (losses.get(t.id) ?? 0),
      wins: wins.get(t.id) ?? 0,
      losses: losses.get(t.id) ?? 0,
      byes: byes.get(t.id) ?? 0,
      buchholz,
      resistance,
      placement: t.placement,
    };
  });

  rows.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.buchholz - a.buchholz ||
      b.resistance - a.resistance ||
      a.teamName.localeCompare(b.teamName)
  );
  return rows;
}

async function createSwissRound(
  tx: Tx,
  bracketId: string,
  roundNumber: number,
  pairs: Array<[string, string]>,
  byeTeamId: string | null
): Promise<string[]> {
  const round = await tx.round.create({
    data: { bracketId, number: roundNumber, name: `Round ${roundNumber}` },
  });

  let position = 0;
  const matchIds: string[] = [];
  for (const [teamAId, teamBId] of pairs) {
    const match = await tx.match.create({
      data: { roundId: round.id, position: position++, teamAId, teamBId, status: 'PENDING' },
    });
    matchIds.push(match.id);
  }
  if (byeTeamId) {
    await tx.match.create({
      data: {
        roundId: round.id,
        position: position++,
        teamAId: byeTeamId,
        status: 'BYE',
        winnerId: byeTeamId,
        completedAt: new Date(),
      },
    });
  }
  return matchIds;
}

export async function generateSwissBracket(tournamentId: string) {
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
    throw new BracketError('NOT_ENOUGH_TEAMS', 'Need at least 2 confirmed teams for a Swiss tournament');
  }
  if (!tournament.swissRounds || tournament.swissRounds < 1) {
    throw new BracketError(
      'INVALID_CONFIG',
      'Number of Swiss rounds must be configured before generating the bracket'
    );
  }

  const teamIds = tournament.teams.map((t) => t.id);
  const byeTeamId = teamIds.length % 2 === 1 ? teamIds[teamIds.length - 1] : null;
  const pairable = byeTeamId ? teamIds.slice(0, -1) : teamIds;
  // Round 1, no results yet: standard initial Swiss pairing — top half vs
  // bottom half by seed.
  const half = pairable.length / 2;
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < half; i++) {
    pairs.push([pairable[i], pairable[i + half]]);
  }

  return db.$transaction(async (tx) => {
    const bracket = await tx.bracket.create({ data: { tournamentId } });
    await createSwissRound(tx, bracket.id, 1, pairs, byeTeamId);
    await tx.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });
    return bracket;
  });
}

// Called once every match in the current round has a result. Either creates
// the next round's pairings, or — if the configured round count has been
// reached — finalizes standings-based placements and completes the
// tournament. Returns the new round's real (non-bye) match ids so the caller
// can send "next match ready" notifications, or the champion's team id if
// the tournament just completed.
export async function advanceSwissTournament(
  tournamentId: string
): Promise<{ completed: boolean; championTeamId: string | null; newMatchIds: string[] }> {
  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { swissRounds: true, bracket: { select: { id: true } } },
  });
  if (!tournament.bracket) {
    return { completed: false, championTeamId: null, newMatchIds: [] };
  }

  const roundCount = await db.round.count({ where: { bracketId: tournament.bracket.id } });
  const standings = await getSwissStandings(tournamentId);

  if (roundCount >= (tournament.swissRounds ?? 0)) {
    await db.$transaction(
      standings.map((row, i) => db.team.update({ where: { id: row.teamId }, data: { placement: i + 1 } }))
    );
    await db.tournament.update({ where: { id: tournamentId }, data: { status: 'COMPLETED' } });
    return { completed: true, championTeamId: standings[0]?.teamId ?? null, newMatchIds: [] };
  }

  const matches = await db.match.findMany({
    where: { round: { bracketId: tournament.bracket.id } },
    select: { teamAId: true, teamBId: true, status: true },
  });
  const playedPairs = new Set<string>();
  const byeCounts = new Map<string, number>();
  for (const m of matches) {
    if (m.status === 'BYE') {
      if (m.teamAId) byeCounts.set(m.teamAId, (byeCounts.get(m.teamAId) ?? 0) + 1);
      continue;
    }
    if (m.teamAId && m.teamBId) playedPairs.add(pairKey(m.teamAId, m.teamBId));
  }

  const ranked = standings.map((r) => r.teamId);
  let byeTeamId: string | null = null;
  let pairable = ranked;
  if (ranked.length % 2 === 1) {
    byeTeamId = pickByeTeam(ranked, byeCounts);
    pairable = ranked.filter((id) => id !== byeTeamId);
  }

  const pairs = pairTeams(pairable, playedPairs) ?? pairTeamsAllowingRepeats(pairable);

  const newMatchIds = await db.$transaction((tx) =>
    createSwissRound(tx, tournament.bracket!.id, roundCount + 1, pairs, byeTeamId)
  );

  return { completed: false, championTeamId: null, newMatchIds };
}
