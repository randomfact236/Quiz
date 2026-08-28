/**
 * ============================================================================
 * Image riddles URL sync + modal history (#18)
 * ============================================================================
 * Covers cosmetics plan C2 #18:
 *  - deep links restore category/difficulty/search on mount
 *  - filter changes write back via replaceState (no new history entries)
 *  - opening the modal pushes a history entry; in-modal navigation does not
 *  - UI close pops the entry (history.back); browser Back (popstate) closes
 * ============================================================================
 */

import { renderHook, act, waitFor } from '@testing-library/react';

import { useImageRiddleFilters } from '@/features/image-riddles/hooks/useImageRiddleFilters';
import { useImageRiddleGame } from '@/features/image-riddles/hooks/useImageRiddleGame';
import type { ImageRiddle } from '@/lib/image-riddles-api';

function makeRiddle(overrides: Partial<ImageRiddle> = {}): ImageRiddle {
  return {
    id: 'r1',
    title: 'Test Riddle',
    imageUrl: 'https://example.com/img.webp',
    answer: 'umbrella',
    hint: null,
    difficulty: 'easy',
    status: 'published',
    timerSeconds: null,
    showTimer: true,
    altText: null,
    isActive: true,
    categoryId: null,
    category: null,
    ...overrides,
  };
}

beforeEach(() => {
  window.history.replaceState(null, '', '/image-riddles');
});

describe('useImageRiddleFilters URL sync', () => {
  it('reads category, difficulty, and search from the URL on mount', () => {
    window.history.replaceState(
      null,
      '',
      '/image-riddles?category=Nature&difficulty=easy&search=owl'
    );
    const { result } = renderHook(() => useImageRiddleFilters());

    expect(result.current.activeCategory).toBe('Nature');
    expect(result.current.difficulty).toBe('easy');
    expect(result.current.searchInput).toBe('owl');
  });

  it('writes filters back via replaceState without adding history entries', async () => {
    const lengthBefore = window.history.length;
    const { result } = renderHook(() => useImageRiddleFilters());

    act(() => {
      result.current.changeCategory('Nature');
      result.current.changeDifficulty('easy');
      result.current.changeSearchInput('owl');
    });

    // search is debounced (350ms) — wait for the settled write-back
    await waitFor(() =>
      expect(window.location.search).toBe('?category=Nature&difficulty=easy&search=owl')
    );
    expect(window.history.length).toBe(lengthBefore); // replaceState, not push
  });

  it('removes params when filters are cleared', async () => {
    window.history.replaceState(null, '', '/image-riddles?category=Nature&difficulty=easy');
    const { result } = renderHook(() => useImageRiddleFilters());

    act(() => {
      result.current.changeCategory(null);
      result.current.changeDifficulty('all');
    });

    await waitFor(() => expect(window.location.search).toBe(''));
  });
});

describe('useImageRiddleGame modal history', () => {
  it('pushes on open, skips push on in-modal navigation, pops on UI close', () => {
    const pushSpy = jest.spyOn(window.history, 'pushState');
    const backSpy = jest.spyOn(window.history, 'back');
    const riddles = [makeRiddle({ id: 'r1' }), makeRiddle({ id: 'r2' })];
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles, onSolved: jest.fn(), onRevealed: jest.fn() })
    );

    act(() => {
      result.current.openRiddle(riddles[0]!);
    });
    expect(result.current.selectedRiddle).not.toBeNull();
    expect(pushSpy).toHaveBeenCalledTimes(1);

    // In-modal navigation reuses the same history entry
    act(() => {
      result.current.navigateRiddle('next');
    });
    expect(result.current.selectedRiddle?.id).toBe('r2');
    expect(pushSpy).toHaveBeenCalledTimes(1);

    // UI close pops the pushed entry
    act(() => {
      result.current.closeRiddle();
    });
    expect(result.current.selectedRiddle).toBeNull();
    expect(backSpy).toHaveBeenCalledTimes(1);

    pushSpy.mockRestore();
    backSpy.mockRestore();
  });

  it('browser Back (popstate) closes an open modal', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );

    act(() => {
      result.current.openRiddle(makeRiddle());
    });
    expect(result.current.selectedRiddle).not.toBeNull();

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.selectedRiddle).toBeNull();
  });

  it('popstate with the modal closed is a harmless no-op', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.selectedRiddle).toBeNull();
  });
});
