/**
 * ============================================================================
 * Image Riddles API Service
 * ============================================================================
 * Backend API integration for image riddles.
 *
 * Public reads hit `/image-riddles/*` (PUBLISHED-only since the draft-leak
 * fix); admin CRUD hits `/admin/image-riddles/*` with the admin JWT.
 * ============================================================================
 */

import { api, apiRequest } from './api-client';

// ============================================================================
// Types
// ============================================================================

export type ImageRiddleDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type ImageRiddleStatus = 'published' | 'draft' | 'trash';

export interface ImageRiddleCategory {
  id: string;
  name: string;
  emoji: string;
  description?: string | null;
}

/** Category as embedded on a riddle (public list includes the relation). */
export interface EmbeddedImageRiddleCategory {
  id?: string;
  name: string;
  emoji: string;
}

export interface ImageRiddleActionOption {
  id: string;
  label: string;
  type: 'button' | 'link' | 'toggle' | 'dropdown' | 'custom';
  [key: string]: unknown;
}

export interface ImageRiddle {
  id: string;
  title: string;
  imageUrl: string;
  answer: string;
  /** Alternative accepted answers (synonyms) checked in addition to `answer` */
  alternativeAnswers?: string[] | null;
  hint: string | null;
  difficulty: ImageRiddleDifficulty;
  status: ImageRiddleStatus;
  timerSeconds: number | null;
  showTimer: boolean;
  altText: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: EmbeddedImageRiddleCategory | null;
  actionOptions?: ImageRiddleActionOption[] | null;
  useDefaultActions?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
}

export interface AdminPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get published image riddles (paginated).
 */
export async function getImageRiddles(
  page: number = 1,
  limit: number = 100
): Promise<Paginated<ImageRiddle>> {
  return apiRequest<Paginated<ImageRiddle>>(`/image-riddles?page=${page}&limit=${limit}`).then(
    (r) => r.data
  );
}

/**
 * Search published riddles by title/answer text.
 */
export async function searchImageRiddles(params: {
  search?: string | undefined;
  categoryId?: string | undefined;
  difficulty?: string | undefined;
  page?: number;
  limit?: number;
}): Promise<Paginated<ImageRiddle>> {
  const qs = new URLSearchParams();
  if (params.search) qs.append('search', params.search);
  if (params.categoryId) qs.append('categoryId', params.categoryId);
  if (params.difficulty && params.difficulty !== 'all') qs.append('difficulty', params.difficulty);
  qs.append('page', String(params.page ?? 1));
  qs.append('limit', String(params.limit ?? 100));
  return apiRequest<Paginated<ImageRiddle>>(`/image-riddles/search?${qs.toString()}`).then(
    (r) => r.data
  );
}

/**
 * Get all image riddle categories.
 */
export async function getImageRiddleCategories(): Promise<ImageRiddleCategory[]> {
  const response = await api.get<ImageRiddleCategory[]>('/image-riddles/categories');
  return response.data;
}

/**
 * Get a random published image riddle.
 */
export async function getRandomImageRiddle(): Promise<ImageRiddle> {
  const response = await api.get<ImageRiddle>('/image-riddles/random');
  return response.data;
}

/**
 * Get published riddles in a category.
 */
export async function getImageRiddlesByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 100
): Promise<Paginated<ImageRiddle>> {
  return apiRequest<Paginated<ImageRiddle>>(
    `/image-riddles/category/${categoryId}?page=${page}&limit=${limit}`
  ).then((r) => r.data);
}

/**
 * Get published riddles by difficulty.
 */
export async function getImageRiddlesByDifficulty(
  level: ImageRiddleDifficulty,
  page: number = 1,
  limit: number = 100
): Promise<Paginated<ImageRiddle>> {
  return apiRequest<Paginated<ImageRiddle>>(
    `/image-riddles/difficulty/${level}?page=${page}&limit=${limit}`
  ).then((r) => r.data);
}

export interface ImageRiddlesStats {
  totalRiddles: number;
  totalCategories: number;
  riddlesByDifficulty: Record<string, number>;
  averageTimer: number;
}

/**
 * Get image riddles statistics (public).
 */
export async function getImageRiddlesStats(): Promise<ImageRiddlesStats> {
  const response = await api.get<ImageRiddlesStats>('/image-riddles/stats/overview');
  return response.data;
}

// ============================================================================
// Admin API (/admin/image-riddles/*)
// ============================================================================

export interface CreateImageRiddleDto {
  title: string;
  imageUrl: string;
  answer: string;
  alternativeAnswers?: string[] | null;
  hint?: string | undefined;
  difficulty: ImageRiddleDifficulty;
  timerSeconds?: number | null;
  showTimer?: boolean;
  altText?: string | undefined;
  categoryId?: string | null;
  actionOptions?: Partial<ImageRiddleActionOption>[];
  useDefaultActions?: boolean;
}

export interface UpdateImageRiddleDto extends Partial<CreateImageRiddleDto> {
  isActive?: boolean;
}

