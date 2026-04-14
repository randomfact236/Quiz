'use client';

import type { RiddleCategory, RiddleSubject } from '@/lib/riddle-mcq-api';

interface ActiveFiltersBadgeProps {
  filters: {
    category?: string;
    subject?: string;
    level?: string;
    search?: string;
  };
  categories: RiddleCategory[];
  subjects: RiddleSubject[];
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
    filters.category || filters.subject || filters.level || filters.search
  );

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
      <span className="text-xs font-medium text-gray-500 uppercase">Active Filters:</span>
      {filters.category && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
          {categories.find((c) => c.slug === filters.category)?.emoji}{' '}
          {categories.find((c) => c.slug === filters.category)?.name}
          <button onClick={onRemoveCategory} className="hover:text-purple-900">
            ×
          </button>
        </span>
      )}
      {filters.subject && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
          {subjects.find((s) => s.slug === filters.subject)?.emoji}{' '}
          {subjects.find((s) => s.slug === filters.subject)?.name}
          <button onClick={onRemoveSubject} className="hover:text-blue-900">
            ×
          </button>
        </span>
      )}
      {filters.level && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
          {filters.level}
          <button onClick={onRemoveLevel} className="hover:text-green-900">
            ×
          </button>
        </span>
      )}
      {filters.search && (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
          &ldquo;{filters.search}&rdquo;
          <button onClick={onRemoveSearch} className="hover:text-gray-900">
            ×
          </button>
        </span>
      )}
      <button
        onClick={onClearAll}
        className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full hover:bg-red-200"
      >
        Clear All ×
      </button>
    </div>
  );
}
