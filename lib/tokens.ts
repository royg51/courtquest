// Cryptographically secure token generation for invite links. Distinct from
// lib/tournaments.ts's randomInviteCode — that one is a short, human-typable
// join code (Math.random(), small alphabet); this is a long, unguessable
// token for a URL nobody needs to type by hand.

import { randomBytes } from 'crypto';

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}
