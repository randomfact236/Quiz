'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Pencil, Trash2, Plus, X, ArrowUpDown } from 'lucide-react';
import { StatusDashboard } from '@/components/ui/StatusDashboard';
import { BulkActionToolbar } from '@/components/ui/BulkActionToolbar';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { toast } from '@/lib/toast';
import { useClickOutside } from '@/hooks/useClickOutside';
import { initialImageRiddles as libInitialImageRiddles } from '@/lib/initial-data';
import type { ImageRiddle, ContentStatus, StatusFilter, BulkActionType } from '../types';
import { getStatusBadgeColor, getDifficultyColor, downloadFile } from '../utils';

/** Items per page constant */
const ITEMS_PER_PAGE = 10;

/** Category type for image riddles */
interface ImageRiddleCategory {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

/** Import export config type */
interface ImportExportConfig<T> {
  entityName: string;
  filePrefix: string;
  csvHeaders: string[];
  jsonRootKey: string;
  validators: {
    required: (keyof T)[];
    enumFields?: Record<string, string[]>;
    maxLength?: Record<string, number>;
  };
}

/** Validation result type */
interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  errors: string[];
  warnings: string[];
}

/** Import result type */
interface ImportResult<T> {
  success: boolean;
  imported: T[];
  failed: { row: number; error: string; data: unknown }[];
  total: number;
}

/** Riddle form state type */
interface RiddleFormState {
  title: string;
  imageUrl: string;
  answer: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timerSeconds: string;
  showTimer: boolean;
  isActive: boolean;
  categoryName: string;
  categoryEmoji: string;
  status?: ContentStatus;
}

/** Status counts type */
interface StatusCounts {
  total: number;
  published: number;
  draft: number;
  trash: number;
}

/** Image Riddle Import/Export Config */
const imageRiddleConfig: ImportExportConfig<ImageRiddle> = {
  entityName: 'ImageRiddle',
  filePrefix: 'image-riddles',
  csvHeaders: ['ID', 'Title', 'ImageUrl', 'Answer', 'Hint', 'Difficulty', 'Category', 'TimerSeconds', 'ShowTimer', 'IsActive'],
  jsonRootKey: 'imageRiddles',
  validators: {
    required: ['title', 'imageUrl', 'answer', 'difficulty', 'category'],
    enumFields: { difficulty: ['easy', 'medium', 'hard', 'expert'] },
    maxLength: { title: 500, answer: 500, hint: 1000, category: 100 },
  },
};

/**
 * Validates CSV content against expected headers and structure
 */
function validateCSVStructure(csvText: string, expectedHeaders: string[]): ValidationResult<string[]> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { isValid: false, data: null, errors, warnings };
  }

  const firstLine = lines[0];
  if (!firstLine) {
    errors.push('CSV file is empty');
    return { isValid: false, data: null, errors, warnings };
  }

  const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
  const missingHeaders = expectedHeaders.filter(expected =>
    !headers.some(header => header.includes(expected.toLowerCase()))
  );

  if (missingHeaders.length > 0) {
    warnings.push(`Missing expected headers: ${missingHeaders.join(', ')}`);
  }

  return { isValid: errors.length === 0, data: headers, errors, warnings };
}

/**
 * Validates JSON content structure
 */
function validateJSONStructure<T>(jsonText: string, rootKey?: string): ValidationResult<T[]> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(jsonText);

    let dataArray: T[];
    if (rootKey && parsed[rootKey]) {
      dataArray = Array.isArray(parsed[rootKey]) ? parsed[rootKey] : [parsed[rootKey]];
    } else if (Array.isArray(parsed)) {
      dataArray = parsed;
    } else {
      dataArray = [parsed];
    }

    if (dataArray.length === 0) {
      errors.push('No data records found in JSON file');
    }

    return {
      isValid: errors.length === 0,
      data: dataArray,
      errors,
      warnings,
    };
  } catch (err) {
    errors.push(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { isValid: false, data: null, errors, warnings };
  }
}

/**
 * Enterprise-Grade Generic CSV Exporter
 */
function exportToCSV<T extends Record<string, unknown>>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, string>
): string {
  const headers = config.csvHeaders;

  const rows = items.map(item =>
    headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '') as keyof T;
      const value = item[key];

      if (value === null || value === undefined) { return ''; }

      const strValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    })
  );

  // Add metadata header if provided
  let csvContent = '';
  if (metadata) {
    csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
  }

  csvContent += [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
}

/**
 * Enterprise-Grade Generic JSON Exporter
 */
