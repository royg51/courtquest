import { z } from 'zod';

export const registerTeamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCE_INTERMEDIATE', 'ADVANCED']),
  waiverAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the waiver to register' }),
  }),
  // Registering as an existing permanent team copies its roster in directly
  // and skips `partner` entirely — mutually exclusive with it.
  permanentTeamId: z.string().optional(),
  partner: z
    .object({
      guestName: z.string().min(2).max(100).optional(),
      guestEmail: z.string().email().optional(),
      guestPhone: z.string().max(30).optional(),
      // Invite-by-email: the partner consents by accepting, rather than
      // being added on the registrant's say-so. Logged-in registrants only
      // (see lib/teams.ts) — guests use guestName instead.
      inviteEmail: z.string().email().optional(),
    })
    .refine((p) => !!p.guestName || !!p.inviteEmail, {
      message: 'Provide either partner details or an email to invite',
    })
    .optional(),
});

export type RegisterTeamInput = z.infer<typeof registerTeamSchema>;

// Guest (no account) registration adds the primary registrant's own details,
// since there's no session user to pull them from.
export const guestRegisterTeamSchema = registerTeamSchema.extend({
  guestPrimary: z.object({
    guestName: z.string().min(2, 'Your name is required').max(100),
    guestEmail: z.string().email().optional().or(z.literal('')),
    guestPhone: z.string().max(30).optional(),
  }),
});

export type GuestRegisterTeamInput = z.infer<typeof guestRegisterTeamSchema>;

export const updateTeamStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'WAITLISTED', 'WITHDRAWN']),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
});

export const createPermanentTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  sport: z.string().min(1),
});
