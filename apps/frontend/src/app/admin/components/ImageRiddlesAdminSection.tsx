/**
 * ============================================================================
 * ImageRiddlesAdminSection — thin composition layer
 * ============================================================================
 * Full implementation lives in features/image-riddles/admin/ (lib/hooks/
 * components). This file only wires the hooks to the presentational
 * components; no business logic lives here. Admin interface for managing
 * image riddles: list with filtering/sorting, add/edit modal, CSV/JSON
 * import-export, bulk actions, and category management. Structural refactor
 * of the former 2090-LOC monolith — behavior unchanged.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import { toast } from '@/lib/toast';
import { downloadFile } from '@/app/admin/utils';
import { getImageRiddlesDashboardStats } from '@/lib/image-riddles-api';

import {
  AdminRiddlesPagination,
  AdminRiddlesTable,
  AdminRiddlesToolbar,
  AdminSectionModals,
  CategoryFilterRow,
  DifficultyFilterRow,
} from '@/features/image-riddles/admin/components';
import {
  useAdminImageRiddleBulk,
  useAdminImageRiddleCategories,
  useAdminImageRiddleData,
  useAdminImageRiddleDelete,
  useAdminImageRiddleFilters,
  useAdminImageRiddleForm,
  useAdminImageRiddleImport,
  ADMIN_ITEMS_PER_PAGE,
} from '@/features/image-riddles/admin/hooks';
import {
  imageRiddlesToCSV,
  imageRiddlesToJSON,
} from '@/features/image-riddles/admin/lib/import-export';

export function ImageRiddlesAdminSection(): JSX.Element {
  const [isSaving, setIsSaving] = useState(false);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState<boolean>(false);
  // Engagement counters (plan/04 P1): written by the play flow, surfaced here.
  const [engagement, setEngagement] = useState<{
    views: number;
    attempts: number;
    solves: number;
  } | null>(null);

  useEffect(() => {
    getImageRiddlesDashboardStats()
      .then((stats) => setEngagement(stats.engagement ?? null))
      .catch(() => undefined);
  }, []);

  const data = useAdminImageRiddleData();
  const filters = useAdminImageRiddleFilters(data.imageRiddles);
  const categories = useAdminImageRiddleCategories({
    setCategories: data.setCategories,
    setImageRiddles: data.setImageRiddles,
    loadData: data.loadData,
    filterCategory: filters.filterCategory,
    setFilterCategory: filters.setFilterCategory,
  });
  const form = useAdminImageRiddleForm({
    categories: data.categories,
    setImageRiddles: data.setImageRiddles,
    categoryIdByName: data.categoryIdByName,
    setIsSaving,
  });
  const deleter = useAdminImageRiddleDelete({
    setImageRiddles: data.setImageRiddles,
    loadData: data.loadData,
  });
  const bulk = useAdminImageRiddleBulk({
    allFilteredIds: filters.filteredRiddles.map((r) => r.id),
    setImageRiddles: data.setImageRiddles,
    loadData: data.loadData,
  });
  const importer = useAdminImageRiddleImport({
    categories: data.categories,
    setCategories: data.setCategories,
    loadData: data.loadData,
    isSaving,
    setIsSaving,
  });

  const handleExportCSV = useCallback(() => {
    downloadFile(
      imageRiddlesToCSV(filters.filteredRiddles),
      `image-riddles_export_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }, [filters.filteredRiddles]);

  const handleExportJSON = useCallback(() => {
    downloadFile(
      imageRiddlesToJSON(filters.filteredRiddles),
      `image-riddles_export_${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  }, [filters.filteredRiddles]);

  const confirmSyncDefaults = useCallback(async () => {
    setShowSyncConfirmModal(false);
    await data.loadData();
    toast.success('🔄 Synced with server!');
  }, [data]);

  return (
    <div className="space-y-6">
      {engagement && (
        <div className="flex flex-wrap gap-3 text-sm">
          {(
            [
              ['Views', engagement.views],
              ['Attempts', engagement.attempts],
              ['Solves', engagement.solves],
            ] as const
          ).map(([label, value]) => (
            <span
              key={label}
              className="rounded-full bg-white px-4 py-1.5 font-bold text-secondary-700 shadow-sm dark:bg-secondary-800 dark:text-secondary-200"
            >
              {label}: <span className="tabular-nums">{value.toLocaleString()}</span>
            </span>
          ))}
        </div>
      )}
      <StatusDashboard
        counts={filters.statusCounts}
        activeFilter={filters.statusFilter}
        onFilterChange={filters.setStatusFilter}
        loading={false}
      />

      <AdminRiddlesToolbar
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        hasActiveFilters={filters.hasActiveFilters}
        onClearFilters={filters.clearFilters}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onOpenImport={() => importer.setShowImportModal(true)}
        onReload={() => setShowSyncConfirmModal(true)}
        onUndo={deleter.handleUndoDelete}
        canUndo={Boolean(deleter.lastDeletedRef.current)}
        onOpenAdd={() => form.setShowAddModal(true)}
      />

      <CategoryFilterRow
        categories={data.categories}
        categoryCounts={filters.categoryCounts}
        totalCount={filters.filteredRiddles.length}
        filterCategory={filters.filterCategory}
        onSelectCategory={filters.setFilterCategory}
        onEditCategory={categories.openEditCategory}
        onDeleteCategory={categories.openDeleteCategory}
        onAddCategory={categories.openAddCategory}
      />

      <DifficultyFilterRow
        difficultyCounts={filters.difficultyCounts}
        totalCount={filters.filteredRiddles.length}
        filterDifficulty={filters.filterDifficulty}
        onSelectDifficulty={filters.setFilterDifficulty}
      />

      <BulkActionToolbar
        selectedIds={bulk.selectedIds}
        totalItems={filters.filteredRiddles.length}
        currentFilter={filters.statusFilter}
        onSelectAll={bulk.selectAll}
        onDeselectAll={bulk.deselectAll}
        onAction={bulk.handleBulkAction}
        onClose={bulk.deselectAll}
        loading={bulk.bulkActionLoading}
      />

      <AdminRiddlesTable
        riddles={filters.paginatedRiddles}
        isLoading={data.isLoadingData}
        startIndex={(filters.currentPage - 1) * ADMIN_ITEMS_PER_PAGE}
        selectedIds={bulk.selectedIds}
        sortConfig={filters.sortConfig}
        onSort={filters.handleSort}
        onToggleSelection={bulk.toggleSelection}
        onSelectAll={bulk.selectAll}
        onDeselectAll={bulk.deselectAll}
        onEdit={form.openEditModal}
        onDuplicate={form.handleDuplicateRiddle}
        onTrash={deleter.openTrashConfirm}
        onCycleStatus={bulk.cycleStatus}
      />

      <AdminRiddlesPagination
        totalCount={filters.filteredRiddles.length}
        currentPage={filters.currentPage}
        totalPages={filters.totalPages}
        pageInput={filters.pageInput}
        onPageInputChange={filters.handlePageInputChange}
        onPageInputSubmit={filters.handlePageInputSubmit}
        onPrev={filters.goToPrevPage}
        onNext={filters.goToNextPage}
      />

      <AdminSectionModals
        form={form}
        deleter={deleter}
        categories={categories}
        importer={importer}
        categoryList={data.categories}
        isSaving={isSaving}
        showSyncConfirmModal={showSyncConfirmModal}
        onCloseSyncConfirmModal={() => setShowSyncConfirmModal(false)}
        onConfirmSync={confirmSyncDefaults}
      />
    </div>
  );
}
