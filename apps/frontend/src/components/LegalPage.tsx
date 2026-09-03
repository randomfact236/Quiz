import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared shell for the legal/static pages (plan/09-site-shell-seo.md P1):
 * privacy, terms, contact.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-extrabold text-secondary-900 dark:text-white">{title}</h1>
      <div className="prose prose-slate max-w-none space-y-4 text-secondary-700 dark:text-secondary-300">
        {children}
      </div>
      <p className="mt-10 text-sm text-secondary-500">
        <Link href="/" className="font-medium text-primary-600 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
