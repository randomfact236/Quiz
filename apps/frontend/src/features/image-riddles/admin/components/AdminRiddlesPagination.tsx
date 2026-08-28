/**
 * ============================================================================
 * AdminRiddlesPagination — showing readout + page input navigation
 * ============================================================================
 */

'use client';

import { ADMIN_ITEMS_PER_PAGE } from '../hooks/useAdminImageRiddleFilters';

export interface AdminRiddlesPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageInput: string;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputSubmit: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function AdminRiddlesPagination({
  totalCount,
  currentPage,
  totalPages,
  pageInput,
  onPageInputChange,
  onPageInputSubmit,
  onPrev,
  onNext,
}: AdminRiddlesPaginationProps) {
  if (totalCount === 0) return null;

  const from = Math.min((currentPage - 1) * ADMIN_ITEMS_PER_PAGE + 1, totalCount);
  const to = Math.min(currentPage * ADMIN_ITEMS_PER_PAGE, totalCount);

  return (
    <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 mt-4">
      <p className="text-sm text-gray-500">
        Showing {from} - {to} of {totalCount} items
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600 flex items-center gap-1">
          Page
          <input
            type="text"
            value={pageInput}
            onChange={onPageInputChange}
            onBlur={onPageInputSubmit}
            onKeyDown={(e) => e.key === 'Enter' && onPageInputSubmit()}
            className="w-12 rounded border border-gray-300 px-2 py-1 text-center text-sm font-medium focus:border-blue-500 focus:outline-none"
          />
          of <span className="font-medium">{totalPages || 1}</span>
        </span>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
