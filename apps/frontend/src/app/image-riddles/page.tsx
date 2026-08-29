/**
 * ============================================================================
 * image-riddles/page.tsx — thin composition (see features/image-riddles/)
 * ============================================================================
 * Grid of RiddleCards + modal gameplay via RiddleModal. All state logic lives
 * in feature hooks: useImageRiddleFilters (filter/sort/pagination/deep links),
 * useImageRiddleCatalog (server-filtered data w/ offline fallback),
 * useImageRiddleScore (solved vs revealed persistence), useImageRiddleGame
 * (modal state machine). 3-column card layout, sticky sidebar & header,
 * 12 items per page.
 * ============================================================================
 */

'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import {
  CategorySidebar,
  PaginationControls,
  RiddleCard,
  RiddleCardSkeleton,
  RiddleModal,
  RiddlesToolbar,
} from '@/features/image-riddles/components';
import {
  useImageRiddleCatalog,
  useImageRiddleFilters,
  useImageRiddleGame,
  useImageRiddleScore,
} from '@/features/image-riddles/hooks';
import { ITEMS_PER_PAGE, applyMixSort } from '@/features/image-riddles/lib/game';
import { useSavedItems } from '@/hooks/useSavedItems';

export default function ImageRiddlesPage(): JSX.Element {
  const filters = useImageRiddleFilters();
  const catalog = useImageRiddleCatalog({
    search: filters.search,
    activeCategory: filters.activeCategory,
    difficulty: filters.difficulty,
    page: filters.page,
    sortOrder: filters.sortOrder,
    shuffleSeed: filters.shuffleSeed,
  });
  const score = useImageRiddleScore(catalog.totalPublished);

  // 🔖 Save — device-local bookmarks, chip on the card corner (stays in sync
  // with the share menu's Save via the saved-items event)
  const { savedMap: savedRiddles, toggle: toggleRiddleSave } = useSavedItems('image-riddles');

  const [erroredImages, setErroredImages] = useState<Record<string, boolean>>({});
  const handleImageError = useCallback((id: string) => {
    setErroredImages((prev) => ({ ...prev, [id]: true }));
  }, []);

  const visibleRiddles = useMemo(
    () =>
      filters.sortOrder === 'random'
        ? applyMixSort(catalog.riddles, filters.shuffleSeed)
        : catalog.riddles,
    [catalog.riddles, filters.sortOrder, filters.shuffleSeed]
  );

  const game = useImageRiddleGame({
    riddles: visibleRiddles,
    onSolved: score.recordSolved,
    onRevealed: score.recordRevealed,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
        >
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-4xl font-black tracking-tight text-slate-800">
            🖼️ Image Riddles
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
            Challenge your perception
          </p>
        </div>

        <RiddlesToolbar filters={filters} score={score.score} totalCount={catalog.totalFiltered} />

        {/* Layout: Sidebar + Main Content */}
        <div className="grid gap-10 lg:grid-cols-4 items-start">
          <CategorySidebar
            categories={catalog.categories}
            categoryCounts={catalog.categoryCounts}
            activeCategory={filters.activeCategory}
            onSelect={filters.changeCategory}
          />

          {/* Main Area: Grid & Pagination */}
          <div className="lg:col-span-3 space-y-6">
            {catalog.isLoading ? (
              // C2 #20: per-card skeletons matching the card layout, instead
              // of a single full-page loading state.
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <RiddleCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            ) : (
              <>
                {catalog.loadError && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    {catalog.loadError}
                  </div>
                )}

                {/* Riddle Grid (3 columns) */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleRiddles.map((riddle) => (
                    <RiddleCard
                      key={riddle.id}
                      riddle={riddle}
                      isRevealed={Boolean(score.revealedIds[riddle.id])}
                      isSolved={Boolean(score.solvedIds[riddle.id])}
                      hasImageError={Boolean(erroredImages[riddle.id])}
                      isSaved={Boolean(savedRiddles[riddle.id])}
                      onToggleSave={toggleRiddleSave}
                      onOpen={game.openRiddle}
                      onToggleReveal={score.toggleRevealed}
                      onImageError={handleImageError}
                    />
                  ))}
                </div>

                {catalog.totalFiltered === 0 && (
                  <div className="py-24 text-center rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200">
                    <Sparkles
                      className="mx-auto mb-6 h-14 w-14 text-slate-300"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-black text-slate-400 mb-2">
                      Nothing matches your search...
                    </h3>
                    <button
                      onClick={filters.resetFilters}
                      className="mt-6 rounded-full bg-indigo-600 px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                <PaginationControls
                  currentPage={filters.page}
                  totalPages={catalog.totalPages}
                  totalCount={catalog.totalFiltered}
                  onChangePage={filters.changePage}
                />
              </>
            )}
          </div>
        </div>

        {/* Modal: Riddle Gameplay */}
        {game.selectedRiddle && (
          <RiddleModal
            riddle={game.selectedRiddle}
            game={game}
            hasImageError={Boolean(erroredImages[game.selectedRiddle.id])}
            onImageError={handleImageError}
            canNavigate={visibleRiddles.length > 1}
          />
        )}
      </div>
    </main>
  );
}
