import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Dad Jokes', path: '/jokes' },
];

export const metadata: Metadata = {
  title: 'Dad Jokes — 😄 Laugh Out Loud Collection',
  description:
    'Browse our collection of hilarious dad jokes. Filter by category, vote on your favourites, and reveal the punchline with a card flip. New Joke of the Day every day!',
  // share-design-system §3 #9: amber joke template as the share image
  // Clean image path (BUG-063): /api/og?... could not be rendered by Facebook.
  openGraph: {
    type: 'website',
    images: [{ url: '/og/joke.png', width: 1200, height: 630 }],
  },
  twitter: { images: ['/og/joke.png'] },
};

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(BREADCRUMBS)} />
      {children}
    </>
  );
}
