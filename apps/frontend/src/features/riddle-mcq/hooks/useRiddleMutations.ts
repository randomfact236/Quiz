'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkActionRiddles, updateRiddle } from '@/lib/riddle-mcq-api';
import type { CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';

/**
 * Mutation layer for the trash/update flow and bulk actions. Category/subject
 * CRUD mutations live in useRiddleMcqCategories / useRiddleMcqSubjects.
 */
export function useRiddleMutations() {
  const queryClient = useQueryClient();

  const updateRiddleMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateRiddleMcqDto> }) =>
      updateRiddle(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: 'delete' | 'trash' | 'publish' | 'draft' | 'restore';
    }) => bulkActionRiddles(ids, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  return {
    updateRiddle: updateRiddleMutation.mutateAsync,
    bulkAction: bulkActionMutation.mutateAsync,
    isBulkActionLoading: bulkActionMutation.isPending,
  };
}
