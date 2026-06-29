// Player stats + global per-sport leaderboard.
//
// Everything here is computed on the fly from the Match table + Team.placement
// (the sources of truth) rather than a denormalized stats table. That trades
// read cost for guaranteed correctness: there's no cache to drift when a match
// is re-scored or a bracket regenerated (both supported flows). At current
// scale this is cheap; if the leaderboard ever gets hot, the swap-in is a
// materialized PlayerStat table — the shapes returned here are already what
// such a table would store.
//
// Points model (per the spec): match win = +10, reaching the final = +50,
// winning the tournament = +100. "Final" / "champion" come from
// Team.placement (1 = champion, 2 = runner-up), set by the format-specific
// completion logic — so the model is correct across single-elim, round-robin,
// etc., not tied to bracket shape. Byes never count as wins (status 'BYE',
// excluded by the COMPLETED filter).

import { cache } from 'react';
import { db } from '@/lib/db';

const POINTS_PER_WIN = 10;
const POINTS_FINALS = 50;
const POINTS_CHAMPION = 100;

// Placement-derived bonus: champion gets finals + champion points; runner-up
// gets the finals bonus. Anything lower contributes only match-win points.
function placementBonus(placement: number | null): number {
  if (placement === 1) return POINTS_FINALS + POINTS_CHAMPION;
  if (placement === 2) return POINTS_FINALS;
  return 0;
}

export interface PlayerProfile {
  userId: string;
  name: string;
  joinedAt: string;
  tournamentsJoined: number;
  wins: number;
  losses: number;
  titles: number;
  points: number;
  history: MatchHistoryItem[];
}

export interface MatchHistoryItem {
  matchId: string;
  tournamentName: string;
  tournamentSlug: string;
  sport: string;
  round: string;
  opponentName: string | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  won: boolean;
  isFinals: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  wins: number;
  titles: number;
  tournaments: number;
}

export const getPlayerProfile = cache(async (userId: string): Promise<PlayerProfile | null> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, createdAt: true },
  });
  if (!user) return null;

  // Teams this user is on (drives "tournaments joined", match lookup, and the
  // placement-based champion/finals bonuses).
  const teams = await db.team.findMany({
    where: { members: { some: { userId } }, status: { not: 'WITHDRAWN' } },
    select: { id: true, tournamentId: true, placement: true },
  });
  const teamIds = new Set(teams.map((t) => t.id));
  const tournamentsJoined = new Set(teams.map((t) => t.tournamentId)).size;

  const matches = await db.match.findMany({
    where: {
      status: 'COMPLETED',
      OR: [{ teamAId: { in: [...teamIds] } }, { teamBId: { in: [...teamIds] } }],
    },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      round: {
        include: { bracket: { include: { tournament: { select: { sport: true, name: true, slug: true } } } } },
      },
    },
    orderBy: { completedAt: 'desc' },
  });

  let wins = 0;
  let losses = 0;
  let points = 0;
  const history: MatchHistoryItem[] = [];

  for (const m of matches) {
    const onTeamA = m.teamAId ? teamIds.has(m.teamAId) : false;
    const myTeam = onTeamA ? m.teamA : m.teamB;
    const opponent = onTeamA ? m.teamB : m.teamA;
    if (!myTeam) continue;

    const won = m.winnerId === myTeam.id;
    const scoreFor = onTeamA ? m.scoreA : m.scoreB;
    const scoreAgainst = onTeamA ? m.scoreB : m.scoreA;

    if (won) {
      wins += 1;
      points += POINTS_PER_WIN;
    } else {
      losses += 1;
    }

    history.push({
      matchId: m.id,
      tournamentName: m.round.bracket.tournament.name,
      tournamentSlug: m.round.bracket.tournament.slug,
      sport: m.round.bracket.tournament.sport,
      round: m.round.name,
      opponentName: opponent?.name ?? null,
      scoreFor,
      scoreAgainst,
      won,
      isFinals: m.round.name === 'Finals',
    });
  }

  // Champion/finals bonuses + titles come from final placement, not bracket
  // shape — correct for every format.
  let titles = 0;
  for (const team of teams) {
    points += placementBonus(team.placement);
    if (team.placement === 1) titles += 1;
  }

  return {
    userId: user.id,
    name: user.name,
    joinedAt: user.createdAt.toISOString(),
    tournamentsJoined,
    wins,
    losses,
    titles,
    points,
    history,
  };
});

export const getLeaderboard = cache(async (sport: string): Promise<LeaderboardEntry[]> => {
  // Teams (with placement) carry the tournaments-joined count and the
  // champion/finals bonuses; completed matches carry the win counts.
  const [teams, matches] = await Promise.all([
    db.team.findMany({
      where: { tournament: { sport }, status: { not: 'WITHDRAWN' } },
      select: { placement: true, tournamentId: true, members: { select: { userId: true } } },
    }),
    db.match.findMany({
      where: { status: 'COMPLETED', round: { bracket: { tournament: { sport } } } },
      select: {
        winnerId: true,
        teamA: { select: { id: true, members: { select: { userId: true } } } },
        teamB: { select: { id: true, members: { select: { userId: true } } } },
      },
    }),
  ]);

  // userId -> running tally
  const tally = new Map<
    string,
    { points: number; wins: number; titles: number; tournaments: Set<string> }
  >();
  const ensure = (userId: string) => {
    let entry = tally.get(userId);
    if (!entry) {
      entry = { points: 0, wins: 0, titles: 0, tournaments: new Set() };
      tally.set(userId, entry);
    }
    return entry;
  };

  // Tournaments joined + placement-based bonuses.
  for (const team of teams) {
    const bonus = placementBonus(team.placement);
    for (const member of team.members) {
      if (!member.userId) continue;
      const entry = ensure(member.userId);
      entry.tournaments.add(team.tournamentId);
      entry.points += bonus;
      if (team.placement === 1) entry.titles += 1;
    }
  }

  // Match wins.
  for (const m of matches) {
    if (!m.winnerId) continue;
    const winner = m.teamA?.id === m.winnerId ? m.teamA : m.teamB?.id === m.winnerId ? m.teamB : null;
    if (!winner) continue;
    for (const member of winner.members) {
      if (!member.userId) continue;
      const entry = ensure(member.userId);
      entry.wins += 1;
      entry.points += POINTS_PER_WIN;
    }
  }

  const userIds = [...tally.keys()];
  if (userIds.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return userIds
    .map((userId) => {
      const t = tally.get(userId)!;
      return {
        userId,
        name: nameById.get(userId) ?? 'Unknown player',
        points: t.points,
        wins: t.wins,
        titles: t.titles,
        tournaments: t.tournaments.size,
      };
    })
    .sort((a, b) => b.points - a.points || b.titles - a.titles || b.wins - a.wins);
});
