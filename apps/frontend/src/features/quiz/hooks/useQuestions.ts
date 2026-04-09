'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { QuizQuestion } from '@/lib/quiz-api';
import type { QuizFilters } from './useQuizFilters';

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

      const response = await api.get<{
        data: QuizQuestion[];
        total: number;
        totalPages: number;
      }>(`/quiz/questions?${params.toString()}`, { isAdmin: true });

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
