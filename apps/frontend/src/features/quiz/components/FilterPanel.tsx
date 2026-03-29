'use client';

import { useState, useCallback, useMemo } from 'react';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { SubjectFilterRow } from './SubjectFilterRow';
import { ChapterFilterRow } from './ChapterFilterRow';
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
  onAddSubject: () => void;
  onEditSubject: (subject: QuizSubject) => void;
  onDeleteSubject: (subject: QuizSubject) => void;
  onAddChapter: () => void;
  onEditChapter: (chapter: QuizChapter) => void;
  onDeleteChapter: (chapter: QuizChapter) => void;
}

const LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
  { value: 'extreme', label: 'Extreme' },
];

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  subjects,
  chapters,
  filterCounts,
  isLoading,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
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

  const filteredChapters = useMemo(() => {
    if (!filters.subject) return [];
    return chapters.filter(c => {
      const chapterCount = filterCounts?.chapterCounts?.find(cc => cc.name === c.name)?.count || 0;
      return chapterCount > 0;
    });
  }, [chapters, filters.subject, filterCounts]);

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

      <div className={`space-y-3 rounded-lg border p-4 ${filters.subject ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Subject:</span>
          <button
            onClick={() => onFilterChange('subject', undefined)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!filters.subject || filters.subject === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
          >
            All ({statusCounts.total})
          </button>
          {subjects.map(subject => {
            const subjectCount = filterCounts?.subjects?.find(s => s.name === subject.name)?.count || 0;
            const isSelected = filters.subject === subject.slug;
            return (
              <SubjectFilterRow
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
            className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600"
          >
            + Add
          </button>
        </div>

        {filters.subject && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Chapter:</span>
            <button
              onClick={() => onFilterChange('chapter', undefined)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!filters.chapter || filters.chapter === 'all'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
            >
              All ({filterCounts?.chapterCounts?.reduce((sum, c) => sum + c.count, 0) || 0})
            </button>
            {filteredChapters.map(chapter => {
              const chapterCount = filterCounts?.chapterCounts?.find(cc => cc.name === chapter.name)?.count || 0;
              const isSelected = filters.chapter === chapter.name;
              return (
                <ChapterFilterRow
                  key={chapter.id}
                  chapter={chapter}
                  isSelected={isSelected}
                  count={chapterCount}
                  onSelect={() => onFilterChange('chapter', chapter.name)}
                  onEdit={() => onEditChapter(chapter)}
                  onDelete={() => onDeleteChapter(chapter)}
                />
              );
            })}
            <button
              onClick={onAddChapter}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
            >
              + Add
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Level:</span>
          <button
            onClick={() => onFilterChange('level', undefined)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!filters.level || filters.level === 'all'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All ({statusCounts.total})
          </button>
          {LEVELS.map(({ value, label }) => {
            const levelCount = filterCounts?.levelCounts?.find(l => l.level === value)?.count || 0;
            return (
              <button
                key={value}
                onClick={() => onFilterChange('level', value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filters.level === value
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {label} ({levelCount})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="quiz-search" className="text-sm font-medium text-gray-700">
            Search:
          </label>
          <input
            id="quiz-search"
            type="text"
            placeholder="Type to search questions..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            value={searchInput}
            onChange={handleSearchChange}
          />
          {hasFilters && (
            <button
              onClick={onReset}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
