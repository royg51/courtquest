// ─── CourtQuest Media Configuration ──────────────────────────────────────────
// Single source of truth for all tournament media.
// Update this file to add events or swap photos — never hardcode paths in pages.
//
// Loading tiers:
//   HERO     → priority={true}, no lazy load, 1 per page max
//   STANDARD → lazy loaded (Next.js default), preload="metadata" for video
//   GALLERY  → lazy loaded, thumbnail-sized via sizes prop

const CD = '/media/tournaments/chill-dill';   // Chill N' Dill — Jan 2026
const RR = '/media/tournaments/rally-royale'; // Rally Royale  — Aug 2025

// ─── Shared photo type ────────────────────────────────────────────────────────
export interface MediaPhoto {
  src: string;
  alt: string;
  label?: string; // Optional tournament context shown on hover in PhotoGrid
}

// ─── HERO images — priority loaded, strictly 1 per page ──────────────────────
// groupPhoto communicates community and nonprofit spirit at first glance.
export const HERO_IMAGES = {
  homepage: {
    src:   `${RR}/groupPhoto-ClosingCeremony.jpg`,
    alt:   'CourtQuest tournament community — players gathered at the closing ceremony',
    sizes: '100vw',
  },
  events: {
    src:   `${CD}/425-DSC06143.jpg`,
    alt:   "CourtQuest Chill N' Dill — players competing on court",
    sizes: '100vw',
  },
} as const;

// ─── CTA background images — lazy loaded ─────────────────────────────────────
export const CTA_IMAGES = {
  homepage: {
    src:   `${CD}/378-DSC06205.jpg`,
    alt:   "CourtQuest Chill N' Dill — competitive court action",
    sizes: '100vw',
  },
} as const;

// ─── About page images — lazy loaded ─────────────────────────────────────────
export const ABOUT_IMAGES = {
  hero: {
    src:   `${CD}/216-DSC06392.jpg`,
    alt:   "CourtQuest Chill N' Dill — players competing on court",
    sizes: '100vw',
  },
  story: {
    src:   `${CD}/1-DSC06667.jpg`,
    alt:   "CourtQuest Chill N' Dill Winter Championship — players and community",
    sizes: '(max-width: 640px) 100vw, 320px',
  },
  ceremony: {
    src:   `${RR}/groupPhoto-ClosingCeremony.jpg`,
    alt:   'Rally Royale Championship — closing ceremony group photo',
    sizes: '(max-width: 640px) 100vw, 640px',
  },
} as const;

// ─── Featured video — preload="metadata" only, no autoplay ───────────────────
export const FEATURED_VIDEO = {
  src:    `${RR}/ClosingCeremony.mp4`,
  poster: `${RR}/groupPhoto-ClosingCeremony.jpg`,
  title:  'Rally Royale Championship Highlights',
} as const;

// ─── Homepage photo carousel — 7 action-focused shots ────────────────────────
// Displayed in the "In the Action" rotating section. Different from gallery
// to maximize variety. Ordered for visual contrast between consecutive slides.
// CD and RR interleaved; new shots 348 and 51 added Jan 2026.
export const CAROUSEL_PHOTOS: MediaPhoto[] = [
  {
    // Ball frozen mid-air, player lunging at net — cleanest single-player action shot
    src:   `${CD}/348-DSC06242.jpg`,
    alt:   "Chill N' Dill — player hitting at the net, ball in frame",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${RR}/IMG_4637.JPG`,
    alt:   'Rally Royale Championship — doubles action',
    label: "Rally Royale '25",
  },
  {
    // Two players at net, ball caught mid-serve — great doubles moment
    src:   `${CD}/51-DSC06611.jpg`,
    alt:   "Chill N' Dill — two players at the net during a serve",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${RR}/IMG_4631.JPG`,
    alt:   'Rally Royale Championship — match play',
    label: "Rally Royale '25",
  },
  {
    src:   `${CD}/181-DSC06429.jpg`,
    alt:   "Chill N' Dill Winter Championship — competitive match in progress",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${CD}/23-DSC06653.jpg`,
    alt:   "Chill N' Dill — closing ceremony and community",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${CD}/216-DSC06392.jpg`,
    alt:   "Chill N' Dill — court-side action",
    label: "Chill N' Dill '26",
  },
];

