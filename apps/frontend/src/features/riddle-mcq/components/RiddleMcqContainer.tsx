'use client';

import { useState } from 'react';
import { useRiddleCategories } from '../hooks/useRiddleCategories';
import { useRiddleSubjects } from '../hooks/useRiddleSubjects';
import { CategoryModal } from '../modals/CategoryModal';
import { SubjectModal } from '../modals/SubjectModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { RiddleCategory, RiddleSubject } from '@/lib/riddle-mcq-api';

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
  const categoriesQuery = useRiddleCategories();
  const subjectsQuery = useRiddleSubjects();

  const [categoryModal, setCategoryModal] = useState<ModalState<RiddleCategory>>({ open: false });
  const [subjectModal, setSubjectModal] = useState<ModalState<RiddleSubject>>({ open: false });

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const categories = categoriesQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];

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

  const isLoading = categoriesQuery.isLoading || subjectsQuery.isLoading;
  const isError = categoriesQuery.isError || subjectsQuery.isError;
  const error = categoriesQuery.error || subjectsQuery.error;
  const isPending = categoriesQuery.isPending || subjectsQuery.isPending;

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
    <div className="space-y-8 p-6">
      {/* Categories Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">🗂️ Categories</h3>
            <p className="text-sm text-gray-500">{categories.length} categories</p>
          </div>
          <button
            onClick={() => setCategoryModal({ open: true })}
            className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
          >
            + Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 shadow-sm dark:border-purple-800 dark:bg-purple-900/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                    <p className="text-xs text-gray-500">Order: {category.order}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCategoryModal({ open: true, item: category })}
                    className="rounded p-1 text-gray-400 hover:bg-purple-100 hover:text-blue-500 dark:hover:bg-purple-800"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="rounded p-1 text-gray-400 hover:bg-purple-100 hover:text-red-500 dark:hover:bg-purple-800"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    category.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              No categories yet. Click &quot;Add Category&quot; to create one.
            </div>
          )}
        </div>
      </div>

      {/* Subjects Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">📚 Subjects</h3>
            <p className="text-sm text-gray-500">{subjects.length} subjects</p>
          </div>
          <button
            onClick={() => setSubjectModal({ open: true })}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-white transition-colors hover:bg-indigo-600"
          >
            + Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const category = categories.find((c) => c.id === subject.categoryId);
            return (
              <div
                key={subject.id}
                className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-800 dark:bg-indigo-900/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{subject.emoji}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{subject.name}</h4>
                      <p className="text-xs text-gray-500">
                        {category ? `${category.emoji} ${category.name}` : 'No category'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSubjectModal({ open: true, item: subject })}
                      className="rounded p-1 text-gray-400 hover:bg-indigo-100 hover:text-blue-500 dark:hover:bg-indigo-800"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject)}
                      className="rounded p-1 text-gray-400 hover:bg-indigo-100 hover:text-red-500 dark:hover:bg-indigo-800"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      subject.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {subject.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    Order: {subject.order}
                  </span>
                </div>
              </div>
            );
          })}

          {subjects.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              No subjects yet. Click &quot;Add Subject&quot; to create one.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        open={categoryModal.open}
        category={categoryModal.item}
        onClose={() => setCategoryModal({ open: false })}
        onSubmit={handleCategorySubmit}
        isSubmitting={isPending}
      />

      <SubjectModal
        open={subjectModal.open}
        subject={subjectModal.item}
        categories={categories}
        onClose={() => setSubjectModal({ open: false })}
        onSubmit={handleSubjectSubmit}
        isSubmitting={isPending}
      />

      {/* Confirm Dialog */}
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
