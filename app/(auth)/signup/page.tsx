// Signup page. Form lives in components/auth/SignupForm.tsx (client component).
// Creates a new PLAYER account. Organizer role granted by admin after signup.

import { Suspense } from 'react';
import SignupForm from '@/components/auth/SignupForm';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Sign Up',
  description: 'Create a free CourtQuest account to register for tournaments.',
  path: '/signup',
  noindex: true,
});

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
