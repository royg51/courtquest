'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoids a hydration mismatch: resolvedTheme is undefined until next-themes
  // reads localStorage/system preference on the client after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={mounted && resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:text-gray-300 dark:hover:bg-gray-800 ${className ?? ''}`}
    >
      {mounted && resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
