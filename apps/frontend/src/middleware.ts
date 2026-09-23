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

import { chapterSlug } from '@/lib/slug';

/** Static subroutes that must never be treated as slugs. */
const KNOWN_SUBPATHS: Record<string, Set<string>> = {
  '/quiz-mcq': new Set(['play', 'results', 'practice-mode', 'timer-challenge', 'daily']),
  '/riddle-mcq': new Set(['play', 'practice', 'challenge', 'results']),
};

interface SlugCache {
  at: number;
  quiz: Set<string>;
  riddle: Set<string>;
}

/** Per-subject chapter-slug sets (NOW-03 two-segment validation). */
interface ChapterCacheEntry {
  at: number;
  slugs: Set<string>;
}

let slugCache: SlugCache | null = null;
const SLUG_TTL_MS = 60_000;
const chapterCache = new Map<string, ChapterCacheEntry>();

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

/**
 * Chapter slugs for ONE subject (NOW-03): the public subject payload carries
 * the chapter names; URL slugs derive via lib/slug.ts. Cached per subject
 * with the same 60s TTL, fail-open on any error (an empty set passes through
 * to the page-level fallback redirect).
 */
async function knownChapterSlugs(subjectSlug: string): Promise<Set<string>> {
  const key = subjectSlug.toLowerCase();
  const cached = chapterCache.get(key);
  if (cached && Date.now() - cached.at < SLUG_TTL_MS) return cached.slugs;
  try {
    const response = await fetch(`${API_BASE}/v1/quiz-mcq/subjects/${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!response.ok) return cached?.slugs ?? new Set();
    const payload: unknown = await response.json();
    const chapters = (payload as { chapters?: unknown })?.chapters;
    const slugs = new Set<string>();
    if (Array.isArray(chapters)) {
      for (const chapter of chapters) {
        const name = (chapter as { name?: unknown })?.name;
        if (typeof name === 'string' && name) slugs.add(chapterSlug(name));
      }
    }
    if (slugs.size > 0) chapterCache.set(key, { at: Date.now(), slugs });
    return slugs.size > 0 ? slugs : (cached?.slugs ?? new Set());
  } catch {
    return cached?.slugs ?? new Set(); // fail open
  }
}

/**
 * The eight 2D games are static HTML under public/games/<slug>/ — they BYPASS
 * the next.config headers() (which only decorates Next-rendered routes), so
 * they were served with no CSP at all. They are dependency-free and
 * local-first (AGENTS.md): same-origin assets only. The one cross-origin
 * allowance is the backend API origin, which pig-feedback.js posts game
 * feedback to (BUG-053).
 */
const API_ORIGIN = (() => {
  try {
    return new URL(process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api').origin;
  } catch {
    return 'http://localhost:3012';
  }
})();

const GAMES_CSP =
  // The two sha256 hashes are the games' inline theme-loader scripts (fixed
  // content per game — collected by probing all eight games).
  "default-src 'self'; script-src 'self' " +
  "'sha256-x8n9zHOItWYXzKEW7pxTk40Fp+ISErZbT3GSH2HCyuI=' " +
  "'sha256-1BmS27UYSimo8gSUTIkRpmW36+iWT0/uKfSVjj8R5EI='; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; media-src 'self'; " +
  `connect-src 'self' ${API_ORIGIN}; object-src 'none'; base-uri 'self'; ` +
  "form-action 'none'; frame-ancestors 'none'";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static games: decorate with CSP and pass through untouched.
  if (pathname.startsWith('/games/')) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', GAMES_CSP);
    return response;
  }

  const moduleBase = pathname.startsWith('/quiz-mcq') ? '/quiz-mcq' : '/riddle-mcq';
  const rest = pathname.slice(moduleBase.length).replace(/^\//, '').toLowerCase();

  // Exactly the hub, a static subroute, or deeper paths (asset/other) → pass.
  if (!rest || KNOWN_SUBPATHS[moduleBase]?.has(rest) || rest.includes('/')) {
    // Two-segment quiz paths (/quiz-mcq/<subject>/<chapter>) get the NOW-03
    // chapter validation below; riddle and deeper paths pass through.
    if (moduleBase === '/quiz-mcq' && rest.includes('/')) {
      const [subjectPart, chapterPart] = rest.split('/');
      if (!subjectPart || !chapterPart || KNOWN_SUBPATHS['/quiz-mcq']?.has(subjectPart)) {
        return NextResponse.next();
      }
      const subjects = await knownSlugs();
      if (subjects && subjects.quiz.size > 0 && !subjects.quiz.has(subjectPart)) {
        const url = request.nextUrl.clone();
        url.pathname = '/quiz-mcq';
        url.search = '';
        return NextResponse.redirect(url, 307); // unknown subject → hub
      }
      const chapters = await knownChapterSlugs(subjectPart);
      if (chapters.size > 0 && !chapters.has(decodeURIComponent(chapterPart))) {
        const url = request.nextUrl.clone();
        url.pathname = `/quiz-mcq/${subjectPart}`;
        url.search = '';
        return NextResponse.redirect(url, 307); // unknown chapter → subject landing
      }
    }
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
  matcher: ['/quiz-mcq/:path*', '/riddle-mcq/:path*', '/games/:path*'],
};
