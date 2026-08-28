/**
 * ============================================================================
 * useAdminImageRiddleFilters — filter/sort/pagination state for the table
 * ============================================================================
 * Wires the pure helpers in admin/lib/filters.ts to React state, preserving
 * the original behavior: page resets on filter change, pageInput stays in
 * sync, and each count view uses its own cross-filter semantics.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ImageRiddle, StatusFilter } from '@/app/admin/types';

import {
  computeCategoryCounts,
  computeDifficultyCounts,
  computeStatusCounts,
  filterAdminRiddles,
  nextSortConfig,
  sortAdminRiddles,
  type AdminSortConfig,
  type AdminSortField,
} from '../lib/filters';

export const ADMIN_ITEMS_PER_PAGE = 10;

export function useAdminImageRiddleFilters(imageRiddles: ImageRiddle[]) {
  // Filter states
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const [sortConfig, setSortConfig] = useState<AdminSortConfig | null>(null);

  const filterParams = useMemo(
    () => ({ filterDifficulty, filterCategory, searchTerm, statusFilter }),
    [filterDifficulty, filterCategory, searchTerm, statusFilter]
  );

  // Status counts - based on current filters (difficulty, category, search)
  const statusCounts = useMemo(
    () => computeStatusCounts(imageRiddles, filterParams),
    [imageRiddles, filterParams]
  );

  // Category counts - based on current filters (difficulty, search, status)
  const categoryCounts = useMemo(
    () => computeCategoryCounts(imageRiddles, filterParams),
    [imageRiddles, filterParams]
  );

  // Difficulty counts - based on current filters (category, search, status)
  const difficultyCounts = useMemo(
    () => computeDifficultyCounts(imageRiddles, filterParams),
    [imageRiddles, filterParams]
  );

  // Filter and Sort riddles (memoized)
  const filteredRiddles = useMemo(
    () => sortAdminRiddles(filterAdminRiddles(imageRiddles, filterParams), sortConfig),
    [imageRiddles, filterParams, sortConfig]
  );

  // Pagination
  const totalPages = Math.ceil(filteredRiddles.length / ADMIN_ITEMS_PER_PAGE);
  const paginatedRiddles = useMemo(
    () =>
      filteredRiddles.slice(
        (currentPage - 1) * ADMIN_ITEMS_PER_PAGE,
        currentPage * ADMIN_ITEMS_PER_PAGE
      ),
    [filteredRiddles, currentPage]
  );

  // Sync pageInput with currentPage; reset page when filters change
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);
  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [filterDifficulty, filterCategory, searchTerm, statusFilter]);

  const handleSort = useCallback((field: AdminSortField) => {
    setSortConfig((current) => nextSortConfig(current, field));
  }, []);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }, []);

  const handlePageInputSubmit = useCallback(() => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(String(currentPage));
    }
  }, [pageInput, totalPages, currentPage]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const clearFilters = useCallback(() => {
    setFilterDifficulty('');
    setFilterCategory('');
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = Boolean(
    filterDifficulty || filterCategory || searchTerm || statusFilter !== 'all'
  );

  return {
    filterDifficulty,
    setFilterDifficulty,
    filterCategory,
    setFilterCategory,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    pageInput,
    totalPages,
    filteredRiddles,
    paginatedRiddles,
    statusCounts,
    categoryCounts,
    difficultyCounts,
    sortConfig,
    handleSort,
    handlePageInputChange,
    handlePageInputSubmit,
    goToPrevPage,
    goToNextPage,
    clearFilters,
    hasActiveFilters,
  };
}
