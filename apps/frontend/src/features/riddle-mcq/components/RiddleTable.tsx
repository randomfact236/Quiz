'use client';

import type { RiddleMcq } from '@/types/riddles';
import type { RiddleSubject } from '@/lib/riddle-mcq-api';
import { RiddleTableRow } from './RiddleTableRow';

interface RiddleTableProps {
  riddles: RiddleMcq[];
  subjects: RiddleSubject[];
  riddlePage: number;
  riddlesTotalPages: number;
  riddlesTotal: number;
  onEditRiddle: (riddle: RiddleMcq) => void;
  onDeleteRiddle: (riddle: RiddleMcq) => void;
  onPageChange: (page: number) => void;
}

export function RiddleTable({
  riddles,
  subjects,
  riddlePage,
  riddlesTotalPages,
  riddlesTotal,
  onEditRiddle,
  onDeleteRiddle,
  onPageChange,
}: RiddleTableProps) {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
          <thead className="bg-gray-50 dark:bg-secondary-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-32">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-secondary-400 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
            {riddles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500 dark:text-secondary-400"
                >
                  No riddles found. Click &quot;Add Riddle&quot; to create one.
                </td>
              </tr>
            ) : (
              riddles.map((riddle) => {
                const subject = subjects.find((s) => s.id === riddle.subjectId);
                return (
                  <RiddleTableRow
                    key={riddle.id}
                    riddle={riddle}
                    subject={subject}
                    onEdit={() => onEditRiddle(riddle)}
                    onDelete={() => onDeleteRiddle(riddle)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {riddlesTotalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-secondary-900 border-t border-gray-200 dark:border-secondary-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-secondary-400">
            Page {riddlePage} of {riddlesTotalPages} ({riddlesTotal} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, riddlePage - 1))}
              disabled={riddlePage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-secondary-700"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(riddlesTotalPages, riddlePage + 1))}
              disabled={riddlePage === riddlesTotalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-secondary-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