export interface GetAllImageRiddlesParams {
  difficulty?: string;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Get all riddles (any status) for the admin panel.
 */
export async function getAllImageRiddlesAdmin(
  params: GetAllImageRiddlesParams = {},
  page: number = 1,
  limit: number = 20
): Promise<AdminPaginated<ImageRiddle>> {
  const qs = new URLSearchParams();
  if (params.difficulty && params.difficulty !== 'all') qs.append('difficulty', params.difficulty);
  if (params.categoryId) qs.append('categoryId', params.categoryId);
  if (params.isActive !== undefined) qs.append('isActive', String(params.isActive));
  if (params.search) qs.append('search', params.search);
  qs.append('page', String(page));
  qs.append('limit', String(limit));

  const response = await api.get<AdminPaginated<ImageRiddle>>(
    `/admin/image-riddles?${qs.toString()}`,
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Get a single riddle by ID (Admin).
 */
export async function getImageRiddleAdmin(id: string): Promise<ImageRiddle> {
  const response = await api.get<ImageRiddle>(`/admin/image-riddles/${id}`, {
    isAdmin: true,
  });
  return response.data;
}

/**
 * Create a riddle (Admin). New riddles start as DRAFT.
 */
export async function createImageRiddle(dto: CreateImageRiddleDto): Promise<ImageRiddle> {
  const response = await api.post<ImageRiddle>('/admin/image-riddles', dto, {
    isAdmin: true,
  });
  return response.data;
}

/**
 * Bulk create riddles (Admin).
 */
export async function bulkCreateImageRiddles(
  dtos: CreateImageRiddleDto[]
): Promise<{ created: number; failed: number; errors: string[] }> {
  const response = await api.post<{ created: number; failed: number; errors: string[] }>(
    '/admin/image-riddles/bulk',
    dtos,
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Update a riddle (Admin).
 */
export async function updateImageRiddle(
  id: string,
  dto: UpdateImageRiddleDto
): Promise<ImageRiddle> {
  const response = await api.put<ImageRiddle>(`/admin/image-riddles/${id}`, dto, {
    isAdmin: true,
  });
  return response.data;
}

/**
 * Soft delete a riddle (sets isActive=false) (Admin).
 */
export async function deleteImageRiddle(id: string): Promise<void> {
  await api.delete(`/admin/image-riddles/${id}`, { isAdmin: true });
}

/**
 * Toggle a riddle's active flag (Admin).
 */
export async function toggleImageRiddleActive(id: string): Promise<{ isActive: boolean }> {
  const response = await api.post<{ isActive: boolean }>(
    `/admin/image-riddles/${id}/toggle-active`,
    {},
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Get all categories with riddle counts, inactive included (Admin).
 */
export async function getImageRiddleCategoriesAdmin(): Promise<
  (ImageRiddleCategory & { riddles?: ImageRiddle[] })[]
> {
  const response = await api.get<(ImageRiddleCategory & { riddles?: ImageRiddle[] })[]>(
    '/admin/image-riddles/categories/all',
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Create a category (Admin).
 */
export async function createImageRiddleCategory(
  dto: Pick<ImageRiddleCategory, 'name'> & { emoji?: string; description?: string }
): Promise<ImageRiddleCategory> {
  const response = await api.post<ImageRiddleCategory>('/admin/image-riddles/categories', dto, {
    isAdmin: true,
  });
  return response.data;
}

/**
 * Update a category (Admin).
 */
export async function updateImageRiddleCategory(
  id: string,
  dto: { name?: string; emoji?: string; description?: string }
): Promise<ImageRiddleCategory> {
  const response = await api.put<ImageRiddleCategory>(
    `/admin/image-riddles/categories/${id}`,
    dto,
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Delete a category (Admin). Soft-deletes its active riddles first.
 */
export async function deleteImageRiddleCategory(id: string): Promise<void> {
  await api.delete(`/admin/image-riddles/categories/${id}`, { isAdmin: true });
}

/**
 * Execute a bulk action (canonical status-change surface; also handles
 * single-item status changes) (Admin).
 */
export type ImageRiddleBulkAction = 'publish' | 'draft' | 'trash' | 'restore' | 'delete';

export interface BulkActionResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  message?: string;
}

export async function bulkActionImageRiddles(
  ids: string[],
  action: ImageRiddleBulkAction
): Promise<BulkActionResult> {
  const response = await api.post<BulkActionResult>(
    '/image-riddles/bulk-action',
    { ids, action },
    { isAdmin: true }
  );
  return response.data;
}

export interface ImageRiddlesDashboardStats {
  totalRiddles: number;
  activeRiddles: number;
  totalCategories: number;
  riddlesByDifficulty: Record<string, number>;
  riddlesByCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
  recentRiddles: ImageRiddle[];
  averageTimer: number;
}

/**
 * Get dashboard statistics (Admin).
 */
export async function getImageRiddlesDashboardStats(): Promise<ImageRiddlesDashboardStats> {
  const response = await api.get<ImageRiddlesDashboardStats>(
    '/admin/image-riddles/dashboard/stats',
    { isAdmin: true }
  );
  return response.data;
}

/**
 * Get recently created/updated riddles (Admin).
 */
export async function getRecentImageRiddles(limit: number = 10): Promise<ImageRiddle[]> {
  const response = await api.get<ImageRiddle[]>(
    `/admin/image-riddles/dashboard/recent?limit=${limit}`,
    { isAdmin: true }
  );
  return response.data;
}
