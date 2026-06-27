'use client';

import { signIn } from 'next-auth/react';

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.14c-.22-.69-.35-1.42-.35-2.14s.13-1.45.35-2.14V7.02H2.18A10.96 10.96 0 0 0 1 12c0 1.79.43 3.48 1.18 4.98z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.02l3.66 2.84c.87-2.6 3.3-4.48 6.16-4.48z"
      />
    </svg>
  );
}

export function GoogleButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn('google', { callbackUrl })}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <GoogleLogo className="h-4 w-4" />
      Continue with Google
    </button>
  );
}
