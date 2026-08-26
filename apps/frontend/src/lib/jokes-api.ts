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
// Admin API — for the admin panel (JWT required)
// ============================================================================

export interface AdminJoke {
  id: string;
  joke: string;
  category: JokeCategory;
  categoryId: string;
  status: string;
  likes: number;
  dislikes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPaginated<T> {
  data: T[];
  total: number;
}

export interface CreateJokeAdminDto {
  joke: string;
  categoryId: string;
}

export interface UpdateJokeAdminDto {
  joke?: string;
  categoryId?: string;
}

export type JokeBulkAction = 'publish' | 'draft' | 'trash' | 'restore' | 'delete';

export interface BulkActionResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  message?: string;
}

/** Adapt a raw admin joke to the shape the JokesSection component expects. */
export function adaptJokeToAdmin(raw: AdminJoke): Joke {
  return {
    id: raw.id,
    joke: raw.joke,
    category: raw.category?.name ?? 'Uncategorized',
    categoryId: raw.categoryId,
    likes: raw.likes,
    dislikes: raw.dislikes,
    status: raw.status,
  };
}

export async function getAllJokesAdmin(
  params: { status?: string; search?: string } = {},
  page = 1,
  limit = 100
): Promise<AdminPaginated<AdminJoke>> {
  const qs = new URLSearchParams();
  if (params.status && params.status !== 'all') qs.append('status', params.status);
  if (params.search) qs.append('search', params.search);
  qs.append('page', String(page));
  qs.append('limit', String(limit));
  const response = await api.get<AdminPaginated<AdminJoke>>(`/jokes/classic?${qs.toString()}`, {
    isAdmin: true,
  });
  return response.data;
}

export async function createJokeAdmin(dto: CreateJokeAdminDto): Promise<AdminJoke> {
  const response = await api.post<AdminJoke>('/jokes/classic', dto, { isAdmin: true });
  return response.data;
}

export async function updateJokeAdmin(id: string, dto: UpdateJokeAdminDto): Promise<AdminJoke> {
  const response = await api.put<AdminJoke>(`/jokes/classic/${id}`, dto, { isAdmin: true });
  return response.data;
}

export async function deleteJokeAdmin(id: string): Promise<void> {
  await api.delete(`/jokes/classic/${id}`, { isAdmin: true });
}

export async function bulkActionJokes(
  ids: string[],
  action: JokeBulkAction
): Promise<BulkActionResult> {
  const response = await api.post<BulkActionResult>(
    '/jokes/classic/bulk-action',
    { ids, action },
    { isAdmin: true }
  );
  return response.data;
}

export async function bulkCreateJokesAdmin(
  dtos: CreateJokeAdminDto[]
): Promise<{ count: number; errors: string[] }> {
  const response = await api.post<{ count: number; errors: string[] }>(
    '/jokes/classic/bulk',
    dtos,
    { isAdmin: true }
  );
  return response.data;
}

export async function getJokeCategoriesAdmin(): Promise<JokeCategory[]> {
  const response = await api.get<JokeCategory[]>('/jokes/classic/categories', { isAdmin: true });
  return response.data;
}

export async function createJokeCategoryAdmin(dto: {
  name: string;
  emoji?: string;
}): Promise<JokeCategory> {
  const response = await api.post<JokeCategory>('/jokes/classic/categories', dto, {
    isAdmin: true,
  });
  return response.data;
}

export async function updateJokeCategoryAdmin(
  id: string,
  dto: { name?: string; emoji?: string }
): Promise<JokeCategory> {
  const response = await api.put<JokeCategory>(`/jokes/classic/categories/${id}`, dto, {
    isAdmin: true,
  });
  return response.data;
}

export async function deleteJokeCategoryAdmin(id: string): Promise<void> {
  await api.delete(`/jokes/classic/categories/${id}`, { isAdmin: true });
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
