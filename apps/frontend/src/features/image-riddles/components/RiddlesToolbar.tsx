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

import type { ImageRiddleFilters } from '../hooks/useImageRiddleFilters';
import type { ImageRiddleScore } from '../hooks/useImageRiddleScore';

const DIFFICULTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'easy', label: '🌱 Easy' },
  { value: 'medium', label: '⭐ Medium' },
  { value: 'hard', label: '🔥 Hard' },
  { value: 'expert', label: '💎 Expert' },
];

export interface RiddlesToolbarProps {
  filters: ImageRiddleFilters;
  score: ImageRiddleScore;
  totalCount: number;
}

export default function RiddlesToolbar({ filters, score, totalCount }: RiddlesToolbarProps) {
  return (
    <div className="sticky top-4 z-30 mb-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-1">
        <h2 className="text-xl font-black text-slate-800 tracking-tight whitespace-nowrap">
          {filters.activeCategory || 'All Riddles'}
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500 border border-slate-200">
            {totalCount}
          </span>
        </h2>
        <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
        <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <span title="Correctly guessed">
            Solved: <span className="text-green-600 ml-1">{score.solved}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span title="Given up or timed out">
            Revealed: <span className="text-indigo-600 ml-1">{score.revealed}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span>
            of <span className="text-slate-700">{score.total}</span>
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
            className="w-full sm:w-64 rounded-full border-2 border-slate-200 bg-white py-2.5 pl-5 pr-12 text-sm font-black text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {filters.searchInput.length > 0 ? (
            <button
              onClick={() => filters.changeSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 transition-all hover:bg-red-100 hover:text-red-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              🔍
            </span>
          )}
        </div>

        {/* 2. Sort Options (Recent/Mix) */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => filters.changeSortOrder('recent')}
            className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${filters.sortOrder === 'recent' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Recent
          </button>
          <button
            onClick={() => filters.changeSortOrder('random')}
            className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${filters.sortOrder === 'random' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Mix
          </button>
        </div>

        {/* 3. Difficulty Filter */}
        <div className="relative group">
          <select
            value={filters.difficulty}
            onChange={(e) => filters.changeDifficulty(e.target.value)}
            className="appearance-none rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 pr-10 text-xs font-black text-slate-700 shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer"
            aria-label="Filter by difficulty"
          >
            <option value="all">All Levels</option>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
