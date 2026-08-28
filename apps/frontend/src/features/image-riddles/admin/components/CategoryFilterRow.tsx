/**
 * ============================================================================
 * CategoryFilterRow — category chips with edit/delete affordances
 * ============================================================================
 */

'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';

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
    <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 mr-2">Category:</span>
        <button
          onClick={() => onSelectCategory('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterCategory === ''
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories <span className="opacity-70">({totalCount})</span>
        </button>

        {categories.map((cat) => {
          const count = categoryCounts[cat.name] || 0;
          const isActive = filterCategory === cat.name;
          return (
            <div
              key={`category-group-${cat.id}`}
              className="flex items-center overflow-hidden rounded-lg shadow-sm border border-gray-100"
            >
              <button
                onClick={() => onSelectCategory(isActive ? '' : cat.name)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
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
                className={`px-2 py-1.5 transition-colors border-l border-gray-200/50 ${isActive ? 'bg-gray-700 text-white hover:bg-indigo-500' : 'bg-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                title="Edit category"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(cat);
                }}
                className={`px-2 py-1.5 transition-colors border-l border-gray-200/50 ${isActive ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-red-500 hover:bg-red-100 hover:text-red-600'}`}
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        <button
          onClick={onAddCategory}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>
    </div>
  );
}
