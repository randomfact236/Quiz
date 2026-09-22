/**
 * ============================================================================
 * middleware.ts — per-content slug validation (plan/15 P2, NOW-03)
 * ============================================================================
 * /quiz-mcq/<slug> and /riddle-mcq/<slug> are ISR landing pages, but a
 * request for an UNKNOWN slug can't set a real redirect/404 status from the
 * page itself: with Next 15 streaming metadata the 200 shell flushes before
 * the page's data fetch resolves, so notFound()/redirect() degrade to
 * streamed payloads (soft-404 / client-side redirect).
 *
 * This middleware closes that with a real 307 for unknown slugs. The known
 * slug lists are cached in-memory for 60s; every failure path is fail-open
 * (backend down / uncached → pass through) so the middleware can never take
 * the landing pages down. The page-level fallback redirect remains as the
 * second layer.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

/** Static subroutes that must never be treated as slugs. */
const KNOWN_SUBPATHS: Record<string, Set<string>> = {
  '/quiz-mcq': new Set(['play', 'results', 'practice-mode', 'timer-challenge']),
  '/riddle-mcq': new Set(['play', 'practice', 'challenge', 'results']),
};

interface SlugCache {
  at: number;
  quiz: Set<string>;
  riddle: Set<string>;
}

let slugCache: SlugCache | null = null;
const SLUG_TTL_MS = 60_000;

const API_BASE = (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api')
  .replace(/\/v1\/?$/, '')
  .replace(/\/$/, '');

async function fetchSlugs(path: string): Promise<Set<string>> {
  try {
    const response = await fetch(`${API_BASE}/v1${path}`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!response.ok) return new Set();
    const payload: unknown = await response.json();
    const list: unknown = Array.isArray(payload)
      ? payload
      : (payload as { data?: unknown[] })?.data;
    const slugs = new Set<string>();
    if (Array.isArray(list)) {
      for (const entry of list) {
        const slug = (entry as { slug?: unknown })?.slug;
        if (typeof slug === 'string' && slug) slugs.add(slug.toLowerCase());
      }
    }
    return slugs;
  } catch {
    return new Set();
  }
}

async function knownSlugs(): Promise<SlugCache | null> {
  if (slugCache && Date.now() - slugCache.at < SLUG_TTL_MS) return slugCache;
  const [quiz, riddle] = await Promise.all([
    fetchSlugs('/quiz-mcq/subjects'),
    fetchSlugs('/riddle-mcq/categories'),
  ]);
  // Fail-open: an empty BOTH-list means the backend answered but badly (or
  // is down) — keep the stale cache if any, otherwise let requests through.
  if (quiz.size === 0 && riddle.size === 0) return slugCache;
  slugCache = { at: Date.now(), quiz, riddle };
  return slugCache;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const moduleBase = pathname.startsWith('/quiz-mcq') ? '/quiz-mcq' : '/riddle-mcq';
  const rest = pathname.slice(moduleBase.length).replace(/^\//, '').toLowerCase();

  // Exactly the hub, a static subroute, or deeper paths (asset/other) → pass.
  if (!rest || KNOWN_SUBPATHS[moduleBase]?.has(rest) || rest.includes('/')) {
    return NextResponse.next();
  }

  const cache = await knownSlugs();
  if (!cache) return NextResponse.next(); // backend unavailable — fail open

  const known = moduleBase === '/quiz-mcq' ? cache.quiz : cache.riddle;
  if (known.size > 0 && !known.has(decodeURIComponent(rest))) {
    const url = request.nextUrl.clone();
    url.pathname = moduleBase;
    url.search = '';
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/quiz-mcq/:path*', '/riddle-mcq/:path*'],
};
