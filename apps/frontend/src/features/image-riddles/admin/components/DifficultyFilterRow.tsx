/**
 * ============================================================================
 * DifficultyFilterRow — difficulty chips with per-difficulty counts
 * ============================================================================
 */

'use client';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;

export interface DifficultyFilterRowProps {
  difficultyCounts: Record<string, number>;
  totalCount: number;
  filterDifficulty: string;
  onSelectDifficulty: (difficulty: string) => void;
}

export default function DifficultyFilterRow({
  difficultyCounts,
  totalCount,
  filterDifficulty,
  onSelectDifficulty,
}: DifficultyFilterRowProps) {
  return (
    <div className="mb-4 rounded-xl bg-white dark:bg-secondary-800 p-4 shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-secondary-300 mr-2">
          Difficulty:
        </span>
        <button
          onClick={() => onSelectDifficulty('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDifficulty === '' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-secondary-200 hover:bg-gray-200 dark:hover:bg-secondary-700'}`}
        >
          All Levels <span className="opacity-70">({totalCount})</span>
        </button>
        {DIFFICULTIES.map((diff) => {
          const count = difficultyCounts[diff] || 0;
          const isActive = filterDifficulty === diff;
          return (
            <button
              key={`diff-chip-${diff}`}
              onClick={() => onSelectDifficulty(isActive ? '' : diff)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${isActive ? 'bg-indigo-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-secondary-200 hover:bg-gray-200 dark:hover:bg-secondary-700'}`}
            >
              {diff} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
