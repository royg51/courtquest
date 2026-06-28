// Login page. Form lives in components/auth/LoginForm.tsx (client component).

import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your CourtQuest account to manage tournaments and registrations.',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
