/**
 * ============================================================================
 * Jokes API Service
 * ============================================================================
 * Backend API integration for dad jokes.
 *
 * The public page expects `setup` + ` punchline` strings and a flat
 * `category: string` name.  The backend returns a single `joke` text field
 * plus a nested `category` object.  The helper `adaptJoke()` bridges the gap.
 * ============================================================================
 */

import { api } from './api-client';

// ============================================================================
// Types — match the backend response shape
// ============================================================================

export interface JokeCategory {
  id: string;
  name: string;
  emoji: string;
}

/** Raw shape returned by GET /jokes/classic. */
export interface RawJoke {
  id: string;
  joke: string;
  category: JokeCategory;
  categoryId: string;
  likes?: number;
  dislikes?: number;
  status?: string;
}

/** Shape the public page uses — flat strings. */
export interface AdaptedJoke {
  id: string;
  setup: string;
  punchline: string;
  category: string;
  categoryId: string;
  likes: number;
  dislikes: number;
  status: string;
}

/**
 * Legacy shape still used by admin JokesSection (localStorage-based).
 * Has the raw `joke` text field plus flat `category` name.
 */
export interface Joke {
  id: string;
  joke?: string;
  setup?: string;
  punchline?: string;
  category: string;
  categoryId?: string;
  likes?: number;
  dislikes?: number;
  status?: string;
  type?: string;
  delivery?: string;
}

// ============================================================================
// Mapper — single joker string → setup/punchline split
// ============================================================================

/** Split a single `joke` string into setup + punchline. */
function splitJoke(fullJoke: string): { setup: string; punchline: string } {
  if (fullJoke.includes('?')) {
    const parts = fullJoke.split('?');
    return { setup: (parts[0] ?? '') + '?', punchline: parts.slice(1).join('?').trim() };
  }
  if (fullJoke.includes('Because')) {
    const parts = fullJoke.split('Because');
    return {
      setup: (parts[0] ?? '').trim(),
      punchline: 'Because ' + parts.slice(1).join('Because').trim(),
    };
  }
  return { setup: fullJoke, punchline: '' };
}

/** Adapt a raw backend joke into the flat-shape the public page expects. */
export function adaptJoke(raw: RawJoke): AdaptedJoke {
  const { setup, punchline } = splitJoke(raw.joke);
  return {
    id: raw.id,
    setup,
    punchline,
    category: raw.category?.name ?? 'Uncategorized',
    categoryId: raw.categoryId,
    likes: raw.likes ?? 0,
    dislikes: raw.dislikes ?? 0,
    status: raw.status ?? 'published',
  };
}

// ============================================================================
// Public API — called by the public page
// ============================================================================

export async function getJokes(page = 1, limit = 200): Promise<AdaptedJoke[]> {
  const response = await api.get<{ data: RawJoke[]; total: number }>(
    `/jokes/classic?page=${page}&limit=${limit}`
  );
  return (response.data.data ?? []).map(adaptJoke);
}

export async function getJokeCategories(hasContent = false): Promise<JokeCategory[]> {
  const response = await api.get<JokeCategory[]>(
    `/jokes/classic/categories${hasContent ? '?hasContent=true' : ''}`
  );
  return response.data;
}

export async function voteJoke(id: string, type: 'like' | 'dislike'): Promise<unknown> {
  const response = await api.post(`/jokes/classic/${id}/vote`, { voteType: type });
  return response.data;
}

// ============================================================================
// Quiz-format API — for the upcoming /jokes/quiz/[slug] page
// ============================================================================

export interface JokeSubject {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  description?: string;
  chapters?: JokeChapter[];
}

export interface JokeChapter {
  id: string;
  name: string;
  chapterNumber: number;
  subjectId: string;
}

export interface QuizJoke {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  level: string;
  chapterId: string;
  explanation?: string;
  punchline?: string;
}

export async function getJokeSubjects(): Promise<JokeSubject[]> {
  const response = await api.get<JokeSubject[]>('/jokes/subjects');
  return response.data;
}

export async function getJokeSubjectBySlug(slug: string): Promise<JokeSubject> {
  const response = await api.get<JokeSubject>(`/jokes/subjects/${slug}`);
  return response.data;
}

export async function getChaptersBySubject(subjectId: string): Promise<JokeChapter[]> {
  const response = await api.get<JokeChapter[]>(`/jokes/chapters/${subjectId}`);
  return response.data;
}

export async function getQuizJokesByChapter(
  chapterId: string,
  page = 1,
  limit = 50
): Promise<{ data: QuizJoke[]; total: number }> {
  const response = await api.get<{ data: QuizJoke[]; total: number }>(
    `/jokes/quiz/${chapterId}?page=${page}&limit=${limit}`
  );
  return response.data;
}

export async function getRandomQuizJokes(level: string, count = 20): Promise<QuizJoke[]> {
  const response = await api.get<QuizJoke[]>(`/jokes/random/${level}?count=${count}`);
  return response.data;
}

export async function getMixedQuizJokes(count = 50): Promise<QuizJoke[]> {
  const response = await api.get<QuizJoke[]>(`/jokes/mixed?count=${count}`);
  return response.data;
}
