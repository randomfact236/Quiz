/**
 * ============================================================================
 * /quiz-mcq/[subject]/[chapter] — per-chapter SEO landing (NOW-03)
 * ============================================================================
 * The TriviaPlaza long-tail play: one indexable page per chapter (79 exist,
 * all with descriptive names). Chapter URL slugs derive from the chapter
 * name (lib/slug.ts — chapters carry no slug column; names are unique per
 * subject, so the derived slugs are too).
 *
 * The page server-fetches the subject meta, the chapter's live published
 * count and a few REAL sample questions (public reads — the answer key is
 * stripped server-side, H1) so crawlers see substantive HTML; CTAs deep-link
 * into the standard play flow by chapter name (the play page's contract).
 * Unknown chapter slugs get a real 307 from the middleware; this page's
 * fallback redirect covers middleware fail-open (backend blips).
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { formatCount, ogData } from '@/lib/og-data';
import { APP_URL, MODULE_META, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { chapterSlug } from '@/lib/slug';

// ISR: chapter meta/counts refetch at most hourly.
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ subject: string; chapter: string }>;
}

interface SampleQuestion {
  id: string;
  question: string;
  options: string[] | null;
  level: string;
}

/** Chapter meta + live count + sample questions (all null-tolerant). */
async function fetchChapter(subjectSlug: string, chapterParam: string) {
  const [meta, subject, counts] = await Promise.all([
    ogData.quizSubjectMeta(subjectSlug),
    ogData.quizSubjectChapters(subjectSlug),
    ogData.quizCounts(),
  ]);
  if (!meta || !subject?.chapters?.length) return null;
  const chapter = subject.chapters.find((c) => chapterSlug(c.name) === chapterParam);
  if (!chapter) return null;
  const count = counts?.byChapter?.[chapter.id]?.count ?? null;
  // Samples pin to the easy level: the default listing order serves the
  // open-ended extreme tier first (options: null by design), and the samples
  // section needs MCQs. The filter below stays as a safety net.
  const raw = await ogData.quizChapterSamples(subjectSlug, chapter.name, 8);
  const samples = (raw?.data ?? [])
    .filter(
      (q): q is SampleQuestion =>
        typeof q?.question === 'string' &&
        q.question.trim() !== '' &&
        Array.isArray(q.options) &&
        q.options.length > 0
    )
    .slice(0, 4);
  const siblings = subject.chapters
    .filter((c) => c.id !== chapter.id)
    .map((c) => ({ name: c.name, slug: chapterSlug(c.name) }));
  return { meta, chapter, count, samples, siblings };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: subjectSlug, chapter: chapterParam } = await params;
  const subject = decodeURIComponent(subjectSlug);
  const chapter = decodeURIComponent(chapterParam);
  const data = await fetchChapter(subject, chapter);
  // Unknown slug: metadata falls back to the module entry (the page body
  // redirects below) — mirrors the [subject] fallback convention.
  if (!data) return MODULE_META['quiz-mcq'];

  const { meta, chapter: chapterData, count } = data;
  const countPart = count !== null ? ` — ${formatCount(count)} Questions` : '';
  const title = `${chapterData.name} Quiz — ${meta.name}${countPart}`;
  const description = `Play the ${chapterData.name} quiz — ${count !== null ? `${formatCount(count)} multiple-choice questions` : 'multiple-choice questions'} in ${meta.name}. Five difficulty levels, timed challenges, practice mode and instant scoring.`;
  const url = `${APP_URL}/quiz-mcq/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}`;
  // Chapters reuse the subject's OG card (no per-chapter generator — the
  // /og/quiz-subject route renders the same branded card, count optional).
  const image = `/og/quiz-subject/${encodeURIComponent(subject)}.png`;
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

export default async function QuizChapterLanding({ params }: PageProps) {
  const { subject: subjectSlug, chapter: chapterParam } = await params;
  const subject = decodeURIComponent(subjectSlug);
  const chapter = decodeURIComponent(chapterParam);
  const data = await fetchChapter(subject, chapter);
  // Unknown chapter → the subject landing; unknown subject → the module hub.
  // (Middleware sends the real 307 first; this is the fail-open fallback,
  // matching the [subject] page convention.)
  if (!data) redirect(`/quiz-mcq/${encodeURIComponent(subject)}`);
  const { meta, chapter: chapterData, count, samples, siblings } = data;

  const chapterPath = `/quiz-mcq/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}`;
  const playHref = `/quiz-mcq/play?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(
    chapterData.name
  )}&level=easy&mode=normal`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Quiz MCQ', path: '/quiz-mcq' },
          { name: meta.name, path: `/quiz-mcq/${encodeURIComponent(subject)}` },
          { name: chapterData.name, path: chapterPath },
        ])}
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm sm:p-8 dark:border-secondary-700 dark:from-secondary-800 dark:via-secondary-800 dark:to-secondary-900">
          <p className="text-sm font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
            <Link href={`/quiz-mcq/${encodeURIComponent(subject)}`} className="hover:underline">
              {meta.emoji} {meta.name}
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary-900 sm:text-4xl dark:text-white">
            {chapterData.name} Quiz
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-secondary-300">
            {count !== null
              ? `${formatCount(count)} multiple-choice questions across five difficulty levels — from a quick easy warm-up to the expert tier.`
              : `Multiple-choice questions across five difficulty levels — from a quick easy warm-up to the expert tier.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={playHref}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              Play {chapterData.name} now
            </Link>
            <Link
              href={`/quiz-mcq/${encodeURIComponent(subject)}`}
              className="rounded-xl border border-indigo-200 bg-white px-6 py-3 text-sm font-black uppercase tracking-widest text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-secondary-600 dark:bg-secondary-800 dark:text-indigo-300 dark:hover:bg-secondary-700"
            >
              All levels &amp; chapters
            </Link>
          </div>
        </section>

        {/* Sample questions — real content, server-rendered; answers are never
            included (public reads strip the key). */}
        {samples.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-black tracking-tight text-secondary-900 dark:text-white">
              Sample questions from {chapterData.name}
            </h2>
            <ol className="mt-4 space-y-4">
              {samples.map((sample, index) => (
                <li
                  key={sample.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-secondary-700 dark:bg-secondary-800"
                >
                  <p className="font-semibold text-secondary-900 dark:text-secondary-100">
                    {index + 1}. {sample.question}
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(sample.options ?? []).map((option) => (
                      <li
                        key={option}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-secondary-700/60 dark:text-secondary-200"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                    {sample.level} level
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Sibling chapters — the crawlable long-tail graph (NOW-03). */}
        {siblings.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-black tracking-tight text-secondary-900 dark:text-white">
              More {meta.name} chapters
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.slug}
                  href={`/quiz-mcq/${encodeURIComponent(subject)}/${encodeURIComponent(sibling.slug)}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-secondary-800 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
                >
                  {sibling.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* The module hub remains the deepest back-link. */}
        <p className="mt-10 text-sm text-slate-500 dark:text-secondary-400">
          Or browse everything on the{' '}
          <Link
            href="/quiz-mcq"
            className="font-bold text-indigo-600 hover:underline dark:text-indigo-300"
          >
            Quiz hub
          </Link>
          .
        </p>
      </main>
    </>
  );
}
