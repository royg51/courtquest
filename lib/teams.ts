// Team / registration service layer.
// Handles all registration logic: capacity checks, status transitions,
// team creation with guest member support.
//
// Implemented in Step 5 (Registration flow)

import { db as _db } from '@/lib/db';

export async function getTeamsForTournament(_tournamentId: string) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function registerTeam(
  _tournamentId: string,
  _data: {
    primaryUserId: string;
    teamName: string;
    skillLevel: string;
    waiverAccepted: boolean;
    partner?: {
      userId?: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
    };
  }
) {
  // Validates: tournament is OPEN, not at capacity, user not already registered
  // Creates Team + TeamMember(s) in one transaction
  // TODO: implement
  throw new Error('Not implemented');
}

export async function updateTeamStatus(
  _teamId: string,
  _status: 'CONFIRMED' | 'WAITLISTED' | 'WITHDRAWN'
) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function withdrawTeam(_teamId: string, _requestingUserId: string) {
  // Validates the user is a team member or organizer before withdrawing
  // TODO: implement
  throw new Error('Not implemented');
}
