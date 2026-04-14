'use client';

import type { RiddleMcq } from '@/types/riddles';
import type { RiddleSubject } from '@/lib/riddle-mcq-api';

interface RiddleTableRowProps {
  riddle: RiddleMcq;
  subject: RiddleSubject | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

function getLevelBadge(level: string) {
  switch (level) {
    case 'easy':
      return {
        class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        label: '🌱 Easy',
      };
    case 'medium':
      return {
        class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        label: '🌿 Medium',
      };
    case 'hard':
      return {
        class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        label: '🌲 Hard',
      };
    case 'expert':
      return {
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: '🔥 Expert',
      };
    default:
      return { class: 'bg-gray-100 text-gray-700', label: level };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return { class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'draft':
      return { class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
    case 'trash':
      return { class: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' };
    default:
      return { class: 'bg-gray-100 text-gray-700' };
  }
}

export function RiddleTableRow({ riddle, subject, onEdit, onDelete }: RiddleTableRowProps) {
  const levelBadge = getLevelBadge(riddle.level);
  const statusBadge = getStatusBadge(riddle.status || 'draft');

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-secondary-700">
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
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${levelBadge.class}`}
        >
          {levelBadge.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 dark:text-secondary-300">
          {subject ? `${subject.emoji} ${subject.name}` : '-'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge.class}`}
        >
          {riddle.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}
