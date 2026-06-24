// Home page — public, server component.
// Full landing page: hero, features, footer. Auth-aware CTA via auth().

import Link from 'next/link';
import { Trophy, Network, Activity } from 'lucide-react';
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
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-brand-700 sm:text-5xl">
            CourtQuest
          </h1>
          <p className="text-lg text-gray-600">Tournament management for pickleball and beyond</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tournaments"
            className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            Browse Tournaments
          </Link>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-md border border-brand-600 px-5 py-2.5 font-medium text-brand-700 hover:bg-brand-50"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-16">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} CourtQuest</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/tournaments" className="hover:text-brand-700">
            Tournaments
          </Link>
          <Link href="/login" className="hover:text-brand-700">
            Login
          </Link>
          <Link href="/signup" className="hover:text-brand-700">
            Sign Up
          </Link>
        </div>
      </footer>
    </main>
  );
}
