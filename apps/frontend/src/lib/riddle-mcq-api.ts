/**
 * ============================================================================
 * Riddles API Service
 * ============================================================================
 * Backend API integration for riddle MCQ (Quiz format)
 * ============================================================================
 */

import { api, apiRequest } from './api-client';
import type { RiddleMcq, RiddleChapter, RiddleSubject } from '@/types/riddles';

// ============================================================================
// Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

// ============================================================================
// Category Types
// ============================================================================

export interface RiddleCategory {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  emoji?: string;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  emoji?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================================================
// Chapter Types
// ============================================================================

export interface CreateChapterDto {
  name: string;
  chapterNumber: number;
  subjectId: string;
}

export interface UpdateChapterDto {
  name?: string;
  chapterNumber?: number;
}

// ============================================================================
// Subject Types
// ============================================================================

export interface CreateSubjectDto {
  name: string;
  slug?: string;
  emoji?: string;
  categoryId?: string | null;
  isActive?: boolean;
  order?: number;
}

export interface UpdateSubjectDto {
  name?: string;
  slug?: string;
  emoji?: string;
  categoryId?: string | null;
  isActive?: boolean;
  order?: number;
}

// ============================================================================
// Riddle MCQ Types
// ============================================================================

export interface CreateRiddleMcqDto {
  question: string;
  options?: string[];
  correctLetter?: string;
  correctAnswer?: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId?: string;
  chapterId?: string;
  hint?: string;
  explanation?: string;
  status?: 'published' | 'draft' | 'trash';
}

// ============================================================================
// Categories API
// ============================================================================

/**
 * Get all riddle categories
 */
export async function getCategories(): Promise<RiddleCategory[]> {
  const response = await api.get<RiddleCategory[]>('/riddle-mcq/categories');
  return response.data;
}

/**
 * Get all categories including inactive (Admin only)
 */
export async function getCategoriesAdmin(): Promise<RiddleCategory[]> {
  const response = await api.get<RiddleCategory[]>('/riddle-mcq/categories/all');
  return response.data;
}

/**
 * Create a new category (Admin only)
 */
export async function createCategory(dto: CreateCategoryDto): Promise<RiddleCategory> {
  const response = await api.post<RiddleCategory>('/riddle-mcq/categories', dto);
  return response.data;
}

/**
 * Update a category (Admin only)
 */
export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<RiddleCategory> {
  const response = await api.patch<RiddleCategory>(`/riddle-mcq/categories/${id}`, dto);
  return response.data;
}

/**
 * Delete a category (Admin only)
 */
export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/categories/${id}`);
}

// ============================================================================
// Subjects API
// ============================================================================

/**
 * Get all active riddle subjects
 */
export async function getSubjects(hasContent: boolean = false): Promise<RiddleSubject[]> {
  const response = await api.get<RiddleSubject[]>(`/riddle-mcq/subjects${hasContent ? '?hasContent=true' : ''}`);
  return response.data;
}

/**
 * Get subject by slug with chapters
 */
export async function getSubjectBySlug(slug: string): Promise<RiddleSubject> {
  const response = await api.get<RiddleSubject>(`/riddle-mcq/subjects/${slug}`);
  return response.data;
}

/**
 * Get all subjects including inactive (Admin only)
 */
export async function getAllSubjectsAdmin(): Promise<RiddleSubject[]> {
  const response = await api.get<RiddleSubject[]>('/riddle-mcq/subjects/all');
  return response.data;
}

/**
 * Create a new subject (Admin only)
 */
export async function createSubject(dto: CreateSubjectDto): Promise<RiddleSubject> {
  const response = await api.post<RiddleSubject>('/riddle-mcq/subjects', dto);
  return response.data;
}

/**
 * Update a subject (Admin only)
 */
export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<RiddleSubject> {
  const response = await api.patch<RiddleSubject>(`/riddle-mcq/subjects/${id}`, dto);
  return response.data;
}

/**
 * Delete a subject (Admin only)
 */
export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/subjects/${id}`);
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
    `/riddle-mcq/chapters/${subjectId}${hasContent ? '?hasContent=true' : ''}`
  );
  return response.data;
}

/**
 * Get all active chapters across all subjects
 */
export async function getAllChapters(hasContent: boolean = false): Promise<RiddleChapter[]> {
  if (hasContent) {
    const response = await api.get<RiddleChapter[]>('/riddle-mcq/chapters/active/all');
    return response.data;
  }

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
  const response = await api.post<RiddleChapter>('/riddle-mcq/chapters', dto);
  return response.data;
}

/**
 * Update a chapter (Admin only)
 */
export async function updateChapter(id: string, dto: UpdateChapterDto): Promise<RiddleChapter> {
  const response = await api.patch<RiddleChapter>(`/riddle-mcq/chapters/${id}`, dto);
  return response.data;
}

