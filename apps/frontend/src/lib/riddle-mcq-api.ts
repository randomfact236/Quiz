/**
 * ============================================================================
 * Riddles API Service
 * ============================================================================
 * Backend API integration for riddle MCQ (Quiz format)
 * ============================================================================
 * Structure: Category → Subject → MCQ (NO Chapter)
 * ============================================================================
 */

import { api, apiRequest } from './api-client';
import type { RiddleMcq, RiddleSubject } from '@/types/riddles';

export type { RiddleSubject } from '@/types/riddles';

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
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  emoji?: string;
  isActive?: boolean;
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
}

export interface UpdateSubjectDto {
  name?: string;
  slug?: string;
  emoji?: string;
  categoryId?: string | null;
  isActive?: boolean;
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
  subjectId: string; // REQUIRED - no chapterId
  hint?: string;
  explanation?: string;
  answer?: string;
  status?: 'published' | 'draft' | 'trash';
}

export interface UpdateRiddleMcqDto {
  question?: string;
  options?: string[];
  correctLetter?: string;
  correctAnswer?: string;
  level?: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId?: string;
  hint?: string;
  explanation?: string;
  answer?: string;
  status?: 'published' | 'draft' | 'trash';
}

// ============================================================================
// Filter Types
// ============================================================================

export interface GetRiddlesParams {
  subject?: string;
  level?: string;
  status?: string;
  search?: string;
}

export interface GetFilterCountsParams {
  category?: string;
  subject?: string;
  level?: string;
}

export interface FilterCounts {
  categoryCounts: { id: string; name: string; emoji: string; count: number }[];
  subjectCounts: {
    id: string;
    name: string;
    emoji: string;
    categoryId: string | null;
    count: number;
  }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}

// ============================================================================
// Stats Types
// ============================================================================

export interface RiddlesStats {
  totalRiddleMcqs: number;
  totalSubjects: number;
  mcqsByLevel: Record<string, number>;
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
  const response = await api.get<RiddleCategory[]>('/riddle-mcq/categories/all', { isAdmin: true });
  return response.data;
}

/**
 * Create a new category (Admin only)
 */
export async function createCategory(dto: CreateCategoryDto): Promise<RiddleCategory> {
  const response = await api.post<RiddleCategory>('/riddle-mcq/categories', dto, { isAdmin: true });
  return response.data;
}

/**
 * Update a category (Admin only)
 */
export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<RiddleCategory> {
  const response = await api.patch<RiddleCategory>(`/riddle-mcq/categories/${id}`, dto, {
    isAdmin: true,
  });
  return response.data;
}

/**
 * Delete a category (Admin only)
 */
export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/categories/${id}`, { isAdmin: true });
}

// ============================================================================
// Subjects API
// ============================================================================

/**
 * Get all active riddle subjects
 */
export async function getSubjects(hasContent: boolean = false): Promise<RiddleSubject[]> {
  const response = await api.get<RiddleSubject[]>(
    `/riddle-mcq/subjects${hasContent ? '?hasContent=true' : ''}`
  );
  return response.data;
}

/**
 * Get subject by slug
 */
export async function getSubjectBySlug(slug: string): Promise<RiddleSubject> {
  const response = await api.get<RiddleSubject>(`/riddle-mcq/subjects/${slug}`);
  return response.data;
}

/**
 * Get all subjects including inactive (Admin only)
 */
export async function getAllSubjectsAdmin(): Promise<RiddleSubject[]> {
  const response = await api.get<RiddleSubject[]>('/riddle-mcq/subjects/all', { isAdmin: true });
  return response.data;
}

/**
 * Create a new subject (Admin only)
 */
export async function createSubject(dto: CreateSubjectDto): Promise<RiddleSubject> {
  const response = await api.post<RiddleSubject>('/riddle-mcq/subjects', dto, { isAdmin: true });
  return response.data;
}

/**
 * Update a subject (Admin only)
 */
export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<RiddleSubject> {
  const response = await api.patch<RiddleSubject>(`/riddle-mcq/subjects/${id}`, dto, {
    isAdmin: true,
  });
  return response.data;
}

/**
 * Delete a subject (Admin only)
 */
export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/subjects/${id}`, { isAdmin: true });
}

// ============================================================================
// Riddle MCQ API
// ============================================================================

/**
 * Get riddle MCQs by subject ID (Public)
 */
