import type { MetadataRoute } from 'next';
import { listTournaments } from '@/lib/tournaments';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // /login and /signup are intentionally absent — both are noindex
  // (see their page metadata), and a noindex page listed in the sitemap is
  // a contradictory signal to crawlers.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/events`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/leaderboard`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${APP_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/donate`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  let tournaments: Awaited<ReturnType<typeof listTournaments>> = [];
  try {
    tournaments = await listTournaments({ isPublic: true });
  } catch (error) {
    console.error('[sitemap] failed to load tournaments; returning static sitemap', error);
  }

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map((tournament) => ({
    url: `${APP_URL}/tournaments/${tournament.slug}`,
    lastModified: tournament.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // Completed tournaments have a final, stable bracket worth indexing
  // (results page, effectively). In-progress/open ones change too often
  // and don't have finished results yet — not worth a separate listing.
  const bracketRoutes: MetadataRoute.Sitemap = tournaments
    .filter((tournament) => tournament.status === 'COMPLETED')
    .map((tournament) => ({
      url: `${APP_URL}/tournaments/${tournament.slug}/bracket`,
      lastModified: tournament.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

  return [...staticRoutes, ...tournamentRoutes, ...bracketRoutes];
}
