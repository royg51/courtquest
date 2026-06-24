import type { Metadata } from 'next';
import { Toaster } from 'sonner';
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
        {/* TanStack Query provider and Auth.js SessionProvider will wrap children here */}
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
