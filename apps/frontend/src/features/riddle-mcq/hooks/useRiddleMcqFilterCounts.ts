'use client';

import { useQuery } from '@tanstack/react-query';
import { getRiddleFilterCounts, type FilterCounts } from '@/lib/riddle-mcq-api';

const FILTER_COUNTS_KEY = ['riddle-mcq-filter-counts'];

export function useRiddleMcqFilterCounts(category?: string, subject?: string, level?: string) {
  const query = useQuery<FilterCounts>({
    queryKey: [...FILTER_COUNTS_KEY, category, subject, level],
    queryFn: () =>
      getRiddleFilterCounts({
        ...(category && { category }),
        ...(subject && { subject }),
        ...(level && { level }),
      }),
    staleTime: 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useRiddleMcqFilterCounts;
