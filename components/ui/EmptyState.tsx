import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional primary action shown as a button below the description */
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
