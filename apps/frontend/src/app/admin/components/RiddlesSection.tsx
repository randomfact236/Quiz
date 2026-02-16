'use client';

import { useState, useRef, useEffect } from 'react';
import { FileUploader } from '@/components/ui/FileUploader';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import { initialRiddles as libInitialRiddles } from '@/lib/initial-data';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import type { Riddle, ContentStatus, BulkActionType, StatusFilter } from '../types';
import {
  getStatusBadgeColor,
  getDifficultyColor,
  riddlesToCSV,
  riddlesToJSON,
  parseRiddleCSV,
  validateJSONStructure,
  downloadFile,
} from '../utils';

/**
 * Props for the RiddlesSection component
 */
interface RiddlesSectionProps {
  /** Optional initial riddles data */
  initialRiddles?: Riddle[];
}

/**
 * Riddle form state interface
 */
interface RiddleFormState {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficulty: Riddle['difficulty'];
  chapter: string;
}

/**
 * RiddlesSection Component
 *
 * Manages the riddle content section in the admin panel.
 * Features include:
 * - Riddle list display with filtering by chapter, difficulty, and search
 * - Add/Edit riddle modal with form validation
 * - Bulk actions (publish, draft, trash, delete, restore)
 * - CSV/JSON import and export functionality
 * - Pagination and status dashboard
 *
 * @example
 * ```tsx
 * <RiddlesSection />
 * ```
 */
