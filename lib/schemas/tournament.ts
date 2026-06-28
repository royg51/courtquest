// Shared Zod schema for tournament creation/editing — used by both the API
// routes and the client forms, so client and server validate identically.

import { z } from 'zod';
import { SPORTS, ENTRY_TYPES, FORMATS } from '@/lib/sports';

// react-hook-form's `valueAsNumber: true` turns a blank entry-fee input into
// NaN rather than undefined, and z.coerce.number() doesn't treat NaN as
// "missing" — so an empty (optional) field would otherwise fail validation
// instead of being treated as omitted.
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (val) => (val === '' || (typeof val === 'number' && Number.isNaN(val)) ? undefined : val),
    schema.optional()
  );

const sportEnum = z.enum(SPORTS as unknown as [string, ...string[]]);
const formatEnum = z.enum(FORMATS.map((f) => f.value) as unknown as [string, ...string[]]);
const entryTypeEnum = z.enum(ENTRY_TYPES.map((e) => e.value) as unknown as [string, ...string[]]);

// Dates arrive from <input type="date"> as "YYYY-MM-DD" strings. z.coerce.date
// parses those; .refine guards keep the timeline sane.
const dateField = z.coerce.date();

const baseTournamentFields = {
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  sport: sportEnum,
  format: formatEnum,
  entryType: entryTypeEnum,
  maxParticipants: z.coerce.number().int().min(2).max(256),
  numberOfCourts: z.coerce.number().int().min(1).max(64),
  entryFeeDollars: optionalNumber(z.coerce.number().min(0).max(1000)),
  startDate: dateField,
  endDate: dateField,
  registrationDeadline: dateField,
  venue: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
};

export const createTournamentSchema = z
  .object(baseTournamentFields)
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine((d) => d.registrationDeadline <= d.startDate, {
    message: 'Registration deadline must be on or before the start date',
    path: ['registrationDeadline'],
  });

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

// Edit schema: every field optional (organizers/admins can change any subset
// later), plus status. No cross-field date refinement here since a partial
// update may only touch one date — the route validates wholesale changes.
export const updateTournamentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  sport: sportEnum.optional(),
  format: formatEnum.optional(),
  entryType: entryTypeEnum.optional(),
  maxParticipants: z.coerce.number().int().min(2).max(256).optional(),
  numberOfCourts: z.coerce.number().int().min(1).max(64).optional(),
  entryFeeDollars: optionalNumber(z.coerce.number().min(0).max(1000)),
  startDate: dateField.optional(),
  endDate: dateField.optional(),
  registrationDeadline: dateField.optional(),
  venue: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
