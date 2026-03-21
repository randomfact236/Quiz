'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectedFiltersProps {
  filters: {
    subject?: string;
    chapter?: string;
    level?: string;
    status?: string;
    search?: string;
  };
  subjectName?: string | undefined;
  chapterName?: string | undefined;
  onRemove: (key: 'subject' | 'chapter' | 'level' | 'status' | 'search') => void;
  onResetAll: () => void;
  className?: string;
}

export function SelectedFilters({ 
  filters, 
  subjectName,
  chapterName,
  onRemove, 
  onResetAll,
  className 
}: SelectedFiltersProps) {
  const activeFilters: { key: 'subject' | 'chapter' | 'level' | 'status' | 'search'; label: string }[] = [];

  if (filters.subject && filters.subject !== 'all') {
    activeFilters.push({ key: 'subject', label: subjectName || filters.subject });
  }
  if (filters.chapter && filters.chapter !== 'all') {
    activeFilters.push({ key: 'chapter', label: chapterName || filters.chapter });
  }
  if (filters.level && filters.level !== 'all') {
    activeFilters.push({ key: 'level', label: filters.level });
  }
  if (filters.status && filters.status !== 'all') {
    activeFilters.push({ key: 'status', label: filters.status });
  }
  if (filters.search) {
    activeFilters.push({ key: 'search', label: `"${filters.search}"` });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className="text-sm text-gray-500">Selected:</span>
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          {filter.label}
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        onClick={onResetAll}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
      >
        Reset All
      </button>
    </div>
  );
}

export default SelectedFilters;