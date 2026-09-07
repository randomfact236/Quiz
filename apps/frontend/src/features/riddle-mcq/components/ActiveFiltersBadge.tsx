'use client';

import type { RiddleMcqCategory, RiddleMcqSubject } from '@/lib/riddle-mcq-api';

interface ActiveFiltersBadgeProps {
  filters: {
    category?: string;
    subject?: string;
    level?: string;
    search?: string;
  };
  categories: RiddleMcqCategory[];
  subjects: RiddleMcqSubject[];
  onRemoveCategory: () => void;
  onRemoveSubject: () => void;
  onRemoveLevel: () => void;
  onRemoveSearch: () => void;
  onClearAll: () => void;
}

export function ActiveFiltersBadge({
  filters,
  categories,
  subjects,
  onRemoveCategory,
  onRemoveSubject,
  onRemoveLevel,
  onRemoveSearch,
  onClearAll,
}: ActiveFiltersBadgeProps) {
  const hasActiveFilters = Boolean(
    (filters.category && filters.category !== 'all') ||
    (filters.subject && filters.subject !== 'all') ||
    (filters.level && filters.level !== 'all') ||
    (filters.search && filters.search !== '')
  );

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-secondary-800">
      <span className="text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase">
        Active Filters:
      </span>
      {filters.category && filters.category !== 'all' && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm rounded-full">
          {categories.find((c) => c.slug === filters.category)?.emoji}{' '}
          {categories.find((c) => c.slug === filters.category)?.name}
          <button
            onClick={onRemoveCategory}
            className="hover:text-purple-900 dark:hover:text-purple-200"
          >
            ×
          </button>
        </span>
      )}
      {filters.subject && filters.subject !== 'all' && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm rounded-full">
          {subjects.find((s) => s.slug === filters.subject)?.emoji}{' '}
          {subjects.find((s) => s.slug === filters.subject)?.name}
          <button
            onClick={onRemoveSubject}
            className="hover:text-blue-900 dark:hover:text-blue-200"
          >
            ×
          </button>
        </span>
      )}
      {filters.level && filters.level !== 'all' && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-sm rounded-full">
          {filters.level}
          <button
            onClick={onRemoveLevel}
            className="hover:text-green-900 dark:hover:text-green-200"
          >
            ×
          </button>
        </span>
      )}
      {filters.search && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-secondary-200 text-sm rounded-full">
          &ldquo;{filters.search}&rdquo;
          <button onClick={onRemoveSearch} className="hover:text-gray-900 dark:text-secondary-50">
            ×
          </button>
        </span>
      )}
      <button
        onClick={onClearAll}
        className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 text-sm rounded-full hover:bg-red-200 dark:hover:bg-red-500/30"
      >
        Clear All ×
      </button>
    </div>
  );
}
