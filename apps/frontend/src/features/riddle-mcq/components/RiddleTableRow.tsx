'use client';

import { useState } from 'react';
import type { RiddleMcq } from '@/types/riddles';
import type { RiddleSubject } from '@/lib/riddle-mcq-api';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

interface RiddleTableRowProps {
  riddle: RiddleMcq;
  subject: RiddleSubject | undefined;
  index: number;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onTrash: () => void;
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
    case 'extreme':
      return {
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: '🔥 Expert',
      };
    default:
      return {
        class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        label: level,
      };
  }
}

export function RiddleTableRow({
  riddle,
  subject,
  index,
  isSelected,
  onSelect,
  onEdit,
  onTrash,
}: RiddleTableRowProps) {
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const levelBadge = getLevelBadge(riddle.level);

  const correctIndex = riddle.correctLetter ? riddle.correctLetter.charCodeAt(0) - 65 : -1;
  const isExpert = riddle.level === 'expert' || riddle.level === 'extreme';

  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-secondary-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    >
      {/* Checkbox */}
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </td>

      {/* # Index */}
      <td className="px-3 py-3 text-center text-sm text-gray-500 dark:text-secondary-400">
        {index}
      </td>

      {/* Question + Hint + Explanation */}
      <td className="px-4 py-3">
        <div className="space-y-2">
          {/* Question */}
          <div className="text-sm text-gray-900 dark:text-secondary-100" title={riddle.question}>
            {riddle.question}
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-3">
            {/* Hint button */}
            {riddle.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700"
              >
                {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                💡 Hint
              </button>
            )}

            {/* Explanation button */}
            {riddle.explanation && (
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                {showExplanation ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                📖 Explanation
              </button>
            )}

            {/* Edit button */}
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-xs text-gray-600 dark:text-secondary-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>

            {/* Trash button */}
            <button
              onClick={onTrash}
              className="flex items-center gap-1 text-xs text-gray-600 dark:text-secondary-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
              Trash
            </button>
          </div>

          {/* Hint expanded content */}
          {showHint && riddle.hint && (
            <div className="text-xs text-gray-600 dark:text-secondary-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
              {riddle.hint}
            </div>
          )}

          {/* Explanation expanded content */}
          {showExplanation && riddle.explanation && (
            <div className="text-xs text-gray-600 dark:text-secondary-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
              {riddle.explanation}
            </div>
          )}
        </div>
      </td>

      {/* Options */}
      <td className="px-4 py-3">
        {isExpert ? (
          <span className="text-xs text-gray-500 dark:text-secondary-500">Expert</span>
        ) : (
          <div className="space-y-1">
            {riddle.options.slice(0, 4).map((option, i) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect = i === correctIndex;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                    isCorrect
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium'
                      : 'text-gray-600 dark:text-secondary-400'
                  }`}
                >
                  <span className="font-bold">{letter}.</span>
                  <span className="truncate">{option}</span>
                  {isCorrect && <span className="ml-auto">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </td>

      {/* Ans */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-700 dark:text-secondary-200">
          {isExpert ? riddle.answer : riddle.options?.[correctIndex] || '-'}
        </span>
      </td>

      {/* Level */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${levelBadge.class}`}
        >
          {levelBadge.label}
        </span>
      </td>

      {/* Subject */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700 dark:text-secondary-300">
          {subject ? `${subject.emoji} ${subject.name}` : '-'}
        </span>
      </td>
    </tr>
  );
}
