/**
 * ============================================================================
 * Image riddles keyboard operability + modal focus management (C3 / C2 #17)
 * ============================================================================
 * Covers:
 *  - RiddleCard: role/tabIndex, Enter/Space opens (Space prevents scroll),
 *    site-standard focus ring
 *  - RiddleModal: focus lands inside on open, Tab/Shift+Tab trap within the
 *    modal, focus returns to the triggering card on unmount
 *  - Escape-to-close still pops the history entry pushed on open (#18 flow)
 * ============================================================================
 */

import { renderHook, act } from '@testing-library/react';
import { render, fireEvent } from '@testing-library/react';

import RiddleCard from '@/features/image-riddles/components/RiddleCard';
import RiddleModal from '@/features/image-riddles/components/RiddleModal';
import { useImageRiddleGame } from '@/features/image-riddles/hooks/useImageRiddleGame';
import type { ImageRiddle } from '@/lib/image-riddles-api';

jest.mock('next/image', () => ({
  __esModule: true,
  // jsdom has no layout/optimizer — render a plain img shim
  default: ({
    fill: _fill,
    sizes: _sizes,
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const r1: ImageRiddle = {
  id: 'r1',
  title: 'Test Riddle',
  imageUrl: 'https://example.com/img.webp',
  answer: 'umbrella',
  hint: 'Look up',
  difficulty: 'easy',
  status: 'published',
  timerSeconds: 60,
  showTimer: true,
  altText: null,
  isActive: true,
  categoryId: null,
  category: null,
};

const cardProps = {
  riddle: r1,
  isRevealed: false,
  isSolved: false,
  hasImageError: false,
  onToggleReveal: jest.fn(),
  onImageError: jest.fn(),
};

function setupGame(riddles: ImageRiddle[] = [r1]) {
  return renderHook(() =>
    useImageRiddleGame({ riddles, onSolved: jest.fn(), onRevealed: jest.fn() })
  );
}

function renderModal(game: ReturnType<typeof setupGame>, canNavigate = true) {
  return render(
    <RiddleModal
      riddle={r1}
      game={game.result.current}
      hasImageError={false}
      onImageError={jest.fn()}
      canNavigate={canNavigate}
    />
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', '/image-riddles');
});

describe('RiddleCard keyboard operability', () => {
  it('renders as a button with the site-standard focus ring', () => {
    const view = render(<RiddleCard {...cardProps} onOpen={jest.fn()} />);
    const card = view.container.firstElementChild as HTMLElement;

    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.className).toContain('focus-visible:ring-2');
    expect(card.className).toContain('focus-visible:ring-indigo-500');
    expect(card.className).toContain('focus-visible:ring-offset-2');
  });

  it('opens via Enter and via Space', () => {
    const onOpen = jest.fn();
    const view = render(<RiddleCard {...cardProps} onOpen={onOpen} />);
    const card = view.container.firstElementChild as HTMLElement;

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith(r1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onOpen).toHaveBeenCalledWith(r1);
  });

  it('prevents default on Space so the page does not scroll', () => {
    const onOpen = jest.fn();
    const view = render(<RiddleCard {...cardProps} onOpen={onOpen} />);
    const card = view.container.firstElementChild as HTMLElement;

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    card.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onOpen).toHaveBeenCalledWith(r1);
  });

  it('still opens on click and ignores unrelated keys', () => {
    const onOpen = jest.fn();
    const view = render(<RiddleCard {...cardProps} onOpen={onOpen} />);
    const card = view.container.firstElementChild as HTMLElement;

    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledWith(r1);

    onOpen.mockClear();
    fireEvent.keyDown(card, { key: 'Tab' });
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe('RiddleModal focus management', () => {
  it('moves focus inside the modal on open', () => {
    const game = setupGame();
    act(() => {
      game.result.current.openRiddle(r1);
    });
    const view = renderModal(game);

    const dialog = view.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);

    view.unmount();
  });

  it('traps Tab: forward from the last element wraps to the first', () => {
    const game = setupGame();
    act(() => {
      game.result.current.openRiddle(r1);
    });
    const view = renderModal(game);
    const dialog = view.getByRole('dialog');

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    expect(focusables.length).toBeGreaterThan(1);

    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;

    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    view.unmount();
  });

  it('traps Shift+Tab: backward from the first element wraps to the last', () => {
    const game = setupGame();
    act(() => {
      game.result.current.openRiddle(r1);
    });
    const view = renderModal(game);
    const dialog = view.getByRole('dialog');

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;

    first.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    view.unmount();
  });

  it('returns focus to the triggering card on close', () => {
    const onOpen = jest.fn();
    const cardView = render(<RiddleCard {...cardProps} onOpen={onOpen} />);
    const card = cardView.container.firstElementChild as HTMLElement;
    card.focus();
    expect(document.activeElement).toBe(card);

    const game = setupGame();
    act(() => {
      game.result.current.openRiddle(r1); // what onOpen triggers in the page
    });
    const modalView = renderModal(game, false);
    expect(document.activeElement).not.toBe(card); // focus moved into the modal

    modalView.unmount(); // ✕ / Escape / history-back all unmount the modal
    expect(document.activeElement).toBe(card); // focus returned to the card

    cardView.unmount();
  });

  it('Escape closes the modal and pops the pushed history entry (#18 flow intact)', () => {
    const backSpy = jest.spyOn(window.history, 'back');
    const pushSpy = jest.spyOn(window.history, 'pushState');
    const game = setupGame();

    act(() => {
      game.result.current.openRiddle(r1);
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(game.result.current.selectedRiddle).toBeNull();
    expect(backSpy).toHaveBeenCalledTimes(1); // no dangling history entry

    backSpy.mockRestore();
    pushSpy.mockRestore();
  });
});
