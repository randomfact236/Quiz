'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface QuizFilters {
  subject?: string | undefined;
  chapter?: string | undefined;
  level?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
}

export function useQuizFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: QuizFilters = useMemo(
    () => ({
      subject: searchParams.get('subject') || undefined,
      chapter: searchParams.get('chapter') || undefined,
      level: searchParams.get('level') || undefined,
      status: searchParams.get('status') || 'published',
      search: searchParams.get('search') || undefined,
    }),
    [searchParams]
  );

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const setFilter = useCallback(
    (key: keyof QuizFilters, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== 'all') {
        params.set(key, value);
      } else if (value === 'all') {
        params.set(key, 'all');
      } else {
        params.delete(key);
      }

      if (key === 'subject') {
        params.delete('chapter');
      }

      params.set('page', '1');

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const setSearch = useCallback(
    (value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }

      params.set('page', '1');

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const setPageSize = useCallback(
    (size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pageSize', String(size));
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('section', 'quiz');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    setFilter,
    setSearch,
    resetFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
  };
}

export default useQuizFilters;
