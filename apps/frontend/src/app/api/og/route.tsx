/**
 * ============================================================================
 * /api/og — parameterized share-image generator (share-design-system WP1)
 * ============================================================================
 * One route renders every products-family share image at 1200×630:
 *   type=joke                                 → amber joke template
 *   type=quiz-subject    &subject=<slug>      → subject emoji + live count
 *   type=quiz-question   &id=<uuid>           → real question + options 2×2
 *   type=quiz-result     &subject&score&total → score badge
 *   type=riddle-category &category=<slug>     → teal 🧩 category card
 *   type=riddle-question &id=<uuid>           → real riddle + options
 * Every displayed value is fetched server-side from the backend — URL params
 * only select what to render (and let platforms refetch when they change).
 * The answer never renders. Failures degrade to the generic family image so
 * a backend blip can never produce a broken og:image.
 * ============================================================================
 */

import { ImageResponse } from 'next/og';

import {
  JokeShareImage,
  OG_1200x630,
  QuestionShareImage,
  ResultShareImage,
  SubjectShareImage,
} from '@/components/og/share-templates';
import { formatCount, ogData } from '@/lib/og-data';

/**
 * Facebook's crawler rejects a chunked PNG that has no Content-Length as a
 * "corrupted image" - which silently killed every share preview even though the
 * bytes were a valid PNG. Buffer the render and answer with an explicit length.
 */
async function asFixedPng(image: ImageResponse): Promise<Response> {
  const buffer = await image.arrayBuffer();
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, no-transform',
    },
  });
}
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'joke';

  try {
    switch (type) {
      case 'quiz-subject': {
        const slug = searchParams.get('subject') ?? '';
        const [meta, counts] = await Promise.all([
          ogData.quizSubjectMeta(slug),
          ogData.quizCounts(),
        ]);
        const count = counts?.bySubject[slug];
        const emoji = meta?.emoji ?? '🌍';
        const name = meta?.name ?? 'Quiz';
        return asFixedPng(
          new ImageResponse(
            SubjectShareImage({
              family: 'quiz',
              emoji,
              title:
                count !== undefined
                  ? `${name} Quiz — ${formatCount(count)} Questions`
                  : `${name} Quiz`,
              hook: 'play now → pigzap.com',
            }),
            OG_1200x630
          )
        );
      }

      case 'quiz-question': {
        const share = await ogData.quizQuestionShare(searchParams.get('id') ?? '');
        if (!share) break;
        return asFixedPng(
          new ImageResponse(
            QuestionShareImage({
              family: 'quiz',
              chip: `${share.subjectEmoji} ${share.subjectName}`.trim() || 'Quiz',
              question: share.question,
              options: share.options,
              hook: 'can you answer this? → pigzap.com',
            }),
            OG_1200x630
          )
        );
      }

      case 'quiz-result': {
        const slug = searchParams.get('subject') ?? '';
        const meta = await ogData.quizSubjectMeta(slug);
        const score = Math.max(0, parseInt(searchParams.get('score') ?? '0', 10) || 0);
        const total = Math.max(1, parseInt(searchParams.get('total') ?? '10', 10) || 10);
        return asFixedPng(
          new ImageResponse(
            ResultShareImage({
              family: 'quiz',
              score: Math.min(score, total),
              total,
              emoji: meta?.emoji ?? '🧠',
              name: `${meta?.name ?? 'Quiz'} Quiz`,
              hook: 'beat you! → pigzap.com',
            }),
            OG_1200x630
          )
        );
      }

      case 'riddle-category': {
        const slug = searchParams.get('category') ?? '';
        const categories = await ogData.riddleCategories();
        const category = categories?.find((c) => c.slug === slug);
        return asFixedPng(
          new ImageResponse(
            SubjectShareImage({
              family: 'riddle',
              emoji: category?.emoji ?? '🧩',
              title: `Riddles · ${category?.name ?? 'Brain Teasers'} — brain teasers`,
              hook: 'solve now → pigzap.com',
            }),
            OG_1200x630
          )
        );
      }

      case 'riddle-result': {
        const label = searchParams.get('label') ?? 'Mixed';
        const score = Math.max(0, parseInt(searchParams.get('score') ?? '0', 10) || 0);
        const total = Math.max(1, parseInt(searchParams.get('total') ?? '10', 10) || 10);
        return asFixedPng(
          new ImageResponse(
            ResultShareImage({
              family: 'riddle',
              score: Math.min(score, total),
              total,
              emoji: '🧩',
              name: `${label.slice(0, 28)} Riddles`,
              hook: 'beat me -> pigzap.com',
            }),
            OG_1200x630
          )
        );
      }

      case 'riddle-question': {
        const share = await ogData.riddleQuestionShare(searchParams.get('id') ?? '');
        if (!share) break;
        // Chip uses the riddle TOKEN emoji (🧩 per design tokens), not the
        // subject's emoji — brand-consistent across every riddle share.
        return asFixedPng(
          new ImageResponse(
            QuestionShareImage({
              family: 'riddle',
              chip: '🧩 Riddles',
              question: share.question,
              options: share.options,
              hook: 'solve it → pigzap.com',
            }),
            OG_1200x630
          )
        );
      }

      case 'joke':
      default:
        break;
    }
  } catch {
    // fall through to the generic joke/family image below
  }

  // SHARE-01: /og/joke/<id>.png renders the joke setup; the plain /og/joke.png
  // (and any failure) keeps the generic family card.
  const jokeId = searchParams.get('id') ?? '';
  const jokeShare = jokeId ? await ogData.jokeShare(jokeId) : null;
  return asFixedPng(new ImageResponse(<JokeShareImage setup={jokeShare?.setup} />, OG_1200x630));
}
