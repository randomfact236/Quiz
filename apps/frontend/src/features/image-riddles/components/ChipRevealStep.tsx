/**
 * ============================================================================
 * ChipRevealStep — chip-to-reveal confession beat (comments-system plan §1)
 * ============================================================================
 * Shown when Reveal Answer is tapped with zero prior guesses. One tap posts
 * a structured chip (🤯 / 😑 / 🙃) to the riddle's feed and reveals the
 * answer; a "just show me" escape hatch keeps the reveal never-blocked.
 * ============================================================================
 */

'use client';

import { CHIP_OPTIONS, type CommentChipValue } from '@/lib/comments-api';

export interface ChipRevealStepProps {
  onChooseChip: (chip: CommentChipValue) => void;
  onSkip: () => void;
}

export default function ChipRevealStep({ onChooseChip, onSkip }: ChipRevealStepProps) {
  return (
    <div className="shrink-0 space-y-4 animate-in slide-in-from-top-4 duration-300">
      <div className="rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 dark:border-amber-500/30 p-6 sm:p-8 text-center shadow-inner">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-300 mb-1">
          No shame — everyone gets stuck
        </p>
        <h3 className="text-2xl font-black text-slate-800 dark:text-secondary-100 tracking-tight mb-6">
          How close were you? 😏
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {CHIP_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChooseChip(option.value)}
              className="flex items-center gap-2 rounded-full bg-white dark:bg-secondary-800 px-6 py-3 text-sm font-bold text-slate-700 dark:text-secondary-200 shadow-md border border-amber-100 dark:border-amber-500/30 transition-all hover:scale-105 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-500/40 active:scale-95"
              aria-label={`Confess: ${option.label}, then reveal the answer`}
            >
              <span className="text-xl" aria-hidden="true">
                {option.emoji}
              </span>
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={onSkip}
          className="mt-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-secondary-400 underline-offset-2 hover:text-slate-600 dark:hover:text-secondary-200 dark:text-secondary-300 hover:underline"
        >
          Just show me the answer
        </button>
      </div>
    </div>
  );
}
