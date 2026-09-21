/**
 * Clean, extension-suffixed share-image path (BUG-063).
 *
 * Facebook rendered the app icon instead of the 1200x630 card for every image
 * served from `/api/og?type=...&id=...&v=N`, even with correct bytes, headers
 * and og:image:* metadata. The home card at `/opengraph-image` (a plain path,
 * no query string) always worked. So expose the same generator on a plain path:
 *
 *   /og/quiz-question/<id>.png
 *   /og/riddle-question/<id>.png
 *   /og/quiz-subject/<slug>[-<count>].png
 *   /og/riddle-category/<slug>.png
 *   /og/quiz-result/<subject>/<score>-<total>.png
 *   /og/joke.png
 *
 * It delegates to the existing /api/og handler, so rendering stays in one place.
 */
import { GET as renderOg } from '../../api/og/route';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> {
  const { slug } = await params;
  const [type = 'joke', ...rest] = slug;
  const strip = (value: string): string => value.replace(/\.png$/i, '');
  const query = new URLSearchParams({ type });
  const last = strip(rest[rest.length - 1] ?? '');

  if (type === 'quiz-question' || type === 'riddle-question') {
    query.set('id', last);
  } else if (type === 'quiz-subject') {
    // optional "-<count>" suffix lets the URL change when content does
    const m = /^(.*)-(\d+)$/.exec(last);
    query.set('subject', m ? m[1]! : last);
  } else if (type === 'riddle-category') {
    query.set('category', last);
  } else if (type === 'quiz-result') {
    const [score = '0', total = '0'] = last.split('-');
    query.set('subject', strip(rest[0] ?? ''));
    query.set('score', score);
    query.set('total', total);
  }

  return renderOg(new Request(new URL(`/api/og?${query.toString()}`, request.url)));
}
