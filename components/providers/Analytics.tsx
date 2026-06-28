'use client';

import { useEffect, useState } from 'react';

// Plausible — privacy-conscious, cookieless analytics. Loads the script tag
// client-side only when all of the following hold:
//   - production build (never in local dev)
//   - NEXT_PUBLIC_PLAUSIBLE_DOMAIN is actually set
//   - the browser hasn't requested Do Not Track
// Doing this as a runtime check (not just "omit the <script> in dev") means
// there's nothing to forget to remove before shipping — the same code runs
// everywhere, it just only activates under the right conditions.
function respectsDoNotTrack(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  return nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.msDoNotTrack === '1';
}

export function Analytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    if (process.env.NODE_ENV !== 'production' || !domain) return;
    if (respectsDoNotTrack()) return;
    setShouldLoad(true);
  }, []);

  if (!shouldLoad) return null;

  return (
    <script
      defer
      data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
    />
  );
}
