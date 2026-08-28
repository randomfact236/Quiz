/**
 * ============================================================================
 * AdminRiddlesToolbar — search, export dropdown, import/reload/undo/add
 * ============================================================================
 */

'use client';

import { useRef, useState } from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';

export interface AdminRiddlesToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onOpenImport: () => void;
  onReload: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenAdd: () => void;
}

export default function AdminRiddlesToolbar({
  searchTerm,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  onExportCSV,
  onExportJSON,
  onOpenImport,
  onReload,
  onUndo,
  canUndo,
  onOpenAdd,
}: AdminRiddlesToolbarProps) {
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(exportDropdownRef, () => setShowExportDropdown(false), showExportDropdown);

  return (
    <div className="rounded-xl bg-white p-4 shadow-md">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search riddles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          aria-label="Search riddles by keyword"
        />
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
            aria-label="Clear all filters"
          >
            ✕ Clear
          </button>
        )}
        <div className="flex-1" />
        <div className="relative" ref={exportDropdownRef}>
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            aria-label="Export riddles"
            aria-expanded={showExportDropdown}
          >
            📥 Export
          </button>
          {showExportDropdown && (
            <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border bg-white shadow-lg">
              <button
                onClick={() => {
                  onExportCSV();
                  setShowExportDropdown(false);
                }}
                className="w-full rounded-t-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                aria-label="Export as CSV"
              >
                Export as CSV
              </button>
              <button
                onClick={() => {
                  onExportJSON();
                  setShowExportDropdown(false);
                }}
                className="w-full rounded-b-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                aria-label="Export as JSON"
              >
                Export as JSON
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onOpenImport}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          aria-label="Import riddles"
        >
          📤 Import
        </button>
        <button
          onClick={onReload}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          aria-label="Reload from server"
        >
          🔄 Reload
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${canUndo ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          aria-label="Undo last delete"
          title="Undo last delete"
        >
          ⟲ Undo
        </button>
        <button
          onClick={onOpenAdd}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          aria-label="Add new riddle"
        >
          + Add Riddle
        </button>
      </div>
    </div>
  );
}
