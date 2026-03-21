'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; emoji: string; category: string }) => void;
  mode: 'add' | 'edit';
  initialData?: { id: string; name: string; emoji: string; category: string; slug: string } | undefined;
}

const EMOJI_OPTIONS = ['📚', '🧪', '🌍', '🔢', '📝', '🎨', '🎵', '🏃', '🍎', '🌱', '🔬', '💻', '🌐', '📖', '🧮'];

export function SubjectModal({ isOpen, onClose, onSave, mode, initialData }: SubjectModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setEmoji(initialData.emoji);
      setCategory(initialData.category || '');
    } else if (isOpen) {
      setName('');
      setEmoji('📚');
      setCategory('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, category: category.trim() });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Subject' : 'Edit Subject'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="e.g., Mathematics"
            required
          />
        </div>

        {/* Emoji */}
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
                className={cn(
                  'w-10 h-10 text-xl rounded-lg border-2 transition-colors',
                  emoji === e 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Science, Arts, Languages"
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
            {mode === 'add' ? 'Add Subject' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SubjectModal;