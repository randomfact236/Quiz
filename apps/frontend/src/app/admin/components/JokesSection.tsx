'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [jokeFilterCategory, setJokeFilterCategory] = useState<string>('');
  const [jokeSearch, setJokeSearch] = useState<string>('');
  const [jokePage, setJokePage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const jokesPerPage = 10;

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedJoke, setSelectedJoke] = useState<Joke | null>(null);

  // Form State
  const [jokeForm, setJokeForm] = useState({ joke: '', category: '' });

  const { filteredJokes, statusCounts } = useJokeFilters(
    allJokes,
    jokeFilterCategory,
    jokeSearch,
    statusFilter
  );

  const totalJokePages = Math.ceil(filteredJokes.length / jokesPerPage);
  const paginatedJokes = filteredJokes.slice((jokePage - 1) * jokesPerPage, jokePage * jokesPerPage);

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(filteredJokes.map(j => String(j.id)));
  const deselectAll = () => setSelectedIds([]);

  // Bulk action handler
  const handleBulkAction = async (action: BulkActionType) => {
    setBulkActionLoading(true);
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

    setSelectedIds([]);
    setBulkActionLoading(false);
  };

  // CRUD Functions
  const handleAddJoke = () => {
    if (!jokeForm.joke.trim() || !jokeForm.category.trim()) return;

    const newJoke: Joke = {
      id: Date.now(),
      joke: jokeForm.joke.trim(),
      category: jokeForm.category.trim(),
      status: 'draft',
    };

    setAllJokes(prev => [...prev, newJoke]);
    setShowAddModal(false);
    setJokeForm({ joke: '', category: '' });
  };

  const handleEditJoke = () => {
    if (!selectedJoke || !jokeForm.joke.trim() || !jokeForm.category.trim()) return;

    setAllJokes(prev => prev.map(j =>
      j.id === selectedJoke.id
        ? { ...j, joke: jokeForm.joke.trim(), category: jokeForm.category.trim() }
        : j
    ));
    setShowEditModal(false);
    setSelectedJoke(null);
    setJokeForm({ joke: '', category: '' });
  };

  const handleDeleteJoke = () => {
    if (!selectedJoke) return;
    setAllJokes(prev => prev.filter(j => j.id !== selectedJoke.id));
    setShowDeleteConfirm(false);
    setSelectedJoke(null);
  };

  const openEditModal = (joke: Joke) => {
    setSelectedJoke(joke);
    setJokeForm({ joke: joke.joke, category: joke.category });
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
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = parseJokeCSV(content);
        if (result.imported.length > 0) {
          setAllJokes(prev => [...prev, ...result.imported.map(j => ({ ...j, id: Date.now() + Math.floor(Math.random() * 1000) }))]);
        }
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">😂 Dad Jokes Management</h3>
          <p className="text-sm text-gray-500">{filteredJokes.length} total jokes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
          >
            Export CSV
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
        onFilterChange={setStatusFilter}
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Joke</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
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
                  <p className="text-sm text-gray-800">{joke.joke}</p>
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
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(joke)}
                      className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200"
                      aria-label={`Edit joke ${joke.id}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setSelectedJoke(joke); setShowDeleteConfirm(true); }}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                      aria-label={`Delete joke ${joke.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="text-xl font-bold mb-4">
              {showAddModal ? 'Add New Joke' : 'Edit Joke'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="joke-text" className="block text-sm font-medium text-gray-700 mb-1">Joke *</label>
                <textarea
                  id="joke-text"
                  value={jokeForm.joke}
                  onChange={(e) => setJokeForm(prev => ({ ...prev, joke: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={4}
                  placeholder="Enter the joke..."
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
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setJokeForm({ joke: '', category: '' }); }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddJoke : handleEditJoke}
                disabled={!jokeForm.joke.trim() || !jokeForm.category.trim()}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
              >
                {showAddModal ? 'Add Joke' : 'Save Changes'}
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
