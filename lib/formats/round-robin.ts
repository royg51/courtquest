// Round-robin format: every team plays every other team once. Scheduling uses
// the standard "circle method" so each generated round is a set of matches
// that can be played concurrently (no team appears twice in a round). With an
// odd number of teams a phantom bye slot is added; the team paired with it
// simply sits that round out (no match is created).
//
// Unlike elimination, round-robin matches don't advance anyone — standings are
// computed from results, and the tournament completes when every match has a
// score. The champion is the standings leader.

import { db } from '@/lib/db';
import { BracketError } from '@/lib/bracket';

export async function generateRoundRobinBracket(tournamentId: string) {
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
    throw new BracketError('NOT_ENOUGH_TEAMS', 'Need at least 2 confirmed teams for a round robin');
  }

  // Circle method. Work with team ids; null is the phantom bye slot used when
  // the count is odd.
  const ids: (string | null)[] = tournament.teams.map((t) => t.id);
  if (ids.length % 2 === 1) ids.push(null);

  const n = ids.length;
  const roundsCount = n - 1;
  const half = n / 2;

  // rounds[r] = list of [teamAId, teamBId] pairings (excluding bye pairings)
  const rounds: Array<Array<[string, string]>> = [];
  let arr = [...ids];
  for (let r = 0; r < roundsCount; r++) {
    const pairings: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== null && b !== null) pairings.push([a, b]);
    }
    rounds.push(pairings);
    // Rotate, keeping the first element fixed.
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }

  return db.$transaction(async (tx) => {
    const bracket = await tx.bracket.create({ data: { tournamentId } });

    for (let r = 0; r < rounds.length; r++) {
      const round = await tx.round.create({
        data: { bracketId: bracket.id, number: r + 1, name: `Round ${r + 1}` },
      });
      for (let p = 0; p < rounds[r].length; p++) {
        const [teamAId, teamBId] = rounds[r][p];
        await tx.match.create({
          data: {
            roundId: round.id,
            position: p,
            teamAId,
            teamBId,
            status: 'PENDING',
          },
        });
      }
    }

    await tx.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });
    return bracket;
  });
}

export interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  placement: number | null;
}

// Computes the standings table from completed matches. Sort: wins desc, then
// point differential desc, then name — the standard round-robin tiebreak.
export async function getRoundRobinStandings(tournamentId: string): Promise<StandingRow[]> {
  const teams = await db.team.findMany({
    where: { tournamentId, status: { not: 'WITHDRAWN' } },
    select: { id: true, name: true, placement: true },
  });

  const matches = await db.match.findMany({
    where: { round: { bracket: { tournamentId } }, status: 'COMPLETED' },
    select: { teamAId: true, teamBId: true, scoreA: true, scoreB: true, winnerId: true },
  });

  const rows = new Map<string, StandingRow>();
  for (const t of teams) {
    rows.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      placement: t.placement,
    });
  }

  for (const m of matches) {
    if (!m.teamAId || !m.teamBId) continue;
    const a = rows.get(m.teamAId);
    const b = rows.get(m.teamBId);
    if (!a || !b) continue;
    const sa = m.scoreA ?? 0;
    const sb = m.scoreB ?? 0;
    a.played += 1;
    b.played += 1;
    a.pointsFor += sa;
    a.pointsAgainst += sb;
    b.pointsFor += sb;
    b.pointsAgainst += sa;
    if (m.winnerId === m.teamAId) {
      a.wins += 1;
      b.losses += 1;
    } else if (m.winnerId === m.teamBId) {
      b.wins += 1;
      a.losses += 1;
    }
  }

  const sorted = [...rows.values()].map((row) => ({
    ...row,
    pointDiff: row.pointsFor - row.pointsAgainst,
  }));
  sorted.sort(
    (x, y) => y.wins - x.wins || y.pointDiff - x.pointDiff || x.teamName.localeCompare(y.teamName)
  );
  return sorted;
}
