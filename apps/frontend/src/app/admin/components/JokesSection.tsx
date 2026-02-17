'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { FileUploader } from '@/components/ui/FileUploader';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import type { Joke, JokeCategory, ContentStatus, BulkActionType, StatusFilter } from '../types';
import { getStatusBadgeColor, useJokeFilters, jokesToCSV, jokesToJSON, parseJokeCSV } from '../utils';

interface JokesSectionProps {
  allJokes: Joke[];
  setAllJokes: React.Dispatch<React.SetStateAction<Joke[]>>;
}

// Default joke categories
const defaultJokeCategories: JokeCategory[] = [
  { id: 1, name: 'Classic Dad Jokes', emoji: '😂' },
  { id: 2, name: 'Programming Jokes', emoji: '💻' },
  { id: 3, name: 'Kids Jokes', emoji: '🧒' },
  { id: 4, name: 'Office Jokes', emoji: '💼' },
];

export function JokesSection({ allJokes, setAllJokes }: JokesSectionProps): JSX.Element {
  const [jokeCategories] = useState<JokeCategory[]>(defaultJokeCategories);
  const [jokeFilterCategory, _setJokeFilterCategory] = useState<string>('');
  const [jokeSearch, _setJokeSearch] = useState<string>('');
  const [jokePage, setJokePage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [statusFilter, _setStatusFilter] = useState<StatusFilter>('published');
  const [selectedIds, _setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, _setBulkActionLoading] = useState(false);
  const jokesPerPage = 10;

  // Group by category state
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [_showDeleteConfirm, _setShowDeleteConfirm] = useState(false);
  const [showImportModal, _setShowImportModal] = useState(false);
  const [selectedJoke, _setSelectedJoke] = useState<Joke | null>(null);
  const [importError, _setImportError] = useState('');
  const [uploadKey, _setUploadKey] = useState(0);

  // Form State - now with question and answer
  const [jokeForm, setJokeForm] = useState({ question: '', answer: '', category: '' });

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

  // Group jokes by category
  const groupedJokes = useMemo(() => {
    const groups: Record<string, Joke[]> = {};
    filteredJokes.forEach(joke => {
      const cat = joke.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(joke);
    });
    return groups;
  }, [filteredJokes]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Pagination for flat view
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
    if (!jokeForm.question.trim() || !jokeForm.answer.trim() || !jokeForm.category.trim()) return;

    const newJoke: Joke = {
      id: Date.now(),
      question: jokeForm.question.trim(),
      answer: jokeForm.answer.trim(),
      category: jokeForm.category.trim(),
      status: 'draft',
    };

    setAllJokes(prev => [...prev, newJoke]);
    setShowAddModal(false);
    setJokeForm({ question: '', answer: '', category: '' });
  };

  const handleEditJoke = () => {
    if (!selectedJoke || !jokeForm.question.trim() || !jokeForm.answer.trim() || !jokeForm.category.trim()) return;

    setAllJokes(prev => prev.map(j =>
      j.id === selectedJoke.id
        ? { ...j, question: jokeForm.question.trim(), answer: jokeForm.answer.trim(), category: jokeForm.category.trim() }
        : j
    ));
    setShowEditModal(false);
    _setSelectedJoke(null);
    setJokeForm({ question: '', answer: '', category: '' });
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
      question: joke.question || joke.joke || '', 
      answer: joke.answer || '', 
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">😂 Dad Jokes Management</h3>
          <p className="text-sm text-gray-500">{filteredJokes.length} total jokes</p>
        </div>
        <div className="flex gap-2">
          {/* Group by Category Toggle */}
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              groupByCategory ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {groupByCategory ? '👥 Grouped' : '📋 Flat View'}
          </button>
          {/* Export Dropdown */}
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

      {/* Grouped View */}
      {groupByCategory ? (
        <div className="space-y-4">
          {Object.entries(groupedJokes).map(([category, jokes]) => (
            <div key={category} className="rounded-xl bg-white shadow-md overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{category}</span>
                  <span className="text-sm text-gray-500">({jokes.length} jokes)</span>
                </div>
                {expandedCategories.has(category) ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </button>
              
              {expandedCategories.has(category) && (
                <table className="w-full">
                  <thead className="bg-gray-50 border-t border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 w-10">
                        <input
                          type="checkbox"
                          checked={jokes.every(j => selectedIds.includes(String(j.id)))}
                          onChange={() => {
                            const jokeIds = jokes.map(j => String(j.id));
                            if (jokes.every(j => selectedIds.includes(String(j.id)))) {
                              _setSelectedIds(prev => prev.filter(id => !jokeIds.includes(id)));
                            } else {
                              _setSelectedIds(prev => [...new Set([...prev, ...jokeIds])]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 w-1/2">Question</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 w-1/3">Answer</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jokes.map((joke) => (
                      <tr key={joke.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(joke.id))}
                            onChange={() => toggleSelection(String(joke.id))}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-800 font-medium">{joke.question || joke.joke}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => openEditModal(joke)}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => { _setSelectedJoke(joke); _setShowDeleteConfirm(true); }}
                              className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 italic">{joke.answer || 'No answer set'}</p>
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
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Flat Table View */
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-2/5">Question</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-1/4">Answer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedJokes.map((joke) => (
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
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-800 font-medium">{joke.question || joke.joke}</p>
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
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 italic">{joke.answer || 'No answer set'}</p>
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
      )}

      {/* Pagination - only for flat view */}
      {!groupByCategory && filteredJokes.length > 0 && (
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 mt-4 rounded-xl">
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

      {/* Add/Edit Modal with Question and Answer */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="text-xl font-bold mb-4">
              {showAddModal ? 'Add New Joke' : 'Edit Joke'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="joke-question" className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea
                  id="joke-question"
                  value={jokeForm.question}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={3}
                  placeholder="Enter the joke question..."
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="joke-answer" className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <input
                  id="joke-answer"
                  type="text"
                  value={jokeForm.answer}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, answer: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Enter the punchline/answer..."
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="joke-category" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  id="joke-category"
                  value={jokeForm.category}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  aria-required="true"
                >
                  <option value="">Select category</option>
                  {jokeCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setJokeForm({ question: '', answer: '', category: '' }); }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddJoke : handleEditJoke}
                disabled={!jokeForm.question.trim() || !jokeForm.answer.trim() || !jokeForm.category.trim()}
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
              <p className="font-medium text-gray-800">{selectedJoke.question || selectedJoke.joke}</p>
              <p className="text-sm text-gray-600 italic mt-1">{selectedJoke.answer}</p>
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
                  question,answer,category,status
                </code>
                <p className="font-medium mt-3 mb-2">JSON Format:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block overflow-x-auto">
                  {`{"jokes": [{"question": "...", "answer": "...", "category": "...", "status": "draft"}]}`}
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
