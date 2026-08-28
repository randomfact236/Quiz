/**
 * ============================================================================
 * AdminSectionModals — all modal instances for the image riddles admin
 * ============================================================================
 * Pure composition: receives the already-wired hook bundles and renders the
 * import / add-edit / trash / category / delete-category / media-picker /
 * reload-confirm dialogs.
 * ============================================================================
 */

'use client';

import { MediaPicker } from '@/components/admin/MediaPicker';
import type { AdminImageRiddleCategory } from '../hooks/useAdminImageRiddleData';
import type { useAdminImageRiddleCategories } from '../hooks/useAdminImageRiddleCategories';
import type { useAdminImageRiddleDelete } from '../hooks/useAdminImageRiddleDelete';
import type { useAdminImageRiddleForm } from '../hooks/useAdminImageRiddleForm';
import type { useAdminImageRiddleImport } from '../hooks/useAdminImageRiddleImport';
import { defaultFormState } from '../lib/form';
import {
  CategoryModal,
  DeleteCategoryConfirmModal,
  ImportModal,
  RiddleFormModal,
  SyncConfirmModal,
  TrashConfirmModal,
} from './index';

type FormBundle = ReturnType<typeof useAdminImageRiddleForm>;
type DeleteBundle = ReturnType<typeof useAdminImageRiddleDelete>;
type CategoriesBundle = ReturnType<typeof useAdminImageRiddleCategories>;
type ImportBundle = ReturnType<typeof useAdminImageRiddleImport>;

export interface AdminSectionModalsProps {
  form: FormBundle;
  deleter: DeleteBundle;
  categories: CategoriesBundle;
  importer: ImportBundle;
  categoryList: AdminImageRiddleCategory[];
  isSaving: boolean;
  showSyncConfirmModal: boolean;
  onCloseSyncConfirmModal: () => void;
  onConfirmSync: () => void;
}

export default function AdminSectionModals({
  form,
  deleter,
  categories,
  importer,
  categoryList,
  isSaving,
  showSyncConfirmModal,
  onCloseSyncConfirmModal,
  onConfirmSync,
}: AdminSectionModalsProps) {
  return (
    <>
      {importer.showImportModal && (
        <ImportModal
          importPreview={importer.importPreview}
          importError={importer.importError}
          importWarnings={importer.importWarnings}
          fileInputRef={importer.fileInputRef}
          modalRef={importer.importModalRef}
          onFileUpload={importer.handleFileUpload}
          onConfirm={() => importer.handleConfirmImport(categoryList)}
          onBack={importer.backToUpload}
          onClose={importer.closeImportModal}
        />
      )}

      {(form.showAddModal || form.showEditModal) && (
        <RiddleFormModal
          isAdd={form.showAddModal}
          form={form.riddleForm}
          selectedRiddle={form.selectedRiddle}
          categories={categoryList}
          isSaving={isSaving}
          modalRef={form.showAddModal ? form.addModalRef : form.editModalRef}
          onChange={(patch) => form.setRiddleForm((prev) => ({ ...prev, ...patch }))}
          onSubmit={form.showAddModal ? form.handleAddRiddle : form.handleEditRiddle}
          onCancel={() => {
            form.setShowAddModal(false);
            form.setShowEditModal(false);
            form.setRiddleForm(defaultFormState);
          }}
          onOpenMediaPicker={() => form.setShowMediaPicker(true)}
        />
      )}

      {deleter.showTrashConfirm && deleter.trashTarget && (
        <TrashConfirmModal
          riddle={deleter.trashTarget}
          onCancel={deleter.cancelTrashConfirm}
          onConfirm={deleter.handleTrashImageRiddle}
        />
      )}

      {(categories.showAddCategoryModal || categories.showEditCategoryModal) && (
        <CategoryModal
          isAdd={categories.showAddCategoryModal}
          form={categories.categoryForm}
          onChange={(patch) => categories.setCategoryForm((prev) => ({ ...prev, ...patch }))}
          onSubmit={
            categories.showAddCategoryModal
              ? categories.handleAddCategory
              : categories.handleEditCategory
          }
          onClose={categories.closeCategoryModals}
        />
      )}

      {categories.showDeleteCategoryConfirm && (
        <DeleteCategoryConfirmModal
          categoryName={categories.selectedCategory?.name}
          onCancel={() => categories.setShowDeleteCategoryConfirm(false)}
          onConfirm={categories.handleDeleteCategory}
        />
      )}

      <MediaPicker
        open={form.showMediaPicker}
        onOpenChange={form.setShowMediaPicker}
        onSelect={({ url }) => form.setRiddleForm((prev) => ({ ...prev, imageUrl: url }))}
      />

      {showSyncConfirmModal && (
        <SyncConfirmModal onCancel={onCloseSyncConfirmModal} onConfirm={onConfirmSync} />
      )}
    </>
  );
}
