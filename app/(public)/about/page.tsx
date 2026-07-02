import Image from 'next/image';
import { Flag, Trophy, ShieldCheck, TrendingUp, BadgeCheck } from 'lucide-react';
import { ABOUT_IMAGES } from '@/lib/media';
import { FadeIn } from '@/components/ui/FadeIn';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About',
  description: "CourtQuest's mission, vision, story, and impact.",
  path: '/about',
});

const TIMELINE = [
  { date: 'July 2025',     title: 'CourtQuest founded',                            icon: Flag },
  { date: 'August 2025',   title: 'Hosted Rally Royale Championship',               icon: Trophy },
  { date: 'November 2025', title: 'Officially became a registered 501(c)(3)',       icon: ShieldCheck },
  { date: 'January 2026',  title: "Hosted Chill N' Dill Winter Championship",      icon: Trophy },
  { date: 'Future',        title: 'Growing community sports nationwide',            icon: TrendingUp },
];

export default function AboutPage() {
  return (
    <>
      {/* ─── HERO — 216-DSC06392.jpg with dark overlay for contrast in both modes */}
      <section className="relative overflow-hidden py-24 text-center sm:py-32">
        <Image
          src={ABOUT_IMAGES.hero.src}
          alt={ABOUT_IMAGES.hero.alt}
          fill
          priority
          className="object-cover object-center"
          sizes={ABOUT_IMAGES.hero.sizes}
          quality={85}
        />
        {/* Dark overlay — provides contrast for white text in both light and dark mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/80" />

        <div className="relative z-10 px-6">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-brand-400" />
              501(c)(3) Certified Nonprofit
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              About CourtQuest
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/80">
              A student-led nonprofit bringing community together through competitive sports.
            </p>
          </FadeIn>
        </div>
      </section>

      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Mission + Vision */}
        <FadeIn>
          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mission</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                CourtQuest exists to make organizing and joining community sports tournaments simple,
                so more time goes toward play and impact — and less toward logistics.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vision</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                A future where every neighborhood has access to organized, inclusive sports
                tournaments that bring people together and give back to the causes they care about.
              </p>
            </div>
          </section>
        </FadeIn>

        {/* Our Story — text + featured tournament photo side-by-side */}
        <FadeIn delay={80}>
          <section className="mt-10">
            <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Our Story</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  CourtQuest started in July 2025 as a small group of students who wanted to run a
                  better pickleball tournament than the one they&apos;d just played in. What began as
                  a single event grew into a registered nonprofit dedicated to organizing competitive,
                  community-focused tournaments — and to making sure the money raised goes straight
                  back into the neighborhoods that host them.
                </p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src={ABOUT_IMAGES.story.src}
                  alt={ABOUT_IMAGES.story.alt}
                  fill
                  className="object-cover object-center"
                  sizes={ABOUT_IMAGES.story.sizes}
                />
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Impact */}
        <FadeIn delay={60}>
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Impact</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Since founding, CourtQuest has organized two tournaments, brought together 40+
              participants, and raised over $3,000 for local causes — entirely student-led.
            </p>
          </section>
        </FadeIn>

        {/* Timeline + closing ceremony photo */}
        <FadeIn delay={80}>
          <section className="mt-12">
            <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Timeline</h2>
            <ol className="relative space-y-8 border-l border-gray-200 pl-8 dark:border-gray-800">
              {TIMELINE.map(({ date, title, icon: Icon }) => (
                <li key={title} className="relative">
                  <span className="absolute -left-[2.45rem] flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-white dark:bg-brand-900/30 dark:text-brand-400 dark:ring-gray-950">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                    {date}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                </li>
              ))}
            </ol>

            {/* Ceremony photo below timeline */}
            <div className="mt-8 overflow-hidden rounded-xl">
              <div className="relative aspect-[16/7]">
                <Image
                  src={ABOUT_IMAGES.ceremony.src}
                  alt={ABOUT_IMAGES.ceremony.alt}
                  fill
                  className="object-cover object-center"
                  sizes={ABOUT_IMAGES.ceremony.sizes}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <p className="absolute bottom-3 left-4 text-sm font-medium text-white/90">
                  Rally Royale Championship — August 2025
                </p>
              </div>
            </div>
          </section>
        </FadeIn>
      </main>
    </>
  );
}
