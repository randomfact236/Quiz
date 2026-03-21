'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; subjectId: string }) => void;
  mode: 'add' | 'edit';
  initialData?: { id: string; name: string; subjectId: string } | undefined;
  subjects: { id: string; name: string; slug: string }[];
}

export function ChapterModal({ isOpen, onClose, onSave, mode, initialData, subjects }: ChapterModalProps) {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setSubjectId(initialData.subjectId);
    } else if (isOpen) {
      setName('');
      setSubjectId(subjects[0]?.id || '');
    }
  }, [isOpen, initialData, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subjectId) return;
    onSave({ name: name.trim(), subjectId });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Chapter' : 'Edit Chapter'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Introduction, Chapter 1, Basics"
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {mode === 'add' ? 'Add Chapter' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ChapterModal;