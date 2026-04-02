'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { QuizQuestion } from '@/lib/quiz-api';
import type { QuizFilters } from './useQuizFilters';

const QUESTIONS_KEY = 'questions';

interface QuestionsResponse {
  data: QuizQuestion[];
  total: number;
  nextCursor?: string;
  hasMore?: boolean;
}

export function useQuestions(filters: QuizFilters) {
  return useInfiniteQuery({
    queryKey: [QUESTIONS_KEY, filters],
    queryFn: async ({ pageParam }): Promise<QuestionsResponse> => {
      const params = new URLSearchParams();

      if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.level && filters.level !== 'all') params.append('level', filters.level);
      if (filters.chapter && filters.chapter !== 'all') params.append('chapter', filters.chapter);
      if (filters.search) params.append('search', filters.search);
      if (pageParam) params.append('cursor', pageParam as string);

      params.append('limit', '20');

      const response = await api.get<{
        data: QuizQuestion[];
        total: number;
        nextCursor?: string;
        hasMore?: boolean;
      }>(`/quiz/questions?${params.toString()}`, { isAdmin: true });

      return {
        data: response.data.data,
        total: response.data.total,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore ?? false,
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30 * 1000, // 30 seconds
    initialPageParam: undefined as string | undefined,
  });
}

export default useQuestions;
