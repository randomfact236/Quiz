'use client';

import { useQuery } from '@tanstack/react-query';
import { getFilterCounts, type FilterCountsResponse } from '@/lib/quiz-api';
import type { QuizFilters } from './useQuizFilters';

const FILTER_COUNTS_KEY = 'filter-counts';

export function useFilterCounts(filters: QuizFilters) {
  return useQuery({
    queryKey: [FILTER_COUNTS_KEY, filters],
    queryFn: async (): Promise<FilterCountsResponse> => {
      const response = await getFilterCounts(
        {
          ...(filters.subject && { subject: filters.subject }),
          ...(filters.level && { level: filters.level }),
          ...(filters.chapter && { chapter: filters.chapter }),
          ...(filters.search && { search: filters.search }),
        },
        true // isAdmin
      );
      return response;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export default useFilterCounts;
