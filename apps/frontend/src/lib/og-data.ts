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

import { API_BASE_URL } from './api-client';

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
  quizQuestionShare: (id: string) =>
    UUID_RE.test(id)
      ? fetchJson<OgQuestionShare>(`/quiz-mcq/questions/${id}/share`)
      : Promise.resolve(null),

  /** { id, question, options, subjectName, subjectEmoji } — never the answer. */
  riddleQuestionShare: (id: string) =>
    UUID_RE.test(id)
      ? fetchJson<OgQuestionShare>(`/riddle-mcq/questions/${id}/share`)
      : Promise.resolve(null),

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
