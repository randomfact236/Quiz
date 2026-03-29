'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getAllQuestions, type QuizQuestion } from '@/lib/quiz-api';
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
      
      // Use cursor if provided
      if (pageParam) {
        params.append('cursor', pageParam as string);
      }
      
      params.append('limit', '20');

      const response = await getAllQuestions(
        {
          ...(filters.subject && { subject: filters.subject }),
          ...(filters.status && { status: filters.status }),
          ...(filters.level && { level: filters.level }),
          ...(filters.chapter && { chapter: filters.chapter }),
          ...(filters.search && { search: filters.search }),
        },
        1, // page is ignored when cursor is used
        20,
        true // isAdmin
      );

      return {
        data: response.data,
        total: response.total,
        hasMore: response.hasMore ?? false,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30 seconds
    initialPageParam: undefined as string | undefined,
  });
}

export default useQuestions;
