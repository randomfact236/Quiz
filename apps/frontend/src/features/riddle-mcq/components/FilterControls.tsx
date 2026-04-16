'use client';

import { useMemo } from 'react';
import { CategoryFilterRow } from './CategoryFilterRow';
import { RiddleMcqSubjectFilterRow } from './RiddleMcqSubjectFilterRow';
import type { RiddleMcqCategory, RiddleMcqSubject } from '@/lib/riddle-mcq-api';

interface FilterControlsProps {
  filters: {
    category?: string;
    subject?: string;
    level?: string;
  };
  categories: RiddleMcqCategory[];
  subjects: RiddleMcqSubject[];
  filterCounts?:
    | {
        categoryCounts?: { id: string; count: number }[];
        subjectCounts?: { id: string; count: number }[];
        levelCounts?: { level: string; count: number }[];
      }
    | undefined;
  onCategoryChange: (categorySlug: string | undefined) => void;
  onSubjectChange: (subjectSlug: string | undefined) => void;
  onLevelChange: (level: string | undefined) => void;
  onAddCategory: () => void;
  onEditCategory: (category: RiddleMcqCategory) => void;
  onDeleteCategory: (category: RiddleMcqCategory) => void;
  onAddSubject: () => void;
  onEditSubject: (subject: RiddleMcqSubject) => void;
  onDeleteSubject: (subject: RiddleMcqSubject) => void;
}

const LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export function FilterControls({
  filters,
  categories,
  subjects,
  filterCounts,
  onCategoryChange,
  onSubjectChange,
  onLevelChange,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
}: FilterControlsProps) {
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

  return (
    <>
      {/* Category Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Category:</span>
        <button
          onClick={() => onCategoryChange(undefined)}
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
              onSelect={() => onCategoryChange(category.slug)}
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
          onClick={() => onSubjectChange(undefined)}
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
            <RiddleMcqSubjectFilterRow
              key={subject.id}
              subject={subject}
              isSelected={isSelected}
              count={subjectCount}
              onSelect={() => onSubjectChange(subject.slug)}
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
          onClick={() => onLevelChange(undefined)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            !filters.level || filters.level === 'all'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {LEVELS.map(({ value, label }) => {
          const levelCount = filterCounts?.levelCounts?.find((l) => l.level === value)?.count || 0;
          return (
            <button
              key={value}
              onClick={() => onLevelChange(value)}
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
    </>
  );
}
