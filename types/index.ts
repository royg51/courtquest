// Shared TypeScript types used across client and server.
// Prefer importing Prisma-generated types directly where possible.
// Add here only for types that don't map 1:1 to Prisma models.

export type Role = 'PLAYER' | 'ORGANIZER' | 'ADMIN';

export type TournamentStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TournamentFormat = 'SINGLE_ELIM' | 'DOUBLE_ELIM' | 'ROUND_ROBIN' | 'SWISS';
export type TeamStatus = 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'WITHDRAWN';
export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BYE';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCE_INTERMEDIATE' | 'ADVANCED';

// Denormalized bracket tree returned by GET /api/tournaments/[id]/bracket
export interface BracketTree {
  id: string;
  generatedAt: string;
  rounds: RoundWithMatches[];
}

// bracketSide is 'MAIN' for single-elim/round-robin, or
// 'WINNERS' | 'LOSERS' | 'GRAND_FINALS' for double elimination.
export interface RoundWithMatches {
  id: string;
  number: number;
  name: string;
  bracketSide: string;
  isBracketReset: boolean;
  matches: MatchWithTeams[];
}

export interface MatchWithTeams {
  id: string;
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  courtNumber: number | null;
  scheduledAt: string | null;
  teamA: TeamSummary | null;
  teamB: TeamSummary | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  seed: number | null;
}

// API error shape returned by all routes
export interface ApiError {
  error: string;
  code: string;
  field?: string;
}
