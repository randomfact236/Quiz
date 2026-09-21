/**
 * ============================================================================
 * CategorySidebar — sticky "Topics" tiles with per-category riddle counts
 * ============================================================================
 * Two surfaces, one tile set:
 *  - lg+  : the classic sticky sidebar column (page grid col 1).
 *  - <lg  : collapsed behind a "Topics" trigger that opens a bottom drawer —
 *           owner directive 2026-09-19: the full topic grid must never sprawl
 *           down the mobile page before the riddles.
 * Zero-count topics render dimmed and disabled so users can't click into
 * empty topics.
 * ============================================================================
 */

'use client';

import { Folder, Globe } from 'lucide-react';

import type { ImageRiddleCategory } from '@/lib/image-riddles-api';

export interface CategorySidebarProps {
  categories: ImageRiddleCategory[];
  categoryCounts: Record<string, number>;
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
  /** Mobile drawer open state — controlled by the page; the trigger lives in
   *  the RiddlesToolbar controls row (owner: All beside Recent/Mix/All Levels). */
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

/** One topic tile (shared by the desktop sidebar and the mobile drawer). */
function TopicTile({
  label,
  icon,
  count,
  active,
  isEmpty,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  /** null = no count pill (the "All" tile, as in the original sidebar). */
  count: number | null;
  active: boolean;
  isEmpty: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isEmpty}
      className={`w-full text-left rounded-xl p-3 transition-all border-2 flex flex-col items-center justify-center text-center gap-1 ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-secondary-800 border-slate-100 dark:border-secondary-800 hover:border-slate-300 dark:hover:border-secondary-600 dark:border-secondary-600'} ${isEmpty ? 'opacity-40 cursor-not-allowed hover:border-slate-100 dark:hover:border-secondary-700 dark:border-secondary-800' : ''}`}
      title={isEmpty ? `${label} (no riddles yet)` : label}
    >
      {icon}
      <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-secondary-200 line-clamp-1 break-all w-full px-1">
        {label}
      </span>
      {count !== null && (
        <span
          className={`text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 border ${isEmpty ? 'bg-slate-50 dark:bg-secondary-800 text-slate-300 border-slate-100 dark:border-secondary-800' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border-indigo-100 dark:border-indigo-500/30'}`}
        >
          {count} {count === 1 ? 'riddle' : 'riddles'}
        </span>
      )}
    </button>
  );
}

export default function CategorySidebar({
  categories,
  categoryCounts,
  activeCategory,
  onSelect,
  drawerOpen,
  onDrawerClose,
}: CategorySidebarProps) {
  const tiles = (
    <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
      <TopicTile
        label="All"
        icon={
          <Globe className="h-5 w-5 text-slate-600 dark:text-secondary-300" aria-hidden="true" />
        }
        count={null}
        active={activeCategory === null}
        isEmpty={false}
        onSelect={() => onSelect(null)}
      />
      {categories.map((cat) => {
        const count = categoryCounts[cat.name] || 0;
        return (
          <TopicTile
            key={cat.id}
            label={cat.name}
            icon={<span className="text-xl">{cat.emoji}</span>}
            count={count}
            active={activeCategory === cat.name}
            isEmpty={count === 0}
            onSelect={() => onSelect(cat.name)}
          />
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop / tablet — classic sticky sidebar column */}
      <div className="hidden lg:block lg:col-span-1 sticky top-[104px] z-20">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-secondary-400 mb-4 px-1 flex items-center gap-2">
          <Folder className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Topics
        </h2>
        {tiles}
      </div>

      {/* Mobile — side drawer (slides in from the right edge, owner directive);
          the trigger lives in the RiddlesToolbar row */}
      <div className="lg:hidden">
        {drawerOpen && (
          <div
            className="fixed inset-0 z-[70] flex justify-end bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onDrawerClose}
            role="dialog"
            aria-modal="true"
            aria-label="Topics"
          >
            <div
              className="h-full w-[85%] max-w-sm overflow-y-auto rounded-l-3xl bg-white dark:bg-secondary-900 shadow-2xl animate-in slide-in-from-right duration-300 p-5 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between text-sm font-black uppercase tracking-widest text-slate-400 dark:text-secondary-400">
                <span className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Topics
                </span>
                <button
                  onClick={onDrawerClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-secondary-800 text-gray-400 dark:text-secondary-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20"
                  aria-label="Close topics"
                >
                  ✕
                </button>
              </div>
              {/* selecting a topic closes the drawer */}
              <div onClick={onDrawerClose}>{tiles}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
