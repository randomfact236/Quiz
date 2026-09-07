/**
 * ============================================================================
 * PreRiddleSummary — pre-game start screen
 * ============================================================================
 * Mirrors quiz-mcq's PreQuizSummary: back link, mix info grid,
 * add-more-riddles picker, mode description, start button.
 * Extracted so the play page stays render-only.
 * ============================================================================
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, Minus, Plus } from 'lucide-react';

interface PreRiddleSummaryProps {
  backHref: string;
  mixName: string;
  levelDisplay: string;
  modeDisplay: string;
  mode: 'timer' | 'practice';
  baseCount: number;
  availableExtra: number;
  extraRiddles: number;
  onExtraRiddlesChange: (count: number) => void;
  onStart: () => void;
}

export function PreRiddleSummary({
  backHref,
  mixName,
  levelDisplay,
  modeDisplay,
  mode,
  baseCount,
  availableExtra,
  extraRiddles,
  onExtraRiddlesChange,
  onStart,
}: PreRiddleSummaryProps): JSX.Element {
  const finalCount = Math.min(baseCount + extraRiddles, baseCount + availableExtra);

  return (
    <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] dark:from-indigo-950 dark:to-rose-950/70">
      <div className="relative z-10 flex flex-col flex-1 px-3 py-4">
        <div className="mx-auto w-full max-w-lg">
          {/* Back Button */}
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/20 dark:bg-secondary-800/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white dark:hover:bg-secondary-700/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mode Selection
          </Link>

          {/* Summary Card */}
          <div className="rounded-2xl bg-white/95 dark:bg-secondary-800/95 p-5 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mb-2 text-5xl">🧩</div>
              <h1 className="mb-1 text-2xl font-bold text-gray-800 dark:text-secondary-100">
                {mixName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-secondary-400">
                Ready to challenge your brain?
              </p>
            </div>

            {/* Info Grid */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-3 text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {finalCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-secondary-300">Riddles</div>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3 text-center">
                <div className="text-2xl font-bold capitalize text-emerald-600 dark:text-emerald-300">
                  {levelDisplay}
                </div>
                <div className="text-xs text-gray-600 dark:text-secondary-300">Difficulty</div>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {mode === 'timer' ? '⏱️' : '🎯'}
                </div>
                <div className="text-xs text-gray-600 dark:text-secondary-300">{modeDisplay}</div>
              </div>
              <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 p-3 text-center">
                <div
                  className="truncate text-lg font-bold text-orange-600 dark:text-orange-300"
                  title={mixName}
                >
                  {mixName}
                </div>
                <div className="text-xs text-gray-600 dark:text-secondary-300">Mix</div>
              </div>
            </div>

            {/* Add More Riddles Section */}
            {availableExtra > 0 && (
              <div className="mb-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 p-3">
                <ExtraRiddlesPicker
                  availableExtra={availableExtra}
                  value={extraRiddles}
                  onChange={onExtraRiddlesChange}
                />
              </div>
            )}

            {/* Mode Description */}
            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-secondary-800 p-3">
              <p className="text-center text-sm text-gray-600 dark:text-secondary-300">
                {mode === 'timer'
                  ? '⏱️ Limited time for the whole session — think fast!'
                  : '🎯 Take your time and solve each riddle carefully.'}
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={onStart}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            >
              {extraRiddles > 0 ? `🚀 Start Riddles (${finalCount} Riddles)` : '🚀 Start Riddles'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtraRiddlesPicker({
  availableExtra,
  value,
  onChange,
}: {
  availableExtra: number;
  value: number;
  onChange: (count: number) => void;
}): JSX.Element {
  const max = Math.min(20, availableExtra);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-secondary-200">
          Add More Riddles:
        </span>
        <span className="text-xs text-purple-600 dark:text-purple-300">
          {availableExtra} more available
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="mb-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-purple-200 dark:bg-purple-500/30"
      />

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 dark:bg-purple-500/30 font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-3 w-3" />
        </button>

        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="h-8 cursor-pointer rounded-lg border border-purple-300 bg-white dark:bg-secondary-800 px-3 text-sm font-semibold text-gray-700 dark:text-secondary-200"
        >
          {Array.from({ length: max + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 dark:bg-purple-500/30 font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {value > 0 && (
        <p className="mt-1 text-center text-xs text-purple-600 dark:text-purple-300">
          +{value} extra riddle{value > 1 ? 's' : ''} will be added
        </p>
      )}
    </div>
  );
}
