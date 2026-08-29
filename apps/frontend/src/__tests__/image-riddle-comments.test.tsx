/**
 * ============================================================================
 * Chip-to-reveal + guess-feed posting tests (comments-system plan §3.2)
 * ============================================================================
 * Covers the useImageRiddleGame comments integration:
 *  - every submitted guess is posted to the riddle's feed (fire-and-forget)
 *  - Reveal with zero prior guesses opens the chip picker instead of revealing
 *  - a chip tap posts kind:'chip' and reveals; "just show me" reveals without posting
 *  - already-guessed players reveal directly (no chip picker)
 * ============================================================================
 */

import { renderHook, act } from '@testing-library/react';

import { useImageRiddleGame } from '@/features/image-riddles/hooks/useImageRiddleGame';
import type { ImageRiddle } from '@/lib/image-riddles-api';

jest.mock('@/lib/comments-api', () => ({
  postCommentOptimistic: jest.fn(),
  CHIP_OPTIONS: [
    { value: 'never-got', emoji: '🤯', label: 'Never got it' },
    { value: 'so-obvious', emoji: '😑', label: 'So obvious' },
    { value: 'so-close', emoji: '🙃', label: 'So close' },
  ],
}));

import { postCommentOptimistic } from '@/lib/comments-api';
const mockPost = postCommentOptimistic as jest.Mock;

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
    showTimer: false,
    altText: null,
    isActive: true,
    categoryId: null,
    category: null,
    ...overrides,
  };
}

describe('useImageRiddleGame — comments integration', () => {
  beforeEach(() => {
    mockPost.mockReset();
    // jsdom lacks pushState-dependent behaviors in older versions? Provide a
    // minimal no-op to keep modal-history integration inert under test.
    window.history.pushState = jest.fn();
    window.history.back = jest.fn();
  });

  it('posts every submitted guess to the feed', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );
    act(() => result.current.openRiddle(makeRiddle()));
    act(() => result.current.changeAnswer('umbrella'));
    act(() => result.current.checkAnswer());

    expect(mockPost).toHaveBeenCalledWith({
      contentType: 'image-riddle',
      contentId: 'r1',
      kind: 'guess',
      text: 'umbrella',
    });
  });

  it('opens the chip picker on a zero-guess reveal instead of revealing', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );
    act(() => result.current.openRiddle(makeRiddle()));
    const revealAction = result.current.modalActions.find((a) => a.id === 'reveal-answer');
    act(() => {
      if (revealAction) result.current.handleAction(revealAction);
      else result.current.handleAction({ id: 'reveal-answer' } as never);
    });

    expect(result.current.chipPrompt).toBe(true);
    expect(result.current.showAnswer).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('posts the chosen chip then reveals', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );
    act(() => result.current.openRiddle(makeRiddle()));
    act(() => result.current.handleAction({ id: 'reveal-answer' } as never));
    act(() => result.current.chooseChip('never-got'));

    expect(mockPost).toHaveBeenCalledWith({
      contentType: 'image-riddle',
      contentId: 'r1',
      kind: 'chip',
      chip: 'never-got',
    });
    expect(result.current.chipPrompt).toBe(false);
    expect(result.current.showAnswer).toBe(true);
    expect(result.current.revealSource).toBe('revealed');
  });

  it('"just show me" reveals without posting a chip', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );
    act(() => result.current.openRiddle(makeRiddle()));
    act(() => result.current.handleAction({ id: 'reveal-answer' } as never));
    act(() => result.current.skipChipPrompt());

    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.showAnswer).toBe(true);
  });

  it('reveals directly (no chip picker) after a wrong guess', () => {
    const { result } = renderHook(() =>
      useImageRiddleGame({ riddles: [makeRiddle()], onSolved: jest.fn(), onRevealed: jest.fn() })
    );
    act(() => result.current.openRiddle(makeRiddle()));
    act(() => result.current.changeAnswer('pancakes'));
    act(() => result.current.checkAnswer());
    act(() => result.current.handleAction({ id: 'reveal-answer' } as never));

    expect(result.current.chipPrompt).toBe(false);
    expect(result.current.showAnswer).toBe(true);
  });
});
