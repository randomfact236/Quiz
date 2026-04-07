'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllChapters,
  getChaptersBySubject,
  deleteChapter,
  type QuizChapter,
} from '@/lib/quiz-api';

const CHAPTERS_KEY = 'chapters';
const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

export function useChapters(subjectId: string | null | undefined) {
  const queryClient = useQueryClient();

  // Query - fetches all chapters when subjectId is null/undefined, or filtered by subject when provided
  const query = useQuery({
    queryKey: [CHAPTERS_KEY, subjectId ?? 'all'],
    queryFn: () => (subjectId ? getChaptersBySubject(subjectId) : getAllChapters()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; subjectId: string }) => deleteChapter(id, true),
    onMutate: async ({ id, subjectId: subjId }) => {
      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, subjId] as const });

      const previousChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId]);

      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId], (old = []) =>
        old.filter((chapter) => chapter.id !== id)
      );

      return { previousChapters };
    },
    onError: (_err, { subjectId: subjId }, context) => {
      if (context?.previousChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, subjId], context.previousChapters);
      }
    },
    onSettled: (_data, _error, { subjectId: subjId }) => {
      // Invalidate chapters, questions, and filter counts
      const subjectKey = subjId || 'all';
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, subjectKey] });
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, 'all'] });
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    delete: deleteMutation.mutateAsync,
    // Mutation states
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

export default useChapters;
