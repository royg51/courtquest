// Shared Zod schemas for login/signup — used by both the client forms and
// the API route, so validation can't drift between them.

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72), // 72 = bcrypt input limit
});
export type SignupInput = z.infer<typeof signupSchema>;
