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
};

export default function Layout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(BREADCRUMBS)} />
      {children}
    </>
  );
}
