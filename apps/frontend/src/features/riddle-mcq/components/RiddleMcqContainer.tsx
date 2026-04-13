'use client';

import { useState } from 'react';
import { useRiddleMcqCategories } from '../hooks/useRiddleMcqCategories';
import { useRiddleMcqSubjects } from '../hooks/useRiddleMcqSubjects';
import { useRiddleMcqQuestions } from '../hooks/useRiddleMcqQuestions';
import { RiddleMcqHeader } from './RiddleMcqHeader';
import { RiddleMcqFilterPanel } from './RiddleMcqFilterPanel';
import { RiddleMcqCategoryModal } from '../modals/RiddleMcqCategoryModal';
import { RiddleMcqSubjectModal } from '../modals/RiddleMcqSubjectModal';
import { RiddleMcqModal } from '../modals/RiddleMcqModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const categoriesQuery = useRiddleMcqCategories();
  const subjectsQuery = useRiddleMcqSubjects();

  const [riddleFilters, setRiddleFilters] = useState({
    category: '',
    subject: '',
    level: '',
    status: '',
    search: '',
  });
  const [riddlePage, setRiddlePage] = useState(1);

  const riddlesQuery = useRiddleMcqQuestions(riddleFilters, riddlePage, 10);

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
  const riddlesTotalPages = Math.ceil(riddlesTotal / 10);

  const handleFilterChange = (key: string, value: string | undefined) => {
    setRiddleFilters((prev) => ({ ...prev, [key]: value || '' }));
    setRiddlePage(1);
  };

  const handleResetFilters = () => {
    setRiddleFilters({ category: '', subject: '', level: '', status: '', search: '' });
    setRiddlePage(1);
  };

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
        totalRiddles={riddlesTotal}
        onAddRiddle={() => setRiddleModal({ open: true })}
        onImport={() => {}}
        onExport={() => {}}
      />

      <RiddleMcqFilterPanel
        filters={riddleFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
        subjects={subjects}
        filterCounts={undefined}
        isLoading={riddlesQuery.isLoading}
        onAddCategory={() => setCategoryModal({ open: true })}
        onEditCategory={(c) => setCategoryModal({ open: true, item: c })}
        onDeleteCategory={handleDeleteCategory}
        onAddSubject={() => setSubjectModal({ open: true })}
        onEditSubject={(s) => setSubjectModal({ open: true, item: s })}
        onDeleteSubject={handleDeleteSubject}
      />

      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
            <thead className="bg-gray-50 dark:bg-secondary-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-32">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
              {riddles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-secondary-400"
                  >
                    No riddles found. Click &quot;Add Riddle&quot; to create one.
                  </td>
                </tr>
              ) : (
                riddles.map((riddle) => {
                  const subject = subjects.find((s) => s.id === riddle.subjectId);
                  return (
                    <tr key={riddle.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                      <td className="px-4 py-3">
                        <div
                          className="text-sm text-gray-900 dark:text-secondary-100 line-clamp-2"
                          title={riddle.question}
                        >
                          {riddle.question}
                        </div>
                        {riddle.hint && (
                          <div className="text-xs text-gray-400 dark:text-secondary-500 mt-1">
                            💡 Hint available
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            riddle.level === 'easy'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : riddle.level === 'medium'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : riddle.level === 'hard'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {riddle.level === 'easy' && '🌱 Easy'}
                          {riddle.level === 'medium' && '🌿 Medium'}
                          {riddle.level === 'hard' && '🌲 Hard'}
                          {riddle.level === 'expert' && '🔥 Expert'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-secondary-300">
                          {subject ? `${subject.emoji} ${subject.name}` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            riddle.status === 'published'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : riddle.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {riddle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setRiddleModal({ open: true, item: riddle })}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteRiddle(riddle)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {riddlesTotalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-secondary-900 border-t border-gray-200 dark:border-secondary-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-secondary-400">
              Page {riddlePage} of {riddlesTotalPages} ({riddlesTotal} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setRiddlePage((p) => Math.max(1, p - 1))}
                disabled={riddlePage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-secondary-700"
              >
                Previous
              </button>
              <button
                onClick={() => setRiddlePage((p) => Math.min(riddlesTotalPages, p + 1))}
                disabled={riddlePage === riddlesTotalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-secondary-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
