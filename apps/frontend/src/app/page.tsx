import Link from 'next/link';

import { BubbleBackground, TopicsSection, ModeCards, StatsSection } from './components/home';

/**
 * Home Page Component
 * Refactored to use extracted sub-components for reduced complexity.
 */
export default function HomePage(): JSX.Element {
  return (
    // Plain div: the layout's <main> is the single landmark (and skip-link target).
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8 dark:from-indigo-950 dark:to-rose-950/70">
      <BubbleBackground />

      <div className="relative mx-auto max-w-2xl">
        {/* NOW-08: the Daily Challenge strip — a time-boxed hook belongs at
            the top; the four content cards below keep the owner's fixed order. */}
        <Link
          href="/quiz-mcq/daily"
          className="mb-6 flex items-center gap-3 rounded-2xl bg-white/90 px-5 py-4 shadow-lg backdrop-blur transition-transform hover:scale-[1.01] dark:bg-secondary-800/90"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-lg text-white shadow">
            📅
          </span>
          <span className="flex-1">
            <span className="block font-black text-gray-800 dark:text-secondary-100">
              Daily Challenge
            </span>
            <span className="block text-sm text-gray-600 dark:text-secondary-300">
              10 questions, one attempt a day — keep your streak
            </span>
          </span>
          <span className="text-sm font-black uppercase tracking-widest text-orange-500">
            Play →
          </span>
        </Link>
        <TopicsSection />
        <ModeCards />
        <StatsSection />
      </div>
    </div>
  );
}
