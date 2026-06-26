// Signup page. Form lives in components/auth/SignupForm.tsx (client component).
// Creates a new PLAYER account. Organizer role granted by admin after signup.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import SignupForm from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Sign Up' };

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
