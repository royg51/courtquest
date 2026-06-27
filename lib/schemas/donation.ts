import { z } from 'zod';

export const donationCheckoutSchema = z.object({
  amountCents: z.coerce.number().int().min(100, 'Minimum donation is $1').max(100_000_00),
  isAnonymous: z.boolean().optional().default(false),
});

export type DonationCheckoutInput = z.infer<typeof donationCheckoutSchema>;
