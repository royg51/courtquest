import { z } from 'zod';

export const submitScoreSchema = z.object({
  scoreA: z.coerce.number().int().min(0),
  scoreB: z.coerce.number().int().min(0),
});

export type SubmitScoreInput = z.infer<typeof submitScoreSchema>;

// Court / time assignment. Both fields are independently nullable so the UI
// can set, change, or clear either one. Empty strings from the form inputs
// are normalized to null (clear) before validation.
const emptyToNull = (val: unknown) => (val === '' || val === undefined ? null : val);

export const updateMatchScheduleSchema = z.object({
  courtNumber: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(64).nullable()),
  scheduledAt: z.preprocess(emptyToNull, z.coerce.date().nullable()),
});

export type UpdateMatchScheduleInput = z.infer<typeof updateMatchScheduleSchema>;
