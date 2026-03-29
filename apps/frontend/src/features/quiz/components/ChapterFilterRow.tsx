'use client';

import type { QuizChapter } from '@/lib/quiz-api';

interface ChapterFilterRowProps {
  chapter: QuizChapter;
  isSelected: boolean;
  count: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChapterFilterRow({
  chapter,
  isSelected,
  count,
  onSelect,
  onEdit,
  onDelete,
}: ChapterFilterRowProps) {
  return (
    <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-600' : 'bg-white border-gray-300 hover:bg-indigo-50'}`}>
      <button
        onClick={onSelect}
        className={`text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-700 hover:text-indigo-600'}`}
      >
        {chapter.name} ({count})
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className={`ml-1 text-xs ${isSelected ? 'text-indigo-200 hover:text-white' : 'text-gray-400 hover:text-blue-500'}`}
        title="Edit"
      >
        ✏️
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={`text-xs ${isSelected ? 'text-indigo-200 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
        title="Delete"
      >
        🗑️
      </button>
    </div>
  );
}
