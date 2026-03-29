'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
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
  
  const { createAsync, updateAsync, isPending, createError, updateError } = useChapterMutation();
  const error = isEdit ? updateError : createError;

  useEffect(() => {
    if (open && chapter) {
      setName(chapter.name);
      setSelectedSubjectId(chapter.subjectId);
    } else if (open) {
      setName('');
      setSelectedSubjectId(subjectId || '');
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Chapter' : 'Add Chapter'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error.message}
            </div>
          )}

          {hasMultipleSubjects && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Introduction to Algebra"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !selectedSubjectId}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChapterModal;
