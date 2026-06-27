import type { Metadata } from 'next';
import { Flag, Trophy, ShieldCheck, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description: "CourtQuest's mission, vision, story, and impact.",
};

const TIMELINE = [
  {
    date: 'July 2025',
    title: 'CourtQuest founded',
    icon: Flag,
  },
  {
    date: 'August 2025',
    title: 'Hosted Rally Royale Championship',
    icon: Trophy,
  },
  {
    date: 'November 2025',
    title: 'Officially became a registered 501(c)(3)',
    icon: ShieldCheck,
  },
  {
    date: 'January 2026',
    title: "Hosted Chill N' Dill Winter Championship",
    icon: Trophy,
  },
  {
    date: 'Future',
    title: 'Growing community sports nationwide',
    icon: TrendingUp,
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">About CourtQuest</h1>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Mission</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            CourtQuest exists to make organizing and joining community sports tournaments simple,
            so more time goes toward play and impact — and less toward logistics.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Vision</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            A future where every neighborhood has access to organized, inclusive sports
            tournaments that bring people together and give back to the causes they care about.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Our Story</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          CourtQuest started in July 2025 as a small group of students who wanted to run a better
          pickleball tournament than the one they&apos;d just played in. What began as a single
          event grew into a registered nonprofit dedicated to organizing competitive,
          community-focused tournaments — and to making sure the money raised goes straight back
          into the neighborhoods that host them.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Impact</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Since founding, CourtQuest has organized two tournaments, brought together 40+
          participants, and raised over $3,000 for local causes — entirely student-led.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="mb-6 font-semibold text-gray-900 dark:text-gray-100">Timeline</h2>
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
      </section>
    </main>
  );
}