function exportToJSON<T>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, unknown>
): string {
  const data: Record<string, unknown> = {
    [config.jsonRootKey]: items,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  if (metadata) {
    data['metadata'] = metadata;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Enterprise-Grade Generic CSV Importer
 */
function importFromCSV<T extends Record<string, unknown>>(
  csvText: string,
  config: ImportExportConfig<T>,
  mapper: (values: string[], headers: string[]) => Partial<T>
): ImportResult<T> {
  const imported: T[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];

  const validation = validateCSVStructure(csvText, config.csvHeaders);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      imported,
      failed: validation.errors.map((error, index) => ({ row: index, error, data: null })),
      total: 0,
    };
  }

  const lines = csvText.trim().split('\n');
  const headers = validation.data;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    try {
      // RFC 4180 compliant CSV tokenizer — handles quoted fields with commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (ch === '"') {
          if (inQuotes && line[ci + 1] === '"') { current += '"'; ci++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          values.push(current); current = '';
        } else {
          current += ch;
        }
      }
      values.push(current);
      const mapped = mapper(values, headers);

      if (mapped && Object.keys(mapped).length > 0) {
        imported.push(mapped as T);
      }
    } catch (err) {
      failed.push({
        row: i,
        error: err instanceof Error ? err.message : 'Unknown error',
        data: line,
      });
    }
  }

  return {
    success: failed.length === 0,
    imported,
    failed,
    total: lines.length - 1,
  };
}

/**
 * Convert image riddles to CSV format
 */
function imageRiddlesToCSV(riddles: ImageRiddle[]): string {
  return exportToCSV(
    riddles as unknown as Record<string, unknown>[],
    imageRiddleConfig as unknown as ImportExportConfig<Record<string, unknown>>,
    { count: riddles.length.toString() }
  );
}

/**
 * Convert image riddles to JSON format
 */
function imageRiddlesToJSON(riddles: ImageRiddle[]): string {
  return exportToJSON(riddles, imageRiddleConfig, { count: riddles.length });
}

/**
 * Parse image riddle CSV
 */
function parseImageRiddleCSV(csvText: string): ImportResult<ImageRiddle> {
  const result = importFromCSV(
    csvText,
    imageRiddleConfig as unknown as ImportExportConfig<Record<string, unknown>>,
    (values, headers) => {
      const getValue = (_index: number, headerName: string): string => {
        const headerIndex = headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
        return headerIndex !== -1 && headerIndex < values.length ? values[headerIndex] ?? '' : '';
      };

      return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.floor(Math.random() * 1000)),
        title: getValue(1, 'title'),
        imageUrl: getValue(2, 'imageurl'),
        answer: getValue(3, 'answer'),
        hint: getValue(4, 'hint'),
        difficulty: (getValue(5, 'difficulty') || 'medium') as ImageRiddle['difficulty'],
        category: { name: getValue(6, 'category') || 'General', emoji: '🔍' },
        timerSeconds: parseInt(getValue(7, 'timerseconds')) || 90,
        showTimer: getValue(8, 'showtimer')?.toLowerCase() === 'true',
        isActive: getValue(9, 'isactive')?.toLowerCase() !== 'false',
      };
    });
  return result as unknown as ImportResult<ImageRiddle>;
}

/** Default form state */
const defaultFormState: RiddleFormState = {
  title: '',
  imageUrl: '',
  answer: '',
  hint: '',
  difficulty: 'medium',
  timerSeconds: '',
  showTimer: true,
  isActive: true,
  categoryName: '',
  categoryEmoji: '',
  status: 'draft',
};

/** Default categories */
const defaultCategories: ImageRiddleCategory[] = [
  { id: '1', name: 'Optical Illusions', emoji: '👁️', count: 2 },
  { id: '2', name: 'Hidden Objects', emoji: '🔍', count: 2 },
  { id: '3', name: 'Pattern Recognition', emoji: '🔲', count: 1 },
  { id: '4', name: 'Perspective Puzzles', emoji: '📐', count: 1 },
  { id: '5', name: 'Color Observation', emoji: '🎨', count: 2 },
];

/**
 * ImageRiddlesAdminSection Component
 *
 * A comprehensive admin interface for managing image riddles including:
 * - Image riddle list display with filtering by difficulty, category, and search
 * - Add/Edit image riddle modal with form validation
 * - Import/Export functionality for CSV and JSON formats
 * - Bulk actions (publish, draft, trash, delete, restore)
 * - Category management display
 *
 * @returns JSX.Element - The rendered component
 */
