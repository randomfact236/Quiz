'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRiddleMcqCategories } from '../hooks/useRiddleMcqCategories';
import { useRiddleMcqSubjects } from '../hooks/useRiddleMcqSubjects';
import { useRiddleMcqQuestions } from '../hooks/useRiddleMcqQuestions';
import { useRiddleMcqFilterCounts } from '../hooks/useRiddleMcqFilterCounts';
import { useRiddleMcqFilters } from '../hooks/useRiddleMcqFilters';
import { useRiddleMutations } from '../hooks/useRiddleMutations';
import { RiddleMcqHeader } from './RiddleMcqHeader';
import { RiddleMcqFilterPanel } from './RiddleMcqFilterPanel';
import { RiddleTable } from './RiddleTable';
import { RiddleMcqCategoryModal } from '../modals/RiddleMcqCategoryModal';
import { RiddleMcqSubjectModal } from '../modals/RiddleMcqSubjectModal';
import { RiddleMcqModal } from '../modals/RiddleMcqModal';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { StatusFilter, BulkActionType } from '@/types/status.types';
import type { RiddleCategory, RiddleSubject } from '@/lib/riddle-mcq-api';
import type { RiddleMcq } from '@/types/riddles';
import type { CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';

interface ModalState<T> {
  open: boolean;
  item?: T;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function RiddleMcqContainer() {
  const router = useRouter();
  const pathname = usePathname();

  const categoriesQuery = useRiddleMcqCategories();
  const subjectsQuery = useRiddleMcqSubjects();

  const { filters, setFilter, setSearch, page, setPage, resetFilters } = useRiddleMcqFilters();
  const isInitialMount = useRef(true);
  const [pageSize, setPageSize] = useState(10);

  const riddlesQuery = useRiddleMcqQuestions(filters, page, pageSize);
  const filterCountsQuery = useRiddleMcqFilterCounts(
    filters.category,
    filters.subject,
    filters.level
  );

  const { bulkAction, isBulkActionLoading } = useRiddleMutations();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [categoryModal, setCategoryModal] = useState<ModalState<RiddleCategory>>({ open: false });
  const [subjectModal, setSubjectModal] = useState<ModalState<RiddleSubject>>({ open: false });
  const [riddleModal, setRiddleModal] = useState<ModalState<RiddleMcq>>({ open: false });

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const categories = categoriesQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const riddles = riddlesQuery.data?.data ?? [];
  const riddlesTotal = riddlesQuery.data?.total ?? 0;
  const riddlesTotalPages = Math.ceil(riddlesTotal / pageSize);

  const debouncedSetSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearch(value);
        }, 300);
      };
    })(),
    [setSearch]
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    params.set('section', 'riddle-mcq');
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.subject !== 'all') params.set('subject', filters.subject);
    if (filters.level !== 'all') params.set('level', filters.level);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    params.set('page', String(page));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, page, pathname, router]);

  const handleDeleteCategory = (category: RiddleCategory) => {
    setConfirm({
      open: true,
      title: 'Delete Category',
      message: `Delete category "${category.name}"? This will also delete all subjects and riddles in this category.`,
      onConfirm: () => {
        categoriesQuery.delete(category.id);
        setConfirm((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleDeleteSubject = (subject: RiddleSubject) => {
    setConfirm({
      open: true,
      title: 'Delete Subject',
      message: `Delete subject "${subject.name}"? This will also delete all riddles in this subject.`,
      onConfirm: () => {
        subjectsQuery.delete(subject.id);
        setConfirm((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleDeleteRiddle = (riddle: RiddleMcq) => {
    setConfirm({
      open: true,
      title: 'Delete Riddle',
      message: `Delete this riddle?`,
      onConfirm: () => {
        riddlesQuery.delete(riddle.id);
        setConfirm((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleCategorySubmit = async (data: any) => {
    if (categoryModal.item) {
      await categoriesQuery.updateAsync({ id: categoryModal.item.id, dto: data });
    } else {
      await categoriesQuery.createAsync(data);
    }
    setCategoryModal({ open: false });
  };

  const handleSubjectSubmit = async (data: any) => {
    if (subjectModal.item) {
      await subjectsQuery.updateAsync({ id: subjectModal.item.id, dto: data });
    } else {
      await subjectsQuery.createAsync(data);
    }
    setSubjectModal({ open: false });
  };

  const handleRiddleSubmit = async (dto: CreateRiddleMcqDto) => {
    if (riddleModal.item) {
      await riddlesQuery.updateAsync({ id: riddleModal.item.id, dto });
    } else {
      await riddlesQuery.createAsync(dto);
    }
    setRiddleModal({ open: false });
  };

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(riddles.map((r) => r.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [riddles]
  );

  const handleBulkAction = useCallback(
    async (action: BulkActionType) => {
      if (selectedIds.size === 0) return;
      try {
        await bulkAction({ ids: Array.from(selectedIds), action });
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    },
    [selectedIds, bulkAction]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    [setPage]
  );

  const isLoading = categoriesQuery.isLoading || subjectsQuery.isLoading;
  const isError = categoriesQuery.isError || subjectsQuery.isError;
  const error = categoriesQuery.error || subjectsQuery.error;
  const isPending = categoriesQuery.isPending || subjectsQuery.isPending || riddlesQuery.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">Failed to load data</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => {
              categoriesQuery.refetch();
              subjectsQuery.refetch();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RiddleMcqHeader
        onAddRiddle={() => setRiddleModal({ open: true })}
        onImport={() => {}}
        onExport={() => {}}
      />

      <RiddleMcqFilterPanel
        filters={filters}
        onFilterChange={setFilter}
        onSearchChange={debouncedSetSearch}
        onReset={resetFilters}
        categories={categories}
        subjects={subjects}
        filterCounts={filterCountsQuery.data}
        isLoading={filterCountsQuery.isLoading}
        onAddCategory={() => setCategoryModal({ open: true })}
        onEditCategory={(c) => setCategoryModal({ open: true, item: c })}
        onDeleteCategory={handleDeleteCategory}
        onAddSubject={() => setSubjectModal({ open: true })}
        onEditSubject={(s) => setSubjectModal({ open: true, item: s })}
        onDeleteSubject={handleDeleteSubject}
      />

      {selectedIds.size > 0 && (
        <BulkActionToolbar
          selectedIds={Array.from(selectedIds)}
          totalItems={riddlesTotal}
          currentFilter={filters.status as StatusFilter}
          onSelectAll={() => handleSelectAll(true)}
          onDeselectAll={() => handleSelectAll(false)}
          onAction={handleBulkAction}
          onClose={() => setSelectedIds(new Set())}
          loading={isBulkActionLoading}
        />
      )}

      <RiddleTable
        riddles={riddles}
        subjects={subjects}
        riddlePage={page}
        riddlesTotalPages={riddlesTotalPages}
        riddlesTotal={riddlesTotal}
        pageSize={pageSize}
        selectedIds={selectedIds}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onEditRiddle={(r) => setRiddleModal({ open: true, item: r })}
        onDeleteRiddle={handleDeleteRiddle}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      <RiddleMcqCategoryModal
        open={categoryModal.open}
        category={categoryModal.item}
        onClose={() => setCategoryModal({ open: false })}
        onSubmit={handleCategorySubmit}
        isSubmitting={isPending}
      />

      <RiddleMcqSubjectModal
        open={subjectModal.open}
        subject={subjectModal.item}
        categories={categories}
        onClose={() => setSubjectModal({ open: false })}
        onSubmit={handleSubjectSubmit}
        isSubmitting={isPending}
      />

      <RiddleMcqModal
        open={riddleModal.open}
        riddle={riddleModal.item}
        subjects={subjects}
        categories={categories}
        onClose={() => setRiddleModal({ open: false })}
        onSubmit={handleRiddleSubmit}
        isSubmitting={riddlesQuery.isPending}
      />

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm((prev) => ({ ...prev, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

export default RiddleMcqContainer;
