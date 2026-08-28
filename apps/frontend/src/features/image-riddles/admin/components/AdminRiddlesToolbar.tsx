/**
 * ============================================================================
 * AdminRiddlesToolbar — search, export dropdown, import/reload/undo/add
 * ============================================================================
 */

'use client';

import { Download, Plus, RefreshCw, Search, Undo2, Upload } from 'lucide-react';
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
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search riddles..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
            aria-label="Search riddles by keyword"
          />
        </div>
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
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
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
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import
        </button>
        <button
          onClick={onReload}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          aria-label="Reload from server"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reload
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${canUndo ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          aria-label="Undo last delete"
          title="Undo last delete"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Undo
        </button>
        <button
          onClick={onOpenAdd}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          aria-label="Add new riddle"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Riddle
        </button>
      </div>
    </div>
  );
}
