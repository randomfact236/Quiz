'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { RiddleMcqSubject, RiddleMcqCategory } from '@/lib/riddle-mcq-api';

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  emoji: z.string().min(1, 'Emoji is required'),
  categoryId: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface RiddleMcqSubjectModalProps {
  open: boolean;
  subject: RiddleMcqSubject | undefined;
  categories: RiddleMcqCategory[];
  onClose: () => void;
  onSubmit: (data: SubjectFormData) => void;
  isSubmitting?: boolean;
}

export function RiddleMcqSubjectModal({
  open,
  subject,
  categories,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RiddleMcqSubjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      emoji: '🧩',
      categoryId: null,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        subject || {
          name: '',
          emoji: '🧩',
          categoryId: null,
          isActive: true,
        }
      );
    }
  }, [open, subject, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {subject ? 'Edit Subject' : 'Add Subject'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Emoji
            </label>
            <input
              {...register('emoji')}
              placeholder="🧩"
              className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.emoji && <p className="mt-1 text-sm text-red-500">{errors.emoji.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              {...register('categoryId')}
              className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('isActive')}
              id="isActive"
              className="h-4 w-4 rounded border-gray-300"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : subject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RiddleMcqSubjectModal;
