/**
 * ============================================================================
 * AdminRiddlesTable — riddle table with select-all, sortable headers
 * ============================================================================
 */

'use client';

import { ArrowUpDown } from 'lucide-react';

import type { ImageRiddle } from '@/app/admin/types';

import type { AdminSortConfig, AdminSortField } from '../lib/filters';
import AdminRiddleRow from './AdminRiddleRow';

export interface AdminRiddlesTableProps {
  riddles: ImageRiddle[];
  isLoading: boolean;
  /** Zero-based offset of the current page for absolute row numbering. */
  startIndex: number;
  selectedIds: string[];
  sortConfig: AdminSortConfig | null;
  onSort: (field: AdminSortField) => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEdit: (riddle: ImageRiddle) => void;
  onDuplicate: (riddle: ImageRiddle) => void;
  onTrash: (riddle: ImageRiddle) => void;
  onCycleStatus: (riddle: ImageRiddle) => void;
}

function SortIcon({
  field,
  sortConfig,
}: {
  field: AdminSortField;
  sortConfig: AdminSortConfig | null;
}) {
  if (sortConfig?.field !== field)
    return <ArrowUpDown className="inline w-3 h-3 ml-1 opacity-40 group-hover:opacity-100" />;
  return sortConfig.direction === 'asc' ? (
    <span className="inline-block ml-1 text-indigo-500 font-black">↑</span>
  ) : (
    <span className="inline-block ml-1 text-indigo-500 font-black">↓</span>
  );
}

export default function AdminRiddlesTable({
  riddles,
  isLoading,
  startIndex,
  selectedIds,
  sortConfig,
  onSort,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onDuplicate,
  onTrash,
  onCycleStatus,
}: AdminRiddlesTableProps) {
  const allSelected = selectedIds.length > 0 && selectedIds.length === riddles.length;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50/50">
          <tr>
            <th className="w-10 px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => (allSelected ? onDeselectAll() : onSelectAll())}
                className="rounded border-gray-300"
                aria-label="Select all riddles"
              />
            </th>
            <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-12 text-center">
              #
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Image
            </th>
            <th
              className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer group hover:bg-gray-100 transition-colors"
              onClick={() => onSort('title')}
            >
              Riddle Details <SortIcon field="title" sortConfig={sortConfig} />
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Answer
            </th>
            <th
              className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer group hover:bg-gray-100 transition-colors"
              onClick={() => onSort('category')}
            >
              Category <SortIcon field="category" sortConfig={sortConfig} />
            </th>
            <th
              className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer group hover:bg-gray-100 transition-colors"
              onClick={() => onSort('difficulty')}
            >
              Difficulty <SortIcon field="difficulty" sortConfig={sortConfig} />
            </th>
            <th
              className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center cursor-pointer group hover:bg-gray-100 transition-colors"
              onClick={() => onSort('status')}
            >
              Status <SortIcon field="status" sortConfig={sortConfig} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {isLoading && (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-sm font-bold text-gray-400">
                Loading riddles from server...
              </td>
            </tr>
          )}
          {!isLoading && riddles.length === 0 && (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                No riddles match the current filters.
              </td>
            </tr>
          )}
          {riddles.map((riddle, index) => (
            <AdminRiddleRow
              key={`riddle-row-${riddle.id}`}
              riddle={riddle}
              index={startIndex + index + 1}
              isSelected={selectedIds.includes(riddle.id)}
              onToggleSelection={onToggleSelection}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onTrash={onTrash}
              onCycleStatus={onCycleStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
