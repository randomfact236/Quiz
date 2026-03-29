'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import type { QuizFilters } from '../hooks/useQuizFilters';
import type { QuizSubject, QuizChapter, FilterCountsResponse } from '@/lib/quiz-api';
import type { StatusFilter } from '@/types/status.types';

interface FilterPanelProps {
  filters: QuizFilters;
  onFilterChange: (key: keyof QuizFilters, value: string | undefined) => void;
  onReset: () => void;
  subjects: QuizSubject[];
  chapters: QuizChapter[];
  filterCounts: FilterCountsResponse | undefined;
  isLoading: boolean;
}

const LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'];

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  subjects,
  chapters,
  filterCounts,
  isLoading,
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onFilterChange('search', value || undefined);
      }, 300);
    };
  }, [onFilterChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const statusCounts = filterCounts ? {
    total: filterCounts.total,
    published: filterCounts.statusCounts.find(s => s.status === 'published')?.count || 0,
    draft: filterCounts.statusCounts.find(s => s.status === 'draft')?.count || 0,
    trash: filterCounts.statusCounts.find(s => s.status === 'trash')?.count || 0,
  } : { total: 0, published: 0, draft: 0, trash: 0 };

  const selectedFilters = useMemo(() => {
    const result: { key: string; label: string; value: string }[] = [];
    if (filters.subject && filters.subject !== 'all') {
      const subject = subjects.find(s => s.slug === filters.subject);
      if (subject) result.push({ key: 'subject', label: 'Subject', value: subject.name });
    }
    if (filters.chapter && filters.chapter !== 'all') {
      result.push({ key: 'chapter', label: 'Chapter', value: filters.chapter });
    }
    if (filters.level && filters.level !== 'all') {
      result.push({ key: 'level', label: 'Level', value: filters.level });
    }
    if (filters.status && filters.status !== 'all') {
      result.push({ key: 'status', label: 'Status', value: filters.status });
    }
    if (filters.search) {
      result.push({ key: 'search', label: 'Search', value: filters.search });
    }
    return result;
  }, [filters, subjects]);

  const hasFilters = selectedFilters.length > 0;

  return (
    <div className="space-y-4">
      <StatusDashboard
        counts={statusCounts}
        activeFilter={(filters.status as StatusFilter) || 'all'}
        onFilterChange={(filter) => onFilterChange('status', filter === 'all' ? undefined : filter)}
        loading={isLoading}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={filters.subject || 'all'}
              onChange={(e) => onFilterChange('subject', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.slug}>
                  {subject.emoji} {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chapter
            </label>
            <select
              value={filters.chapter || 'all'}
              onChange={(e) => onFilterChange('chapter', e.target.value === 'all' ? undefined : e.target.value)}
              disabled={!filters.subject || chapters.length === 0}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Chapters</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.name}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <select
              value={filters.level || 'all'}
              onChange={(e) => onFilterChange('level', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              {LEVELS.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search questions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
            {selectedFilters.map(filter => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
              >
                {filter.label}: {filter.value}
                <button
                  onClick={() => onFilterChange(filter.key as keyof QuizFilters, undefined)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={onReset}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterPanel;
