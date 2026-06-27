// Home page — public, server component.
// Hero + features. Footer is global (components/layout/Footer.tsx via app/layout.tsx).

import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Network, Activity, ArrowRight } from 'lucide-react';
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

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main>
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-20 text-center sm:py-28">
        <Image
          src="/logo.png"
          alt="CourtQuest"
          width={72}
          height={72}
          className="rounded-full"
          priority
        />

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-brand-700 sm:text-5xl">
            CourtQuest
          </h1>
          <p className="mx-auto max-w-md text-lg text-gray-600">
            Tournament management for pickleball and beyond
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tournaments"
            className="group flex items-center gap-1.5 rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Browse Tournaments
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-md border border-brand-600 px-5 py-2.5 font-medium text-brand-700 transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-brand-200 hover:bg-brand-50/30"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform group-hover:scale-105">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
