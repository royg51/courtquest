'use client';

import { useState } from 'react';

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

// Tab switches are purely client-side (the content for all three tabs is
// already rendered server-side and handed in as `content`), so there's no
// need to round-trip through the router. We still sync the URL via the
// native History API — purely cosmetic, so /events?tab=past is shareable —
// without triggering router.replace's server re-fetch on every click.
export function EventsTabs({ initialTab, tabs }: { initialTab: string; tabs: Tab[] }) {
  const [active, setActive] = useState(initialTab);

  const select = (key: string) => {
    setActive(key);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', key);
    window.history.replaceState(null, '', url);
  };

  return (
    <div>
      <div role="tablist" className="mb-8 flex gap-6 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => select(tab.key)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
              active === tab.key
                ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.key} role="tabpanel" hidden={active !== tab.key}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
