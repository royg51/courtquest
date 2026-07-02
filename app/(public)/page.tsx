// Home page — server component.
// Sports-first design: real tournament photography, hero, photo gallery, carousel, CTA.
// All media paths are sourced exclusively from lib/media.ts.

import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Network, Activity, ArrowRight, BadgeCheck, Heart } from 'lucide-react';
import { auth } from '@/lib/auth';
import { PhotoGrid } from '@/components/ui/PhotoGrid';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { FadeIn } from '@/components/ui/FadeIn';
import {
  HERO_IMAGES,
  CTA_IMAGES,
  HOMEPAGE_GALLERY,
  CAROUSEL_PHOTOS,
} from '@/lib/media';

const STATS = [
  { value: '$3,000+', label: 'Raised for Community' },
  { value: '40+',     label: 'Tournament Players' },
  { value: '100%',    label: 'Student-Led' },
];

const FEATURES = [
  {
    icon: Trophy,
    title: 'Tournament Creation',
    description: "Spin up a tournament in minutes — set the format and capacity, and you're live.",
  },
  {
    icon: Network,
    title: 'Bracket Tracking',
    description: 'Brackets update automatically as winners advance, round after round.',
  },
  {
    icon: Activity,
    title: 'Live Results',
    description: 'Scores and standings update in real time as matches finish.',
  },
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main>
      {/* ─── HERO — community group photo; communicates nonprofit + excitement ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <Image
          src={HERO_IMAGES.homepage.src}
          alt={HERO_IMAGES.homepage.alt}
          fill
          priority
          className="object-cover object-center"
          sizes={HERO_IMAGES.homepage.sizes}
          quality={85}
        />
        {/* Stronger gradient — center reaches ~72% so white text always reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/72 to-black/95" />

        <div className="relative z-10 w-full px-6 py-28 sm:py-36">
          {/* Centered content block */}
          <div className="mx-auto max-w-3xl animate-fade-in-up text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-brand-400" />
              501(c)(3) Certified Nonprofit
            </span>

            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Transform Communities{' '}
              <span className="text-brand-400">Through Sports</span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-lg text-gray-200 sm:text-xl">
              CourtQuest organizes competitive pickleball tournaments that bring people together
              and raise funds for local causes — entirely student-led.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/events?tab=current"
                className="group inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/30 transition-all hover:bg-brand-500 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Browse Tournaments
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm ring-1 ring-white/30 transition-all hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm ring-1 ring-white/30 transition-all hover:bg-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Join CourtQuest
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ─── STATS — adapts to theme: light gray in light mode, dark in dark mode ── */}
      <section className="relative overflow-hidden bg-gray-100 px-6 py-16 dark:bg-gray-900">
        {/* Court-grid texture: visible in dark mode, hidden in light mode */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-[0.035] dark:block"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg, transparent, transparent 59px, #fff 59px, #fff 60px)',
              'repeating-linear-gradient(90deg, transparent, transparent 59px, #fff 59px, #fff 60px)',
            ].join(', '),
          }}
        />
        <div className="relative mx-auto grid max-w-3xl gap-10 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 120} className="text-center">
              <p className="text-5xl font-black text-brand-600 sm:text-6xl dark:text-brand-400">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── FROM THE COURTS — photo gallery, lazy loaded ────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-28 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">From the Courts</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Real moments from CourtQuest tournaments.</p>
            </div>
            <Link
              href="/events?tab=past"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-all hover:text-brand-700 hover:gap-2 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          <FadeIn delay={80}>
            <PhotoGrid photos={HOMEPAGE_GALLERY} columns={3} />
          </FadeIn>
        </div>
      </section>

      {/* ─── HOW IT WORKS — feature cards, staggered FadeIn ─────────────────── */}
      <section className="border-t border-gray-200 bg-white px-6 py-20 sm:py-28 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              Everything You Need to Run a Tournament
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-gray-400">
              From registration to final bracket, CourtQuest handles the logistics so you can
              focus on the competition.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <FadeIn key={title} delay={i * 100}>
                <div className="group h-full rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800 dark:hover:shadow-brand-900/20">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-900/30 dark:text-brand-400">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── IN THE ACTION — rotating photo carousel ─────────────────────────── */}
      <section className="bg-gray-100 px-6 py-20 sm:py-28 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <FadeIn className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">In the Action</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Highlights from both tournaments.</p>
          </FadeIn>

          <FadeIn delay={60}>
            <PhotoCarousel photos={CAROUSEL_PHOTOS} />
          </FadeIn>
        </div>
      </section>

      {/* ─── DONATE STRIP ────────────────────────────────────────────────────── */}
      <section className="bg-brand-50 px-6 py-12 dark:bg-brand-900/20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Support our mission — every dollar goes back to the community
            </p>
          </div>
          <Link
            href="/donate"
            className="shrink-0 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Donate Now
          </Link>
        </div>
      </section>

      {/* ─── CTA — strong overlay for text readability against action photo ──── */}
      <section className="relative overflow-hidden py-24 sm:py-36">
        <Image
          src={CTA_IMAGES.homepage.src}
          alt={CTA_IMAGES.homepage.alt}
          fill
          className="object-cover object-center"
          sizes={CTA_IMAGES.homepage.sizes}
        />
        {/* Two-layer overlay: gradient vignette + flat brand tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/96 via-brand-900/92 to-brand-950/96" />

        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center text-white">
          <h2 className="text-4xl font-black sm:text-5xl">Ready to Compete?</h2>
          <p className="mt-5 text-lg text-white/85">
            Join hundreds of players and help build community sports in Northern Virginia.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/events?tab=current"
              className="rounded-lg bg-white px-6 py-3.5 font-semibold text-brand-700 shadow-lg transition-all hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              View Tournaments
            </Link>
            {!isLoggedIn && (
              <Link
                href="/signup"
                className="rounded-lg border-2 border-white/40 px-6 py-3.5 font-semibold text-white transition-all hover:border-white hover:bg-white/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
