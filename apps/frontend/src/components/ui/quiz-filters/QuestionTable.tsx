'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/quiz-api';
import { updateQuestion, bulkActionQuestions } from '@/lib/quiz-api';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare,
  Square,
  Pencil,
  Trash2,
} from 'lucide-react';

interface QuestionTableProps {
  questions: QuizQuestion[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onQuestionUpdate: () => void;
  onEditQuestion?: (question: QuizQuestion) => void;
  onDeleteQuestion?: (question: QuizQuestion) => void;
  isLoading?: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'bg-green-100', text: 'text-green-700' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
  hard: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  expert: { bg: 'bg-orange-100', text: 'text-orange-700' },
  extreme: { bg: 'bg-red-100', text: 'text-red-700' },
};

const CORRECT_LETTERS: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
};

export function QuestionTable({
  questions,
  total,
  page,
  limit,
  onPageChange,
  onQuestionUpdate,
  onEditQuestion,
  onDeleteQuestion,
  isLoading = false,
}: QuestionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState(String(page));

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage = parseInt(pageInput, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    } else {
      setPageInput(String(page));
    }
  };

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  }, [questions, selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }, [selectedIds]);

  const handleBulkAction = useCallback(async (action: 'publish' | 'draft' | 'trash' | 'delete') => {
    if (selectedIds.size === 0) return;
    
    setActionLoading(action);
    try {
      await bulkActionQuestions(Array.from(selectedIds), action);
      setSelectedIds(new Set());
      onQuestionUpdate();
    } catch (error) {
      console.error(`Failed to ${action} questions:`, error);
    } finally {
      setActionLoading(null);
    }
  }, [selectedIds, onQuestionUpdate]);

  const handleStatusChange = useCallback(async (id: string, newStatus: 'published' | 'draft' | 'trash') => {
    setActionLoading(id);
    try {
      await updateQuestion(id, { status: newStatus });
      onQuestionUpdate();
    } catch (error) {
      console.error('Failed to update question status:', error);
    } finally {
      setActionLoading(null);
    }
  }, [onQuestionUpdate]);

  const getCorrectLetterIndex = (question: QuizQuestion): number => {
    if (!question.options || question.options.length === 0) return -1;
    return question.options.findIndex(opt => opt === question.correctAnswer);
  };

  const isExtreme = (level: string): boolean => level === 'extreme';

  if (questions.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-md p-8 text-center">
        <p className="text-gray-500">No questions found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-md overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-gray-500 hover:text-gray-700"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
            <span className="text-sm text-blue-700 font-medium">
              Selected ({selectedIds.size})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('publish')}
              disabled={actionLoading !== null}
              className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('draft')}
              disabled={actionLoading !== null}
              className="px-3 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkAction('trash')}
              disabled={actionLoading !== null}
              className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Trash
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={actionLoading !== null}
              className="px-3 py-1.5 text-xs font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {selectedIds.size === questions.length && questions.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                Options
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                Chapter
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {questions.map((question, index) => {
              const correctIdx = getCorrectLetterIndex(question);
              const extreme = isExtreme(question.level);
              const questionNumber = startItem + index;
              
              return (
                <tr 
                  key={question.id} 
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    selectedIds.has(question.id) && "bg-blue-50/50"
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(question.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedIds.has(question.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* # Number */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-500">
                      {questionNumber}.
                    </span>
                  </td>

                  {/* Question */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                      {question.question}
                    </p>
                    {/* Edit/Delete below question */}
                    {(onEditQuestion || onDeleteQuestion) && (
                      <div className="flex items-center gap-3 mt-2">
                        {onEditQuestion && (
                          <button
                            onClick={() => onEditQuestion(question)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {onDeleteQuestion && (
                          <button
                            onClick={() => onDeleteQuestion(question)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Options */}
                  <td className="px-4 py-3">
                    {extreme ? (
                      <span className="text-xs text-gray-400 italic">Open-ended</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {question.options?.map((opt, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                              idx === correctIdx
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            )}
                          >
                            {CORRECT_LETTERS[idx]}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Answer */}
                  <td className="px-4 py-3">
                    {extreme ? (
                      <span className="text-sm text-gray-700 line-clamp-2">{question.correctAnswer}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-bold rounded">
                          {CORRECT_LETTERS[correctIdx] || '?'}
                        </span>
                        <span className="text-sm text-gray-700 line-clamp-2">
                          {question.correctAnswer}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Chapter */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {question.chapter?.name || '-'}
                    </span>
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize",
                      LEVEL_COLORS[question.level]?.bg || 'bg-gray-100',
                      LEVEL_COLORS[question.level]?.text || 'text-gray-700'
                    )}>
                      {question.level}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <select
                      value={question.status || 'draft'}
                      onChange={(e) => handleStatusChange(question.id, e.target.value as 'published' | 'draft' | 'trash')}
                      disabled={actionLoading === question.id}
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500",
                        question.status === 'published' && 'bg-green-100 text-green-700',
                        question.status === 'draft' && 'bg-yellow-100 text-yellow-700',
                        question.status === 'trash' && 'bg-red-100 text-red-700',
                        !question.status && 'bg-yellow-100 text-yellow-700'
                      )}
                    >
                      <option value="published">Pub</option>
                      <option value="draft">Draft</option>
                      <option value="trash">Trash</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{total > 0 ? startItem : 0}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{total}</span>
        </p>
        
        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600">Page</span>
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            className="w-12 px-2 py-1 text-center text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-600">of {totalPages}</span>
          
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">Loading...</span>
        </div>
      )}
    </div>
  );
}

export default QuestionTable;