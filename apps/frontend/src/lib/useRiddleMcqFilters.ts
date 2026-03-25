'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface RiddleFilters {
  status: string;
  level: string;
  search: string;
  subject: string;
  page: number;
}

export interface RiddleFiltersState {
  filters: RiddleFilters;
  setFilter: (key: keyof RiddleFilters, value: string | number) => void;
  resetFilters: () => void;
  buildCountsParams: () => { subject?: string; level?: string };
  buildDataParams: () => { subject?: string; level?: string; status?: string; search?: string };
}

const DEFAULT_FILTERS: RiddleFilters = {
  status: 'published',
  level: 'all',
  search: '',
  subject: 'all',
  page: 1,
};

export function useRiddleMcqFilters(): RiddleFiltersState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);

  const filters = useMemo<RiddleFilters>(() => ({
    status: searchParams.get('status') || DEFAULT_FILTERS.status,
    level: searchParams.get('level') || DEFAULT_FILTERS.level,
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    subject: searchParams.get('subject') || DEFAULT_FILTERS.subject,
    page: parseInt(searchParams.get('page') || '1', 10),
  }), [searchParams]);

  const updateURL = useCallback((newFilters: RiddleFilters) => {
    const params = new URLSearchParams();

    // Always preserve the current section from URL
    const currentSection = searchParams.get('section') || 'riddle-mcq';
    params.set('section', currentSection);

    // Order: subject → level → status → search → page (broad → specific)
    if (newFilters.subject && newFilters.subject !== 'all') params.set('subject', newFilters.subject);
    if (newFilters.level && newFilters.level !== 'all') params.set('level', newFilters.level);
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.page > 1) params.set('page', String(newFilters.page));

    const queryString = params.toString();
    const newURL = `${pathname}?${queryString}`;

    router.push(newURL, { scroll: false });
  }, [pathname, router, searchParams]);

  const setFilter = useCallback((key: keyof RiddleFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    // Reset page when changing filters (except when explicitly setting page)
    if (key !== 'page') {
      newFilters.page = 1;
    }
    updateURL(newFilters);
  }, [filters, updateURL]);

  const resetFilters = useCallback(() => {
    updateURL({ ...DEFAULT_FILTERS });
  }, [updateURL]);

  const buildCountsParams = useCallback((): { subject?: string; level?: string } => {
    const params: { subject?: string; level?: string } = {};
    if (filters.subject !== 'all') {
      params.subject = filters.subject;
    }
    if (filters.level !== 'all') {
      params.level = filters.level;
    }
    return params;
  }, [filters]);

  const buildDataParams = useCallback((): { subject?: string; level?: string; status?: string; search?: string } => {
    const params: { subject?: string; level?: string; status?: string; search?: string } = {};
    if (filters.subject !== 'all') {
      params.subject = filters.subject;
    }
    if (filters.level !== 'all') {
      params.level = filters.level;
    }
    if (filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    return params;
  }, [filters]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
    buildCountsParams,
    buildDataParams,
  };
}

export default useRiddleMcqFilters;
