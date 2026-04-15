'use client';

import type { RiddleMcq } from '@/types/riddles';
import type { RiddleSubject } from '@/lib/riddle-mcq-api';
import { RiddleTableRow } from './RiddleTableRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RiddleTableProps {
  riddles: RiddleMcq[];
  subjects: RiddleSubject[];
  riddlePage: number;
  riddlesTotalPages: number;
  riddlesTotal: number;
  pageSize: number;
  selectedIds: Set<string>;
  onSelectOne: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEditRiddle: (riddle: RiddleMcq) => void;
  onTrashRiddle: (riddle: RiddleMcq) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function RiddleTable({
  riddles,
  subjects,
  riddlePage,
  riddlesTotalPages,
  riddlesTotal,
  pageSize,
  selectedIds,
  onSelectOne,
  onSelectAll,
  onEditRiddle,
  onTrashRiddle,
  onPageChange,
  onPageSizeChange,
}: RiddleTableProps) {
  const isAllSelected = riddles.length > 0 && selectedIds.size === riddles.length;
  const startIndex = (riddlePage - 1) * pageSize + 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    let start = Math.max(1, riddlePage - Math.floor(maxVisible / 2));
    let end = Math.min(riddlesTotalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < riddlesTotalPages) {
      if (end < riddlesTotalPages - 1) pages.push('...');
      pages.push(riddlesTotalPages);
    }

    return pages;
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 overflow-hidden">
      {/* Total count + Per page */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-secondary-900 border-b border-gray-200 dark:border-secondary-700 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-secondary-400">
          Total: {riddlesTotal} riddles
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-secondary-400">Show</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-gray-300 dark:border-secondary-600 px-2 py-1 text-sm bg-white dark:bg-secondary-800"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <label className="text-sm text-gray-600 dark:text-secondary-400">per page</label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
          <thead className="bg-gray-50 dark:bg-secondary-900">
            <tr>
              <th className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </th>
              <th className="w-12 px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-40">
                Options
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-32">
                Ans
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-32">
                Subject
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
            {riddles.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-500 dark:text-secondary-400"
                >
                  No riddles found. Click &quot;Add Riddle&quot; to create one.
                </td>
              </tr>
            ) : (
              riddles.map((riddle, idx) => {
                const subject = subjects.find((s) => s.id === riddle.subjectId);
                return (
                  <RiddleTableRow
                    key={riddle.id}
                    riddle={riddle}
                    subject={subject}
                    index={startIndex + idx}
                    isSelected={selectedIds.has(riddle.id)}
                    onSelect={(checked) => onSelectOne(riddle.id, checked)}
                    onEdit={() => onEditRiddle(riddle)}
                    onTrash={() => onTrashRiddle(riddle)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {riddlesTotalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-secondary-900 border-t border-gray-200 dark:border-secondary-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-secondary-400">
            Page {riddlePage} of {riddlesTotalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, riddlePage - 1))}
              disabled={riddlePage === 1}
              className="p-2 text-gray-600 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((page, i) =>
              typeof page === 'number' ? (
                <button
                  key={i}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[32px] h-8 px-2 text-sm rounded ${
                    page === riddlePage
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={i} className="px-1 text-gray-400">
                  {page}
                </span>
              )
            )}

            <button
              onClick={() => onPageChange(Math.min(riddlesTotalPages, riddlePage + 1))}
              disabled={riddlePage === riddlesTotalPages}
              className="p-2 text-gray-600 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
