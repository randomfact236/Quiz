/**
 * ============================================================================
 * og-data.ts — server-side data fetches for the share-image generator
 * ============================================================================
 * Every display value rendered into a share image is fetched HERE from the
 * backend — URL params only select what to render and bust platform caches
 * (share-design-system rule: "numbers are live"). All fetches tolerate
 * failure with null so a backend blip degrades to the generic family image
 * instead of a broken og:image.
 * ============================================================================
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { API_BASE_URL } from './api-client';

/**
 * The brand pig icon as a base64 PNG data URL for satori (which cannot render
 * the site's SVG logo). Converted once from public/brand/pigzap-icon.svg into
 * public/brand/og-pig-icon.png; the data URL is cached module-side so the
 * 33KB base64 string is read at most once per server process.
 */
let pigIconDataUrlCache: string | null | undefined;

export function pigIconDataUrl(): string | null {
  if (pigIconDataUrlCache !== undefined) return pigIconDataUrlCache;
  try {
    const png = readFileSync(path.join(process.cwd(), 'public', 'brand', 'og-pig-icon.png'));
    pigIconDataUrlCache = `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    pigIconDataUrlCache = null; // caller falls back to the 🐷 emoji mark
  }
  return pigIconDataUrlCache;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 900 } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The quiz share endpoint sends `options` as an array, but the riddle one
 * serialises it as a JSON string. Normalise both to string[] - the share
 * template iterates the list, and a string crashed the OG render (the proxy
 * surfaced that as a 502, so shared riddle links had no preview image).
 */
function normalizeOptions(value: unknown): string[] {
  const onlyStrings = (arr: unknown[]): string[] =>
    arr.filter((v): v is string => typeof v === 'string');
  if (Array.isArray(value)) return onlyStrings(value);
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? onlyStrings(parsed) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export interface OgQuestionShare {
  id: string;
  question: string;
  options: string[];
  subjectSlug: string;
  subjectName: string;
  subjectEmoji: string;
}

export const ogData = {
  /** { name, emoji, slug } for a quiz subject slug. */
  quizSubjectMeta: (slug: string) =>
    fetchJson<{ name: string; emoji: string; slug: string }>(
      `/quiz-mcq/subjects/${encodeURIComponent(slug)}/meta`
    ),

  /** Published published-question counts per subject slug. */
  quizCounts: () => fetchJson<{ bySubject: Record<string, number> }>('/quiz-mcq/question-counts'),

  /** { id, question, options, subjectName, subjectEmoji } — never the answer. */
  quizQuestionShare: async (id: string): Promise<OgQuestionShare | null> => {
    if (!UUID_RE.test(id)) return null;
    const raw = await fetchJson<OgQuestionShare & { options: unknown }>(
      `/quiz-mcq/questions/${id}/share`
    );
    return raw ? { ...raw, options: normalizeOptions(raw.options) } : null;
  },

  /** { id, question, options, subjectName, subjectEmoji } — never the answer. */
  riddleQuestionShare: async (id: string): Promise<OgQuestionShare | null> => {
    if (!UUID_RE.test(id)) return null;
    const raw = await fetchJson<OgQuestionShare & { options: unknown }>(
      `/riddle-mcq/questions/${id}/share`
    );
    return raw ? { ...raw, options: normalizeOptions(raw.options) } : null;
  },

  /** Riddle categories (public hub payload) — { id, name, slug, emoji, isActive }. */
  riddleCategories: () =>
    fetchJson<Array<{ id: string; name: string; slug: string; emoji: string; isActive: boolean }>>(
      '/riddle-mcq/categories'
    ),

  /** Total published riddles (public stats overview). */
  riddleTotal: async (): Promise<number | null> => {
    const stats = await fetchJson<{ totalRiddleMcqs: number }>('/riddle-mcq/stats/overview');
    return stats ? Number(stats.totalRiddleMcqs) || 0 : null;
  },

  /** Total published dad jokes (pagination total of the public classic list). */
  jokesTotal: async (): Promise<number | null> => {
    const page = await fetchJson<{ total: number }>('/jokes/classic?limit=1');
    return page ? Number(page.total) || 0 : null;
  },

  /** Total published image riddles (public stats overview). */
  imageRiddlesTotal: async (): Promise<number | null> => {
    const stats = await fetchJson<{ totalRiddles: number }>('/image-riddles/stats/overview');
    return stats ? Number(stats.totalRiddles) || 0 : null;
  },
};

/** Static count — games are dependency-free static assets, not DB rows. */
export const GAMES_COUNT = 8;

export function formatCount(n: number | null): string {
  return n === null ? '—' : n.toLocaleString('en-US');
}

/** Assembled home stats line (WP0) — LIVE totals + the static games count.
 *  Shared by opengraph-image and twitter-image so the two variants can never
 *  drift apart. */
export async function homeStats(): Promise<Array<{ value: string; label: string }>> {
  const [quizCounts, riddleTotal, jokesTotal, imageRiddlesTotal] = await Promise.all([
    ogData.quizCounts(),
    ogData.riddleTotal(),
    ogData.jokesTotal(),
    ogData.imageRiddlesTotal(),
  ]);
  const quizTotal = quizCounts
    ? Object.values(quizCounts.bySubject).reduce((sum, n) => sum + (Number(n) || 0), 0)
    : null;
  return [
    { value: formatCount(quizTotal), label: 'questions' },
    { value: formatCount(riddleTotal), label: 'riddles' },
    { value: formatCount(jokesTotal), label: 'jokes' },
    { value: formatCount(imageRiddlesTotal), label: 'image puzzles' },
    { value: String(GAMES_COUNT), label: 'games' },
  ];
}
