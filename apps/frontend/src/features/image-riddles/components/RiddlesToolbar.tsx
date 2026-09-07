/**
 * ============================================================================
 * RiddlesToolbar — sticky unified header for the image riddles grid
 * ============================================================================
 * Title + filtered-count chip, honest score readout (Solved/Revealed/of),
 * search with visible clear affordance, Recent/Mix sort toggle, and the
 * difficulty filter.
 * ============================================================================
 */

'use client';

import { ChevronDown, Search } from 'lucide-react';

import type { ImageRiddleFilters } from '../hooks/useImageRiddleFilters';
import type { ImageRiddleScore } from '../hooks/useImageRiddleScore';

const DIFFICULTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export interface RiddlesToolbarProps {
  filters: ImageRiddleFilters;
  score: ImageRiddleScore;
  totalCount: number;
}

export default function RiddlesToolbar({ filters, score, totalCount }: RiddlesToolbarProps) {
  return (
    <div className="sticky top-4 z-30 mb-8 bg-white/95 dark:bg-secondary-800/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-slate-300 dark:border-secondary-600 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-1">
        <h2 className="text-xl font-black text-slate-800 dark:text-secondary-100 tracking-tight whitespace-nowrap">
          {filters.activeCategory || 'All Riddles'}
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-secondary-800 px-2.5 py-0.5 text-xs font-black text-slate-500 dark:text-secondary-400 border border-slate-200 dark:border-secondary-700">
            {totalCount}
          </span>
        </h2>
        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-secondary-700"></div>
        <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-secondary-400 uppercase tracking-widest bg-slate-50 dark:bg-secondary-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-secondary-800">
          <span title="Correctly guessed">
            Solved: <span className="text-green-600 dark:text-green-300 ml-1">{score.solved}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span title="Given up or timed out">
            Revealed:{' '}
            <span className="text-indigo-600 dark:text-indigo-300 ml-1">{score.revealed}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span>
            of <span className="text-slate-700 dark:text-secondary-200">{score.total}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-end">
        {/* 1. Search (Visible and on the right, with clear affordance) */}
        <div className="relative flex-1 sm:flex-none min-w-[200px]">
          <input
            type="search"
            placeholder="Search riddles..."
            value={filters.searchInput}
            onChange={(e) => filters.changeSearchInput(e.target.value)}
            className="w-full sm:w-64 rounded-full border-2 border-slate-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 py-2.5 pl-5 pr-12 text-sm font-black text-slate-700 dark:text-secondary-200 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {filters.searchInput.length > 0 ? (
            <button
              onClick={() => filters.changeSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-secondary-800 text-slate-500 dark:text-secondary-400 transition-all hover:bg-red-200 dark:hover:bg-red-500/30 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-300"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-secondary-400"
              aria-hidden="true"
            />
          )}
        </div>

        {/* 2. Sort Options (Recent/Mix) */}
        <div className="flex items-center bg-slate-100 dark:bg-secondary-800/80 p-1 rounded-xl border border-slate-200 dark:border-secondary-700/60">
          <button
            onClick={() => filters.changeSortOrder('recent')}
            className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${filters.sortOrder === 'recent' ? 'bg-white dark:bg-secondary-800 text-indigo-600 dark:text-indigo-300 shadow-md ring-1 ring-slate-200 dark:ring-secondary-700' : 'text-slate-500 dark:text-secondary-400 hover:text-slate-800 dark:hover:text-secondary-100 dark:text-secondary-100'}`}
          >
            Recent
          </button>
          <button
            onClick={() => filters.changeSortOrder('random')}
            className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${filters.sortOrder === 'random' ? 'bg-white dark:bg-secondary-800 text-indigo-600 dark:text-indigo-300 shadow-md ring-1 ring-slate-200 dark:ring-secondary-700' : 'text-slate-500 dark:text-secondary-400 hover:text-slate-800 dark:hover:text-secondary-100 dark:text-secondary-100'}`}
          >
            Mix
          </button>
        </div>

        {/* 3. Difficulty Filter */}
        <div className="relative group">
          <select
            value={filters.difficulty}
            onChange={(e) => filters.changeDifficulty(e.target.value)}
            className="appearance-none rounded-xl border-2 border-slate-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-5 py-2.5 pr-10 text-xs font-black text-slate-700 dark:text-secondary-200 shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer"
            aria-label="Filter by difficulty"
          >
            <option value="all">All Levels</option>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-slate-400 dark:text-secondary-400"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
