'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { QuizQuestion } from '@/lib/quiz-api';
import { useQuestionMutation } from '../hooks';
import { QuestionTable } from './QuestionTable';

interface QuestionManagerProps {
  questions: QuizQuestion[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onEdit: (question: QuizQuestion) => void;
}

const PAGE_SIZES = [10, 25, 50];

export function QuestionManager({
  questions,
  total,
  isLoading,
  isFetching,
  hasNextPage,
  onLoadMore,
  onEdit,
}: QuestionManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { bulkUpdateStatusAsync, bulkDeleteAsync, isProcessing } = useQuestionMutation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetching) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetching, onLoadMore]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  }, [selectedIds.size, questions]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleDelete = useCallback(async (question: QuizQuestion) => {
    const isTrash = question.status === 'trash';
    const message = isTrash
      ? `Permanently delete question: "${question.question.substring(0, 50)}..."?`
      : `Move to trash: "${question.question.substring(0, 50)}..."?`;
    if (!confirm(message)) return;
    try {
      if (isTrash) {
        await bulkDeleteAsync([question.id]);
      } else {
        await bulkUpdateStatusAsync({ ids: [question.id], action: 'trash' });
      }
    } catch {
      // Error handled by mutation
    }
  }, [bulkDeleteAsync, bulkUpdateStatusAsync]);

  const handleBulkAction = useCallback(async (action: 'publish' | 'draft' | 'trash' | 'delete' | 'restore') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      if (action === 'delete') {
        await bulkDeleteAsync(ids);
      } else if (action !== 'restore') {
        await bulkUpdateStatusAsync({ ids, action });
      }
      setSelectedIds(new Set());
    } catch {
      // Error handled by mutation
    }
  }, [selectedIds, bulkDeleteAsync, bulkUpdateStatusAsync]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Total: {total} questions
        </span>
      </div>

      {selectedIds.size > 0 && (
        <BulkActionToolbar
          selectedIds={Array.from(selectedIds)}
          totalItems={total}
          currentFilter="all"
          onSelectAll={toggleSelectAll}
          onDeselectAll={() => setSelectedIds(new Set())}
          onAction={handleBulkAction}
          onClose={() => setSelectedIds(new Set())}
          loading={isProcessing}
        />
      )}

      {isLoading && questions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <span className="text-gray-500 dark:text-gray-400">Loading questions...</span>
        </div>
      ) : (
        <QuestionTable
          questions={questions}
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      )}

      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetching && (
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading more...</span>
        )}
        {!hasNextPage && questions.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">No more questions</span>
        )}
      </div>
    </div>
  );
}

export default QuestionManager;
