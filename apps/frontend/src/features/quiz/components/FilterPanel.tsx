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

  // Sort subjects alphabetically by name
  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  // Get chapters - all when no subject or "all", or filtered by subject when selected
  const filteredChapters = useMemo(() => {
    if (!filters.subject || filters.subject === 'all') {
      return [...chapters].sort((a, b) => a.name.localeCompare(b.name));
    }
    const subject = subjects.find(s => s.slug === filters.subject);
    if (!subject) return [];
    return chapters
      .filter(c => c.subjectId === subject.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [chapters, filters.subject, subjects]);

  const getSubjectName = (slug: string) => {
    const s = subjects.find(s => s.slug === slug);
    return s ? s.emoji + ' ' + s.name : slug;
  };

  const getChapterName = (id: string) => {
    const c = chapters.find(c => c.id === id);
    return c ? c.name : id;
  };

  const hasActiveFilters = Boolean(
    filters.subject ||
    filters.chapter ||
    filters.level ||
    (filters.status && filters.status !== 'published') ||
    filters.search
  );

  return (
    <div className="space-y-4">
      <StatusDashboard
        counts={statusCounts}
        activeFilter={(filters.status as StatusFilter) || 'all'}
        onFilterChange={(filter) => onFilterChange('status', filter === 'all' ? 'all' : filter)}
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
          {sortedSubjects.map(subject => {
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Chapter:</span>
          <button
            onClick={() => onFilterChange('chapter', undefined)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!filters.chapter || filters.chapter === 'all'
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
          >
            All
          </button>
          {filteredChapters.map(chapter => {
            const isSelected = filters.chapter === chapter.id;
            const chapterCount = filterCounts?.chapterCounts?.find(c => c.id === chapter.id)?.count || 0;
            return (
              <ChapterFilterRow
                key={chapter.id}
                chapter={chapter}
                isSelected={isSelected}
                count={chapterCount}
                onSelect={() => onFilterChange('chapter', chapter.id)}
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
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase">Active Filters:</span>
            {filters.subject && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                {getSubjectName(filters.subject)}
                <button onClick={() => onFilterChange('subject', undefined)} className="hover:text-purple-900">×</button>
              </span>
            )}
            {filters.chapter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {getChapterName(filters.chapter)}
                <button onClick={() => onFilterChange('chapter', undefined)} className="hover:text-blue-900">×</button>
              </span>
            )}
            {filters.level && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                {filters.level}
                <button onClick={() => onFilterChange('level', undefined)} className="hover:text-green-900">×</button>
              </span>
            )}
            {filters.status && filters.status !== 'published' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                {filters.status}
                <button onClick={() => onFilterChange('status', 'published')} className="hover:text-yellow-900">×</button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                &ldquo;{filters.search}&rdquo;
                <button onClick={() => onFilterChange('search', undefined)} className="hover:text-gray-900">×</button>
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

export default FilterPanel;
