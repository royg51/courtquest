// Static historical/marketing content for real-world past events.
// Photo arrays are sourced from lib/media.ts — add or swap images there.

import type { MediaPhoto } from '@/lib/media';
import { TOURNAMENT_GALLERIES } from '@/lib/media';

export interface PastEvent {
  name: string;
  subtitle?: string;
  date: string;
  status: string;
  venue: string;
  location: string;
  cause?: string;
  stats: { label: string; value: string }[];
  photoAlbumUrl?: string;
  photos?: MediaPhoto[];
}

export const PAST_EVENTS: PastEvent[] = [
  {
    name: 'Rally Royale Championship',
    date: 'August 23, 2025',
    status: 'Completed Successfully',
    venue: 'Worldgate Center',
    location: 'Herndon, Virginia',
    cause: 'Raised funds for the Herndon Community Center',
    stats: [
      { label: 'Participants', value: '32' },
      { label: 'Raised', value: '$1,200' },
    ],
    photoAlbumUrl: undefined,
    photos: TOURNAMENT_GALLERIES['rally-royale'],
  },
  {
    name: "Chill N' Dill",
    subtitle: 'Winter Championship',
    date: 'January 31, 2026',
    status: 'Completed Successfully',
    venue: 'Worldgate Center',
    location: 'Herndon, Virginia',
    stats: [
      { label: 'Participants', value: '40' },
      { label: 'Raised', value: '$1,600+' },
    ],
    photoAlbumUrl: undefined,
    photos: TOURNAMENT_GALLERIES['chill-n-dill'],
  },
];
