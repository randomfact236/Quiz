/**
 * ============================================================================
 * /quiz-mcq/[subject] — per-subject SEO landing (plan/15 P2)
 * ============================================================================
 * Real path segment per quiz subject so per-subject titles, canonicals and
 * sitemap entries become possible (query-param URLs could not carry them).
 * The page server-fetches the subject meta for crawlers (title/description/
 * BreadcrumbList in the initial HTML) and renders the existing hub view with
 * the subject preselected; the interactive chapter picker hydrates on top.
 * Unknown slugs 404; backend blips degrade to the generic module metadata.
 * ============================================================================
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { formatCount, ogData } from '@/lib/og-data';
import { APP_URL, MODULE_META, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

import QuizHubView from '../QuizHubView';

// ISR: subject meta/counts refetch at most hourly.
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ subject: string }>;
}

/** Subject meta + live published-question count (both null-tolerant). */
async function fetchSubject(slug: string) {
  const [meta, counts] = await Promise.all([ogData.quizSubjectMeta(slug), ogData.quizCounts()]);
  if (!meta) return null;
  const count = counts?.bySubject[slug];
  return { ...meta, count: typeof count === 'number' ? count : null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: slug } = await params;
  const decoded = decodeURIComponent(slug);
  const data = await fetchSubject(decoded);
  // Unknown slug: metadata falls back to the module entry (the page body
  // redirects below) — mirrors the /jokes/[id] fallback convention.
  if (!data) return MODULE_META['quiz-mcq'];

  const countPart = data.count !== null ? ` — ${formatCount(data.count)} Questions` : '';
  const title = `${data.name} Quiz${countPart}`;
  const description = `Play ${data.name} multiple-choice quizzes by chapter and difficulty — five levels, timed challenges, practice mode and instant scoring.`;
  const url = `${APP_URL}/quiz-mcq/${encodeURIComponent(decoded)}`;
  const image = `/og/quiz-subject/${encodeURIComponent(decoded)}${
    data.count !== null ? `-${data.count}` : ''
  }.png`;
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

export default async function QuizSubjectLanding({ params }: PageProps) {
  const { subject: slug } = await params;
  const decoded = decodeURIComponent(slug);
  const data = await fetchSubject(decoded);
  // Unknown slug → the module hub with a real redirect status. (Next 15.5's
  // streaming metadata makes notFound() statuses unreliable for data-fetched
  // pages — a 200 shell can flush before the abort resolves — so the app's
  // convention is fallback/redirect, matching /jokes/[id].)
  if (!data) redirect('/quiz-mcq');
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Quiz MCQ', path: '/quiz-mcq' },
          { name: data.name, path: `/quiz-mcq/${encodeURIComponent(decoded)}` },
        ])}
      />
      <QuizHubView initialSubject={decoded} />
    </>
  );
}
