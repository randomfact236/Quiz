/**
 * ============================================================================
 * Quiz hub page — server wrapper (share-design-system WP1)
 * ============================================================================
 * The hub view itself is a client component (searchParams-driven pickers);
 * this server page exists so generateMetadata can read the URL params and
 * point og:image at the matching share design:
 *   ?subject=<slug>              → subject share image (live question count)
 *   ?subject=<slug>&q=<uuid>     → question share image (question + options)
 *   ?subject=<slug>&score=S&total=T → result score-badge image
 * ============================================================================ */

import type { Metadata } from 'next';
import Link from 'next/link';

import { formatCount, ogData } from '@/lib/og-data';
import { APP_URL, MODULE_META } from '@/lib/seo';

import QuizHubView from './QuizHubView';

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
  const subject = first(params['subject']);
  const questionId = first(params['q']);
  const score = parseInt(first(params['score']), 10);
  const total = parseInt(first(params['total']), 10);

  // Question share (★ design §3 #3): the platform card shows the real
  // question + its options; the answer never leaves the site.
  if (questionId) {
    const share = await ogData.quizQuestionShare(questionId);
    if (share) {
      const title = `Can you answer this? 🧠 ${share.subjectName} Quiz`;
      const image = `/og/quiz-question/${questionId}.png`;
      // Self-canonical + og:url: scrapers obey rel=canonical, so pointing it at
      // /quiz-mcq made Facebook preview the hub instead of this question card.
      const url = `${APP_URL}/quiz-mcq?subject=${encodeURIComponent(subject)}&q=${questionId}`;
      // Spec A3 #3: the description IS the question text (FB/LinkedIn display it).
      const description = share.question.slice(0, 110);
      return {
        ...MODULE_META['quiz-mcq'],
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

  // Result share (§3 #4): score badge; the session itself is never shared.
  if (!Number.isNaN(score) && !Number.isNaN(total) && subject) {
    const meta = await ogData.quizSubjectMeta(subject);
    const name = meta?.name ?? 'Quiz';
    const title = `I scored ${score}/${total} on ${name} — beat you! 🧠`;
    const image = `/og/quiz-result/${encodeURIComponent(subject)}/${score}-${total}.png`;
    const url = `${APP_URL}/quiz-mcq?subject=${encodeURIComponent(subject)}&score=${score}&total=${total}`;
    return {
      ...MODULE_META['quiz-mcq'],
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

  // Subject share (§3 #2): live published-question count baked into the URL
  // so platforms refetch the image after content pushes.
  if (subject) {
    const [meta, counts] = await Promise.all([
      ogData.quizSubjectMeta(subject),
      ogData.quizCounts(),
    ]);
    if (meta) {
      const count = counts?.bySubject[subject];
      const countPart = count !== undefined ? ` — ${formatCount(count)} Questions` : '';
      const title = `${meta.name} Quiz${countPart}`;
      const image = `/og/quiz-subject/${encodeURIComponent(subject)}${
        count !== undefined ? `-${count}` : ''
      }.png`;
      // plan/15 P2: canonical points at the real per-subject segment now — the
      // query-param view and /quiz-mcq/<subject> are the same content, and the
      // segment page is what the sitemap lists (keeps one consolidated URL).
      const url = `${APP_URL}/quiz-mcq/${encodeURIComponent(subject)}`;
      return {
        ...MODULE_META['quiz-mcq'],
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

  return MODULE_META['quiz-mcq'];
}

// NOW-03 (RSC residual): the subject grid renders SERVER-SIDE so crawlers see
// the full quiz catalog as crawlable links — the interactive hub hydrates
// below it and stays untouched for players.
export default async function QuizMcqPage() {
  const [subjects, counts] = await Promise.all([ogData.quizSubjectsList(), ogData.quizCounts()]);
  const catalog = (subjects ?? [])
    .map((subject) => ({
      name: subject.name,
      emoji: subject.emoji,
      slug: subject.slug,
      count: counts?.bySubject[subject.slug] ?? null,
    }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  return (
    <>
      <QuizHubView />
      {catalog.length > 0 && (
        <section
          aria-label="All quiz subjects"
          className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6"
        >
          <h2 className="text-xl font-black tracking-tight text-secondary-900 dark:text-white">
            Browse all quiz subjects
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((subject) => (
              <Link
                key={subject.slug}
                href={`/quiz-mcq/${encodeURIComponent(subject.slug)}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-secondary-800 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
              >
                <span>
                  {subject.emoji} {subject.name}
                </span>
                {subject.count !== null && (
                  <span className="shrink-0 text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                    {formatCount(subject.count)} Q
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
