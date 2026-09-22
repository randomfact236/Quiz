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
      const image = `/og/riddle-question/${questionId}.png`;
      // Self-canonical + og:url (see quiz-mcq page): scrapers obey rel=canonical.
      const url = `${APP_URL}/riddle-mcq?q=${questionId}`;
      // Spec A3 #6: the description IS the riddle text.
      const description = share.question.slice(0, 110);
      return {
        ...MODULE_META['riddle-mcq'],
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
  }

  // Category share (§3 #5): teal 🧩 card with the category name.
  // Riddle result share (SHARE-01 row #7): score card, mirroring the quiz result.
  const scoreParam = first(params['score']);
  const totalParam = first(params['total']);
  if (scoreParam && totalParam) {
    const label = first(params['label']) || 'Mixed';
    const image = `/og/riddle-result/${encodeURIComponent(label)}/${scoreParam}-${totalParam}-v2.png`;
    const url = `${APP_URL}/riddle-mcq?label=${encodeURIComponent(label)}&score=${scoreParam}&total=${totalParam}`;
    const title = `I scored ${scoreParam}/${totalParam} on ${label} Riddles ${'🧩'}`;
    const description = `Beat my score in the ${label} Riddles - can you do better?`;
    return {
      ...MODULE_META['riddle-mcq'],
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

  if (category) {
    const categories = await ogData.riddleCategories();
    const match = categories?.find((c) => c.slug === category);
    if (match) {
      const title = `Riddles · ${match.name} — brain teasers`;
      const image = `/og/riddle-category/${encodeURIComponent(category)}.png`;
      // plan/15 P2: canonical points at the real per-category segment
      // (/riddle-mcq/<category>) so the query-param view consolidates onto the
      // URL the sitemap lists.
      const url = `${APP_URL}/riddle-mcq/${encodeURIComponent(category)}`;
      return {
        ...MODULE_META['riddle-mcq'],
        title,
        alternates: { canonical: url },
        openGraph: {
          type: 'website',
          title,
          url,
          images: [{ url: image, width: 1200, height: 630 }],
        },
        twitter: { title, images: [image] },
      };
    }
  }

  return MODULE_META['riddle-mcq'];
}

export default function RiddleMcqPage() {
  return <RiddlesHubView />;
}
