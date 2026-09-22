'use client';

/**
 * JokeCategoryDrawer - mobile categories drawer (BUG-058).
 *
 * Owner directive: a clickable icon on the jokes page opens the joke
 * categories in a side drawer - mirrors the image-riddles Topics drawer
 * (slides in from the right edge, selecting a category closes it).
 * The desktop sidebar stays as-is; this drawer is <lg only.
 *
 * Rewritten 2026-09-22: the close glyph and the "All Jokes" emoji were
 * mojibake, one line carried a corrupted character, the card classes had a
 * contradictory duplicate dark background, and the dialog had none of the
 * app's modal a11y (Escape, focus move + trap, scroll lock, focus restore).
 */

import { useEffect, useRef } from 'react';
import { Folder, Library, X } from 'lucide-react';

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

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function JokeCategoryDrawer({
  open,
  onClose,
  categories,
  totalJokes,
  activeCategory,
  onSelect,
}: JokeCategoryDrawerProps): JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes, body scroll locks, focus moves in and Tab is trapped inside
  // the panel, then focus is restored on close (matches the header drawer).
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return <></>;

  const tileClass = (isActive: boolean) =>
    `flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 bg-white p-4 text-left shadow-sm transition-all hover:translate-x-1 hover:shadow-md dark:bg-secondary-800/60 ${
      isActive
        ? 'border-orange-500 ring-1 ring-orange-200 dark:ring-orange-500/30'
        : 'border-transparent'
    }`;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Joke categories"
    >
      <div
        ref={panelRef}
        className="h-full w-[85%] max-w-sm overflow-y-auto rounded-l-3xl bg-white p-5 pb-8 shadow-2xl animate-in slide-in-from-right duration-300 dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between text-sm font-black uppercase tracking-widest text-slate-400 dark:text-secondary-400">
          <span className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-orange-400" aria-hidden="true" /> Joke Categories
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:bg-red-500/20"
            aria-label="Close joke categories"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            aria-pressed={activeCategory === null}
            className={tileClass(activeCategory === null)}
          >
            <Library className="h-7 w-7 shrink-0 text-orange-500" aria-hidden="true" />
            <span>
              <span className="block text-base font-semibold text-gray-800 dark:text-secondary-100">
                All Jokes
              </span>
              <span className="block text-xs text-gray-500 dark:text-secondary-400">
                The full collection ·{' '}
                <span className="font-bold text-orange-500">{totalJokes}</span>
              </span>
            </span>
          </button>

          {categories.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-secondary-800/60 dark:text-secondary-400">
              No joke categories yet.
            </p>
          ) : (
            categories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onSelect(category.id);
                    onClose();
                  }}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${category.name}. ${category.count} jokes`}
                  className={tileClass(isActive)}
                >
                  <span className="shrink-0 text-3xl" aria-hidden="true">
                    {category.emoji}
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-gray-800 dark:text-secondary-100">
                      {category.name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-secondary-400">
                      <span className="font-bold text-orange-500">{category.count}</span> jokes
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
