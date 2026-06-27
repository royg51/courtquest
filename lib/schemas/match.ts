import { z } from 'zod';

export const submitScoreSchema = z.object({
  scoreA: z.coerce.number().int().min(0),
  scoreB: z.coerce.number().int().min(0),
});

export type SubmitScoreInput = z.infer<typeof submitScoreSchema>;
