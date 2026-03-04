'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { FileUploader } from '@/components/ui/FileUploader';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { Joke, JokeCategory, ContentStatus, BulkActionType, StatusFilter } from '../types';
import { getStatusBadgeColor, useJokeFilters, jokesToCSV, jokesToJSON, parseJokeCSV } from '../utils';

interface JokesSectionProps {
  allJokes: Joke[];
  setAllJokes: React.Dispatch<React.SetStateAction<Joke[]>>;
  jokeCategories: JokeCategory[];
  setJokeCategories: React.Dispatch<React.SetStateAction<JokeCategory[]>>;
}

export function JokesSection({ allJokes, setAllJokes, jokeCategories, setJokeCategories }: JokesSectionProps): JSX.Element {
  const [jokeFilterCategory, _setJokeFilterCategory] = useState<string>('');
  const [jokeSearch, _setJokeSearch] = useState<string>('');
  const [jokePage, setJokePage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [statusFilter, _setStatusFilter] = useState<StatusFilter>('published');
  const [selectedIds, _setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, _setBulkActionLoading] = useState(false);
  const jokesPerPage = 15;

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [_showDeleteConfirm, _setShowDeleteConfirm] = useState(false);
  const [showImportModal, _setShowImportModal] = useState(false);

  // Category Modal States
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<JokeCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '📚', description: '' });

  // Soft-delete pending state (no auto-timer — requires manual confirmation)
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState<{
    category: JokeCategory;
    originalStatuses: Record<string | number, string>;
  } | null>(null);

  const [selectedJoke, _setSelectedJoke] = useState<Joke | null>(null);
  const [importError, _setImportError] = useState('');
  const [uploadKey, _setUploadKey] = useState(0);


  // Form State
  const [jokeForm, setJokeForm] = useState({ setup: '', punchline: '', category: '' });

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const importModalRef = useRef<HTMLDivElement>(null);

  const { filteredJokes, statusCounts } = useJokeFilters(
    allJokes,
    jokeFilterCategory,
    jokeSearch,
    statusFilter
  );

  // Pagination
  const totalJokePages = Math.ceil(filteredJokes.length / jokesPerPage);
  const paginatedJokes = filteredJokes.slice((jokePage - 1) * jokesPerPage, jokePage * jokesPerPage);

  // Sync pageInput with jokePage
  useEffect(() => {
    setPageInput(String(jokePage));
  }, [jokePage]);

  // Page input handlers
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalJokePages) {
      setJokePage(page);
    } else {
      setPageInput(String(jokePage));
    }
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    _setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => _setSelectedIds(filteredJokes.map(j => String(j.id)));
  const deselectAll = () => _setSelectedIds([]);

  // Bulk action handler
  const handleBulkAction = async (action: BulkActionType) => {
    _setBulkActionLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setAllJokes(prev => prev.map(joke => {
      if (selectedIds.includes(String(joke.id))) {
        switch (action) {
          case 'publish': return { ...joke, status: 'published' as ContentStatus };
          case 'draft': return { ...joke, status: 'draft' as ContentStatus };
          case 'trash': return { ...joke, status: 'trash' as ContentStatus };
          case 'delete': return null as unknown as Joke;
          case 'restore': return { ...joke, status: 'draft' as ContentStatus };
          default: return joke;
        }
      }
      return joke;
    }).filter(Boolean) as Joke[]);

    _setSelectedIds([]);
    _setBulkActionLoading(false);
  };

  // CRUD Functions
  const handleAddJoke = () => {
    if (!jokeForm.setup.trim() || !jokeForm.punchline.trim() || !jokeForm.category.trim()) return;

    const newJoke: Joke = {
      id: Date.now(),
      setup: jokeForm.setup.trim(),
      punchline: jokeForm.punchline.trim(),
      category: jokeForm.category.trim(),
      status: 'draft',
    };

    setAllJokes(prev => [...prev, newJoke]);
    setShowAddModal(false);
    setJokeForm({ setup: '', punchline: '', category: '' });
  };

  const handleEditJoke = () => {
    if (!selectedJoke || !jokeForm.setup.trim() || !jokeForm.punchline.trim() || !jokeForm.category.trim()) return;

    setAllJokes(prev => prev.map(j =>
      j.id === selectedJoke.id
        ? { ...j, setup: jokeForm.setup.trim(), punchline: jokeForm.punchline.trim(), category: jokeForm.category.trim() }
        : j
    ));
    setShowEditModal(false);
    _setSelectedJoke(null);
    setJokeForm({ setup: '', punchline: '', category: '' });
  };

  // Delete handler
  const handleDeleteJoke = () => {
    if (!selectedJoke) return;
    setAllJokes(prev => prev.filter(j => j.id !== selectedJoke.id));
    _setShowDeleteConfirm(false);
    _setSelectedJoke(null);
  };

  const openEditModal = (joke: Joke) => {
    _setSelectedJoke(joke);
    setJokeForm({
      setup: joke.setup || (joke.joke?.split('?')[0] ? joke.joke.split('?')[0] + '?' : joke.joke || ''),
      punchline: joke.punchline || (joke.joke?.split('?')[1] || ''),
      category: joke.category
    });
    setShowEditModal(true);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = jokesToCSV(filteredJokes);
    downloadFile(csv, `jokes_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = jokesToJSON(filteredJokes);
    downloadFile(json, `jokes_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Import handlers
  const handleFileUpload = (file: File) => {
    _setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let importedJokes: Joke[] = [];

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          importedJokes = Array.isArray(data.jokes)
            ? data.jokes
            : Array.isArray(data)
              ? data
              : [];
        } else {
          const result = parseJokeCSV(content);
          importedJokes = result.imported;
        }

        if (importedJokes.length === 0) {
          _setImportError('No valid jokes found in file');
          return;
        }

        setAllJokes(prev => [...prev, ...importedJokes.map(j => ({
          ...j,
          id: Date.now() + Math.floor(Math.random() * 1000),
          status: j.status || 'draft'
        }))]);
        _setShowImportModal(false);
        _setUploadKey(prev => prev + 1);
      } catch (err) {
        _setImportError('Failed to parse file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  // Reset import state when modal opens
  useEffect(() => {
    if (showImportModal) {
      _setImportError('');
      _setUploadKey(prev => prev + 1);
    }
  }, [showImportModal]);

  // Handle outside click for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle outside click for import modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importModalRef.current && !importModalRef.current.contains(event.target as Node)) {
        _setShowImportModal(false);
        _setImportError('');
      }
    };
    if (showImportModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showImportModal]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Manage Dad Jokes</h3>
          <p className="text-sm text-gray-500">Create, edit, and organize the dad jokes collection.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 flex items-center gap-2"
            >
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 last:rounded-b-lg"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => _setShowImportModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            + Add Joke
          </button>
        </div>
      </div>

      <StatusDashboard
        counts={statusCounts}
        activeFilter={statusFilter}
        onFilterChange={_setStatusFilter}
        loading={false}
      />

      <BulkActionToolbar
        selectedIds={selectedIds}
        totalItems={filteredJokes.length}
        currentFilter={statusFilter}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onAction={handleBulkAction}
        onClose={deselectAll}
        loading={bulkActionLoading}
      />

      {/* Inline Category Filter Row */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-1">Category:</span>

          {/* All Categories chip */}
          <button
            onClick={() => _setJokeFilterCategory('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${jokeFilterCategory === ''
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All Categories <span className="opacity-70">({allJokes.length})</span>
          </button>

          {/* Per-category chips with edit/delete */}
          {jokeCategories.map(cat => {
            const count = allJokes.filter(j => j.category === cat.name).length;
            const isActive = jokeFilterCategory === cat.name;
            const isPendingDelete = pendingCategoryDelete?.category.id === cat.id;
            return (
              <div key={cat.id} className={`group flex items-center gap-0.5 transition-opacity ${isPendingDelete ? 'opacity-40' : ''}`}>
                <button
                  onClick={() => _setJokeFilterCategory(isActive ? '' : cat.name)}
                  disabled={isPendingDelete}
                  className={`px-3 py-1.5 rounded-l-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {cat.emoji} {cat.name} <span className="opacity-70">({count})</span>
                </button>
                {/* Edit button */}
                <button
                  onClick={() => {
                    setSelectedCategoryForEdit(cat);
                    setCategoryForm({ name: cat.name, emoji: cat.emoji, description: cat.description || '' });
                    setShowEditCategoryModal(true);
                  }}
                  disabled={isPendingDelete}
                  className={`px-1.5 py-1.5 transition-colors border-x border-white/20 ${isActive
                    ? 'bg-green-400 text-white hover:bg-green-300'
                    : 'bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                    }`}
                  title={`Edit ${cat.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {/* Delete button — first click enters pending state, no auto-delete */}
                <button
                  onClick={() => {
                    // If there's a pending delete for another category, finalize it first
                    if (pendingCategoryDelete && pendingCategoryDelete.category.id !== cat.id) {
                      setJokeCategories(prev => prev.filter(c => c.id !== pendingCategoryDelete.category.id));
                    }
                    // Save original statuses and move jokes to draft as a safety measure
                    const originalStatuses: Record<string | number, string> = {};
                    setAllJokes(prev => prev.map(j => {
                      if (j.category === cat.name) {
                        originalStatuses[j.id] = j.status;
                        return { ...j, status: 'draft' as ContentStatus };
                      }
                      return j;
                    }));
                    // Clear active filter if it was this category
                    if (jokeFilterCategory === cat.name) _setJokeFilterCategory('');
                    // Mark as pending — no timer, waits for user to confirm
                    setPendingCategoryDelete({ category: cat, originalStatuses });
                  }}
                  className={`px-1.5 py-1.5 rounded-r-lg transition-colors ${isActive
                    ? 'bg-green-400 text-white hover:bg-red-400'
                    : 'bg-gray-200 text-red-600 hover:bg-red-50'
                    }`}
                  title={`Delete ${cat.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* Add Category chip */}
          <button
            onClick={() => {
              setCategoryForm({ name: '', emoji: '📚', description: '' });
              setShowAddCategoryModal(true);
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-indigo-300 text-indigo-500 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredJokes.length}
                  onChange={() => selectedIds.length === filteredJokes.length ? deselectAll() : selectAll()}
                  className="rounded border-gray-300"
                  aria-label="Select all jokes"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Question (Setup)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Answer (Punchline)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedJokes.map((joke, index) => (
              <tr key={joke.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(String(joke.id))}
                    onChange={() => toggleSelection(String(joke.id))}
                    className="rounded border-gray-300"
                    aria-label={`Select joke ${joke.id}`}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                  {(jokePage - 1) * jokesPerPage + index + 1}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-800 font-medium">{joke.setup || joke.joke}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEditModal(joke)}
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                      aria-label={`Edit joke ${joke.id}`}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => { _setSelectedJoke(joke); _setShowDeleteConfirm(true); }}
                      className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      aria-label={`Delete joke ${joke.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {joke.punchline}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                    {joke.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(joke.status)}`}>
                    {joke.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredJokes.length > 0 && (
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 mt-4">
          <p className="text-sm text-gray-500">
            Showing {Math.min((jokePage - 1) * jokesPerPage + 1, filteredJokes.length)} - {Math.min(jokePage * jokesPerPage, filteredJokes.length)} of {filteredJokes.length} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setJokePage(p => Math.max(1, p - 1))}
              disabled={jokePage === 1}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 flex items-center gap-1">
              Page
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                className="w-12 rounded border border-gray-300 px-2 py-1 text-center text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
              of <span className="font-medium">{totalJokePages || 1}</span>
            </span>
            <button
              onClick={() => setJokePage(p => Math.min(totalJokePages, p + 1))}
              disabled={jokePage >= totalJokePages}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Simple Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="text-xl font-bold mb-4">
              {showAddModal ? 'Add New Joke' : 'Edit Joke'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="joke-setup" className="block text-sm font-medium text-gray-700 mb-1">Question (Setup) *</label>
                <textarea
                  id="joke-setup"
                  value={jokeForm.setup}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, setup: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={2}
                  placeholder="Enter the joke question..."
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="joke-punchline" className="block text-sm font-medium text-gray-700 mb-1">Answer (Punchline) *</label>
                <textarea
                  id="joke-punchline"
                  value={jokeForm.punchline}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, punchline: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={2}
                  placeholder="Enter the joke answer..."
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={jokeForm.category}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="">Select a category</option>
                  {jokeCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setJokeForm({ setup: '', punchline: '', category: '' }); }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddJoke : handleEditJoke}
                disabled={!jokeForm.setup.trim() || !jokeForm.punchline.trim() || !jokeForm.category.trim()}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
              >
                {showAddModal ? 'Add Joke' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {_showDeleteConfirm && selectedJoke && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-red-600">🗑️ Delete Joke</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this joke? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="font-medium text-gray-800">{selectedJoke.joke}</p>
              <p className="text-sm text-gray-500 mt-1">Category: {selectedJoke.category}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { _setShowDeleteConfirm(false); _setSelectedJoke(null); }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJoke}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div ref={importModalRef} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">Import Jokes</h3>

            <div className="space-y-4">
              <FileUploader
                key={uploadKey}
                onFileSelect={handleFileUpload}
                accept=".csv,.json"
                label="Select CSV or JSON File"
                description="Drag and drop your CSV or JSON file here, or click to browse"
              />

              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">CSV Format (with headers):</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                  joke,category,status
                </code>
                <p className="font-medium mt-3 mb-2">JSON Format:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                  {`{"jokes": [{"joke": "...", "category": "...", "status": "draft"}]}`}
                </code>
              </div>

              {importError && (
                <p className="text-red-500 text-sm" role="alert">
                  {importError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    _setShowImportModal(false);
                    _setImportError('');
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Manage Joke Categories</h3>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                + Add Category
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Emoji</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Jokes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {jokeCategories.map(cat => {
                    const jokeCount = allJokes.filter(j => j.category === cat.name).length;
                    return (
                      <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-2xl">{cat.emoji}</td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {jokeCount}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedCategoryForEdit(cat);
                              setCategoryForm({ name: cat.name, emoji: cat.emoji, description: cat.description || '' });
                              setShowEditCategoryModal(true);
                            }}
                            className="mr-3 text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
                                setJokeCategories(prev => prev.filter(c => c.id !== cat.id));
                              }
                            }}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {jokeCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No categories found. Click &apos;Add Category&apos; to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCategoryManager(false)}
                className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold mb-4">Add Joke Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Science Jokes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={categoryForm.emoji}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, emoji: e.target.value }))}
                    className="w-20 rounded-lg border border-gray-300 px-4 py-2 text-center text-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    maxLength={2}
                  />
                  <span className="text-sm text-gray-500">Paste an emoji here to represent the category.</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                  placeholder="A brief description of this category..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setCategoryForm({ name: '', emoji: '📚', description: '' });
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!categoryForm.name.trim()) return;
                    setJokeCategories(prev => [
                      ...prev,
                      {
                        id: Date.now(),
                        name: categoryForm.name.trim(),
                        emoji: categoryForm.emoji || '📚',
                        description: categoryForm.description.trim()
                      }
                    ]);
                    setShowAddCategoryModal(false);
                    setCategoryForm({ name: '', emoji: '📚', description: '' });
                  }}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 font-medium"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategoryForEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold mb-4">Edit Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={categoryForm.emoji}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, emoji: e.target.value }))}
                    className="w-20 rounded-lg border border-gray-300 px-4 py-2 text-center text-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setSelectedCategoryForEdit(null);
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!categoryForm.name.trim() || !selectedCategoryForEdit) return;
                    setJokeCategories(prev => prev.map(cat =>
                      cat.id === selectedCategoryForEdit.id
                        ? { ...cat, name: categoryForm.name.trim(), emoji: categoryForm.emoji || '📚', description: categoryForm.description.trim() }
                        : cat
                    ));
                    setShowEditCategoryModal(false);
                    setSelectedCategoryForEdit(null);
                  }}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 font-medium"
                >
                  Update Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Banner */}
      {pendingCategoryDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-start gap-4 rounded-xl border border-red-200 bg-white px-5 py-4 shadow-2xl min-w-[380px] max-w-lg">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Delete &ldquo;{pendingCategoryDelete.category.emoji} {pendingCategoryDelete.category.name}&rdquo;?
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {Object.keys(pendingCategoryDelete.originalStatuses).length} joke(s) moved to <strong>Draft</strong> and hidden from public view.
              Category will <strong>not</strong> be deleted until you confirm below.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  // Restore the original statuses of the drafted jokes
                  setAllJokes(prev => prev.map(j => {
                    const originalStatus = pendingCategoryDelete.originalStatuses[j.id];
                    return originalStatus !== undefined
                      ? { ...j, status: originalStatus as ContentStatus }
                      : j;
                  }));
                  setPendingCategoryDelete(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel — Restore Jokes
              </button>
              <button
                onClick={() => {
                  setJokeCategories(prev => prev.filter(c => c.id !== pendingCategoryDelete.category.id));
                  setPendingCategoryDelete(null);
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
