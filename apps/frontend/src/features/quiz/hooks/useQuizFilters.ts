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

  const filters: QuizFilters = useMemo(() => ({
    subject: searchParams.get('subject') || undefined,
    chapter: searchParams.get('chapter') || undefined,
    level: searchParams.get('level') || undefined,
    status: searchParams.get('status') || 'published',
    search: searchParams.get('search') || undefined,
  }), [searchParams]);

  const setFilter = useCallback((key: keyof QuizFilters, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // When subject changes, clear chapter selection
    if (key === 'subject') {
      params.delete('chapter');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    setFilter,
    resetFilters,
  };
}

export default useQuizFilters;
