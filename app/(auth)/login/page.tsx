// Login page. Form lives in components/auth/LoginForm.tsx (client component).

import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Login',
  description: 'Sign in to your CourtQuest account to manage tournaments and registrations.',
  path: '/login',
  noindex: true,
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
