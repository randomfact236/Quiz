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
        <TopicsSection />
        <ModeCards />
        <StatsSection />
      </div>
    </div>
  );
}
