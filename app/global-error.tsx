'use client';

// App Router's last-resort error boundary — catches anything that escapes
// every other error.tsx in the tree. Reports to Sentry (a no-op if it's not
// configured) and shows a minimal fallback UI rather than a blank page.
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">
            We&apos;ve been notified and are looking into it. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
