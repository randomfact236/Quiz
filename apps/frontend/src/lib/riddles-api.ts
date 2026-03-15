/**
 * ============================================================================
 * Riddles API Service
 * ============================================================================
 * Backend API integration for riddles, chapters, and subjects
 * Replaces localStorage-based storage with proper backend API calls
 * ============================================================================
 */

import { api, apiRequest } from './api-client';
import type { Riddle, RiddleChapter, RiddleSubject, QuizRiddle } from '@/types/riddles';

// ============================================================================
// Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface CreateChapterDto {
  name: string;
  chapterNumber: number;
  subjectId: string;
}

export interface UpdateChapterDto {
  name?: string;
  chapterNumber?: number;
  subjectId?: string;
}

export interface CreateSubjectDto {
  name: string;
  slug?: string;
  emoji?: string;
  categoryId?: string;
}

export interface UpdateSubjectDto {
  name?: string;
  slug?: string;
  emoji?: string;
  categoryId?: string;
}

export interface CreateRiddleDto {
  question: string;
  options: string[];
  correctLetter: string;
  correctAnswer: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId?: string;
  chapterId?: string;
  hint?: string;
  explanation?: string;
  status?: 'published' | 'draft' | 'trash';
}

export interface ReorderChaptersDto {
  chapterOrders: { id: string; chapterNumber: number }[];
}

// ============================================================================
// Subjects API
// ============================================================================

/**
 * Get all riddle subjects (Quiz format)
 */
export async function getSubjects(hasContent: boolean = false): Promise<RiddleSubject[]> {
  const response = await api.get<RiddleSubject[]>(`/riddles/subjects${hasContent ? '?hasContent=true' : ''}`);
  return response.data;
}

/**
 * Get subject by slug with chapters
 */
export async function getSubjectBySlug(slug: string): Promise<RiddleSubject> {
  const response = await api.get<RiddleSubject>(`/riddles/subjects/${slug}`);
  return response.data;
}

/**
 * Create a new subject (Admin only)
 */
export async function createSubject(dto: CreateSubjectDto): Promise<RiddleSubject> {
  const response = await api.post<RiddleSubject>('/riddles/subjects', dto);
  return response.data;
}

/**
 * Create a new classic category (Admin only)
 */
export async function createCategory(dto: { name: string; emoji?: string }): Promise<any> {
  const response = await api.post('/riddles/classic/categories', dto);
  return response.data;
}

/**
 * Get all classic categories (Admin/Public)
 */
export async function getCategories(): Promise<any[]> {
  const response = await api.get<any[]>('/riddles/classic/categories');
  return response.data;
}

/**
 * Update a subject (Admin only)
 */
export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<RiddleSubject> {
  const response = await api.put<RiddleSubject>(`/riddles/subjects/${id}`, dto);
  return response.data;
}

/**
 * Delete a subject (Admin only)
 */