/**
 * Delete a chapter (Admin only)
 */
export async function deleteChapter(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/chapters/${id}`);
}

// ============================================================================
// Riddle MCQ API
// ============================================================================

/**
 * Get riddle MCQs by subject ID
 */
export async function getRiddlesBySubject(
  subjectId: string,
  page: number = 1,
  limit: number = 50,
  level?: string
): Promise<{ data: RiddleMcq[]; total: number }> {
  let url = `/riddle-mcq/subjects/${subjectId}/mcqs?page=${page}&limit=${limit}`;
  if (level && level !== 'all') {
    url += `&level=${level}`;
  }
  const response = await apiRequest<{ data: RiddleMcq[]; total: number }>(url);
  return response.data;
}

/**
 * Get riddle MCQs by chapter ID
 */
export async function getRiddlesByChapter(
  chapterId: string,
  page: number = 1,
  limit: number = 50,
  level?: string
): Promise<PaginatedResponse<RiddleMcq>> {
  let url = `/riddle-mcq/mcqs/${chapterId}?page=${page}&limit=${limit}`;
  if (level && level !== 'all') {
    url += `&level=${level}`;
  }
  const response = await apiRequest<RiddleMcq[]>(url);
  return response.data as unknown as PaginatedResponse<RiddleMcq>;
}

/**
 * Get random riddle MCQs by difficulty
 */
export async function getRandomRiddles(
  level: string,
  count: number = 10
): Promise<RiddleMcq[]> {
  const response = await api.get<RiddleMcq[]>(`/riddle-mcq/random/${level}?count=${count}`);
  return response.data;
}

/**
 * Get mixed riddle MCQs from all chapters
 */
export async function getMixedRiddles(count: number = 50): Promise<RiddleMcq[]> {
  const response = await api.get<RiddleMcq[]>(`/riddle-mcq/mixed?count=${count}`);
  return response.data;
}

/**
 * Get all riddle MCQs for Admin panel
 */
export async function getAllRiddleMcqsAdmin(): Promise<RiddleMcq[]> {
  const response = await api.get<RiddleMcq[]>('/riddle-mcq/all');
  return response.data;
}

/**
 * Execute bulk action on riddle MCQs (Admin only)
 */
export async function bulkActionRiddles(
  ids: string[],
  action: 'delete' | 'trash' | 'publish' | 'draft'
): Promise<{ success: boolean; processed: number; succeeded: number; failed: number; message: string }> {
  const response = await api.post('/riddle-mcq/mcqs/bulk-action', { ids, action });
  return response.data as { success: boolean; processed: number; succeeded: number; failed: number; message: string };
}

/**
 * Create a new riddle MCQ (Admin only)
 */
export async function createRiddle(dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
  const response = await api.post<RiddleMcq>('/riddle-mcq/mcqs', dto);
  return response.data;
}

/**
 * Bulk create riddle MCQs (Admin only)
 */
export async function bulkCreateRiddles(
  dtos: CreateRiddleMcqDto[]
): Promise<{ count: number; errors: string[] }> {
  const response = await api.post<{ count: number; errors: string[] }>('/riddle-mcq/mcqs/bulk', dtos);
  return response.data;
}

/**
 * Update a riddle MCQ (Admin only)
 */
export async function updateRiddle(id: string, dto: Partial<CreateRiddleMcqDto>): Promise<RiddleMcq> {
  const response = await api.patch<RiddleMcq>(`/riddle-mcq/mcqs/${id}`, dto);
  return response.data;
}

/**
 * Delete a riddle MCQ (Admin only)
 */
export async function deleteRiddle(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/mcqs/${id}`);
}

// ============================================================================
// Stats API
// ============================================================================

export interface RiddlesStats {
  totalRiddleMcqs: number;
  totalSubjects: number;
  totalChapters: number;
  mcqsByLevel: Record<string, number>;
}

/**
 * Get riddle MCQ statistics
 */
export async function getStats(): Promise<RiddlesStats> {
  const response = await api.get<RiddlesStats>('/riddle-mcq/stats/overview');
  return response.data;
}

/**
 * Get unified filter counts
 */
export async function getFilterCounts(): Promise<{
  subjectCounts: { id: string; name: string; count: number }[];
  chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
  levelCounts: { level: string; count: number }[];
  total: number;
}> {
  const response = await api.get('/riddle-mcq/filter-counts');
  return response.data as { subjectCounts: { id: string; name: string; count: number }[]; chapterCounts: { id: string; name: string; count: number; subjectId: string }[]; levelCounts: { level: string; count: number }[]; total: number };
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
  const chapters = await getAllChapters(true);

  return chapters.map(ch => ({
    id: ch.id,
    title: ch.name,
    icon: ch.subject?.emoji || '📚',
    count: ch.riddles?.length || 0,
  }));
}
