import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthSessionProvider } from '@/components/providers/SessionProvider';
import Navbar from '@/components/layout/Navbar';
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
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: 'CourtQuest',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          {/* TanStack Query provider will wrap children here */}
          <Navbar />
          {children}
        </AuthSessionProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
