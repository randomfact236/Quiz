/**
 * ============================================================================
 * CategorySidebar — sticky "Topics" tiles with per-category riddle counts
 * ============================================================================
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
}

export default function CategorySidebar({
  categories,
  categoryCounts,
  activeCategory,
  onSelect,
}: CategorySidebarProps) {
  return (
    <div className="lg:col-span-1 sticky top-[104px] z-20">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
        <Folder className="h-4 w-4 text-indigo-400" aria-hidden="true" /> Topics
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left rounded-xl p-3 transition-all border-2 flex flex-col items-center justify-center text-center gap-1 ${activeCategory === null ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
        >
          <Globe className="h-5 w-5 text-slate-600" aria-hidden="true" />
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-700">
            All
          </span>
        </button>
        {categories.map((cat) => {
          const count = categoryCounts[cat.name] || 0;
          const isEmpty = count === 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.name)}
              disabled={isEmpty}
              className={`w-full text-left rounded-xl p-3 transition-all border-2 flex flex-col items-center justify-center text-center gap-1 ${activeCategory === cat.name ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'} ${isEmpty ? 'opacity-40 cursor-not-allowed hover:border-slate-100' : ''}`}
              title={isEmpty ? `${cat.name} (no riddles yet)` : cat.name}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 line-clamp-1 break-all w-full px-1">
                {cat.name}
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 border ${isEmpty ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}
              >
                {count} {count === 1 ? 'riddle' : 'riddles'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
