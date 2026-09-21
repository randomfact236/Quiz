import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { APP_URL, breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Games', path: '/games' },
];

// SHARE-01 #10: the hub card replaces the home fallback; the per-game links
// (/games/<slug>) carry their own og tags in the static game HTMLs and
// render /og/game/<slug>.png (per-game accents).
const TITLE = 'Games — Brain Exercise & Puzzle Games';
const DESCRIPTION =
  'Free browser brain games: train your memory, words and reflexes — from Memory Quiz to Word Puzzle. Playable one-handed on any device — no install, no signup.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/games' },
  openGraph: {
    type: 'website',
    title: 'PigZap Games — 8 Free Brain Games',
    description: DESCRIPTION,
    url: `${APP_URL}/games`,
    images: [{ url: '/og/games.png', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'PigZap Games — 8 Free Brain Games',
    description: DESCRIPTION,
    images: ['/og/games.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(BREADCRUMBS)} />
      {children}
    </>
  );
}
