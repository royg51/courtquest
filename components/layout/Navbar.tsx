// Top navigation bar.
// Auth-aware: shows Dashboard + Logout when signed in, Login + Sign Up otherwise.
// Below sm:, the link group collapses into an accessible slide-in drawer.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/about', label: 'About' },
  { href: '/donate', label: 'Donate' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  // /organizer itself redirects PLAYER-role accounts straight back to
  // /dashboard with no explanation — showing this link to everyone made
  // that look like a dead click for non-organizers. Only show it to
  // accounts that can actually use it.
  const canSeeOrganizerLink =
    session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN';
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusables = drawerRef.current.querySelectorAll<HTMLElement>('a, button:not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const linkClass =
    'transition-colors hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 rounded dark:hover:text-brand-400';
  const drawerLinkClass =
    'rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:hover:bg-gray-800';

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700 dark:text-brand-400">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
          CourtQuest
        </Link>

        <div className="hidden items-center gap-4 text-sm font-medium text-gray-700 sm:flex dark:text-gray-300">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
          {canSeeOrganizerLink && (
            <Link href="/organizer" className={linkClass}>
              Organizer
            </Link>
          )}

          {status === 'authenticated' && (
            <>
              <Link href="/dashboard" className={linkClass}>
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-md border border-gray-300 px-3 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          )}

          {status === 'unauthenticated' && (
            <>
              <Link href="/login" className={linkClass}>
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                Sign Up
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-drawer"
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity sm:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 sm:hidden dark:bg-gray-950 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Menu</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={close} className={drawerLinkClass}>
              {link.label}
            </Link>
          ))}
          {canSeeOrganizerLink && (
            <Link href="/organizer" onClick={close} className={drawerLinkClass}>
              Organizer
            </Link>
          )}

          {status === 'authenticated' && (
            <>
              <Link href="/dashboard" onClick={close} className={drawerLinkClass}>
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  close();
                  signOut({ callbackUrl: '/' });
                }}
                className={`${drawerLinkClass} border border-gray-300 dark:border-gray-700`}
              >
                Logout
              </button>
            </>
          )}

          {status === 'unauthenticated' && (
            <>
              <Link href="/login" onClick={close} className={drawerLinkClass}>
                Login
              </Link>
              <Link
                href="/signup"
                onClick={close}
                className="rounded-md bg-brand-600 px-3 py-2 text-center text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
