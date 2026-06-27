// Static historical/marketing content for real-world past events — these
// predate (or aren't modeled as) live Tournament records in the database,
// so they're plain content data, not a Prisma model.
//
// To add photos: drop a Google Drive (or other) album link into
// `photoAlbumUrl` below. Leave it undefined to show "Photos coming soon".

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
  },
  {
    name: "Chill N' Dill",
    subtitle: 'Winter Championship',
    date: 'January 31, 2026',
    status: 'Completed Successfully',
    venue: 'Worldgate Center',
    location: 'Herndon, Virginia',
    stats: [{ label: 'Raised', value: '$1,600+' }],
    photoAlbumUrl: undefined,
  },
];
