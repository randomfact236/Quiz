'use client';

import { useMemo } from 'react';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { FilterControls } from './FilterControls';
import { SearchInput } from './SearchInput';
import { ActiveFiltersBadge } from './ActiveFiltersBadge';
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
  onFilterChange: (key: string, value: string | undefined) => void;
  onSearchChange: (value: string) => void;
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

export function RiddleMcqFilterPanel({
  filters,
  onFilterChange,
  onSearchChange,
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
  const statusCounts = useMemo(() => {
    if (!filterCounts) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }
    return {
      total: filterCounts.total,
      published: filterCounts.statusCounts?.find((s) => s.status === 'published')?.count ?? 0,
      draft: filterCounts.statusCounts?.find((s) => s.status === 'draft')?.count ?? 0,
      trash: filterCounts.statusCounts?.find((s) => s.status === 'trash')?.count ?? 0,
    };
  }, [filterCounts]);

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
        <FilterControls
          filters={filters}
          categories={categories}
          subjects={subjects}
          filterCounts={filterCounts}
          onCategoryChange={handleCategoryChange}
          onSubjectChange={(slug) => onFilterChange('subject', slug)}
          onLevelChange={(level) => onFilterChange('level', level)}
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onAddSubject={onAddSubject}
          onEditSubject={onEditSubject}
          onDeleteSubject={onDeleteSubject}
        />

        <SearchInput value={filters.search || ''} onChange={onSearchChange} />

        <ActiveFiltersBadge
          filters={filters}
          categories={categories}
          subjects={subjects}
          onRemoveCategory={() => handleCategoryChange(undefined)}
          onRemoveSubject={() => onFilterChange('subject', undefined)}
          onRemoveLevel={() => onFilterChange('level', undefined)}
          onRemoveSearch={() => onFilterChange('search', undefined)}
          onClearAll={onReset}
        />
      </div>
    </div>
  );
}

export default RiddleMcqFilterPanel;
