'use client';

import { BubbleBackground, TopicsSection, ModeCards, StatsSection } from './components/home';

/**
 * Home Page Component
 * Refactored to use extracted sub-components for reduced complexity
 */
export default function HomePage(): JSX.Element {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <BubbleBackground />

      <div className="relative mx-auto max-w-2xl">
        <div className="home-content">
          <TopicsSection />
          <ModeCards />
          <StatsSection />

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-white/60">
            <p>© 2026 AI Quiz Platform</p>
          </div>
        </div>
      </div>
    </main>
  );
}
