import type { Metadata } from 'next';

import { ogData } from '@/lib/og-data';
import { APP_URL } from '@/lib/seo';

import ImageRiddlesPage from '../page';

/**
 * SHARE-01 #8: a per-riddle URL (/image-riddles/<id>) with its own share
 * metadata. The self-canonical here is the actual FB fix — the previous
 * share URL (/image-riddles?riddle=<id>) canonicalised to `/`, so Facebook
 * previewed the generic home card. The /image-riddles page is a client
 * component (it cannot export generateMetadata), so this thin server route
 * provides the metadata and renders the list view; the client opens the
 * linked riddle's modal (BUG-064 follow-up deep link).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const riddle = await ogData.imageRiddleShare(id);
  if (!riddle) {
    return { title: 'Image Riddles | PigZap' };
  }
  // Only title/imageUrl are read from the entity — the answer never leaves
  // the server, let alone into the preview metadata.
  const title = `${riddle.title.slice(0, 60)} | PigZap Image Riddles`;
  const description = `Can you solve this image riddle: ${riddle.title}`.slice(0, 160);
  const url = `${APP_URL}/image-riddles/${id}`;
  const image = `/og/image-riddle/${id}.png`;
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

export default function ImageRiddlePage() {
  return <ImageRiddlesPage />;
}
