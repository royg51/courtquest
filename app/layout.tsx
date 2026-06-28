import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { AuthSessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemedToaster } from '@/components/providers/ThemedToaster';
import { ChunkErrorRecovery } from '@/components/providers/ChunkErrorRecovery';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const TITLE = 'CourtQuest — Tournament Management Platform';
const DESCRIPTION =
  'Create, manage, and track tournaments with live brackets and results.';

export const metadata: Metadata = {
  title: { default: TITLE, template: '%s | CourtQuest' },
  description: DESCRIPTION,
  keywords: [
    'tournaments',
    'bracket management',
    'pickleball tournaments',
    'sports software',
    'CourtQuest',
  ],
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: 'CourtQuest',
    type: 'website',
    images: [{ url: '/logo.png', width: 500, height: 500, alt: 'CourtQuest' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/logo.png'],
  },
};

// Organization + WebSite structured data — sitewide, since they describe
// the site itself rather than any one page. Per-page structured data
// (e.g. SportsEvent on tournament detail pages) lives on those pages.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CourtQuest',
  url: APP_URL,
  logo: `${APP_URL}/logo.png`,
  sameAs: [
    'https://www.instagram.com/court_quest/',
    'https://www.facebook.com/profile.php?id=61578623644938',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CourtQuest',
  url: APP_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ChunkErrorRecovery />
        <ThemeProvider>
          <AuthSessionProvider>
            <QueryProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </QueryProvider>
          </AuthSessionProvider>
          <ThemedToaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
