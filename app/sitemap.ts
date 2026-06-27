import type { MetadataRoute } from 'next';
import { listTournaments } from '@/lib/tournaments';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tournaments = await listTournaments({ isPublic: true });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/tournaments`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/signup`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map((tournament) => ({
    url: `${APP_URL}/tournaments/${tournament.slug}`,
    lastModified: tournament.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [...staticRoutes, ...tournamentRoutes];
}
