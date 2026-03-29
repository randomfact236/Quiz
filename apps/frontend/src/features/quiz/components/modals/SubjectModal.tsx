'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { QuizSubject } from '@/lib/quiz-api';
import { useSubjectMutation } from '../../hooks';

interface SubjectModalProps {
  open: boolean;
  subject: QuizSubject | undefined;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['📚', '🧪', '🌍', '🔢', '📝', '🎨', '🎵', '🏃', '🍎', '🌱', '🔬', '💻', '🌐', '📖', '🧮'];

export function SubjectModal({ open, subject, onClose }: SubjectModalProps) {
  const isEdit = useMemo(() => !!subject, [subject]);
  
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [category, setCategory] = useState('');
  
  const { createAsync, updateAsync, isPending, createError, updateError } = useSubjectMutation();
  const error = isEdit ? updateError : createError;

  useEffect(() => {
    if (open && subject) {
      setName(subject.name);
      setEmoji(subject.emoji);
      setCategory(subject.category || '');
    } else if (open) {
      setName('');
      setEmoji('📚');
      setCategory('');
    }
  }, [open, subject]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      slug: generateSlug(name.trim()),
      emoji,
      ...(category.trim() && { category: category.trim() }),
    };

    try {
      if (isEdit && subject) {
        await updateAsync({ id: subject.id, dto: data });
      } else {
        await createAsync(data);
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
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Subject' : 'Add Subject'}</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mathematics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                    emoji === e
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Science, Arts"
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
            disabled={isPending || !name.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubjectModal;
