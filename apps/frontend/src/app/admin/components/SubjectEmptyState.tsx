'use client';

import { FolderOpen } from 'lucide-react';

interface SubjectEmptyStateProps {
  onAddSubject?: () => void;
}

export function SubjectEmptyState({ onAddSubject }: SubjectEmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        No subjects in database
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Add subjects to get started
      </p>
      {onAddSubject && (
        <button
          onClick={onAddSubject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Subject
        </button>
      )}
    </div>
  );
}
