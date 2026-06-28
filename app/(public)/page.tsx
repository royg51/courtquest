// Home page — public, server component.
// Hero + stats + features. Footer is global (components/layout/Footer.tsx).

import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Network, Activity, ArrowRight, BadgeCheck } from 'lucide-react';
import { auth } from '@/lib/auth';

const FEATURES = [
  {
    icon: Trophy,
    title: 'Tournament Creation',
    description: 'Spin up a tournament in minutes — set the format and capacity, and you’re live.',
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

const STATS = [
  { value: '$3,000+', label: 'Raised for Community' },
  { value: '40+', label: 'Tournament Participants' },
  { value: '100%', label: 'Student-Led' },
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white px-4 py-20 text-center sm:py-28 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
        <div className="mx-auto flex max-w-2xl animate-fade-in-up flex-col items-center gap-6">
          <Image
            src="/logo.png"
            alt="CourtQuest"
            width={72}
            height={72}
            className="rounded-full"
            priority
          />

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-gray-900 dark:text-brand-400 dark:ring-brand-800">
            <BadgeCheck className="h-3.5 w-3.5" />
            501(c)(3) Certified Nonprofit
          </span>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
              Transform Communities <span className="text-brand-600 dark:text-brand-400">Through Sports</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-gray-600 dark:text-gray-400">
              Join CourtQuest in organizing competitive sports tournaments that strengthen
              communities while raising funds for local causes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/events?tab=current"
              className="group flex items-center gap-1.5 rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Browse Tournaments
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-md border border-brand-600 bg-white px-5 py-2.5 font-medium text-brand-700 transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-gray-900 dark:text-brand-400 dark:hover:bg-gray-800"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-brand-600 sm:text-4xl dark:text-brand-400">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 px-4 py-16 sm:py-20 dark:border-gray-800">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:border-brand-200 hover:bg-brand-50/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800 dark:hover:bg-brand-900/10"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform group-hover:scale-105 dark:bg-brand-900/30 dark:text-brand-400">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