export function ImageRiddlesAdminSection(): JSX.Element {
  // State for image riddles initialized with defaults for SSR
  const [imageRiddles, setImageRiddles] = useState<ImageRiddle[]>(libInitialImageRiddles as unknown as ImageRiddle[]);
  const [categories, setCategories] = useState<ImageRiddleCategory[]>(defaultCategories);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setImageRiddles(getItem(STORAGE_KEYS.IMAGE_RIDDLES, libInitialImageRiddles as unknown as ImageRiddle[]));
    setCategories(getItem(STORAGE_KEYS.IMAGE_RIDDLE_CATEGORIES, defaultCategories));
    setIsHydrated(true);
  }, []);

  // Category Modal States
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImageRiddleCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '🔍' });

  // Filter states
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const itemsPerPage = 10;

  // Selection and bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);

  // Modal states
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState<boolean>(false);
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);

  // Undo delete reference
  const lastDeletedRef = useRef<ImageRiddle | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  type SortField = 'title' | 'difficulty' | 'status' | 'category';
  type SortConfig = { field: SortField; direction: 'asc' | 'desc' } | null;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Import states
  const [importError, setImportError] = useState<string>('');
  const [importPreview, setImportPreview] = useState<ImageRiddle[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);

  // Form state
  const [riddleForm, setRiddleForm] = useState<RiddleFormState>(defaultFormState);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModalRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Persistence effect for riddles (Guarded)
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.IMAGE_RIDDLES, imageRiddles);
    }
  }, [imageRiddles, isHydrated]);

  // Persistence effect for categories (Guarded)
  useEffect(() => {
    if (isHydrated) {
      setItem(STORAGE_KEYS.IMAGE_RIDDLE_CATEGORIES, categories);
    }
  }, [categories, isHydrated]);

  // Calculate status counts (memoized)
  const statusCounts = useMemo<StatusCounts>(() => ({
    total: imageRiddles.length,
    published: imageRiddles.filter(r => r.status === 'published').length,
    draft: imageRiddles.filter(r => r.status === 'draft').length,
    trash: imageRiddles.filter(r => r.status === 'trash').length,
  }), [imageRiddles]);

  // Category Handlers
  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) return;
    const newCategory: ImageRiddleCategory = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: categoryForm.name.trim(),
      emoji: categoryForm.emoji || '🔍',
      count: 0
    };
    setCategories(prev => [...prev, newCategory]);
    setShowAddCategoryModal(false);
    setCategoryForm({ name: '', emoji: '🔍' });
  };

  const handleEditCategory = () => {
    if (!selectedCategory || !categoryForm.name.trim()) return;
    const oldName = selectedCategory.name;
    const newName = categoryForm.name.trim();
    const newEmoji = categoryForm.emoji;

    setCategories(prev => prev.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, name: newName, emoji: newEmoji }
        : cat
    ));

    // Propagate changes to riddles
    setImageRiddles(prev => prev.map(r =>
      r.category?.name === oldName
        ? { ...r, category: { ...r.category!, name: newName, emoji: newEmoji } }
        : r
    ));

    if (filterCategory === oldName) setFilterCategory(newName);

    setShowEditCategoryModal(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    const categoryName = selectedCategory.name;

    setCategories(prev => prev.filter(cat => cat.id !== selectedCategory.id));

    // Propagate changes: riddles in this category become "Uncategorized"
    setImageRiddles(prev => prev.map(r =>
      r.category?.name === categoryName
        ? { ...r, category: undefined }
        : r
    ));

    if (filterCategory === categoryName) setFilterCategory('');

    setShowDeleteCategoryConfirm(false);
    setSelectedCategory(null);
  };

  /** Sync with default data from source */
  const handleSyncDefaults = useCallback(() => {
    setShowSyncConfirmModal(true);
  }, []);

  const confirmSyncDefaults = useCallback(() => {
    setImageRiddles(libInitialImageRiddles);
    setCategories(defaultCategories);
    setShowSyncConfirmModal(false);
    toast.success('🔄 Synced with source defaults — 20 riddles loaded!');
  }, []);

  // Filter and Sort riddles (memoized)
  const filteredRiddles = useMemo(() => {
    let result = imageRiddles.filter(riddle => {
      const matchesDifficulty = !filterDifficulty || riddle.difficulty === filterDifficulty;
      const matchesCategory = !filterCategory || riddle.category?.name === filterCategory;
      const matchesSearch = !searchTerm || riddle.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || riddle.status === statusFilter;
      return matchesDifficulty && matchesCategory && matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let valueA: string = '';
        let valueB: string = '';

        if (sortConfig.field === 'title') {
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
        } else if (sortConfig.field === 'difficulty') {
          const diffMap: Record<string, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };
          valueA = String(diffMap[a.difficulty] || 0);
          valueB = String(diffMap[b.difficulty] || 0);
        } else if (sortConfig.field === 'status') {
          valueA = a.status;
          valueB = b.status;
        } else if (sortConfig.field === 'category') {
          valueA = (a.category?.name || '').toLowerCase();
          valueB = (b.category?.name || '').toLowerCase();
        }

        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [imageRiddles, filterDifficulty, filterCategory, searchTerm, statusFilter, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(current => {
      if (current?.field === field) {
        return current.direction === 'asc' ? { field, direction: 'desc' } : null;
      }
      return { field, direction: 'asc' };
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig?.field !== field) return <ArrowUpDown className="inline w-3 h-3 ml-1 opacity-40 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc'
      ? <span className="inline-block ml-1 text-indigo-500 font-black">↑</span>
      : <span className="inline-block ml-1 text-indigo-500 font-black">↓</span>;
  };

  // Pagination
  const totalPages = Math.ceil(filteredRiddles.length / ITEMS_PER_PAGE);
  const paginatedRiddles = useMemo(() => filteredRiddles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ), [filteredRiddles, currentPage]);

  // Sync pageInput with currentPage; reset page when filters change
  useEffect(() => { setPageInput(String(currentPage)); }, [currentPage]);
  useEffect(() => { setCurrentPage(1); setPageInput('1'); }, [filterDifficulty, filterCategory, searchTerm, statusFilter]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setPageInput(e.target.value); };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(filteredRiddles.map(r => r.id));
  }, [filteredRiddles]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Bulk action handler
  const handleBulkAction = useCallback(async (action: BulkActionType) => {
    setBulkActionLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    setImageRiddles(prev => prev.map(riddle => {
      if (selectedIds.includes(riddle.id)) {
        switch (action) {
          case 'publish': return { ...riddle, status: 'published' as ContentStatus };
          case 'draft': return { ...riddle, status: 'draft' as ContentStatus };
          case 'trash': return { ...riddle, status: 'trash' as ContentStatus };
          case 'delete': return null;
          case 'restore': return { ...riddle, status: 'draft' as ContentStatus };
          default: return riddle;
        }
      }
      return riddle;
    }).filter((r): r is ImageRiddle => r !== null));

    setSelectedIds([]);
    setBulkActionLoading(false);
  }, [selectedIds]);

  // Export functions
  const handleExportCSV = useCallback(() => {
    const csv = imageRiddlesToCSV(filteredRiddles);
    downloadFile(csv, `image-riddles_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }, [filteredRiddles]);

  const handleExportJSON = useCallback(() => {
    const json = imageRiddlesToJSON(filteredRiddles);
    downloadFile(json, `image-riddles_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }, [filteredRiddles]);

  // Import functions
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { return; }

    setImportError('');
    setImportWarnings([]);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let result: ImportResult<ImageRiddle>;

        if (file.name.endsWith('.json')) {
          const validation = validateJSONStructure<ImageRiddle>(content, 'imageRiddles');
          if (!validation.isValid || !validation.data) {
            setImportError(validation.errors.join('; '));
            return;
          }
          result = {
            success: true,
            imported: validation.data.map(r => ({
              ...r,
              id: String(Date.now() + Math.floor(Math.random() * 1000))
            })) as ImageRiddle[],
            failed: [],
            total: validation.data.length,
          };
        } else {
          result = parseImageRiddleCSV(content);
        }

        if (result.imported.length === 0) {
          setImportError(result.failed.map(f => f.error).join('; ') || 'No valid image riddles found');
          return;
        }

        setImportPreview(result.imported);
        if (result.failed.length > 0) {
          setImportWarnings(result.failed.map(f => `Row ${f.row}: ${f.error}`));
        }
      } catch (err) {
        setImportError('Failed to parse file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

    reader.readAsText(file);
  }, []);

  const handleConfirmImport = useCallback(() => {
    setImageRiddles(prev => [...prev, ...importPreview]);
    setShowImportModal(false);
    setImportPreview([]);
    setImportWarnings([]);
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  }, [importPreview]);

  useClickOutside(exportDropdownRef, () => setShowExportDropdown(false), showExportDropdown);

  useClickOutside(importModalRef, () => {
    setShowImportModal(false);
    setImportError('');
    setImportPreview([]);
  }, showImportModal);

  useClickOutside(addModalRef, () => {
    setShowAddModal(false);
    setRiddleForm(defaultFormState);
  }, showAddModal);

  useClickOutside(editModalRef, () => {
    setShowEditModal(false);
    setSelectedRiddle(null);
    setRiddleForm(defaultFormState);
  }, showEditModal);

  // CRUD Functions
  const handleAddRiddle = useCallback(() => {
    if (!riddleForm.title.trim() || !riddleForm.imageUrl.trim() ||
      !riddleForm.answer.trim() || !riddleForm.categoryName.trim()) {
      return;
    }

    const newRiddle: ImageRiddle = {
      id: String(Date.now()),
      title: riddleForm.title.trim(),
      imageUrl: riddleForm.imageUrl.trim(),
      answer: riddleForm.answer.trim(),
      hint: riddleForm.hint.trim(),
      difficulty: riddleForm.difficulty,
      status: riddleForm.status || 'draft',
      timerSeconds: riddleForm.timerSeconds ? parseInt(riddleForm.timerSeconds) : null,
      showTimer: riddleForm.showTimer,
      isActive: riddleForm.isActive,
      category: { name: riddleForm.categoryName, emoji: riddleForm.categoryEmoji || '❓' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setImageRiddles(prev => [...prev, newRiddle]);
    setShowAddModal(false);
    setRiddleForm(defaultFormState);
    toast.success('✨ Riddle added successfully!');
  }, [riddleForm]);

  const handleEditRiddle = useCallback(() => {
    if (!selectedRiddle || !riddleForm.title.trim() || !riddleForm.imageUrl.trim() ||
      !riddleForm.answer.trim() || !riddleForm.categoryName.trim()) {
      return;
    }

    setImageRiddles(prev => prev.map(r =>
      r.id === selectedRiddle.id
        ? {
          ...r,
          title: riddleForm.title.trim(),
          imageUrl: riddleForm.imageUrl.trim(),
          answer: riddleForm.answer.trim(),
          hint: riddleForm.hint.trim(),
          difficulty: riddleForm.difficulty,
          status: riddleForm.status || r.status,
          timerSeconds: riddleForm.timerSeconds ? parseInt(riddleForm.timerSeconds) : null,
          showTimer: riddleForm.showTimer,
          isActive: riddleForm.isActive,
          category: { name: riddleForm.categoryName, emoji: riddleForm.categoryEmoji || '❓' },
          updatedAt: new Date().toISOString(),
        }
        : r
    ));
    setShowEditModal(false);
    setSelectedRiddle(null);
    setRiddleForm(defaultFormState);
    toast.success('✏️ Riddle updated successfully!');
  }, [selectedRiddle, riddleForm]);

  const handleDeleteRiddle = useCallback(() => {
    if (!selectedRiddle) { return; }

    // Store for undo
    lastDeletedRef.current = selectedRiddle;

    setImageRiddles(prev => prev.filter(r => r.id !== selectedRiddle.id));
    setShowDeleteConfirm(false);
    setSelectedRiddle(null);

    toast.success('Riddle deleted. (Undo available)', 5000);

    // Clear the undo buffer after 5 seconds to prevent memory leaks if many deletes happen
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      lastDeletedRef.current = null;
    }, 5500);

  }, [selectedRiddle]);

  const handleUndoDelete = useCallback(() => {
    if (lastDeletedRef.current) {
      const restored = lastDeletedRef.current;
      setImageRiddles(prev => [...prev, restored]);
      lastDeletedRef.current = null;
      toast.success('Riddle restored!');
    } else {
      toast.error('Nothing to undo.');
    }
  }, []);

  const handleDuplicateRiddle = useCallback((riddle: ImageRiddle) => {
    const duplicated: ImageRiddle = {
      ...riddle,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      title: `${riddle.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setImageRiddles(prev => [...prev, duplicated]);
    toast.success('Riddle duplicated as draft!');
  }, []);

  const openEditModal = useCallback((riddle: ImageRiddle) => {
    setSelectedRiddle(riddle);
    setRiddleForm({
      title: riddle.title,
      imageUrl: riddle.imageUrl,
      answer: riddle.answer,
      hint: riddle.hint || '',
      difficulty: riddle.difficulty,
      status: riddle.status,
      timerSeconds: riddle.timerSeconds?.toString() || '',
      showTimer: riddle.showTimer,
      isActive: riddle.isActive,
      categoryName: riddle.category?.name || '',
      categoryEmoji: riddle.category?.emoji || '',
    });
    setShowEditModal(true);
  }, []);

  const openDeleteConfirm = useCallback((riddle: ImageRiddle) => {
    setSelectedRiddle(riddle);
    setShowDeleteConfirm(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterDifficulty('');
    setFilterCategory('');
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = filterDifficulty || filterCategory || searchTerm || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Status Dashboard */}
      <StatusDashboard
        counts={statusCounts}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        loading={false}
      />

      {/* Search and Add */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search riddles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            aria-label="Search riddles by keyword"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
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
                  onClick={() => { handleExportCSV(); setShowExportDropdown(false); }}
                  className="w-full rounded-t-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                  aria-label="Export as CSV"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => { handleExportJSON(); setShowExportDropdown(false); }}
                  className="w-full rounded-b-lg px-4 py-2 text-left text-sm hover:bg-gray-100"
                  aria-label="Export as JSON"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            aria-label="Import riddles"
          >
            📤 Import
          </button>
          <button
            onClick={handleSyncDefaults}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
            aria-label="Sync with defaults"
          >
            🔄 Sync Source
          </button>
          <button
            onClick={handleUndoDelete}
            disabled={!lastDeletedRef.current}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${lastDeletedRef.current ? 'bg-slate-700 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            aria-label="Undo last delete"
            title="Undo last delete"
          >
            ⟲ Undo
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            aria-label="Add new riddle"
          >
            + Add Riddle
          </button>
        </div>
      </div>

      {/* Categories Row */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Category:</span>
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === ''
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All Categories <span className="opacity-70">({imageRiddles.length})</span>
          </button>

          {categories.map(cat => {
            const count = imageRiddles.filter(r => r.category?.name === cat.name).length;
            const isActive = filterCategory === cat.name;
            return (
              <div
                key={`category-group-${cat.id}`}
                className="flex items-center overflow-hidden rounded-lg shadow-sm border border-gray-100"
              >
                <button
                  onClick={() => setFilterCategory(isActive ? '' : cat.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${isActive
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory(cat);
                    setCategoryForm({ name: cat.name, emoji: cat.emoji });
                    setShowEditCategoryModal(true);
                  }}
                  className={`px-2 py-1.5 transition-colors border-l border-gray-200/50 ${isActive ? 'bg-gray-700 text-white hover:bg-indigo-500' : 'bg-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                  title="Edit category"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory(cat);
                    setShowDeleteCategoryConfirm(true);
                  }}
                  className={`px-2 py-1.5 transition-colors border-l border-gray-200/50 ${isActive ? 'bg-gray-700 text-white hover:bg-red-500' : 'bg-gray-200 text-red-500 hover:bg-red-100 hover:text-red-600'}`}
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => {
              setCategoryForm({ name: '', emoji: '🔍' });
              setShowAddCategoryModal(true);
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Difficulty Row */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Difficulty:</span>
          <button
            onClick={() => setFilterDifficulty('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDifficulty === ''
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All Levels <span className="opacity-70">({imageRiddles.length})</span>
          </button>
          {['easy', 'medium', 'hard', 'expert'].map(diff => {
            const count = imageRiddles.filter(r => r.difficulty === diff).length;
            const isActive = filterDifficulty === diff;
            return (
              <button
                key={`diff-chip-${diff}`}
                onClick={() => setFilterDifficulty(isActive ? '' : diff)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${isActive
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {diff} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
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

      {/* Riddles Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-md border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="w-10 px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredRiddles.length}
                  onChange={() => selectedIds.length === filteredRiddles.length ? deselectAll() : selectAll()}
                  className="rounded border-gray-300"
                  aria-label="Select all riddles"
                />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-12 text-center">#</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Image</th>
              <th
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('title')}
              >
                Riddle Details {getSortIcon('title')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Answer</th>
              <th
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('category')}
              >
                Category {getSortIcon('category')}
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('difficulty')}
              >
                Difficulty {getSortIcon('difficulty')}
              </th>
              <th
                className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedRiddles.map((riddle, index) => {
              const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <tr key={`riddle-row-${riddle.id}`} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(riddle.id)}
                      onChange={() => toggleSelection(riddle.id)}
                      className="rounded border-gray-300"
                      aria-label={`Select riddle: ${riddle.title}`}
                    />
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-gray-400 text-center">
                    {absoluteIndex.toString().padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-14 w-20 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
                      <img
                        src={riddle.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors" title={`Created: ${riddle.createdAt ? new Date(riddle.createdAt).toLocaleString() : 'N/A'}\nUpdated: ${riddle.updatedAt ? new Date(riddle.updatedAt).toLocaleString() : 'N/A'}`}>
                      {riddle.title}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openEditModal(riddle)}
                        className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-0.5 rounded shadow-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateRiddle(riddle)}
                        className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-50 px-2 py-0.5 rounded shadow-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(riddle)}
                        className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:text-red-800 transition-colors bg-red-50 px-2 py-0.5 rounded shadow-sm"
                      >
                        Trash
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block max-w-[150px] truncate rounded-lg bg-orange-50 border border-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                      {riddle.answer}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 w-fit">
                      <span>{riddle.category?.emoji || '🔍'}</span>
                      <span>{riddle.category?.name || 'General'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${getDifficultyColor(riddle.difficulty)} bg-white border border-current opacity-80`}>
                      {riddle.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center group/status cursor-pointer" onClick={() => {
                    const nextStatus = riddle.status === 'published' ? 'draft' : riddle.status === 'draft' ? 'trash' : 'published';
                    setImageRiddles(prev => prev.map(r => r.id === riddle.id ? { ...r, status: nextStatus, updatedAt: new Date().toISOString() } : r));
                    toast.success(`👁️ Status changed to ${nextStatus.toUpperCase()}`);
                  }}>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusBadgeColor(riddle.status)} bg-white border border-current transition-transform group-hover/status:scale-105`}>
                      {riddle.status} <span className="ml-1 opacity-0 group-hover/status:opacity-100 transition-opacity">⟳</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredRiddles.length > 0 && (
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 mt-4">
          <p className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRiddles.length)} - {Math.min(currentPage * itemsPerPage, filteredRiddles.length)} of {filteredRiddles.length} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                className="w-12 rounded border border-gray-300 px-2 py-1 text-center text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
              of <span className="font-medium">{totalPages || 1}</span>
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
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
            <h3 className="mb-4 text-xl font-bold">📤 Import Image Riddles</h3>

            {!importPreview.length ? (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload CSV or JSON file"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
                  >
                    📁 Select CSV or JSON File
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Supported formats: CSV, JSON
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p className="mb-2 font-medium">CSV Format:</p>
                  <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                    Title,ImageUrl,Answer,Hint,Difficulty,Category,TimerSeconds,ShowTimer,IsActive
                  </code>
                  <p className="mb-2 mt-3 font-medium">JSON Format:</p>
                  <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                    {'{"imageRiddles": [{"title": "...", "imageUrl": "...", "answer": "...", "difficulty": "medium", "category": {"name": "...", "emoji": "..."}}]}'}
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
                      if (fileInputRef.current) { fileInputRef.current.value = ''; }
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
                  ✓ Found {importPreview.length} image riddles to import
                </p>

                {importWarnings.length > 0 && (
                  <div className="max-h-32 overflow-auto rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="mb-1 text-sm font-medium text-yellow-700">⚠️ Warnings:</p>
                    {importWarnings.map((w, i) => (
                      <p key={`warning-${w.slice(0, 30)}-${w.length}-${i}`} className="text-xs text-yellow-600">{w}</p>
                    ))}
                  </div>
                )}

                <div className="max-h-64 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Title</th>
                        <th className="px-3 py-2 text-left">Answer</th>
                        <th className="px-3 py-2 text-left">Difficulty</th>
                        <th className="px-3 py-2 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 5).map((riddle, i) => (
                        <tr key={`preview-${riddle.id ?? riddle.title?.slice(0, 20)}-${i}`} className="border-t">
                          <td className="max-w-xs truncate px-3 py-2">{riddle.title}</td>
                          <td className="max-w-xs truncate px-3 py-2">{riddle.answer}</td>
                          <td className="px-3 py-2">{riddle.difficulty}</td>
                          <td className="px-3 py-2">{riddle.category?.name}</td>
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
                      if (fileInputRef.current) { fileInputRef.current.value = ''; }
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
          <div ref={showAddModal ? addModalRef : editModalRef} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">
              {showAddModal ? '➕ Add New Image Riddle' : '✏️ Edit Image Riddle'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="image-riddle-title" className="mb-1 block text-sm font-medium text-gray-700">
                  Title <span aria-label="required">*</span>
                </label>
                <input
                  id="image-riddle-title"
                  type="text"
                  value={riddleForm.title}
                  onChange={(e) => setRiddleForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter the riddle title..."
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="image-riddle-url" className="mb-1 block text-sm font-medium text-gray-700">
                  Image URL <span aria-label="required">*</span>
                </label>
                <input
                  id="image-riddle-url"
                  type="text"
                  value={riddleForm.imageUrl}
                  onChange={(e) => setRiddleForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="https://example.com/image.jpg"
                  aria-required="true"
                />
                {riddleForm.imageUrl && (
                  <div className="mt-2 text-center rounded-lg border border-slate-200 bg-slate-50 p-2 overflow-hidden max-h-40 flex items-center justify-center">
                    <img src={riddleForm.imageUrl} alt="Preview" className="max-h-36 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = '❌ Invalid Image URL'; }} />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image-riddle-answer" className="mb-1 block text-sm font-medium text-gray-700">
                  Answer <span aria-label="required">*</span>
                </label>
                <input
                  id="image-riddle-answer"
                  type="text"
                  value={riddleForm.answer}
                  onChange={(e) => setRiddleForm(prev => ({ ...prev, answer: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter the answer..."
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="image-riddle-hint" className="mb-1 block text-sm font-medium text-gray-700">
                  Hint
                </label>
                <input
                  id="image-riddle-hint"
                  type="text"
                  value={riddleForm.hint}
                  onChange={(e) => setRiddleForm(prev => ({ ...prev, hint: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter a hint (optional)..."
                  aria-describedby="hint-optional"
                />
                <span id="hint-optional" className="sr-only">This field is optional</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="image-riddle-difficulty" className="mb-1 block text-sm font-medium text-gray-700">
                    Difficulty <span aria-label="required">*</span>
                  </label>
                  <select
                    id="image-riddle-difficulty"
                    value={riddleForm.difficulty}
                    onChange={(e) => setRiddleForm(prev => ({ ...prev, difficulty: e.target.value as RiddleFormState['difficulty'] }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="image-riddle-timer" className="mb-1 block text-sm font-medium text-gray-700">
                    Timer (seconds)
                  </label>
                  <input
                    id="image-riddle-timer"
                    type="number"
                    value={riddleForm.timerSeconds}
                    onChange={(e) => setRiddleForm(prev => ({ ...prev, timerSeconds: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Leave empty for default (90s)"
                    aria-describedby="timer-default"
                  />
                  <span id="timer-default" className="sr-only">Leave empty for default 90 seconds</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="image-riddle-category" className="mb-1 block text-sm font-medium text-gray-700">
                    Category Name <span aria-label="required">*</span>
                  </label>
                  <select
                    id="image-riddle-category"
                    value={riddleForm.categoryName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const cat = categories.find(c => c.name === selectedName);
                      setRiddleForm(prev => ({ ...prev, categoryName: selectedName, categoryEmoji: cat ? cat.emoji : prev.categoryEmoji }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-required="true"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={`category-option-${cat.id}`} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="image-riddle-emoji" className="mb-1 block text-sm font-medium text-gray-700">
                    Category Emoji
                  </label>
                  <input
                    id="image-riddle-emoji"
                    type="text"
                    value={riddleForm.categoryEmoji}
                    onChange={(e) => setRiddleForm(prev => ({ ...prev, categoryEmoji: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g., 🔍"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-4">
                <div className="flex-1">
                  <label htmlFor="image-riddle-status" className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="image-riddle-status"
                    value={riddleForm.status || 'draft'}
                    onChange={(e) => setRiddleForm(prev => ({ ...prev, status: e.target.value as ContentStatus }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-slate-50 font-bold"
                  >
                    <option value="draft">Draft (Hidden)</option>
                    <option value="published">Published (Live)</option>
                    <option value="trash">Trash (Hidden)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={riddleForm.showTimer}
                    onChange={(e) => setRiddleForm(prev => ({ ...prev, showTimer: e.target.checked }))}
                    className="rounded border-gray-300 w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 font-medium select-none">Show Timer</span>
                </label>
                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={riddleForm.isActive}
                    onChange={(e) => setRiddleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 font-medium select-none">Active</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setRiddleForm(defaultFormState);
                  }}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddModal ? handleAddRiddle : handleEditRiddle}
                  disabled={!riddleForm.title.trim() || !riddleForm.imageUrl.trim() ||
                    !riddleForm.answer.trim() || !riddleForm.categoryName.trim()}
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
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this image riddle?
            </p>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="line-clamp-2 text-sm text-gray-800">{selectedRiddle.title}</p>
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


      {/* Add/Edit Category Modal */}
      {(showAddCategoryModal || showEditCategoryModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {showAddCategoryModal ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button
                onClick={() => { setShowAddCategoryModal(false); setShowEditCategoryModal(false); }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="e.g. Brain Teasers"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Emoji Icon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryForm.emoji}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, emoji: e.target.value }))}
                    className="w-20 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                  <div className="flex-1 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-500 flex items-center">
                    Enter any emoji to represent this category.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setShowAddCategoryModal(false); setShowEditCategoryModal(false); }}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showAddCategoryModal ? handleAddCategory : handleEditCategory}
                disabled={!categoryForm.name.trim()}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all"
              >
                {showAddCategoryModal ? 'Create Category' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {showDeleteCategoryConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 text-left px-0">Delete Category?</h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{selectedCategory?.name}"</span>? This will not delete the riddles in this category, but they will be marked as "Uncategorized".
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteCategoryConfirm(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={handleDeleteCategory}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-500/25 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Source Confirm Modal */}
      {showSyncConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 text-left px-0">Sync with Defaults?</h3>
            <p className="mb-6 text-sm text-gray-600">
              This will refresh your list with the latest default riddles from the source file. Your current changes will be preserved but missing defaults will be added.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSyncConfirmModal(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSyncDefaults}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ImageRiddlesAdminSectionFallback(): JSX.Element {
  return <ImageRiddlesAdminSection />;
}
