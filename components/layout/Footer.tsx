// Site footer. Rendered globally from app/layout.tsx, alongside Navbar.

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Mail } from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/icons/SocialIcons';

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

const CONTACT_EMAIL = 'courtquest3@gmail.com';

export default function Footer() {
  const { status } = useSession();

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-12 text-sm text-gray-500">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-base font-bold text-brand-700">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
              CourtQuest
            </Link>
            <p className="mt-3 max-w-sm leading-relaxed text-gray-500">
              CourtQuest helps organizers run pickleball tournaments that bring communities
              together — making it easy to create events, track brackets, and grow the game at
              the grassroots level.
            </p>
            <div className="mt-4 flex gap-4">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-gray-400 transition-colors hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/tournaments" className="transition-colors hover:text-brand-700">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="/organizer" className="transition-colors hover:text-brand-700">
                  Organizer
                </Link>
              </li>
              <li>
                {status === 'authenticated' ? (
                  <Link href="/dashboard" className="transition-colors hover:text-brand-700">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="transition-colors hover:text-brand-700">
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Contact</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" />
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-gray-100 pt-6 text-center text-xs text-gray-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} CourtQuest. All rights reserved.</p>
          <p>Made with ❤️ for youth sports.</p>
        </div>
      </div>
    </footer>
  );
}
