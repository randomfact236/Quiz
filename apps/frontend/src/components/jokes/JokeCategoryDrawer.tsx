'use client';

/**
 * JokeCategoryDrawer — mobile categories drawer (BUG-058).
 *
 * Owner directive: a clickable icon on the jokes page opens the joke
 * categories in a side drawer — mirrors the image-riddles Topics drawer
 * (slides in from the right edge, selecting a category closes it).
 * The desktop sidebar stays as-is; this drawer is <lg only.
 */

import { Folder } from 'lucide-react';

export interface JokeCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Categories with their live joke counts (empty ones filtered out). */
  categories: Array<{ id: string; name: string; emoji: string; count: number }>;
  /** Total jokes (for the "All Jokes" tile). */
  totalJokes: number;
  activeCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function JokeCategoryDrawer({
  open,
  onClose,
  categories,
  totalJokes,
  activeCategory,
  onSelect,
}: JokeCategoryDrawerProps): JSX.Element {
  if (!open) return <></>;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Joke categories"
    >
      <div
        className="h-full w-[85%] max-w-sm overflow-y-auto rounded-l-3xl bg-white dark:bg-secondary-900 shadow-2xl animate-in slide-in-from-right duration-300 p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between text-sm font-black uppercase tracking-widest text-slate-400 dark:text-secondary-400">
          <span className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-orange-400" aria-hidden="true" /> Joke Categories
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-secondary-800 text-gray-400 dark:text-secondary-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20"
            aria-label="Close joke categories"
          >
            ✕
          </button>
        </div>

        {/* selecting a category closes the drawer */}
        <div className="flex flex-col gap-3" onClick={onClose}>
          <div
            onClick={() => onSelect(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(null);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={activeCategory === null}
            aria-label="Show all jokes"
            className={`cursor-pointer rounded-xl bg-white dark:bg-secondary-800 p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 dark:bg-secondary-800/60 ${
              activeCategory === null
                ? 'border-orange-500 ring-1 ring-orange-200'
                : 'border-transparent'
            }`}
          >
            <span className="text-3xl" aria-hidden="true">
              🃏
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-secondary-100">
                All Jokes
              </h3>
              <p className="text-xs text-gray-500 dark:text-secondary-400">
                The full collection ·{' '}
                <span className="font-bold text-orange-500">{totalJokes}</span>
              </p>
            </div>
          </div>

          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <div
                key={category.id}
                onClick={() => onSelect(category.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(category.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Filter by ${category.name}. ${category.count} jokes`}
                className={`cursor-pointer rounded-xl bg-white dark:bg-secondary-800/60 p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${
                  isActive ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'
                }`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {category.emoji}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-secondary-100">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-secondary-400">
                    <span className="font-bold text-orange-500">{category.count}</span> jokes
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