export async function getRiddlesBySubject(
  subjectId: string,
  page: number = 1,
  limit: number = 50,
  level?: string
): Promise<{ data: RiddleMcq[]; total: number }> {
  let url = `/riddle-mcq/subjects/${subjectId}/riddles?page=${page}&limit=${limit}`;
  if (level && level !== 'all') {
    url += `&level=${level}`;
  }
  const response = await apiRequest<{ data: RiddleMcq[]; total: number }>(url);
  return response.data;
}

/**
 * Get random riddle MCQs by difficulty (Public)
 */
export async function getRandomRiddles(level: string, count: number = 10): Promise<RiddleMcq[]> {
  const response = await api.get<RiddleMcq[]>(`/riddle-mcq/random/${level}?count=${count}`);
  return response.data;
}

/**
 * Get mixed riddle MCQs from all subjects (Public)
 */
export async function getMixedRiddles(count: number = 50): Promise<RiddleMcq[]> {
  const response = await api.get<RiddleMcq[]>(`/riddle-mcq/mixed?count=${count}`);
  return response.data;
}

/**
 * Get all riddle MCQs for Admin panel with filters (Admin)
 */
export async function getAllRiddles(
  params: GetRiddlesParams = {},
  page: number = 1,
  limit: number = 50
): Promise<{ data: RiddleMcq[]; total: number }> {
  const queryParams = new URLSearchParams();

  if (params.subject && params.subject !== 'all') {
    queryParams.append('subject', params.subject);
  }
  if (params.level && params.level !== 'all') {
    queryParams.append('level', params.level);
  }
  if (params.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  queryParams.append('page', String(page));
  queryParams.append('limit', String(limit));

  const url = `/riddle-mcq/all?${queryParams.toString()}`;
  const response = await api.get<{ data: RiddleMcq[]; total: number }>(url, { isAdmin: true });
  return response.data;
}

/**
 * Execute bulk action on riddle MCQs (Admin only)
 */
export async function bulkActionRiddles(
  ids: string[],
  action: 'delete' | 'trash' | 'publish' | 'draft'
): Promise<{
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  message: string;
}> {
  const response = await api.post(
    '/riddle-mcq/riddles/bulk-action',
    { ids, action },
    { isAdmin: true }
  );
  return response.data as {
    success: boolean;
    processed: number;
    succeeded: number;
    failed: number;
    message: string;
  };
}

/**
 * Create a new riddle MCQ (Admin only)
 */
export async function createRiddle(dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
  const response = await api.post<RiddleMcq>('/riddle-mcq/riddles', dto, { isAdmin: true });
  return response.data;
}

/**
 * Bulk create riddle MCQs (Admin only)
 */
export async function bulkCreateRiddles(
  dtos: CreateRiddleMcqDto[]
): Promise<{ count: number; errors: string[] }> {
  const response = await api.post<{ count: number; errors: string[] }>(
    '/riddle-mcq/riddles/bulk',
    dtos,
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Update a riddle MCQ (Admin only)
 */
export async function updateRiddle(
  id: string,
  dto: Partial<CreateRiddleMcqDto>
): Promise<RiddleMcq> {
  const response = await api.patch<RiddleMcq>(`/riddle-mcq/riddles/${id}`, dto, { isAdmin: true });
  return response.data;
}

/**
 * Delete a riddle MCQ (Admin only)
 */
export async function deleteRiddle(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/riddles/${id}`, { isAdmin: true });
}

// ============================================================================
// Filter Counts API
// ============================================================================

/**
 * Get unified filter counts (Public)
 */
export async function getRiddleFilterCounts(
  params: GetFilterCountsParams = {}
): Promise<FilterCounts> {
  const queryParams = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    queryParams.append('category', params.category);
  }
  if (params.subject && params.subject !== 'all') {
    queryParams.append('subject', params.subject);
  }
  if (params.level && params.level !== 'all') {
    queryParams.append('level', params.level);
  }

  const url = `/riddle-mcq/filter-counts?${queryParams.toString()}`;
  const response = await api.get(url);
  return response.data as FilterCounts;
}

// ============================================================================
// Stats API
// ============================================================================

/**
 * Get riddle MCQ statistics
 */
export async function getStats(): Promise<RiddlesStats> {
  const response = await api.get<RiddlesStats>('/riddle-mcq/stats/overview');
  return response.data;
}
