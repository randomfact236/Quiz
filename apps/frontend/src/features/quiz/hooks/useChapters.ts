'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllChapters,
  getChaptersBySubject,
  createChapter,
  updateChapter,
  deleteChapter,
  type QuizChapter,
  type CreateChapterDto,
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

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (dto: CreateChapterDto) => createChapter(dto, true),
    onMutate: async (dto) => {
      const subjectKey = dto.subjectId || 'all';
      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, subjectKey] as const });
      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, 'all'] as const });

      const previousChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, subjectKey]);
      const previousAllChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, 'all']);

      const tempChapter: QuizChapter = {
        id: `temp-${Date.now()}`,
        name: dto.name,
        subjectId: dto.subjectId,
        chapterNumber: (previousChapters?.length || 0) + 1,
      };

      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, subjectKey], (old = []) => [
        ...old,
        tempChapter,
      ]);
      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, 'all'], (old = []) => [
        ...old,
        tempChapter,
      ]);

      return { previousChapters, previousAllChapters };
    },
    onError: (_err, dto, context) => {
      const subjectKey = dto.subjectId || 'all';
      if (context?.previousChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, subjectKey], context.previousChapters);
      }
      if (context?.previousAllChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, 'all'], context.previousAllChapters);
      }
    },
    onSettled: () => {
      // Only invalidate filter counts - let optimistic update handle chapters cache
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  // Update mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; subjectId?: string } }) =>
      updateChapter(id, dto, true),
    onMutate: async ({ id, dto }) => {
      const subjId = dto.subjectId;
      if (!subjId) return;

      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, subjId] as const });

      const previousChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId]);

      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId], (old = []) =>
        old.map((chapter) => (chapter.id === id ? { ...chapter, ...dto } : chapter))
      );

      return { previousChapters };
    },
    onError: (_err, { dto }, context) => {
      if (dto.subjectId && context?.previousChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, dto.subjectId], context.previousChapters);
      }
    },
    onSettled: () => {
      // Only invalidate filter counts - let optimistic update handle chapters cache
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
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
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

export default useChapters;
