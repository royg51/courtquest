// Public "join with code" entry point. Type a tournament's invite code to be
// taken to its page. Anyone can use this — no login required.

import { pageMetadata } from '@/lib/seo';
import JoinCodeForm from '@/components/registration/JoinCodeForm';

export const metadata = pageMetadata({
  title: 'Join with a code',
  description: 'Enter a tournament invite code to join.',
  path: '/join',
  noindex: true,
});

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">Join a tournament</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Enter the invite code your organizer shared with you.
      </p>
      <JoinCodeForm />
    </main>
  );
}
