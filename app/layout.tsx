import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthSessionProvider } from '@/components/providers/SessionProvider';
import Navbar from '@/components/layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CourtQuest', template: '%s | CourtQuest' },
  description: 'Modern tournament management for pickleball and beyond.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
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
