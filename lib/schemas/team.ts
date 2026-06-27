import { z } from 'zod';

export const registerTeamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCE_INTERMEDIATE', 'ADVANCED']),
  waiverAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the waiver to register' }),
  }),
  partner: z
    .object({
      guestName: z.string().min(2).max(100),
      guestEmail: z.string().email().optional(),
      guestPhone: z.string().max(30).optional(),
    })
    .optional(),
});

export type RegisterTeamInput = z.infer<typeof registerTeamSchema>;

export const updateTeamStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'WAITLISTED', 'WITHDRAWN']),
});
