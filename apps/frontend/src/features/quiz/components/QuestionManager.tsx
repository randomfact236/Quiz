'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { QuizQuestion } from '@/lib/quiz-api';
import { useQuestionMutation } from '../hooks';

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

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  hard: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  expert: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  extreme: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  trash: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

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
  
  const { deleteAsync, bulkUpdateStatusAsync, bulkDeleteAsync, isProcessing } = useQuestionMutation();

  // Infinite scroll with IntersectionObserver
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
    if (!confirm(`Delete question: "${question.question.substring(0, 50)}..."?`)) return;
    try {
      await deleteAsync(question.id);
    } catch {
      // Error handled by mutation
    }
  }, [deleteAsync]);

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

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < questions.length;

  return (
    <div className="space-y-4">
      {/* Page Size Selector */}
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

      {/* Bulk Action Toolbar */}
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

      {/* Questions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : isIndeterminate ? (
                    <div className="w-5 h-5 border-2 border-blue-600 rounded bg-blue-600 flex items-center justify-center">
                      <div className="w-2.5 h-0.5 bg-white" />
                    </div>
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Question</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Level</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading questions...
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No questions found
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <tr
                  key={question.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedIds.has(question.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelectOne(question.id)}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      {selectedIds.has(question.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                      {question.question}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {question.chapter?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      LEVEL_COLORS[question.level]?.bg || 'bg-gray-100'
                    } ${LEVEL_COLORS[question.level]?.text || 'text-gray-700'}`}>
                      {question.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      STATUS_COLORS[question.status || 'draft']?.bg || 'bg-gray-100'
                    } ${STATUS_COLORS[question.status || 'draft']?.text || 'text-gray-700'}`}>
                      {question.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(question)}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Loading More Indicator */}
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
