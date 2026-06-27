// Shared Zod schema for tournament creation — used by both the API route
// and the client form, so client and server validate identically.

import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  sport: z.string().min(2).max(50),
  maxParticipants: z.coerce.number().int().min(2).max(256),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  sport: z.string().min(2).max(50).optional(),
  maxParticipants: z.coerce.number().int().min(2).max(256).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
