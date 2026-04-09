'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Loader2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { QuizQuestion } from '@/lib/quiz-api';
import { useQuestionMutation } from '../hooks';
import { QuestionTable } from './QuestionTable';

interface QuestionManagerProps {
  questions: QuizQuestion[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (question: QuizQuestion) => void;
  statusFilter?: string;
}

const PAGE_SIZES = [10, 25, 50];

interface TrashConfirmState {
  isOpen: boolean;
  question: QuizQuestion | null;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const windowSize = 5;

  if (total <= windowSize) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  const halfWindow = Math.floor(windowSize / 2);
  let start = Math.max(1, current - halfWindow);
  let end = Math.min(total, start + windowSize - 1);

  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total) {
    if (end < total - 1) pages.push('...');
    pages.push(total);
  }

  return pages;
}

export function QuestionManager({
  questions,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  isFetching,
  onPageChange,
  onPageSizeChange,
  onEdit,
  statusFilter = 'all',
}: QuestionManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trashConfirm, setTrashConfirm] = useState<TrashConfirmState>({
    isOpen: false,
    question: null,
  });
  const [isTrashing, setIsTrashing] = useState(false);

  const { bulkUpdateStatusAsync, bulkDeleteAsync, isProcessing } = useQuestionMutation();

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  }, [selectedIds.size, questions]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleDelete = useCallback((question: QuizQuestion) => {
    setTrashConfirm({ isOpen: true, question });
  }, []);

  const confirmTrash = useCallback(async () => {
    if (!trashConfirm.question) return;
    setIsTrashing(true);
    try {
      await bulkUpdateStatusAsync({ ids: [trashConfirm.question.id], action: 'trash' });
      setTrashConfirm({ isOpen: false, question: null });
    } catch {
      // Error handled by mutation
    } finally {
      setIsTrashing(false);
    }
  }, [trashConfirm, bulkUpdateStatusAsync]);

  const cancelTrash = useCallback(() => {
    setTrashConfirm({ isOpen: false, question: null });
  }, []);

  const handleBulkAction = useCallback(
    async (action: 'publish' | 'draft' | 'trash' | 'delete' | 'restore') => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      try {
        if (action === 'delete') {
          await bulkDeleteAsync(ids);
        } else {
          await bulkUpdateStatusAsync({ ids, action });
        }
        setSelectedIds(new Set());
      } catch (error) {
        console.error(`[BulkAction] Failed to execute "${action}":`, error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        alert(`Bulk action failed: ${message}`);
      }
    },
    [selectedIds, bulkDeleteAsync, bulkUpdateStatusAsync]
  );

  return (
    <div className="space-y-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">Total: {total} questions</span>

      {selectedIds.size > 0 && (
        <BulkActionToolbar
          selectedIds={Array.from(selectedIds)}
          totalItems={total}
          currentFilter={statusFilter as any}
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
          page={page}
          pageSize={pageSize}
        />
      )}

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1 || isFetching}
              className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="First page"
            >
              <ChevronFirst className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || isFetching}
              className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers(page, totalPages).map((pageNum, index) =>
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 py-1">
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  disabled={isFetching}
                  className={`px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                    page === pageNum
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || isFetching}
              className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages || isFetching}
              className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Last page"
            >
              <ChevronLast className="w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Trash Confirmation Modal */}
      {trashConfirm.isOpen && trashConfirm.question && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={!isTrashing ? cancelTrash : undefined}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 pointer-events-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Trash2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Move to Trash
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to move this question to trash? You can restore it later
                  from the Trash section.
                </p>
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    <strong>Question:</strong> {trashConfirm.question.question}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 pt-0">
                <button
                  onClick={cancelTrash}
                  disabled={isTrashing}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTrash}
                  disabled={isTrashing}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isTrashing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Move to Trash
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

export default QuestionManager;
