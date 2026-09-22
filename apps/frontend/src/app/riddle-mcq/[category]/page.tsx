/**
 * ============================================================================
 * /riddle-mcq/[category] — per-category SEO landing (plan/15 P2)
 * ============================================================================
 * Real path segment per riddle category (mirrors /quiz-mcq/[subject]):
 * server-fetched category meta for crawlers + BreadcrumbList JSON-LD, with
 * the existing hub view rendered on top and the category preselected.
 * Unknown slugs 404; backend blips degrade to the generic module metadata.
 * ============================================================================
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ogData } from '@/lib/og-data';
import { APP_URL, MODULE_META, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

import RiddlesHubView from '../RiddlesHubView';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ category: string }>;
}

async function fetchCategory(slug: string) {
  const categories = await ogData.riddleCategories();
  return categories?.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const decoded = decodeURIComponent(slug);
  const category = await fetchCategory(decoded);
  if (!category) return MODULE_META['riddle-mcq'];

  const countPart =
    typeof category.riddleTotal === 'number'
      ? ` — ${category.riddleTotal.toLocaleString('en-US')} Riddles`
      : '';
  const title = `${category.name} Riddles${countPart}`;
  const description = `Solve ${category.name} multiple-choice riddles by difficulty — timed challenges, streaks, and resume-anytime sessions.`;
  const url = `${APP_URL}/riddle-mcq/${encodeURIComponent(decoded)}`;
  const image = `/og/riddle-category/${encodeURIComponent(decoded)}.png`;
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

export default async function RiddleCategoryLanding({ params }: PageProps) {
  const { category: slug } = await params;
  const decoded = decodeURIComponent(slug);
  const category = await fetchCategory(decoded);
  // Unknown slug → module hub with a real redirect status (streaming-metadata
  // note on the quiz [subject] page; matches the /jokes/[id] convention).
  if (!category) redirect('/riddle-mcq');
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Riddle MCQ', path: '/riddle-mcq' },
          { name: category.name, path: `/riddle-mcq/${encodeURIComponent(decoded)}` },
        ])}
      />
      <RiddlesHubView initialCategory={decoded} />
    </>
  );
}
