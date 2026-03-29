'use client';

import { Plus, Upload } from 'lucide-react';

interface QuizHeaderProps {
  totalQuestions: number;
  onAddQuestion: () => void;
  onImport: () => void;
}

export function QuizHeader({ totalQuestions, onAddQuestion, onImport }: QuizHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quiz MCQ Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Total Questions: <span className="font-medium text-gray-900 dark:text-white">{totalQuestions}</span>
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
        <button
          onClick={onAddQuestion}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>
    </div>
  );
}

export default QuizHeader;
