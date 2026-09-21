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
 *   /og/image-riddle/<id>.png        (SHARE-01 #8)
 *   /og/game/<slug>.png              (SHARE-01 #10, per-game accents)
 *   /og/games.png · /og/play.png     (hub cards)
 *
 * It delegates to the existing /api/og handler, so rendering stays in one place.
 */
import { GET as renderOg } from '../../api/og/route';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> {
  const { slug } = await params;
  const strip = (value: string): string => value.replace(/\.png$/i, '');
  const type = strip(slug[0] ?? 'joke');
  const rest = slug.slice(1);
  const query = new URLSearchParams({ type });
  const last = strip(rest[rest.length - 1] ?? '');

  if (type === 'quiz-question' || type === 'riddle-question' || type === 'image-riddle') {
    query.set('id', last);
  } else if (type === 'game') {
    query.set('slug', last);
  } else if (type === 'joke') {
    // /og/joke.png            -> generic section card
    // /og/joke/<id>.png       -> that joke's setup
    // /og/joke/<id>/vN.png    -> same, with a version segment for cache-busting
    const jokeId = strip(rest[0] ?? '');
    if (jokeId) query.set('id', jokeId);
  } else if (type === 'quiz-subject') {
    // optional "-<count>" suffix lets the URL change when content does
    const m = /^(.*)-(\d+)$/.exec(last);
    query.set('subject', m ? m[1]! : last);
  } else if (type === 'riddle-category') {
    query.set('category', last);
  } else if (type === 'riddle-result') {
    // /og/riddle-result/<label>/<score>-<total>.png
    const [score = '0', total = '0'] = last.split('-');
    query.set('label', strip(rest[0] ?? ''));
    query.set('score', score);
    query.set('total', total);
  } else if (type === 'quiz-result') {
    const [score = '0', total = '0'] = last.split('-');
    query.set('subject', strip(rest[0] ?? ''));
    query.set('score', score);
    query.set('total', total);
  }

  return renderOg(new Request(new URL(`/api/og?${query.toString()}`, request.url)));
}