// ─── Homepage gallery — 6 curated shots, lazy loaded ─────────────────────────
// Different photos from the carousel to maximize page variety.
export const HOMEPAGE_GALLERY: MediaPhoto[] = [
  {
    src:   `${CD}/161-DSC06461.jpg`,
    alt:   "Chill N' Dill Winter Championship — competitive match in progress",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${CD}/1-DSC06667.jpg`,
    alt:   "Chill N' Dill — players and community at the tournament",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${RR}/IMG_4641.JPG`,
    alt:   'Rally Royale Championship — action shot',
    label: "Rally Royale '25",
  },
  {
    src:   `${CD}/251-DSC06350.jpg`,
    alt:   "Chill N' Dill — players competing on court",
    label: "Chill N' Dill '26",
  },
  {
    src:   `${RR}/IMG_4670.JPG`,
    alt:   'Rally Royale — doubles match highlights',
    label: "Rally Royale '25",
  },
  {
    src:   `${CD}/408-DSC06163.jpg`,
    alt:   "Chill N' Dill — match highlights",
    label: "Chill N' Dill '26",
  },
];

// ─── Tournament photo galleries — events page, lazy loaded ───────────────────
export const TOURNAMENT_GALLERIES: Record<string, MediaPhoto[]> = {
  'rally-royale': [
    { src: `${RR}/groupPhoto-ClosingCeremony.jpg`, alt: 'Rally Royale closing ceremony — participants group photo' },
    { src: `${RR}/IMG_4641.JPG`,                   alt: 'Rally Royale championship match in progress' },
    { src: `${RR}/IMG_4631.JPG`,                   alt: 'Rally Royale — competitive pickleball action' },
    { src: `${RR}/IMG_4637.JPG`,                   alt: 'Rally Royale — tournament play on court' },
    { src: `${RR}/IMG_4720.JPG`,                   alt: 'Rally Royale — players in action' },
    { src: `${RR}/IMG_4670.JPG`,                   alt: 'Rally Royale — doubles match highlights' },
  ],
  'chill-n-dill': [
    { src: `${CD}/348-DSC06242.jpg`, alt: "Chill N' Dill — player at the net, ball in frame" },
    { src: `${CD}/181-DSC06429.jpg`, alt: "Chill N' Dill — championship action shot" },
    { src: `${CD}/IMG_4707.JPG`,     alt: "Chill N' Dill — wide court view with players in action" },
    { src: `${CD}/161-DSC06461.jpg`, alt: "Chill N' Dill — competitive match in progress" },
    { src: `${CD}/51-DSC06611.jpg`,  alt: "Chill N' Dill — two players at net during a serve" },
    { src: `${CD}/1-DSC06667.jpg`,   alt: "Chill N' Dill — players at the tournament" },
    { src: `${CD}/300-DSC06298.jpg`, alt: "Chill N' Dill — student organizer briefing players court-side" },
    { src: `${CD}/23-DSC06653.jpg`,  alt: "Chill N' Dill — tournament atmosphere" },
    { src: `${CD}/235-DSC06370.jpg`, alt: "Chill N' Dill — community gathering between rounds" },
    { src: `${CD}/216-DSC06392.jpg`, alt: "Chill N' Dill — court action" },
    { src: `${CD}/251-DSC06350.jpg`, alt: "Chill N' Dill — players competing" },
    { src: `${CD}/408-DSC06163.jpg`, alt: "Chill N' Dill — match highlights" },
    { src: `${CD}/378-DSC06205.jpg`, alt: "Chill N' Dill — players on court" },
  ],
};
