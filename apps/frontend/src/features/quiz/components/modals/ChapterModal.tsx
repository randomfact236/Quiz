'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { QuizChapter, QuizSubject } from '@/lib/quiz-api';
import { useChapterMutation } from '../../hooks';

interface ChapterModalProps {
  open: boolean;
  chapter: QuizChapter | undefined;
  subjectId: string | undefined;
  subjects: QuizSubject[];
  onClose: () => void;
}

export function ChapterModal({ open, chapter, subjectId, subjects, onClose }: ChapterModalProps) {
  const isEdit = useMemo(() => !!chapter, [chapter]);
  const hasMultipleSubjects = subjects.length > 1;
  
  const [name, setName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId || '');
  const [chapterNumber, setChapterNumber] = useState(1);
  
  const { createAsync, updateAsync, isPending, createError, updateError } = useChapterMutation();
  const error = isEdit ? updateError : createError;

  useEffect(() => {
    if (open && chapter) {
      setName(chapter.name);
      setSelectedSubjectId(chapter.subjectId);
      setChapterNumber(chapter.chapterNumber);
    } else if (open) {
      setName('');
      setSelectedSubjectId(subjectId || '');
      setChapterNumber(1);
    }
  }, [open, chapter, subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedSubjectId) return;

    try {
      if (isEdit && chapter) {
        await updateAsync({
          id: chapter.id,
          dto: { name: name.trim(), subjectId: selectedSubjectId },
        });
      } else {
        await createAsync({
          name: name.trim(),
          subjectId: selectedSubjectId,
        });
      }
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Edit Chapter' : 'Add Chapter'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error.message}
          </div>
        )}

        {hasMultipleSubjects && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.emoji} {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chapter Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Introduction to Algebra"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chapter Number
          </label>
          <input
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim() || !selectedSubjectId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ChapterModal;
