/**
 * ============================================================================
 * CategoryFilterRow — category chips with edit/delete affordances
 * ============================================================================
 */

'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';

import { CollapsibleRows } from '@/components/ui/CollapsibleRows';

import type { AdminImageRiddleCategory } from '../hooks/useAdminImageRiddleData';

export interface CategoryFilterRowProps {
  categories: AdminImageRiddleCategory[];
  categoryCounts: Record<string, number>;
  totalCount: number;
  filterCategory: string;
  onSelectCategory: (category: string) => void;
  onEditCategory: (category: AdminImageRiddleCategory) => void;
  onDeleteCategory: (category: AdminImageRiddleCategory) => void;
  onAddCategory: () => void;
}

export default function CategoryFilterRow({
  categories,
  categoryCounts,
  totalCount,
  filterCategory,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
}: CategoryFilterRowProps) {
  return (
    <div className="mb-4 rounded-xl bg-white dark:bg-secondary-800 p-4 shadow-md">
      <CollapsibleRows className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-secondary-300 mr-2">
          Category:
        </span>
        <button
          onClick={() => onSelectCategory('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === '' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-secondary-200 hover:bg-gray-200 dark:hover:bg-secondary-700'}`}
        >
          All Categories <span className="opacity-70">({totalCount})</span>
        </button>

        {categories.map((cat) => {
          const count = categoryCounts[cat.name] || 0;
          const isActive = filterCategory === cat.name;
          return (
            <div
              key={`category-group-${cat.id}`}
              className="flex items-center overflow-hidden rounded-lg shadow-sm border border-gray-100 dark:border-secondary-800"
            >
              <button
                onClick={() => onSelectCategory(isActive ? '' : cat.name)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${isActive ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-secondary-200 hover:bg-gray-200 dark:hover:bg-secondary-700'}`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategory(cat);
                }}
                className={`px-2 py-1.5 transition-colors border-l border-gray-200 dark:border-secondary-700/50 ${isActive ? 'bg-gray-700 text-white hover:bg-indigo-500' : 'bg-gray-200 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 dark:hover:bg-indigo-500/10 hover:text-indigo-600'}`}
                title="Edit category"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(cat);
                }}
                className={`px-2 py-1.5 transition-colors border-l border-gray-200 dark:border-secondary-700/50 ${isActive ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 dark:bg-secondary-700 text-red-500 hover:bg-red-200 dark:hover:bg-red-500/30 dark:hover:bg-red-500/20 hover:text-red-600'}`}
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        <button
          onClick={onAddCategory}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 text-indigo-500 hover:border-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </CollapsibleRows>
    </div>
  );
}
