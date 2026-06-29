// Group stage → playoffs format.
//
// Phase 1 (group stage): confirmed teams are split into snake-seeded groups
// (so strength is spread evenly rather than seed 1-4 all landing in the same
// group) and each group plays a full round robin within itself, reusing the
// same circle-method scheduling round robin uses.
//
// Phase 2 (playoffs): once every group-stage match has a result,
// finalizeGroupStageAndGeneratePlayoffs() computes each group's standings,
// keeps the top `qualifiersPerGroup` teams CONFIRMED, demotes the rest to
// ELIMINATED (so they're excluded from any further generator that filters on
// CONFIRMED), and generates a single- or double-elimination bracket from the
// qualifiers via the *existing* generators — unmodified beyond accepting an
// `existingBracketId` so the playoff rounds land in the same Bracket row the
// group stage already created (a tournament has exactly one Bracket; see the
// comment on generateSingleEliminationBracket in lib/bracket.ts).
//
// Round numbers/names deliberately overlap between phases (group-stage round
// 1 and playoff round 1 both exist) — the same convention double
// elimination's winners/losers/grand-finals rounds rely on. Consumers always
// filter by groupNumber first: group-stage rounds have it set, playoff
// rounds (created by the unmodified single/double-elim generators) don't.

import { db } from '@/lib/db';
import { BracketError, generateSingleEliminationBracket } from '@/lib/bracket';
import { generateDoubleEliminationBracket } from '@/lib/formats/double-elimination';
import { circleMethodRounds, type StandingRow } from '@/lib/formats/round-robin';

const PLAYOFF_FORMATS = ['SINGLE_ELIM', 'DOUBLE_ELIM'] as const;

// 0-indexed snake seeding: rank 0..groupCount-1 go to groups 0..groupCount-1
// in order, rank groupCount..2*groupCount-1 go in reverse, and so on — so
// groups end up with comparable total strength instead of group 1 getting
// every top seed.
function snakeGroupForRank(rank: number, groupCount: number): number {
  const lap = Math.floor(rank / groupCount);
  const posInLap = rank % groupCount;
  return lap % 2 === 0 ? posInLap : groupCount - 1 - posInLap;
}

export async function generateGroupStageBracket(tournamentId: string) {
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
    throw new BracketError('NOT_ENOUGH_TEAMS', 'Need at least 2 confirmed teams for a group stage');
  }
  const groupSize = tournament.groupSize ?? 0;
  const qualifiersPerGroup = tournament.qualifiersPerGroup ?? 0;
  const playoffFormat = tournament.playoffFormat ?? '';
  if (groupSize < 2 || qualifiersPerGroup < 1 || !PLAYOFF_FORMATS.includes(playoffFormat as never)) {
    throw new BracketError(
      'INVALID_CONFIG',
      'Group size, qualifiers per group, and a playoff format must be configured before generating the bracket'
    );
  }

  const teams = tournament.teams;
  const groupCount = Math.ceil(teams.length / groupSize);
  if (groupCount * qualifiersPerGroup < 2) {
    throw new BracketError(
      'INVALID_CONFIG',
      'Qualifiers per group must produce at least 2 total playoff teams'
    );
  }

  const groupOf = new Map<string, number>(); // teamId -> 1-indexed group number
  teams.forEach((team, rank) => {
    groupOf.set(team.id, snakeGroupForRank(rank, groupCount) + 1);
  });

  const teamIdsByGroup = new Map<number, string[]>();
  for (const [teamId, groupNumber] of groupOf) {
    if (!teamIdsByGroup.has(groupNumber)) teamIdsByGroup.set(groupNumber, []);
    teamIdsByGroup.get(groupNumber)!.push(teamId);
  }

  // Generation does one round-robin schedule per group — can be a lot of
  // sequential creates for larger fields, same reasoning as double
  // elimination's elevated timeout.
  return db.$transaction(
    async (tx) => {
      const bracket = await tx.bracket.create({ data: { tournamentId } });

      await Promise.all(
        teams.map((team) =>
          tx.team.update({ where: { id: team.id }, data: { groupNumber: groupOf.get(team.id) } })
        )
      );

      for (const [groupNumber, groupTeamIds] of teamIdsByGroup) {
        const rounds = circleMethodRounds(groupTeamIds);
        for (let r = 0; r < rounds.length; r++) {
          const round = await tx.round.create({
            data: {
              bracketId: bracket.id,
              number: r + 1,
              name: `Group ${groupNumber} — Round ${r + 1}`,
              groupNumber,
            },
          });
          for (let p = 0; p < rounds[r].length; p++) {
            const [teamAId, teamBId] = rounds[r][p];
            await tx.match.create({
              data: { roundId: round.id, position: p, teamAId, teamBId, status: 'PENDING' },
            });
          }
        }
      }

      await tx.tournament.update({ where: { id: tournamentId }, data: { status: 'IN_PROGRESS' } });
      return bracket;
    },
    { timeout: 30000 }
  );
}