export function RiddlesSection({ initialRiddles }: RiddlesSectionProps): JSX.Element {
  const [allRiddles, setAllRiddles] = useState<Riddle[]>(() =>
    initialRiddles ?? getItem(STORAGE_KEYS.RIDDLES, libInitialRiddles)
  );

  // Persistence
  useEffect(() => {
    setItem(STORAGE_KEYS.RIDDLES, allRiddles);
  }, [allRiddles]);

  // Filter States
  const [riddleFilterLevel, setRiddleFilterLevel] = useState<string>('');
  const [riddleFilterChapter, setRiddleFilterChapter] = useState<string>('');
  const [riddleSearch, setRiddleSearch] = useState<string>('');
  const [riddlePage, setRiddlePage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const riddlesPerPage = 10;

  // Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRiddle, setSelectedRiddle] = useState<Riddle | null>(null);

  // Import State
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState<Riddle[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModalRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Form State
  const [riddleForm, setRiddleForm] = useState<RiddleFormState>({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    difficulty: 'easy',
    chapter: '',
  });

  // Get unique chapters from riddles
  const chapters = Array.from(new Set(allRiddles.map(r => r.chapter)));

  // Calculate chapter counts
  const chapterCounts = chapters.reduce((acc, chapter) => {
    acc[chapter] = allRiddles.filter(r => r.chapter === chapter).length;
    return acc;
  }, {} as Record<string, number>);

  // Calculate difficulty counts
  const difficultyCounts = {
    easy: allRiddles.filter(r => r.difficulty === 'easy').length,
    medium: allRiddles.filter(r => r.difficulty === 'medium').length,
    hard: allRiddles.filter(r => r.difficulty === 'hard').length,
    expert: allRiddles.filter(r => r.difficulty === 'expert').length,
    extreme: allRiddles.filter(r => r.difficulty === 'extreme').length,
  };

  // Calculate status counts
  const statusCounts = {
    total: allRiddles.length,
    published: allRiddles.filter(r => r.status === 'published').length,
    draft: allRiddles.filter(r => r.status === 'draft').length,
    trash: allRiddles.filter(r => r.status === 'trash').length,
  };

  // Filter riddles based on all criteria
  const filteredRiddles = allRiddles.filter(riddle => {
    const matchesDifficulty = !riddleFilterLevel || riddle.difficulty === riddleFilterLevel;
    const matchesChapter = !riddleFilterChapter || riddle.chapter === riddleFilterChapter;
    const matchesSearch = !riddleSearch ||
      riddle.question.toLowerCase().includes(riddleSearch.toLowerCase()) ||
      riddle.options[0]?.toLowerCase().includes(riddleSearch.toLowerCase()) ||
      riddle.options[1]?.toLowerCase().includes(riddleSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || riddle.status === statusFilter;
    return matchesDifficulty && matchesChapter && matchesSearch && matchesStatus;
  });

  // Pagination
  const totalRiddlePages = Math.ceil(filteredRiddles.length / riddlesPerPage);
  const paginatedRiddles = filteredRiddles.slice(
    (riddlePage - 1) * riddlesPerPage,
    riddlePage * riddlesPerPage
  );

  // Sync pageInput with riddlePage
  useEffect(() => {
    setPageInput(String(riddlePage));
  }, [riddlePage]);

  // Page input handlers
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalRiddlePages) {
      setRiddlePage(page);
    } else {
      setPageInput(String(riddlePage));
    }
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(filteredRiddles.map(r => String(r.id)));
  const deselectAll = () => setSelectedIds([]);

  // Bulk action handler
  const handleBulkAction = async (action: BulkActionType) => {
    setBulkActionLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    setAllRiddles(prev =>
      prev
        .map(riddle => {
          if (selectedIds.includes(String(riddle.id))) {
            switch (action) {
              case 'publish':
                return { ...riddle, status: 'published' as ContentStatus };
              case 'draft':
                return { ...riddle, status: 'draft' as ContentStatus };
              case 'trash':
                return { ...riddle, status: 'trash' as ContentStatus };
              case 'delete':
                return null;
              case 'restore':
                return { ...riddle, status: 'draft' as ContentStatus };
              default:
                return riddle;
            }
          }
          return riddle;
        })
        .filter(Boolean) as Riddle[]
    );

    setSelectedIds([]);
    setBulkActionLoading(false);
  };

  // Check if an option is the correct answer
  const isCorrectOption = (riddle: Riddle, optionIndex: number) =>
    riddle.correctOption === ['A', 'B', 'C', 'D'][optionIndex];

  // Export Functions
  const handleExportCSV = () => {
    const csv = riddlesToCSV(filteredRiddles);
    downloadFile(csv, `riddles_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = riddlesToJSON(filteredRiddles);
    downloadFile(json, `riddles_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Import Functions
  const handleFileUpload = (file: File) => {
    setImportError('');
    setImportWarnings([]);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let result: import('../types').ImportResult<Riddle>;

        if (file.name.endsWith('.json')) {
          const validation = validateJSONStructure<Riddle>(content, 'riddles');
          if (!validation.isValid || !validation.data) {
            setImportError(validation.errors.join('; '));
            return;
          }
          result = {
            success: true,
            imported: validation.data.map(r => ({
              ...r,
              id: Date.now() + Math.floor(Math.random() * 1000),
            })),
            failed: [],
            total: validation.data.length,
          };
        } else {
          result = parseRiddleCSV(content);
        }

        if (result.imported.length === 0) {
          setImportError(result.failed.map(f => f.error).join('; ') || 'No valid riddles found');
          return;
        }

        setImportPreview(result.imported);
        if (result.failed.length > 0) {
          setImportWarnings(result.failed.map(f => `Row ${f.row}: ${f.error}`));
        }
      } catch (err) {
        setImportError('Failed to parse file: ' + (err as Error).message);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    setAllRiddles(prev => [...prev, ...importPreview]);
    setShowImportModal(false);
    setImportPreview([]);
    setImportWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset form helper
  const resetRiddleForm = () => {
    setRiddleForm({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      difficulty: 'easy',
      chapter: '',
    });
  };

  // Handle outside click for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle outside click for import modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        importModalRef.current &&
        !importModalRef.current.contains(event.target as Node)
      ) {
        setShowImportModal(false);
        setImportError('');
        setImportPreview([]);
      }
    };
    if (showImportModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showImportModal]);

  // Handle outside click for add modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
        resetRiddleForm();
      }
    };
    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showAddModal]);

  // Handle outside click for edit modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditModal(false);
        setSelectedRiddle(null);
        resetRiddleForm();
      }
    };
    if (showEditModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showEditModal]);

  // CRUD Functions
  const handleAddRiddle = () => {
    if (
      !riddleForm.question.trim() ||
      !riddleForm.optionA.trim() ||
      !riddleForm.optionB.trim() ||
      !riddleForm.chapter.trim()
    ) {
      return;
    }

    const newRiddle: Riddle = {
      id: Date.now(),
      question: riddleForm.question.trim(),
      options: [
        riddleForm.optionA.trim(),
        riddleForm.optionB.trim(),
        riddleForm.optionC.trim(),
        riddleForm.optionD.trim(),
      ],
      correctOption: riddleForm.correctOption,
      difficulty: riddleForm.difficulty,
      chapter: riddleForm.chapter.trim(),
      status: 'draft',
    };

    setAllRiddles(prev => [...prev, newRiddle]);
    setShowAddModal(false);
    resetRiddleForm();
  };

  const handleEditRiddle = () => {
    if (
      !selectedRiddle ||
      !riddleForm.question.trim() ||
      !riddleForm.optionA.trim() ||
      !riddleForm.optionB.trim() ||
      !riddleForm.chapter.trim()
    ) {
      return;
    }

    setAllRiddles(prev =>
      prev.map(r =>
        r.id === selectedRiddle.id
          ? {
              ...r,
              question: riddleForm.question.trim(),
              options: [
                riddleForm.optionA.trim(),
                riddleForm.optionB.trim(),
                riddleForm.optionC.trim(),
                riddleForm.optionD.trim(),
              ],
              correctOption: riddleForm.correctOption,
              difficulty: riddleForm.difficulty,
              chapter: riddleForm.chapter.trim(),
            }
          : r
      )
    );
    setShowEditModal(false);
    setSelectedRiddle(null);
    resetRiddleForm();
  };

  const handleDeleteRiddle = () => {
    if (!selectedRiddle) {
      return;
    }
    setAllRiddles(prev => prev.filter(r => r.id !== selectedRiddle.id));
    setShowDeleteConfirm(false);
    setSelectedRiddle(null);
  };

  const openEditModal = (riddle: Riddle) => {
    setSelectedRiddle(riddle);
    setRiddleForm({
      question: riddle.question,
      optionA: riddle.options[0] || '',
      optionB: riddle.options[1] || '',
      optionC: riddle.options[2] || '',
      optionD: riddle.options[3] || '',
      correctOption: riddle.correctOption,
      difficulty: riddle.difficulty,
      chapter: riddle.chapter,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (riddle: Riddle) => {
    setSelectedRiddle(riddle);
    setShowDeleteConfirm(true);
  };

  // Difficulty level options
  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' },
    { value: 'extreme', label: 'Extreme' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎭 Riddles Management</h3>
          <p className="text-sm text-gray-500">{filteredRiddles.length} total riddles</p>
        </div>
        <div className="flex gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
              aria-label="Export riddles"
              aria-expanded={showExportDropdown}
              aria-haspopup="menu"
            >
              📥 Export
            </button>
            {showExportDropdown && (
              <div
                className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-lg z-10"
                role="menu"
              >
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowExportDropdown(false);
                  }}
                  className="w-full rounded-t-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                  role="menuitem"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportDropdown(false);
                  }}
                  className="w-full rounded-b-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                  role="menuitem"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
            aria-label="Import riddles"
          >
            📤 Import
          </button>
          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            aria-label="Add new riddle"
          >
            + Add Riddle
          </button>
        </div>
      </div>

      {/* Status Dashboard */}
      <div className="mb-4">
        <StatusDashboard
          counts={statusCounts}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          loading={false}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Chapter Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-gray-600">Chapter:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              riddleFilterChapter === ''
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setRiddleFilterChapter('')}
            aria-pressed={riddleFilterChapter === ''}
          >
            All Chapters <span className="opacity-70">({allRiddles.length})</span>
          </button>
          {chapters.map(chapter => (
            <button
              key={`chapter-${chapter}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                riddleFilterChapter === chapter
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setRiddleFilterChapter(chapter)}
              aria-pressed={riddleFilterChapter === chapter}
            >
              {chapter} <span className="opacity-70">({chapterCounts[chapter] || 0})</span>
            </button>
          ))}
          <button className="rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200">
            + Add Chapter
          </button>
        </div>

        {/* Level Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-gray-600">Level:</span>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              riddleFilterLevel === ''
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setRiddleFilterLevel('')}
            aria-pressed={riddleFilterLevel === ''}
          >
            All Levels <span className="opacity-70">({allRiddles.length})</span>
          </button>
          {difficultyLevels.map(({ value, label }) => (
            <button
              key={`level-${value}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                riddleFilterLevel === value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setRiddleFilterLevel(value)}
              aria-pressed={riddleFilterLevel === value}
            >
              {label} <span className="opacity-70">({difficultyCounts[value as keyof typeof difficultyCounts] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-2">
          <label htmlFor="riddle-search" className="mr-1 text-sm text-gray-600">
            Search:
          </label>
          <input
            id="riddle-search"
            type="text"
            placeholder="Type to search riddles..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm"
            value={riddleSearch}
            onChange={e => setRiddleSearch(e.target.value)}
            aria-label="Search riddles by keyword"
          />
          {(riddleFilterChapter || riddleFilterLevel || riddleSearch || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setRiddleFilterChapter('');
                setRiddleFilterLevel('');
                setRiddleSearch('');
                setStatusFilter('all');
              }}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
              aria-label="Clear all filters"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        totalItems={filteredRiddles.length}
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
              <th className="w-10 px-3 py-3 text-left text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredRiddles.length}
                  onChange={() =>
                    selectedIds.length === filteredRiddles.length ? deselectAll() : selectAll()
                  }
                  className="rounded border-gray-300"
                  aria-label="Select all riddles"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-12">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Question</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-28">Chapter</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-48">Options</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-16">Ans</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-20">Level</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-20">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRiddles.map((riddle, index) => (
              <tr key={`riddle-row-${riddle.id}`} className="hover:bg-gray-50">
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(String(riddle.id))}
                    onChange={() => toggleSelection(String(riddle.id))}
                    className="rounded border-gray-300"
                    aria-label={`Select riddle ${riddle.id}`}
                  />
                </td>
                <td className="px-3 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-3 py-3 align-top">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{riddle.question}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEditModal(riddle)}
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
                      aria-label={`Edit riddle ${riddle.id}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(riddle)}
                      className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      aria-label={`Delete riddle ${riddle.id}`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    {riddle.chapter || 'General'}
                  </span>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1 text-xs">
                    <div className={isCorrectOption(riddle, 0) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                      A. {riddle.options[0]}
                    </div>
                    <div className={isCorrectOption(riddle, 1) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                      B. {riddle.options[1]}
                    </div>
                    {riddle.options[2] && (
                      <div className={isCorrectOption(riddle, 2) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                        C. {riddle.options[2]}
                      </div>
                    )}
                    {riddle.options[3] && (
                      <div className={isCorrectOption(riddle, 3) ? 'font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded' : 'text-gray-600 px-1.5'}>
                        D. {riddle.options[3]}
                      </div>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                    {riddle.correctOption}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getDifficultyColor(riddle.difficulty)}`}>
                    {riddle.difficulty}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-center align-top">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(riddle.status)}`}>
                    {riddle.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedRiddles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">No riddles found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting filters or add new riddles</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredRiddles.length > 0 && (
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 mt-4">
          <p className="text-sm text-gray-500">
            Showing {Math.min((riddlePage - 1) * riddlesPerPage + 1, filteredRiddles.length)} - {Math.min(riddlePage * riddlesPerPage, filteredRiddles.length)} of {filteredRiddles.length} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRiddlePage(p => Math.max(1, p - 1))}
              disabled={riddlePage === 1}
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
              of <span className="font-medium">{totalRiddlePages || 1}</span>
            </span>
            <button
              onClick={() => setRiddlePage(p => Math.min(totalRiddlePages, p + 1))}
              disabled={riddlePage >= totalRiddlePages}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div ref={importModalRef} className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">📤 Import Riddles</h3>

            {!importPreview.length ? (
              <div className="space-y-4">
                <FileUploader
                  onFileSelect={handleFileUpload}
                  accept=".csv,.json"
                  label="Select CSV or JSON File"
                  description="Drag and drop your CSV or JSON file here, or click to browse"
                />

                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p className="mb-2 font-medium">CSV Format:</p>
                  <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                    Question,Answer,OptionA,OptionB,OptionC,OptionD,CorrectOption,Difficulty,Chapter,Hint
                  </code>
                  <p className="mb-2 mt-3 font-medium">JSON Format:</p>
                  <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                    {`{"riddles": [{"question": "...", "answer": "...", "options": [...], "correctOption": "A", "level": "easy", "chapter": "..."}]}`}
                  </code>
                </div>

                {importError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-600">⚠️ {importError}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportError('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-medium text-green-600">
                  ✓ Found {importPreview.length} riddles to import
                </p>

                {importWarnings.length > 0 && (
                  <div className="max-h-32 overflow-auto rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="mb-1 text-sm font-medium text-yellow-700">⚠️ Warnings:</p>
                    {importWarnings.map((w, i) => (
                      <p key={`warning-${w.slice(0, 30)}-${w.length}-${i}`} className="text-xs text-yellow-600">
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                <div className="max-h-64 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Question</th>
                        <th className="px-3 py-2 text-left">Answer</th>
                        <th className="px-3 py-2 text-left">Level</th>
                        <th className="px-3 py-2 text-left">Chapter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 5).map((riddle, i) => (
                        <tr
                          key={`preview-${riddle.id ?? riddle.question?.slice(0, 20)}-${i}`}
                          className="border-t"
                        >
                          <td className="max-w-xs truncate px-3 py-2">{riddle.question}</td>
                          <td className="px-3 py-2">{riddle.answer}</td>
                          <td className="px-3 py-2">{riddle.difficulty}</td>
                          <td className="px-3 py-2">{riddle.chapter}</td>
                        </tr>
                      ))}
                      {importPreview.length > 5 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
                            ... and {importPreview.length - 5} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setImportPreview([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                  >
                    Import {importPreview.length} Riddles
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={showAddModal ? addModalRef : editModalRef}
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6"
          >
            <h3 className="mb-4 text-xl font-bold">
              {showAddModal ? '➕ Add New Riddle' : '✏️ Edit Riddle'}
            </h3>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label htmlFor="riddle-question" className="mb-1 block text-sm font-medium text-gray-700">
                  Question *
                </label>
                <textarea
                  id="riddle-question"
                  value={riddleForm.question}
                  onChange={e => setRiddleForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  placeholder="Enter the riddle question..."
                  aria-required="true"
                />
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="riddle-option-a" className="mb-1 block text-sm font-medium text-gray-700">
                    Option A *
                  </label>
                  <input
                    id="riddle-option-a"
                    type="text"
                    value={riddleForm.optionA}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionA: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option A"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="riddle-option-b" className="mb-1 block text-sm font-medium text-gray-700">
                    Option B *
                  </label>
                  <input
                    id="riddle-option-b"
                    type="text"
                    value={riddleForm.optionB}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionB: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option B"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="riddle-option-c" className="mb-1 block text-sm font-medium text-gray-700">
                    Option C
                  </label>
                  <input
                    id="riddle-option-c"
                    type="text"
                    value={riddleForm.optionC}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionC: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label htmlFor="riddle-option-d" className="mb-1 block text-sm font-medium text-gray-700">
                    Option D
                  </label>
                  <input
                    id="riddle-option-d"
                    type="text"
                    value={riddleForm.optionD}
                    onChange={e => setRiddleForm(prev => ({ ...prev, optionD: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Option D"
                  />
                </div>
              </div>

              {/* Correct Answer, Difficulty, Chapter */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="riddle-correct-answer"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Correct Answer *
                  </label>
                  <select
                    id="riddle-correct-answer"
                    value={riddleForm.correctOption}
                    onChange={e => setRiddleForm(prev => ({ ...prev, correctOption: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="riddle-difficulty" className="mb-1 block text-sm font-medium text-gray-700">
                    Difficulty *
                  </label>
                  <select
                    id="riddle-difficulty"
                    value={riddleForm.difficulty}
                    onChange={e =>
                      setRiddleForm(prev => ({ ...prev, difficulty: e.target.value as Riddle['difficulty'] }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="riddle-chapter" className="mb-1 block text-sm font-medium text-gray-700">
                    Chapter *
                  </label>
                  <select
                    id="riddle-chapter"
                    value={riddleForm.chapter}
                    onChange={e => setRiddleForm(prev => ({ ...prev, chapter: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map(ch => (
                      <option key={`chapter-option-${ch}`} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetRiddleForm();
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddModal ? handleAddRiddle : handleEditRiddle}
                  disabled={
                    !riddleForm.question.trim() ||
                    !riddleForm.optionA.trim() ||
                    !riddleForm.optionB.trim() ||
                    !riddleForm.chapter.trim()
                  }
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showAddModal ? 'Add Riddle' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedRiddle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-2 text-xl font-bold">🗑️ Confirm Delete</h3>
            <p className="mb-4 text-gray-600">Are you sure you want to delete this riddle?</p>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="line-clamp-2 text-sm text-gray-800">{selectedRiddle.question}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedRiddle(null);
                }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRiddle}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
