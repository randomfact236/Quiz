/**
 * ============================================================================
 * admin/lib/filters.ts — filtering, counts, and sorting for the admin table
 * ============================================================================
 * Pure helpers extracted from ImageRiddlesAdminSection. Each count function
 * mirrors the original cross-filtering semantics exactly (status counts
 * ignore the status filter; category counts ignore the category filter;
 * difficulty counts ignore the difficulty filter).
 * ============================================================================
 */

import type { ContentStatus, ImageRiddle, StatusFilter } from '@/app/admin/types';

export interface AdminFilterParams {
  filterDifficulty: string;
  filterCategory: string;
  searchTerm: string;
  statusFilter: StatusFilter;
}

/** Full filter predicate used for the table rows. */
export function filterAdminRiddles(
  riddles: ImageRiddle[],
  params: AdminFilterParams
): ImageRiddle[] {
  return riddles.filter((riddle) => {
    const matchesDifficulty =
      !params.filterDifficulty || riddle.difficulty === params.filterDifficulty;
    const matchesCategory =
      !params.filterCategory || riddle.category?.name === params.filterCategory;
    const matchesSearch =
      !params.searchTerm || riddle.title.toLowerCase().includes(params.searchTerm.toLowerCase());
    const matchesStatus = params.statusFilter === 'all' || riddle.status === params.statusFilter;
    return matchesDifficulty && matchesCategory && matchesSearch && matchesStatus;
  });
}

/** Cross-filter used by status counts (difficulty + category + search only). */
function filterForStatusCounts(riddles: ImageRiddle[], params: AdminFilterParams): ImageRiddle[] {
  return riddles.filter((riddle) => {
    const matchesDifficulty =
      !params.filterDifficulty || riddle.difficulty === params.filterDifficulty;
    const matchesCategory =
      !params.filterCategory || riddle.category?.name === params.filterCategory;
    const matchesSearch =
      !params.searchTerm || riddle.title.toLowerCase().includes(params.searchTerm.toLowerCase());
    return matchesDifficulty && matchesCategory && matchesSearch;
  });
}

/** Cross-filter used by category counts (difficulty + search + status). */
function filterForCategoryCounts(riddles: ImageRiddle[], params: AdminFilterParams): ImageRiddle[] {
  return riddles.filter((riddle) => {
    const matchesDifficulty =
      !params.filterDifficulty || riddle.difficulty === params.filterDifficulty;
    const matchesSearch =
      !params.searchTerm || riddle.title.toLowerCase().includes(params.searchTerm.toLowerCase());
    const matchesStatus = params.statusFilter === 'all' || riddle.status === params.statusFilter;
    return matchesDifficulty && matchesSearch && matchesStatus;
  });
}

/** Cross-filter used by difficulty counts (category + search + status). */
function filterForDifficultyCounts(
  riddles: ImageRiddle[],
  params: AdminFilterParams
): ImageRiddle[] {
  return riddles.filter((riddle) => {
    const matchesCategory =
      !params.filterCategory || riddle.category?.name === params.filterCategory;
    const matchesSearch =
      !params.searchTerm || riddle.title.toLowerCase().includes(params.searchTerm.toLowerCase());
    const matchesStatus = params.statusFilter === 'all' || riddle.status === params.statusFilter;
    return matchesCategory && matchesSearch && matchesStatus;
  });
}

export interface AdminStatusCounts {
  total: number;
  published: number;
  draft: number;
  trash: number;
}

export function computeStatusCounts(
  riddles: ImageRiddle[],
  params: AdminFilterParams
): AdminStatusCounts {
  const filtered = filterForStatusCounts(riddles, params);
  return {
    total: filtered.length,
    published: filtered.filter((r) => r.status === 'published').length,
    draft: filtered.filter((r) => r.status === 'draft').length,
    trash: filtered.filter((r) => r.status === 'trash').length,
  };
}

export function computeCategoryCounts(
  riddles: ImageRiddle[],
  params: AdminFilterParams
): Record<string, number> {
  const counts: Record<string, number> = {};
  filterForCategoryCounts(riddles, params).forEach((r) => {
    const catName = r.category?.name || '';
    if (catName) {
      counts[catName] = (counts[catName] || 0) + 1;
    }
  });
  return counts;
}

export function computeDifficultyCounts(
  riddles: ImageRiddle[],
  params: AdminFilterParams
): Record<string, number> {
  const filtered = filterForDifficultyCounts(riddles, params);
  return {
    easy: filtered.filter((r) => r.difficulty === 'easy').length,
    medium: filtered.filter((r) => r.difficulty === 'medium').length,
    hard: filtered.filter((r) => r.difficulty === 'hard').length,
    expert: filtered.filter((r) => r.difficulty === 'expert').length,
  };
}

// ============================================================================
// Sorting
// ============================================================================

export type AdminSortField = 'title' | 'difficulty' | 'status' | 'category';

export interface AdminSortConfig {
  field: AdminSortField;
  direction: 'asc' | 'desc';
}

const DIFFICULTY_RANK: Record<string, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

/** Non-mutating sort implementing the original comparator semantics. */
export function sortAdminRiddles(
  riddles: ImageRiddle[],
  sortConfig: AdminSortConfig | null
): ImageRiddle[] {
  if (!sortConfig) return riddles;

  return [...riddles].sort((a, b) => {
    let valueA = '';
    let valueB = '';

    if (sortConfig.field === 'title') {
      valueA = a.title.toLowerCase();
      valueB = b.title.toLowerCase();
    } else if (sortConfig.field === 'difficulty') {
      valueA = String(DIFFICULTY_RANK[a.difficulty] || 0);
      valueB = String(DIFFICULTY_RANK[b.difficulty] || 0);
    } else if (sortConfig.field === 'status') {
      valueA = a.status;
      valueB = b.status;
    } else if (sortConfig.field === 'category') {
      valueA = (a.category?.name || '').toLowerCase();
      valueB = (b.category?.name || '').toLowerCase();
    }

    if (valueA < valueB) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/** Click-cycle for a column header: asc → desc → off. */
export function nextSortConfig(
  current: AdminSortConfig | null,
  field: AdminSortField
): AdminSortConfig | null {
  if (current?.field === field) {
    return current.direction === 'asc' ? { field, direction: 'desc' } : null;
  }
  return { field, direction: 'asc' };
}

/** Status shown after clicking a row's status badge (published → draft → trash → published). */
export function nextStatusCycle(status: ContentStatus): ContentStatus {
  return status === 'published' ? 'draft' : status === 'draft' ? 'trash' : 'published';
}
