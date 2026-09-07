'use client';

import type { QuizSubject } from '@/lib/quiz-mcq-api';

interface SubjectFilterRowProps {
  subject: QuizSubject;
  isSelected: boolean;
  count: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SubjectFilterRow({
  subject,
  isSelected,
  count,
  onSelect,
  onEdit,
  onDelete,
}: SubjectFilterRowProps) {
  return (
    <div
      className={`flex items-center gap-1 rounded-lg border px-2 py-1 transition-colors ${isSelected ? 'bg-purple-500 border-purple-600' : 'bg-white dark:bg-secondary-800 border-gray-300 dark:border-secondary-600 hover:bg-purple-200 dark:hover:bg-purple-500/30 dark:hover:bg-purple-500/10 dark:hover:bg-purple-500/10'}`}
    >
      <button
        onClick={onSelect}
        className={`text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-700 dark:text-secondary-200 hover:text-purple-600 dark:hover:text-purple-300'}`}
      >
        {subject.emoji} {subject.name} ({count})
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`ml-1 text-xs ${isSelected ? 'text-purple-200 hover:text-white' : 'text-gray-400 dark:text-secondary-400 hover:text-blue-500'}`}
        title="Edit"
      >
        ✏️
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`text-xs ${isSelected ? 'text-purple-200 hover:text-white' : 'text-gray-400 dark:text-secondary-400 hover:text-red-500'}`}
        title="Delete"
      >
        🗑️
      </button>
    </div>
  );
}
