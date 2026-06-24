// Home page — public, server component.
// Full landing page: hero, features, footer. Auth-aware CTA via auth().

import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Network, Activity } from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/icons/SocialIcons';
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

const SOCIAL_LINKS = [
  {
    icon: InstagramIcon,
    label: 'CourtQuest on Instagram',
    href: 'https://www.instagram.com/court_quest/',
  },
  {
    icon: FacebookIcon,
    label: 'CourtQuest on Facebook',
    href: 'https://www.facebook.com/profile.php?id=61578623644938',
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

      <section className="border-t border-gray-200 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-4">
          {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-gray-400 hover:text-brand-700"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        <p className="mt-4">© {new Date().getFullYear()} CourtQuest</p>

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
