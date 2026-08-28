/**
 * ============================================================================
 * RiddleCardSkeleton — per-card loading placeholder (C2 #20 finish)
 * ============================================================================
 * Mirrors RiddleCard's shape (aspect-[4/3] image area, title lines, answer
 * row) with the codebase's standard animate-pulse treatment, so the grid
 * swaps cleanly from skeletons to loaded cards with no layout shift.
 * ============================================================================
 */

'use client';

export default function RiddleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100"
    >
      {/* Image area (matches aspect-[4/3]) */}
      <div className="aspect-[4/3] bg-slate-200 animate-pulse" />

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-4 h-5 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-20 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
