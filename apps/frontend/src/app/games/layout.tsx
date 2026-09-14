import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Games', path: '/games' },
];

export const metadata: Metadata = {
  title: 'Games — Brain Exercise & Puzzle Games',
  description:
    'Free browser brain games: train your memory, words and reflexes — from Memory Quiz to Word Puzzle. Playable one-handed on any device — no install, no signup.',
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
