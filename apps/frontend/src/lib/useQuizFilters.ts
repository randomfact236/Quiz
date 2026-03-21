'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface QuizFilters {
  status: string;
  level: string;
  chapter: string;
  search: string;
  subject: string;
}

export interface QuizFiltersState {
  filters: QuizFilters;
  setFilter: (key: keyof QuizFilters, value: string) => void;
  resetFilters: () => void;
  isLoading: boolean;
}

const DEFAULT_FILTERS: QuizFilters = {
  status: 'all',
  level: 'all',
  chapter: 'all',
  search: '',
  subject: 'all',
};

export function useQuizFilters(subjectSlug?: string): QuizFiltersState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  const filters = useMemo<QuizFilters>(() => ({
    status: searchParams.get('status') || DEFAULT_FILTERS.status,
    level: searchParams.get('level') || DEFAULT_FILTERS.level,
    chapter: searchParams.get('chapter') || DEFAULT_FILTERS.chapter,
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    subject: subjectSlug || searchParams.get('subject') || DEFAULT_FILTERS.subject,
  }), [searchParams, subjectSlug || '']);

  const updateURL = useCallback((newFilters: QuizFilters) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    
    // Always preserve the current section from URL
    const currentSection = searchParams.get('section') || 'quiz';
    params.set('section', currentSection);
    
    // Order: subject → chapter → level → status → search (broad → specific)
    if (newFilters.subject && newFilters.subject !== 'all') params.set('subject', newFilters.subject);
    if (newFilters.chapter && newFilters.chapter !== 'all') params.set('chapter', newFilters.chapter);
    if (newFilters.level && newFilters.level !== 'all') params.set('level', newFilters.level);
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.search) params.set('search', newFilters.search);

    const queryString = params.toString();
    const newURL = `${pathname}?${queryString}`;
    
    router.push(newURL, { scroll: false });
    
    setTimeout(() => setIsLoading(false), 100);
  }, [pathname, router, searchParams]);

  const setFilter = useCallback((key: keyof QuizFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    updateURL(newFilters);
  }, [filters, updateURL]);

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      ...DEFAULT_FILTERS,
      subject: subjectSlug || 'all',
    };
    updateURL(defaultFilters);
  }, [subjectSlug, updateURL]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      if (subjectSlug && subjectSlug !== 'quiz') {
        const currentSubject = searchParams.get('subject');
        if (!currentSubject) {
          setFilter('subject', subjectSlug);
        }
      }
    }
  }, [subjectSlug, searchParams, setFilter]);

  return {
    filters,
    setFilter,
    resetFilters,
    isLoading,
  };
}

export default useQuizFilters;
