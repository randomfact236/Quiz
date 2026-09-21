/**
 * ============================================================================
 * Riddles hub page — server wrapper (share-design-system WP1)
 * ============================================================================
 * The hub view itself is a client component (searchParams-driven pickers);
 * this server page exists so generateMetadata can read the URL params and
 * point og:image at the matching share design:
 *   ?category=<slug>              → riddle category share image
 *   ?category=<slug>&q=<uuid>     → riddle question share image (riddle +
 *                                   options, answer never included)
 * ============================================================================ */

import type { Metadata } from 'next';

import { ogData } from '@/lib/og-data';
import { APP_URL, MODULE_META } from '@/lib/seo';

import RiddlesHubView from './RiddlesHubView';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = first(params['category']);
  const questionId = first(params['q']);

  // Riddle question share (§3 #6): platform card shows the real riddle + its
  // options; the answer never leaves the site.
  if (questionId) {
    const share = await ogData.riddleQuestionShare(questionId);
    if (share) {
      const base = share.subjectName || 'Riddles';
      const title = `Can you solve this riddle? 🧩 ${base}`;
      const image = `/api/og?type=riddle-question&id=${questionId}`;
      // Self-canonical + og:url (see quiz-mcq page): scrapers obey rel=canonical.
      const url = `${APP_URL}/riddle-mcq?q=${questionId}`;
      return {
        ...MODULE_META['riddle-mcq'],
        title,
        alternates: { canonical: url },
        openGraph: { title, url, images: [image] },
        twitter: { title, images: [image] },
      };
    }
  }

  // Category share (§3 #5): teal 🧩 card with the category name.
  if (category) {
    const categories = await ogData.riddleCategories();
    const match = categories?.find((c) => c.slug === category);
    if (match) {
      const title = `Riddles · ${match.name} — brain teasers`;
      const image = `/api/og?type=riddle-category&category=${encodeURIComponent(category)}`;
      const url = `${APP_URL}/riddle-mcq?category=${encodeURIComponent(category)}`;
      return {
        ...MODULE_META['riddle-mcq'],
        title,
        alternates: { canonical: url },
        openGraph: { title, url, images: [image] },
        twitter: { title, images: [image] },
      };
    }
  }

  return MODULE_META['riddle-mcq'];
}

export default function RiddleMcqPage() {
  return <RiddlesHubView />;
}
