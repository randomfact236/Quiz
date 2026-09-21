import type { Metadata } from 'next';

import { APP_URL } from '@/lib/seo';
import { ogData } from '@/lib/og-data';

import JokesListPage from '../page';

/**
 * SHARE-01: a per-joke URL (/jokes/<id>) with its own share metadata. The
 * /jokes page itself is a client component (it cannot export generateMetadata),
 * so this thin server route provides the metadata and renders the list view.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const joke = await ogData.jokeShare(id);
  if (!joke) {
    return { title: 'Dad Jokes | PigZap' };
  }
  const setup = joke.setup.slice(0, 60);
  const title = `${setup} | PigZap Dad Jokes`;
  const description = (joke.punchline ? `${joke.setup} - ${joke.punchline}` : joke.setup).slice(
    0,
    110
  );
  const url = `${APP_URL}/jokes/${id}`;
  const image = `/og/joke/${id}.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { title, description, images: [image] },
  };
}

export default function JokePage() {
  return <JokesListPage />;
}
