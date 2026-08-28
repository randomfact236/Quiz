/**
 * ============================================================================
 * useAdminImageRiddle* hook smoke tests (upgrade plan A10 finish)
 * ============================================================================
 * Smoke scope per hook: initializes without error, expected return shape,
 * and the primary happy-path state transitions. The underlying pure logic
 * (filters/counts/sort, CSV import/export, form predicates) is covered in
 * detail by image-riddle-admin.test.ts.
 *
 * Known-tricky behaviors covered explicitly:
 *  - useAdminImageRiddleDelete: 5.5s ref-based undo window
 *  - useAdminImageRiddleCategories: rename propagation + post-delete reload
 *  - useAdminImageRiddleBulk: row status click-cycle (published→draft→trash)
 * ============================================================================
 */

import { renderHook, act, waitFor } from '@testing-library/react';

import { defaultFormState } from '@/features/image-riddles/admin/lib/form';
import type { ImageRiddle } from '@/app/admin/types';
import type { AdminImageRiddleCategory } from '@/features/image-riddles/admin/hooks/useAdminImageRiddleData';

jest.mock('@/lib/image-riddles-api', () => ({
  getAllImageRiddlesAdmin: jest.fn(),
  getImageRiddleCategoriesAdmin: jest.fn(),
  bulkActionImageRiddles: jest.fn(),
  bulkCreateImageRiddles: jest.fn(),
  createImageRiddle: jest.fn(),
  updateImageRiddle: jest.fn(),
  updateImageRiddleCategory: jest.fn(),
  createImageRiddleCategory: jest.fn(),
  deleteImageRiddleCategory: jest.fn(),
}));
jest.mock('@/lib/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

import {
  useAdminImageRiddleBulk,
  useAdminImageRiddleCategories,
  useAdminImageRiddleData,
  useAdminImageRiddleDelete,
  useAdminImageRiddleFilters,
  useAdminImageRiddleForm,
  useAdminImageRiddleImport,
  useAdminImageRiddleMutations,
} from '@/features/image-riddles/admin/hooks';
import { toast } from '@/lib/toast';

const mockGetAll = require('@/lib/image-riddles-api').getAllImageRiddlesAdmin as jest.Mock;
const mockGetCategories = require('@/lib/image-riddles-api')
  .getImageRiddleCategoriesAdmin as jest.Mock;
const mockBulkAction = require('@/lib/image-riddles-api').bulkActionImageRiddles as jest.Mock;
const mockBulkCreate = require('@/lib/image-riddles-api').bulkCreateImageRiddles as jest.Mock;
const mockCreate = require('@/lib/image-riddles-api').createImageRiddle as jest.Mock;
const mockCreateCategory = require('@/lib/image-riddles-api')
  .createImageRiddleCategory as jest.Mock;

const mockToastSuccess = toast.success as jest.Mock;
const mockToastError = toast.error as jest.Mock;

function makeRiddle(overrides: Partial<ImageRiddle> = {}): ImageRiddle {
  return {
    id: 'r1',
    title: 'Test Riddle',
    imageUrl: 'https://example.com/img.webp',
    answer: 'umbrella',
    hint: '',
    difficulty: 'easy',
    category: { name: 'Nature', emoji: '🌳' },
    status: 'draft',
    timerSeconds: null,
    showTimer: true,
    isActive: true,
    categoryId: null,
    altText: null,
    ...overrides,
  };
}

function makeCategory(overrides: Partial<AdminImageRiddleCategory> = {}): AdminImageRiddleCategory {
  return { id: 'c1', name: 'Nature', emoji: '🌳', count: 0, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue({ data: [], total: 0 });
  mockGetCategories.mockResolvedValue([]);
  mockBulkAction.mockResolvedValue({});
  mockBulkCreate.mockResolvedValue({ created: 0, failed: 0, errors: [] });
  mockCreate.mockResolvedValue({});
  mockCreateCategory.mockResolvedValue({});
});

// ============================================================================
// useAdminImageRiddleData
// ============================================================================

describe('useAdminImageRiddleData', () => {
  it('initializes loading and returns the expected shape', () => {
    const { result } = renderHook(() => useAdminImageRiddleData());

    expect(result.current.imageRiddles).toEqual([]);
    expect(result.current.isLoadingData).toBe(true);
    expect(typeof result.current.loadData).toBe('function');
    expect(typeof result.current.categoryIdByName).toBe('function');
  });

  it('loads and normalizes riddles + categories, resolves category ids', async () => {
    mockGetAll.mockResolvedValue({
      data: [
        {
          id: 'r1',
          title: 'T',
          imageUrl: 'u',
          answer: 'A',
          hint: null,
          difficulty: 'easy',
          status: 'draft',
          timerSeconds: null,
          showTimer: true,
          altText: null,
          isActive: true,
          categoryId: 'c1',
          category: { id: 'c1', name: 'Nature', emoji: '🌳' },
        },
      ],
      total: 1,
    });
    mockGetCategories.mockResolvedValue([
      { id: 'c1', name: 'Nature', emoji: '🌳', riddles: [{ id: 'r1' }] },
    ]);

    const { result } = renderHook(() => useAdminImageRiddleData());
    await waitFor(() => expect(result.current.isLoadingData).toBe(false));

    expect(result.current.imageRiddles).toHaveLength(1);
    expect(result.current.imageRiddles[0]!.hint).toBe(''); // null normalized to ''
    expect(result.current.categories).toEqual([
      { id: 'c1', name: 'Nature', emoji: '🌳', count: 1 },
    ]);
    expect(result.current.categoryIdByName('Nature')).toBe('c1');
    expect(result.current.categoryIdByName('Nope')).toBeUndefined();
  });
});

// ============================================================================
// useAdminImageRiddleFilters
// ============================================================================

describe('useAdminImageRiddleFilters', () => {
  const riddles = Array.from({ length: 15 }, (_, i) =>
    makeRiddle({ id: `r${i + 1}`, title: `Riddle ${i + 1}` })
  );

  it('initializes with no filters, page 1, and paginates 10 per page', () => {
    const { result } = renderHook(() => useAdminImageRiddleFilters(riddles));

    expect(result.current.filterDifficulty).toBe('');
    expect(result.current.filterCategory).toBe('');
    expect(result.current.searchTerm).toBe('');
    expect(result.current.statusFilter).toBe('all');
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredRiddles).toHaveLength(15);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedRiddles).toHaveLength(10);
  });

  it('activating a filter resets the page and marks filters active', () => {
    const { result } = renderHook(() => useAdminImageRiddleFilters(riddles));

    act(() => {
      result.current.goToNextPage();
    });
    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.setFilterCategory('Nature');
    });
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.currentPage).toBe(1);
  });

  it('filters by search term and clears via clearFilters', () => {
    const { result } = renderHook(() => useAdminImageRiddleFilters(riddles));

    act(() => {
      result.current.setSearchTerm('riddle 15');
    });
    expect(result.current.filteredRiddles.map((r) => r.id)).toEqual(['r15']);

    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredRiddles).toHaveLength(15);
  });

  it('sort cycles asc → desc → off per column', () => {
    const { result } = renderHook(() => useAdminImageRiddleFilters(riddles));

    act(() => {
      result.current.handleSort('title');
    });
    expect(result.current.sortConfig).toEqual({ field: 'title', direction: 'asc' });

    act(() => {
      result.current.handleSort('title');
    });
    expect(result.current.sortConfig).toEqual({ field: 'title', direction: 'desc' });

    act(() => {
      result.current.handleSort('title');
    });
    expect(result.current.sortConfig).toBeNull();
  });

  it('page input submit navigates within bounds and rejects out-of-range', () => {
    const { result } = renderHook(() => useAdminImageRiddleFilters(riddles));

    act(() => {
      result.current.handlePageInputChange({
        target: { value: '2' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      result.current.handlePageInputSubmit();
    });
    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.handlePageInputChange({
        target: { value: '99' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      result.current.handlePageInputSubmit();
    });
    expect(result.current.currentPage).toBe(2); // rejected, stays
  });
});

// ============================================================================
// useAdminImageRiddleCategories
// ============================================================================

describe('useAdminImageRiddleCategories', () => {
  function setup(overrides: Partial<Parameters<typeof useAdminImageRiddleCategories>[0]> = {}) {
    const setCategories = jest.fn();
    const setImageRiddles = jest.fn();
    const loadData = jest.fn().mockResolvedValue(undefined);
    const setFilterCategory = jest.fn();
    const utils = renderHook(() =>
      useAdminImageRiddleCategories({
        setCategories,
        setImageRiddles,
        loadData,
        filterCategory: '',
        setFilterCategory,
        ...overrides,
      })
    );
    return { ...utils, setCategories, setImageRiddles, loadData, setFilterCategory };
  }

  it('initializes with modals closed and empty form', () => {
    const { result } = setup();

    expect(result.current.showAddCategoryModal).toBe(false);
    expect(result.current.showEditCategoryModal).toBe(false);
    expect(result.current.showDeleteCategoryConfirm).toBe(false);
    expect(result.current.categoryForm).toEqual({ name: '', emoji: '' });
  });

  it('creates a category and closes the add modal', async () => {
    mockCreateCategory.mockResolvedValue({ id: 'c9', name: 'New', emoji: '✨' });
    const utils = setup();

    act(() => {
      utils.result.current.openAddCategory(); // opens with a fresh empty form
    });
    act(() => {
      utils.result.current.setCategoryForm({ name: 'New', emoji: '✨' });
    });
    expect(utils.result.current.showAddCategoryModal).toBe(true);

    await act(async () => {
      await utils.result.current.handleAddCategory();
    });

    expect(mockCreateCategory).toHaveBeenCalledWith({ name: 'New', emoji: '✨' });
    expect(utils.setCategories).toHaveBeenCalled();
    expect(utils.result.current.showAddCategoryModal).toBe(false);
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('renames a category, propagates to riddles, and updates the filter', async () => {
    const utils = setup({ filterCategory: 'Old' });

    act(() => {
      utils.result.current.openEditCategory(makeCategory({ id: 'c1', name: 'Old', emoji: '🌳' }));
      utils.result.current.setCategoryForm({ name: 'New', emoji: '🌿' });
    });
    await act(async () => {
      await utils.result.current.handleEditCategory();
    });

    // Riddle category objects renamed via updater
    expect(utils.setImageRiddles).toHaveBeenCalled();
    // Active filter pointing at the old name is fixed up
    expect(utils.setFilterCategory).toHaveBeenCalledWith('New');
    expect(utils.result.current.showEditCategoryModal).toBe(false);
  });

  it('deletes a category, reloads data, and resets a matching filter', async () => {
    const utils = setup({ filterCategory: 'Old' });

    act(() => {
      utils.result.current.openDeleteCategory(makeCategory({ id: 'c1', name: 'Old' }));
    });
    await act(async () => {
      await utils.result.current.handleDeleteCategory();
    });

    expect(utils.loadData).toHaveBeenCalled(); // post-delete reload (riddles archived server-side)
    expect(utils.setCategories).toHaveBeenCalled();
    expect(utils.setFilterCategory).toHaveBeenCalledWith('');
    expect(utils.result.current.showDeleteCategoryConfirm).toBe(false);
  });
});

// ============================================================================
// useAdminImageRiddleForm + useAdminImageRiddleMutations
// ============================================================================

describe('useAdminImageRiddleForm', () => {
  function setup() {
    const setImageRiddles = jest.fn();
    const setIsSaving = jest.fn();
    const utils = renderHook(() =>
      useAdminImageRiddleForm({
        categories: [makeCategory()],
        setImageRiddles,
        categoryIdByName: (name: string) => (name === 'Nature' ? 'c1' : undefined),
        setIsSaving,
      })
    );
    return { ...utils, setImageRiddles, setIsSaving };
  }

  it('initializes closed with the default form state', () => {
    const { result } = setup();

    expect(result.current.showAddModal).toBe(false);
    expect(result.current.showEditModal).toBe(false);
    expect(result.current.showMediaPicker).toBe(false);
    expect(result.current.riddleForm).toEqual(defaultFormState);
  });

  it('openEditModal maps the riddle onto the form', () => {
    const { result } = setup();

    act(() => {
      result.current.openEditModal(
        makeRiddle({ id: 'r1', title: 'T', answer: 'A', timerSeconds: 45, hint: 'H' })
      );
    });

    expect(result.current.showEditModal).toBe(true);
    expect(result.current.riddleForm).toMatchObject({
      title: 'T',
      answer: 'A',
      hint: 'H',
      timerSeconds: '45',
      categoryName: 'Nature',
    });
  });
});

describe('useAdminImageRiddleMutations', () => {
  const completeForm = {
    ...defaultFormState,
    title: 'T',
    imageUrl: 'u',
    answer: 'A',
    categoryName: 'Nature',
  };

  function setup(overrides: Record<string, unknown> = {}) {
    const args = {
      categories: [makeCategory()],
      setImageRiddles: jest.fn(),
      categoryIdByName: (name: string) => (name === 'Nature' ? 'c1' : undefined),
      riddleForm: completeForm,
      setRiddleForm: jest.fn(),
      selectedRiddle: null as ImageRiddle | null,
      setSelectedRiddle: jest.fn(),
      setShowAddModal: jest.fn(),
      setShowEditModal: jest.fn(),
      setIsSaving: jest.fn(),
      ...overrides,
    };
    const utils = renderHook(() => useAdminImageRiddleMutations(args));
    return { ...utils, ...args };
  }

  it('creates a draft riddle and closes the add modal', async () => {
    mockCreate.mockResolvedValue({
      id: 'n1',
      title: 'T',
      imageUrl: 'u',
      answer: 'A',
      hint: null,
      difficulty: 'medium',
      status: 'draft',
      timerSeconds: null,
      showTimer: true,
      altText: null,
      isActive: true,
      categoryId: 'c1',
      category: { name: 'Nature', emoji: '🌳' },
    });
    const utils = setup();

    await act(async () => {
      await utils.result.current.handleAddRiddle();
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'T', categoryId: 'c1' })
    );
    expect(mockBulkAction).not.toHaveBeenCalled(); // draft — no publish
    expect(utils.setImageRiddles).toHaveBeenCalled();
    expect(utils.setShowAddModal).toHaveBeenCalledWith(false);
    expect(utils.setRiddleForm).toHaveBeenCalledWith(defaultFormState);
  });

  it('publishes immediately when the form asks for a published status', async () => {
    mockCreate.mockResolvedValue({
      id: 'n1',
      title: 'T',
      imageUrl: 'u',
      answer: 'A',
      hint: null,
      difficulty: 'medium',
      status: 'draft',
      timerSeconds: null,
      showTimer: true,
      altText: null,
      isActive: true,
      categoryId: 'c1',
      category: null,
    });
    const utils = setup({
      riddleForm: { ...completeForm, status: 'published' },
    });

    await act(async () => {
      await utils.result.current.handleAddRiddle();
    });

    expect(mockBulkAction).toHaveBeenCalledWith(['n1'], 'publish');
  });

  it('duplicates a riddle as a draft copy', async () => {
    mockCreate.mockResolvedValue({
      id: 'n2',
      title: 'T (Copy)',
      imageUrl: 'u',
      answer: 'A',
      hint: null,
      difficulty: 'easy',
      status: 'draft',
      timerSeconds: null,
      showTimer: true,
      altText: null,
      isActive: true,
      categoryId: null,
      category: null,
    });
    const utils = setup();

    await act(async () => {
      await utils.result.current.handleDuplicateRiddle(makeRiddle({ title: 'T' }));
    });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'T (Copy)' }));
    expect(mockToastSuccess).toHaveBeenCalledWith('Riddle duplicated as draft!');
  });

  it('does not submit an incomplete form', async () => {
    const utils = setup({ riddleForm: { ...defaultFormState, title: 'T' } });

    await act(async () => {
      await utils.result.current.handleAddRiddle();
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useAdminImageRiddleDelete
// ============================================================================

describe('useAdminImageRiddleDelete', () => {
  function setup() {
    const setImageRiddles = jest.fn();
    const loadData = jest.fn().mockResolvedValue(undefined);
    const utils = renderHook(() => useAdminImageRiddleDelete({ setImageRiddles, loadData }));
    return { ...utils, setImageRiddles, loadData };
  }

  it('moves a riddle to trash and arms the undo window', async () => {
    jest.useFakeTimers();
    try {
      const utils = setup();
      const riddle = makeRiddle({ id: 'r1', status: 'draft' });

      act(() => {
        utils.result.current.openTrashConfirm(riddle);
      });
      expect(utils.result.current.showTrashConfirm).toBe(true);
      expect(utils.result.current.trashTarget).toEqual(riddle);

      await act(async () => {
        await utils.result.current.handleTrashImageRiddle();
      });

      expect(mockBulkAction).toHaveBeenCalledWith(['r1'], 'trash');
      expect(utils.result.current.showTrashConfirm).toBe(false);
      expect(utils.result.current.lastDeletedRef.current).not.toBeNull();

      // Undo works within the window
      await act(async () => {
        await utils.result.current.handleUndoDelete();
      });
      expect(mockBulkAction).toHaveBeenCalledWith(['r1'], 'restore');
      expect(mockToastSuccess).toHaveBeenCalledWith('Riddle restored!');

      // 5.5s window closes and clears the undo ref
      act(() => {
        jest.advanceTimersByTime(5500);
      });
      expect(utils.result.current.lastDeletedRef.current).toBeNull();

      await act(async () => {
        await utils.result.current.handleUndoDelete();
      });
      expect(mockToastError).toHaveBeenCalledWith('Nothing to undo.');
    } finally {
      jest.useRealTimers();
    }
  });

  it('permanently deletes a riddle that is already in trash', async () => {
    const utils = setup();
    const trashed = makeRiddle({ id: 'r2', status: 'trash' });

    act(() => {
      utils.result.current.openTrashConfirm(trashed);
    });
    await act(async () => {
      await utils.result.current.handleTrashImageRiddle();
    });

    expect(mockBulkAction).toHaveBeenCalledWith(['r2'], 'delete');
    expect(utils.result.current.showTrashConfirm).toBe(false);
  });

  it('reloads data when the trash action fails', async () => {
    mockBulkAction.mockRejectedValueOnce(new Error('boom'));
    const utils = setup();

    act(() => {
      utils.result.current.openTrashConfirm(makeRiddle({ id: 'r1', status: 'draft' }));
    });
    await act(async () => {
      await utils.result.current.handleTrashImageRiddle();
    });

    expect(utils.loadData).toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith('Failed to update riddle — reloading.');
  });
});

// ============================================================================
// useAdminImageRiddleBulk
// ============================================================================

describe('useAdminImageRiddleBulk', () => {
  function setup() {
    const setImageRiddles = jest.fn();
    const loadData = jest.fn().mockResolvedValue(undefined);
    const utils = renderHook(() =>
      useAdminImageRiddleBulk({
        allFilteredIds: ['r1', 'r2', 'r3'],
        setImageRiddles,
        loadData,
      })
    );
    return { ...utils, setImageRiddles, loadData };
  }

  it('manages selection state', () => {
    const { result } = setup();

    expect(result.current.selectedIds).toEqual([]);

    act(() => {
      result.current.toggleSelection('r1');
      result.current.toggleSelection('r2');
    });
    expect(result.current.selectedIds).toEqual(['r1', 'r2']);

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selectedIds).toEqual(['r1', 'r2', 'r3']);

    act(() => {
      result.current.deselectAll();
    });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('applies a bulk publish and clears the selection', async () => {
    const { result, setImageRiddles } = setup();

    act(() => {
      result.current.selectAll();
    });
    await act(async () => {
      await result.current.handleBulkAction('publish');
    });

    expect(mockBulkAction).toHaveBeenCalledWith(['r1', 'r2', 'r3'], 'publish');
    expect(setImageRiddles).toHaveBeenCalled(); // local status patch
    expect(result.current.selectedIds).toEqual([]);
    expect(mockToastSuccess).toHaveBeenCalledWith('✅ Bulk publish complete');
  });

  it('row status click-cycle advances draft → trash', async () => {
    const { result } = setup();
    const draft = makeRiddle({ id: 'r1', status: 'draft' });

    await act(async () => {
      await result.current.cycleStatus(draft);
    });
    expect(mockBulkAction).toHaveBeenCalledWith(['r1'], 'trash');

    const published = makeRiddle({ id: 'r2', status: 'published' });
    await act(async () => {
      await result.current.cycleStatus(published);
    });
    expect(mockBulkAction).toHaveBeenCalledWith(['r2'], 'draft');
  });

  it('reloads from the server when a bulk action fails', async () => {
    mockBulkAction.mockRejectedValueOnce(new Error('boom'));
    const { result, loadData } = setup();

    act(() => {
      result.current.toggleSelection('r1');
    });
    await act(async () => {
      await result.current.handleBulkAction('trash');
    });

    expect(loadData).toHaveBeenCalled();
  });
});

// ============================================================================
// useAdminImageRiddleImport
// ============================================================================

describe('useAdminImageRiddleImport', () => {
  function setup() {
    const setCategories = jest.fn();
    const loadData = jest.fn().mockResolvedValue(undefined);
    const setIsSaving = jest.fn();
    const utils = renderHook(() =>
      useAdminImageRiddleImport({
        categories: [makeCategory()],
        setCategories,
        loadData,
        isSaving: false,
        setIsSaving,
      })
    );
    return { ...utils, setCategories, loadData, setIsSaving };
  }

  it('initializes with the modal closed and empty preview', () => {
    const { result } = setup();

    expect(result.current.showImportModal).toBe(false);
    expect(result.current.importPreview).toEqual([]);
    expect(result.current.importError).toBe('');
    expect(result.current.importWarnings).toEqual([]);
  });

  it('parses an uploaded CSV into the preview', async () => {
    const csv = [
      'ID,Title,ImageUrl,Answer,Hint,Difficulty,Category,TimerSeconds,ShowTimer,IsActive',
      'id1,T1,https://x/i,A,,easy,Nature,90,true,true',
    ].join('\n');
    const globalScope = global as unknown as Record<string, unknown>;
    const originalFileReader = globalScope['FileReader'];
    class MockFileReader {
      onload: ((ev: unknown) => void) | null = null;
      readAsText() {
        this.onload?.({ target: { result: csv } });
      }
    }
    globalScope['FileReader'] = MockFileReader;

    try {
      const { result } = setup();
      const file = new File([csv], 'riddles.csv');
      await act(async () => {
        result.current.handleFileUpload({
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
        await Promise.resolve();
      });

      expect(result.current.importPreview).toHaveLength(1);
      expect(result.current.importPreview[0]!.title).toBe('T1');
      expect(result.current.importError).toBe('');
    } finally {
      globalScope['FileReader'] = originalFileReader;
    }
  });

  it('confirm import bulk-creates, reloads, and closes the modal', async () => {
    const { result, loadData } = setup();

    act(() => {
      result.current.setShowImportModal(true);
    });
    await act(async () => {
      await result.current.handleConfirmImport([makeCategory()]);
    });

    expect(mockBulkCreate).toHaveBeenCalledWith([]);
    expect(loadData).toHaveBeenCalled();
    expect(result.current.showImportModal).toBe(false);
    expect(mockToastSuccess).toHaveBeenCalled();
  });
});
