'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Auto-redirects after `seconds`, but the caller should still render its own
// link/button alongside this for users who don't want to wait — this only
// adds the countdown + timer, it doesn't replace manual navigation.
export function AutoRedirect({ href, seconds }: { href: string; seconds: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      router.push(href);
      return;
    }
    const timer = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, href, router]);

  return (
    <p className="mt-2 text-xs text-green-700/70 dark:text-green-400/70">
      Redirecting to home in {remaining}s…
    </p>
  );
}
