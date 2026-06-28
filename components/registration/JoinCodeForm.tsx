'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/join/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. K7M2QP"
        autoCapitalize="characters"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-lg font-mono uppercase tracking-widest text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <button
        type="submit"
        className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      >
        Continue
      </button>
    </form>
  );
}
