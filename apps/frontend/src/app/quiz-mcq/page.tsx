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
      const url = `${APP_URL}/quiz-mcq?subject=${encodeURIComponent(subject)}`;
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

export default function QuizMcqPage() {
  return <QuizHubView />;
}
