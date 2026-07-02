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
      <head>
        {/* Minimal dark-mode styles — ThemeProvider is unavailable at this level */}
        <style>{`
          body { margin: 0; font-family: system-ui, sans-serif; background: #f9fafb; color: #111827; }
          @media (prefers-color-scheme: dark) {
            body { background: #030712; color: #f9fafb; }
          }
          .err-btn {
            border-radius: 6px; background: #ef4444; color: #fff;
            padding: 0.5rem 1.25rem; font-weight: 500; border: none; cursor: pointer;
          }
          .err-btn:hover { background: #dc2626; }
        `}</style>
      </head>
      <body>
        <main style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>
            We&apos;ve been notified and are looking into it. Please try again.
          </p>
          <button onClick={reset} className="err-btn">Try again</button>
        </main>
      </body>
    </html>
  );
}
