import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CourtQuest',
    short_name: 'CourtQuest',
    description: 'Create, manage, and track tournaments with live brackets and results.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#ef4444',
    icons: [
      {
        src: '/icon.png',
        sizes: '256x256',
        type: 'image/png',
      },
    ],
  };
}
