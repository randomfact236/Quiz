'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

const DEFAULT_FILTERS = {
  category: 'all',
  subject: 'all',
  level: 'all',
  status: 'all',
  search: '',
};

export function useRiddleMcqFilters() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || DEFAULT_FILTERS.category,
    subject: searchParams.get('subject') || DEFAULT_FILTERS.subject,
    level: searchParams.get('level') || DEFAULT_FILTERS.level,
    status: searchParams.get('status') || DEFAULT_FILTERS.status,
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
  });

  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || DEFAULT_FILTERS.category,
      subject: searchParams.get('subject') || DEFAULT_FILTERS.subject,
      level: searchParams.get('level') || DEFAULT_FILTERS.level,
      status: searchParams.get('status') || DEFAULT_FILTERS.status,
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
    });
    setPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const setFilter = useCallback((key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value ?? 'all' }));
    setPage(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  return {
    filters,
    setFilter,
    setSearch,
    page,
    setPage,
    resetFilters,
  };
}
