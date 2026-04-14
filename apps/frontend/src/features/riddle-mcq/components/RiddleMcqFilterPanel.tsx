'use client';

import { useState, useCallback, useMemo } from 'react';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { CategoryFilterRow } from './CategoryFilterRow';
import { RiddleSubjectFilterRow } from './RiddleSubjectFilterRow';
import type { RiddleCategory, RiddleSubject } from '@/lib/riddle-mcq-api';
import type { StatusFilter } from '@/types/status.types';

interface RiddleFilters {
  category?: string;
  subject?: string;
  level?: string;
  status?: string;
  search?: string;
}

interface RiddleFilterCounts {
  categoryCounts: { id: string; name: string; emoji: string; count: number }[];
  subjectCounts: {
    id: string;
    name: string;
    emoji: string;
    categoryId: string | null;
    count: number;
  }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}

interface RiddleMcqFilterPanelProps {
  filters: RiddleFilters;
  onFilterChange: (key: keyof RiddleFilters, value: string | undefined) => void;
  onReset: () => void;
  categories: RiddleCategory[];
  subjects: RiddleSubject[];
  filterCounts: RiddleFilterCounts | undefined;
  isLoading: boolean;
  onAddCategory: () => void;
  onEditCategory: (category: RiddleCategory) => void;
  onDeleteCategory: (category: RiddleCategory) => void;
  onAddSubject: () => void;
  onEditSubject: (subject: RiddleSubject) => void;
  onDeleteSubject: (subject: RiddleSubject) => void;
}

const LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export function RiddleMcqFilterPanel({
  filters,
  onFilterChange,
  onReset,
  categories,
  subjects,
  filterCounts,
  isLoading,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
}: RiddleMcqFilterPanelProps) {
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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const statusCounts = filterCounts
    ? {
        total: filterCounts.total,
        published: filterCounts.statusCounts?.find((s) => s.status === 'published')?.count ?? 0,
        draft: filterCounts.statusCounts?.find((s) => s.status === 'draft')?.count ?? 0,
        trash: filterCounts.statusCounts?.find((s) => s.status === 'trash')?.count ?? 0,
      }
    : { total: 0, published: 0, draft: 0, trash: 0 };

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!filters.category || filters.category === 'all') {
      return sortedSubjects;
    }
    return sortedSubjects.filter((s) => s.category?.slug === filters.category);
  }, [sortedSubjects, filters.category]);

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.subject ||
    filters.level ||
    (filters.status && filters.status !== 'all' && filters.status !== '') ||
    filters.search
  );

  const handleCategoryChange = (categorySlug: string | undefined) => {
    onFilterChange('category', categorySlug);
    onFilterChange('subject', undefined);
  };

  return (
    <div className="space-y-4">
      <StatusDashboard
        counts={statusCounts}
        activeFilter={
          (filters.status && filters.status !== '' ? filters.status : 'all') as StatusFilter
        }
        onFilterChange={(filter) => onFilterChange('status', filter === 'all' ? 'all' : filter)}
        loading={isLoading}
      />

      <div
        className={`space-y-3 rounded-lg border p-4 ${
          filters.category ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'
        }`}
      >
        {/* Category Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Category:</span>
          <button
            onClick={() => handleCategoryChange(undefined)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !filters.category || filters.category === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {sortedCategories.map((category) => {
            const categoryCount =
              filterCounts?.categoryCounts?.find((c) => c.id === category.id)?.count || 0;
            const isSelected = filters.category === category.slug;
            return (
              <CategoryFilterRow
                key={category.id}
                category={category}
                isSelected={isSelected}
                count={categoryCount}
                onSelect={() => handleCategoryChange(category.slug)}
                onEdit={() => onEditCategory(category)}
                onDelete={() => onDeleteCategory(category)}
              />
            );
          })}
          <button
            onClick={onAddCategory}
            className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600"
          >
            + Add
          </button>
        </div>

        {/* Subject Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Subject:</span>
          <button
            onClick={() => onFilterChange('subject', undefined)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !filters.subject || filters.subject === 'all'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {filteredSubjects.map((subject) => {
            const subjectCount =
              filterCounts?.subjectCounts?.find((s) => s.id === subject.id)?.count || 0;
            const isSelected = filters.subject === subject.slug;
            return (
              <RiddleSubjectFilterRow
                key={subject.id}
                subject={subject}
                isSelected={isSelected}
                count={subjectCount}
                onSelect={() => onFilterChange('subject', subject.slug)}
                onEdit={() => onEditSubject(subject)}
                onDelete={() => onDeleteSubject(subject)}
              />
            );
          })}
          <button
            onClick={onAddSubject}
            className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
          >
            + Add
          </button>
        </div>

        {/* Level Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Level:</span>
          <button
            onClick={() => onFilterChange('level', undefined)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !filters.level || filters.level === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {LEVELS.map(({ value, label }) => {
            const levelCount =
              filterCounts?.levelCounts?.find((l) => l.level === value)?.count || 0;
            return (
              <button
                key={value}
                onClick={() => onFilterChange('level', value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.level === value
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({levelCount})
              </button>
            );
          })}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-2">
          <label htmlFor="riddle-search" className="text-sm font-medium text-gray-700">
            Search:
          </label>
          <input
            id="riddle-search"
            type="text"
            placeholder="Type to search riddles..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase">Active Filters:</span>
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                {categories.find((c) => c.slug === filters.category)?.emoji}{' '}
                {categories.find((c) => c.slug === filters.category)?.name}
                <button
                  onClick={() => handleCategoryChange(undefined)}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.subject && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {subjects.find((s) => s.slug === filters.subject)?.emoji}{' '}
                {subjects.find((s) => s.slug === filters.subject)?.name}
                <button
                  onClick={() => onFilterChange('subject', undefined)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.level && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                {filters.level}
                <button
                  onClick={() => onFilterChange('level', undefined)}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                &ldquo;{filters.search}&rdquo;
                <button
                  onClick={() => onFilterChange('search', undefined)}
                  className="hover:text-gray-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={onReset}
              className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full hover:bg-red-200"
            >
              Clear All ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiddleMcqFilterPanel;
