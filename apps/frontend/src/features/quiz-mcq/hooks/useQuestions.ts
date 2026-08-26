'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import type { QuizQuestion } from '@/lib/quiz-mcq-api';
import type { QuizFilters } from './useQuizMcqFilters';

const QUESTIONS_KEY = 'questions';

interface QuestionsResponse {
  data: QuizQuestion[];
  total: number;
  totalPages: number;
}

export function useQuestions(filters: QuizFilters, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [QUESTIONS_KEY, filters, page, pageSize],
    queryFn: async (): Promise<QuestionsResponse> => {
      const params = new URLSearchParams();

      if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.level && filters.level !== 'all') params.append('level', filters.level);
      if (filters.chapter && filters.chapter !== 'all') params.append('chapter', filters.chapter);
      if (filters.search) params.append('search', filters.search);

      params.append('page', String(page));
      params.append('limit', String(pageSize));

      const response = await adminApi.get<{
        data: QuizQuestion[];
        total: number;
        totalPages: number;
      }>(`/quiz-mcq/questions?${params.toString()}`);

      return {
        data: response.data.data,
        total: response.data.total,
        totalPages: response.data.totalPages,
      };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

export default useQuestions;