// Per-group standings, same tiebreak as round robin (wins, then point
// differential, then name) since each group's stage is just a round robin
// scoped to its own teams.
export async function getGroupStandings(
  tournamentId: string
): Promise<Array<{ groupNumber: number; rows: StandingRow[] }>> {
  const teams = await db.team.findMany({
    where: { tournamentId, groupNumber: { not: null }, status: { not: 'WITHDRAWN' } },
    select: { id: true, name: true, placement: true, groupNumber: true },
  });

  const matches = await db.match.findMany({
    where: { round: { bracket: { tournamentId }, groupNumber: { not: null } }, status: 'COMPLETED' },
    select: { teamAId: true, teamBId: true, scoreA: true, scoreB: true, winnerId: true },
  });

  const rows = new Map<string, StandingRow>();
  const groupByTeam = new Map<string, number>();
  for (const t of teams) {
    groupByTeam.set(t.id, t.groupNumber!);
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

  const byGroup = new Map<number, StandingRow[]>();
  for (const row of rows.values()) {
    const groupNumber = groupByTeam.get(row.teamId)!;
    row.pointDiff = row.pointsFor - row.pointsAgainst;
    if (!byGroup.has(groupNumber)) byGroup.set(groupNumber, []);
    byGroup.get(groupNumber)!.push(row);
  }

  return [...byGroup.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([groupNumber, groupRows]) => {
      groupRows.sort(
        (x, y) => y.wins - x.wins || y.pointDiff - x.pointDiff || x.teamName.localeCompare(y.teamName)
      );
      return { groupNumber, rows: groupRows };
    });
}

// Called once every group-stage match has a result. Qualifies the top
// `qualifiersPerGroup` teams from each group, eliminates the rest, and
// generates the playoff bracket from the qualifiers. Returns the playoff's
// freshly-paired (non-bye) match ids so the caller can send "match ready"
// notifications, the same way Swiss does for its own round-by-round pairing.
export async function finalizeGroupStageAndGeneratePlayoffs(
  tournamentId: string
): Promise<{ newMatchIds: string[] }> {
  const tournament = await db.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { qualifiersPerGroup: true, playoffFormat: true, bracket: { select: { id: true } } },
  });
  if (!tournament.bracket) return { newMatchIds: [] };

  const standings = await getGroupStandings(tournamentId);
  const qualifiersPerGroup = tournament.qualifiersPerGroup ?? 1;

  const qualifierIds = new Set<string>();
  for (const group of standings) {
    const qualifyCount = Math.min(qualifiersPerGroup, group.rows.length);
    group.rows.slice(0, qualifyCount).forEach((row) => qualifierIds.add(row.teamId));
  }

  await db.$transaction(
    standings.flatMap((group) =>
      group.rows.map((row) =>
        db.team.update({
          where: { id: row.teamId },
          data: qualifierIds.has(row.teamId) ? {} : { status: 'ELIMINATED' },
        })
      )
    )
  );

  const bracketId = tournament.bracket.id;
  if (tournament.playoffFormat === 'DOUBLE_ELIM') {
    await generateDoubleEliminationBracket(tournamentId, { existingBracketId: bracketId });
  } else {
    await generateSingleEliminationBracket(tournamentId, { existingBracketId: bracketId });
  }

  // The playoff bracket was just created — any non-group-stage match with
  // both teams already set is its freshly-paired round 1 (later rounds stay
  // empty until advancement fills them in).
  const newMatches = await db.match.findMany({
    where: {
      round: { bracketId, groupNumber: null },
      status: 'PENDING',
      teamAId: { not: null },
      teamBId: { not: null },
    },
    select: { id: true },
  });

  return { newMatchIds: newMatches.map((m) => m.id) };
}