export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/riddles/subjects/${id}`);
}

// ============================================================================
// Chapters API
// ============================================================================

/**
 * Get chapters by subject ID
 */
export async function getChaptersBySubject(
  subjectId: string,
  hasContent: boolean = false
): Promise<RiddleChapter[]> {
  const response = await api.get<RiddleChapter[]>(
    `/riddles/chapters/${subjectId}${hasContent ? '?hasContent=true' : ''}`
  );
  return response.data;
}

/**
 * Get all chapters across all subjects
 */
export async function getAllChapters(hasContent: boolean = false): Promise<RiddleChapter[]> {
  if (hasContent) {
    const response = await api.get<RiddleChapter[]>('/riddles/chapters/active/all');
    return response.data;
  }

  // Get all subjects first, then fetch chapters for each
  const subjects = await getSubjects();
  const allChapters: RiddleChapter[] = [];

  for (const subject of subjects) {
    if (subject.id) {
      const chapters = await getChaptersBySubject(subject.id);
      allChapters.push(...chapters.map(ch => ({ ...ch, subject })));
    }
  }

  return allChapters;
}

/**
 * Create a new chapter (Admin only)
 */
export async function createChapter(dto: CreateChapterDto): Promise<RiddleChapter> {
  const response = await api.post<RiddleChapter>('/riddles/chapters', dto);
  return response.data;
}

/**
 * Update a chapter (Admin only)
 */
export async function updateChapter(id: string, dto: UpdateChapterDto): Promise<RiddleChapter> {
  const response = await api.put<RiddleChapter>(`/riddles/chapters/${id}`, dto);
  return response.data;
}

/**
 * Delete a chapter (Admin only)
 */
export async function deleteChapter(id: string): Promise<void> {
  await api.delete(`/riddles/chapters/${id}`);
}

/**
 * Reorder chapters (Admin only)
 */
export async function reorderChapters(dto: ReorderChaptersDto): Promise<void> {
  await api.patch('/riddles/chapters/reorder', dto);
}

// ============================================================================
// Riddles API (Quiz Format)
// ============================================================================

/**
 * Get quiz riddles by subject ID (Riddle MCQ)
 */
export async function getRiddlesBySubject(
  subjectId: string,
  page: number = 1,
  limit: number = 50,
  level?: string
): Promise<PaginatedResponse<QuizRiddle>> {
  let url = `/riddles/quiz-by-subject/${subjectId}?page=${page}&limit=${limit}`;
  if (level && level !== 'all') {
    url += `&level=${level}`;
  }
  const response = await apiRequest<QuizRiddle[]>(url);
  return response.data as unknown as PaginatedResponse<QuizRiddle>;
}

/**
 * Get quiz riddles by chapter ID
 */
export async function getRiddlesByChapter(
  chapterId: string,
  page: number = 1,
  limit: number = 50,
  level?: string
): Promise<PaginatedResponse<QuizRiddle>> {
  let url = `/riddles/quiz/${chapterId}?page=${page}&limit=${limit}`;
  if (level && level !== 'all') {
    url += `&level=${level}`;
  }
  const response = await apiRequest<QuizRiddle[]>(url);
  // Backend returns { data, total } format
  return response.data as unknown as PaginatedResponse<QuizRiddle>;
}

/**
 * Get random quiz riddles by difficulty
 */
export async function getRandomRiddles(
  level: string,
  count: number = 10
): Promise<QuizRiddle[]> {
  const response = await api.get<QuizRiddle[]>(`/riddles/random/${level}?count=${count}`);
  return response.data;
}

/**
 * Get mixed quiz riddles from all chapters
 */
export async function getMixedRiddles(count: number = 50): Promise<QuizRiddle[]> {
  const response = await api.get<QuizRiddle[]>(`/riddles/mixed?count=${count}`);
  return response.data;
}

/**
 * Get all quiz riddles for Admin panel
 */
export async function getAllQuizRiddlesAdmin(): Promise<QuizRiddle[]> {
  const response = await api.get<QuizRiddle[]>('/riddles/quiz/all');
  return response.data;
}

/**
 * Execute bulk action on quiz riddles
 */
export async function bulkActionRiddles(
  ids: string[],
  action: 'publish' | 'draft' | 'trash' | 'delete'
): Promise<{ success: boolean; processed: number; succeeded: number; failed: number; message: string }> {
  const response = await api.post('/riddles/quiz/bulk-action', { ids, action });
  return response.data as { success: boolean; processed: number; succeeded: number; failed: number; message: string };
}

/**
 * Create a new quiz riddle (Admin only)
 */
export async function createRiddle(dto: CreateRiddleDto): Promise<Riddle> {
  const response = await api.post<Riddle>('/riddles/quiz', dto);
  return response.data;
}

/**
 * Bulk create quiz riddles (Admin only)
 */
export async function bulkCreateRiddles(
  dtos: CreateRiddleDto[]
): Promise<{ count: number; errors: string[] }> {
  const response = await api.post<{ count: number; errors: string[] }>('/riddles/quiz/bulk', dtos);
  return response.data;
}

/**
 * Update a quiz riddle (Admin only)
 */
export async function updateRiddle(id: string, dto: Partial<CreateRiddleDto>): Promise<Riddle> {
  const response = await api.put<Riddle>(`/riddles/quiz/${id}`, dto);
  return response.data;
}

/**
 * Delete a quiz riddle (Admin only)
 */
export async function deleteRiddle(id: string): Promise<void> {
  await api.delete(`/riddles/quiz/${id}`);
}

// ============================================================================
// Classic Riddles API (Alternative format)
// ============================================================================

/**
 * Get all classic riddles
 */
export async function getClassicRiddles(
  page: number = 1,
  limit: number = 50,
  status?: string
): Promise<PaginatedResponse<Riddle>> {
  const statusParam = status ? `&status=${status}` : '';
  const response = await apiRequest<Riddle[]>(
    `/riddles/classic?page=${page}&limit=${limit}${statusParam}`
  );
  return response.data as unknown as PaginatedResponse<Riddle>;
}

/**
 * Get classic riddles by difficulty
 */
export async function getClassicRiddlesByDifficulty(
  level: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<Riddle>> {
  const response = await apiRequest<Riddle[]>(
    `/riddles/classic/difficulty/${level}?page=${page}&limit=${limit}`
  );
  return response.data as unknown as PaginatedResponse<Riddle>;
}

// ============================================================================
// Stats API
// ============================================================================

export interface RiddlesStats {
  totalClassicRiddles: number;
  totalCategories: number;
  totalQuizRiddles: number;
  totalSubjects: number;
  totalChapters: number;
  riddlesByDifficulty: Record<string, number>;
}

/**
 * Get riddles statistics
 */
export async function getStats(): Promise<RiddlesStats> {
  const response = await api.get<RiddlesStats>('/riddles/stats/overview');
  return response.data;
}

// ============================================================================
// Adapter Functions (for frontend compatibility)
// ============================================================================

/**
 * Convert backend chapter format to frontend chapter format
 */
export function adaptChapterToFrontend(
  chapter: RiddleChapter & { subject?: RiddleSubject }
): { title: string; icon: string; id: string; riddleCount: number } {
  return {
    id: chapter.id,
    title: chapter.name,
    icon: chapter.subject?.emoji || '📚',
    riddleCount: chapter.riddles?.length || 0,
  };
}

/**
 * Get chapters with riddle counts
 */
export async function getChaptersWithCounts(): Promise<
  Array<{ id: string; title: string; icon: string; count: number }>
> {
  const chapters = await getAllChapters();

  return chapters.map(ch => ({
    id: ch.id,
    title: ch.name,
    icon: ch.subject?.emoji || '📚',
    count: ch.riddles?.length || 0,
  }));
}
