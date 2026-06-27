import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-6">
        <Image src="/logo.png" alt="CourtQuest" width={56} height={56} className="rounded-full" />
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {children}
      </div>
    </main>
  );
}
