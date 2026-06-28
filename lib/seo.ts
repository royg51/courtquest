// Shared helper for building per-page metadata. Next.js's metadata
// inheritance only deep-merges openGraph/twitter when the child provides
// nothing at all for that key — provide an empty object and you silently
// inherit the ROOT layout's title/description for og:title etc., which is
// wrong for every page that isn't the homepage. This makes "give every
// page its own correct OG/Twitter data" a one-liner instead of repeating
// the same shape on every page.

import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  image?: string;
}): Metadata {
  const { title, description, path, noindex, image } = opts;
  const url = `${APP_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: 'CourtQuest',
      type: 'website',
      images: [{ url: image ?? '/logo.png', width: 500, height: 500, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image ?? '/logo.png'],
    },
  };
}
