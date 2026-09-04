import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Dad Jokes', path: '/jokes' },
];

export const metadata: Metadata = {
  title: 'Dad Jokes — 😄 Laugh Out Loud Collection | AIQuiz',
  description:
    'Browse our collection of hilarious dad jokes. Filter by category, vote on your favourites, and reveal the punchline with a card flip. New Joke of the Day every day!',
  openGraph: {
    title: 'Dad Jokes — AIQuiz',
    description:
      'Flip cards to reveal punchlines, like your favourites, and discover the Joke of the Day.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dad Jokes — AIQuiz',
    description:
      'Flip cards to reveal punchlines, like your favourites, and discover the Joke of the Day.',
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
