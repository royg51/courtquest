// Site footer. Rendered globally from app/layout.tsx, alongside Navbar.

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Mail, MapPin } from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/icons/SocialIcons';

const VENUE_NAME = 'Worldgate Center';
const VENUE_ADDRESS = '13025 Worldgate Dr, Herndon, VA 20170';
const VENUE_URL = 'https://www.worldgatecentre.com';
const VENUE_MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49640.57380193009!2d-77.47735965136718!3d38.9574305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b647f2ac612663%3A0xbe2137f229b5b44f!2sWorldgate%20Centre!5e0!3m2!1sen!2sus!4v1782540359706!5m2!1sen!2sus';

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

const QUICK_LINKS = [
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
  { href: '/donate', label: 'Donate' },
  { href: '/organizer', label: 'Organizer' },
];

const CONTACT_EMAIL = 'courtquest3@gmail.com';

export default function Footer() {
  const { status } = useSession();

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-12 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-bold text-brand-700 dark:text-brand-400"
            >
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
              CourtQuest
            </Link>
            <p className="mt-3 max-w-sm leading-relaxed text-gray-500 dark:text-gray-400">
              A 501(c)(3) nonprofit dedicated to growing community sports while making a positive
              impact on local communities.
            </p>
            <div className="mt-4 flex gap-4">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-gray-400 transition-colors hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:hover:text-brand-400"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                {status === 'authenticated' ? (
                  <Link
                    href="/dashboard"
                    className="transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                  >
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contact</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                >
                  <Mail className="h-4 w-4" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={VENUE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {VENUE_NAME}
                    <br />
                    {VENUE_ADDRESS}
                  </span>
                </a>
              </li>
            </ul>
            <iframe
              src={VENUE_MAP_EMBED}
              title={`Map of ${VENUE_NAME}`}
              width="100%"
              height={160}
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="mt-3 w-full rounded-md border border-gray-200 dark:border-gray-800"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-gray-100 pt-6 text-center text-xs text-gray-400 sm:flex-row sm:justify-between dark:border-gray-800 dark:text-gray-500">
          <p>© {new Date().getFullYear()} CourtQuest. All rights reserved.</p>
          <p>Made with a passion for youth sports.</p>
        </div>
      </div>
    </footer>
  );
}
