/**
 * ============================================================================
 * PaginationControls — page navigation + "Showing X-Y of Z" readout
 * ============================================================================
 */

'use client';

const ITEMS_PER_PAGE = 12;

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onChangePage: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  onChangePage,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const from = Math.min(totalCount, (currentPage - 1) * ITEMS_PER_PAGE + 1);
  const to = Math.min(totalCount, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-4 pb-12">
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-100">
        <button
          onClick={() => onChangePage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
          aria-label="Previous page"
        >
          <span className="text-xl font-bold">‹</span>
        </button>

        <div className="px-4 text-xs font-black uppercase tracking-widest text-slate-400">
          <span className="text-slate-800">{currentPage}</span> / {totalPages}
        </div>

        <button
          onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
          aria-label="Next page"
        >
          <span className="text-xl font-bold">›</span>
        </button>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
        Showing {from} - {to} of {totalCount}
      </p>
    </div>
  );
}
