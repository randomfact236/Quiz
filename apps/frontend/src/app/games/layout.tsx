import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Games', path: '/games' },
];

export const metadata: Metadata = {
  title: 'Mini Games — Quick Reaction & Puzzle Games',
  description:
    "Free browser mini games: test your reflexes in Tap or Don't Tap, a Go/No-Go reaction game. Playable one-handed on any device — no install, no signup.",
  alternates: { canonical: '/games' },
};

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(BREADCRUMBS)} />
      {children}
    </>
  );
}
