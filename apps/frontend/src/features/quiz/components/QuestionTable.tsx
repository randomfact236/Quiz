'use client';

import type { QuizQuestion } from '@/lib/quiz-api';

interface QuestionTableProps {
  questions: QuizQuestion[];
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (question: QuizQuestion) => void;
}

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

const CORRECT_LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionTable({
  questions,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onEdit,
  onDelete,
}: QuestionTableProps) {
  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-md">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-3 py-3 text-left text-xs font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-12">#</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Question</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-28">Chapter</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-48">Options</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-16">Ans</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-20">Level</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-20">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {questions.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">No questions found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting filters or add new questions</p>
                </div>
              </td>
            </tr>
          ) : (
            questions.map((question, index) => {
              const levelColors = LEVEL_COLORS[question.level] || { bg: 'bg-gray-100', text: 'text-gray-700' };
              const statusColors = STATUS_COLORS[question.status || 'draft'] || { bg: 'bg-gray-100', text: 'text-gray-700' };
              const isExtreme = question.level === 'extreme';
              
              return (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(question.id)}
                      onChange={() => onToggleSelectOne(question.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-3 py-3 align-top">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{question.question}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => onEdit(question)}
                        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => onDelete(question)}
                        className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      >
                        🗑️ Trash
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                      {question.chapter?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    {isExtreme ? (
                      <div className="text-xs text-gray-700 bg-purple-50 px-2 py-1 rounded whitespace-normal break-words max-w-48">
                        <span className="font-medium text-purple-600">A: </span>
                        {question.correctAnswer || 'No answer'}
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs">
                        {question.options?.slice(0, 4).map((opt, i) => {
                          const letter = CORRECT_LETTERS[i];
                          const isCorrect = question.correctLetter === letter;
                          return (
                            <div
                              key={i}
                              className={isCorrect
                                ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded'
                                : 'text-gray-600 px-1.5'
                              }
                            >
                              {letter}. {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                    {isExtreme ? (
                      <span className="text-gray-400 text-xs">—</span>
                    ) : (
                      <div className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
                        {question.correctLetter}. {question.options?.[CORRECT_LETTERS.indexOf(question.correctLetter || 'A')] || ''}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${levelColors.bg} ${levelColors.text}`}>
                      {question.level}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors.bg} ${statusColors.text}`}>
                      {question.status || 'draft'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionTable;
