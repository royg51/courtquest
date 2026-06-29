// Smart tournament assistant — the "AI" helpers. Everything here is
// deterministic and works with zero external dependencies (it's really a
// ranking-aware heuristic engine), so the feature ships fully functional out
// of the box. An optional LLM layer (lib/ai.ts) can enrich the format
// rationale with natural language when an API key is configured, but it's
// never required and always falls back to these heuristics.

import { db } from '@/lib/db';
import { getLeaderboard } from '@/lib/rankings';
import { teamSizeForEntryType } from '@/lib/sports';

export class AssistError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Auto-seed confirmed teams by strength, where a team's strength is the sum of
// its (account-holding) members' ranking points in this sport. New/guest
// players contribute 0 and naturally seed last; ties keep registration order
// (V8's sort is stable and the input is registration-ordered). Higher strength
// → lower (better) seed number. Combined with the bracket generator's standard
// seed ordering, this keeps the strongest teams apart until late rounds — i.e.
// auto-balancing comes for free.
export async function autoSeedByRanking(tournamentId: string): Promise<number> {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { sport: true, bracket: { select: { id: true } } },
  });
  if (!tournament) throw new AssistError('NOT_FOUND', 'Tournament not found');
  if (tournament.bracket) {
    throw new AssistError('BRACKET_EXISTS', 'Seed before generating the bracket');
  }

  const leaderboard = await getLeaderboard(tournament.sport);
  const pointsByUser = new Map(leaderboard.map((e) => [e.userId, e.points]));

  const teams = await db.team.findMany({
    where: { tournamentId, status: 'CONFIRMED' },
    select: { id: true, members: { select: { userId: true } } },
    orderBy: { registeredAt: 'asc' },
  });
  if (teams.length < 2) {
    throw new AssistError('NOT_ENOUGH_TEAMS', 'Need at least 2 confirmed teams to seed');
  }

  const ranked = teams
    .map((t) => ({
      id: t.id,
      strength: t.members.reduce(
        (sum, m) => sum + (m.userId ? pointsByUser.get(m.userId) ?? 0 : 0),
        0
      ),
    }))
    .sort((a, b) => b.strength - a.strength);

  await db.$transaction(
    ranked.map((r, i) => db.team.update({ where: { id: r.id }, data: { seed: i + 1 } }))
  );

  return ranked.length;
}

export interface FormatRecommendation {
  format: 'SINGLE_ELIM' | 'ROUND_ROBIN' | 'SWISS';
  label: string;
  rationale: string;
  suggestedRounds?: number;
}

// Recommends a format from the field size. Small fields play better as round
// robin (everyone gets several matches and the result is fair, and the total
// match count stays manageable). Mid-size fields outgrow round robin's
// quadratic match count but still benefit from more than one elimination
// loss deciding the result, so Swiss fits — bounded rounds, paired by
// record. Large fields run cleanest as single elimination. Double-elim isn't
// recommended yet because its engine isn't implemented.
export function recommendFormat(teamCount: number): FormatRecommendation {
  if (teamCount <= 6) {
    return {
      format: 'ROUND_ROBIN',
      label: 'Round Robin',
      rationale: `With ${teamCount} ${teamCount === 1 ? 'team' : 'teams'}, round robin gives everyone several matches and decides the winner fairly on overall record rather than a single bad draw.`,
    };
  }
  if (teamCount <= 16) {
    const suggestedRounds = Math.ceil(Math.log2(teamCount)) + 1;
    return {
      format: 'SWISS',
      label: 'Swiss',
      rationale: `A field of ${teamCount} is too large for round robin to stay manageable, but Swiss pairing over ${suggestedRounds} rounds still gives every team several matches against similarly-performing opponents instead of a single elimination loss.`,
      suggestedRounds,
    };
  }
  return {
    format: 'SINGLE_ELIM',
    label: 'Single Elimination',
    rationale: `A field of ${teamCount} runs cleanly as single elimination — fewer total matches and a clear knockout path to the final.`,
  };
}

export interface AssistSummary {
  confirmedTeams: number;
  entryType: string;
  teamSize: number;
  recommendation: FormatRecommendation;
  currentFormat: string;
  matchesIfRoundRobin: number;
}

// Server-side summary the organizer "Smart Assist" panel renders before the
// bracket is generated.
export async function getAssistSummary(tournamentId: string): Promise<AssistSummary | null> {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true, entryType: true, _count: { select: { teams: true } } },
  });
  if (!tournament) return null;

  const confirmedTeams = await db.team.count({
    where: { tournamentId, status: 'CONFIRMED' },
  });

  return {
    confirmedTeams,
    entryType: tournament.entryType,
    teamSize: teamSizeForEntryType(tournament.entryType),
    recommendation: recommendFormat(confirmedTeams),
    currentFormat: tournament.format,
    matchesIfRoundRobin: (confirmedTeams * (confirmedTeams - 1)) / 2,
  };
}
