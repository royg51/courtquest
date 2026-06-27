// Shared Zod schema for tournament creation — used by both the API route
// and the client form, so client and server validate identically.

import { z } from 'zod';

// react-hook-form's `valueAsNumber: true` turns a blank entry-fee input into
// NaN rather than undefined, and z.coerce.number() doesn't treat NaN as
// "missing" — so an empty (optional) field would otherwise fail validation
// instead of being treated as omitted.
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (val) => (val === '' || (typeof val === 'number' && Number.isNaN(val)) ? undefined : val),
    schema.optional()
  );

export const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  sport: z.string().min(2).max(50),
  maxParticipants: z.coerce.number().int().min(2).max(256),
  entryFeeDollars: optionalNumber(z.coerce.number().min(0).max(1000)),
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
