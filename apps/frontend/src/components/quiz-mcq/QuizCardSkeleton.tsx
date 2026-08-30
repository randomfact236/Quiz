/**
 * ============================================================================
 * Quiz Card Skeleton — per-card loading placeholder for the picker pages
 * ============================================================================
 * Mirrors SubjectCard's shape (centered emoji tile + two text lines) with the
 * codebase's standard animate-pulse treatment, so the grid swaps cleanly from
 * skeletons to loaded cards with no layout shift.
 * ============================================================================
 */

'use client';

export default function QuizCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg"
    >
      <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
      <div className="mt-3 h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}
