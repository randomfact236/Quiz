/**
 * ============================================================================
 * RiddleModal — gameplay modal for a single image riddle
 * ============================================================================
 * Scrollable max-height shell (usable on short viewports), prev/next
 * navigation, difficulty chip, conditional countdown + progress bar
 * (hidden when the riddle sets showTimer=false), TIME'S UP overlay with a
 * Reveal / Keep Trying choice, and the guess/answer panel switch.
 * ============================================================================
 */

'use client';

import Image from 'next/image';
import { Clock, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { ImageRiddle } from '@/lib/image-riddles-api';

import type { ImageRiddleGame } from '../hooks/useImageRiddleGame';
import {
  CARD_BLUR_DATA_URL,
  difficultyColors,
  difficultyIcons,
  difficultyLabels,
  resolveTimerSeconds,
} from '../lib/game';
import RiddleAnswerPanel from './RiddleAnswerPanel';
import RiddleGuessPanel from './RiddleGuessPanel';

export interface RiddleModalProps {
  riddle: ImageRiddle;
  game: ImageRiddleGame;
  hasImageError: boolean;
  onImageError: (id: string) => void;
  canNavigate: boolean;
}

/** Focusable-element selector used by the focus trap (C3). */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export default function RiddleModal({
  riddle,
  game,
  hasImageError,
  onImageError,
  canNavigate,
}: RiddleModalProps) {
  const timerEnabled = riddle.showTimer !== false;
  const totalSeconds = resolveTimerSeconds(riddle);
  const modalRef = useRef<HTMLDivElement>(null);

  // C3: capture the triggering element (the card that opened the modal) as
  // early as possible — during first render, BEFORE the guess input's
  // autoFocus moves focus — so it can be restored on unmount.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  if (returnFocusRef.current === null && typeof document !== 'undefined') {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  }

  // C3: on mount, if focus did not land inside the modal (the guess input's
  // autoFocus normally handles it), move focus to the first focusable
  // element. On unmount, return focus to the triggering card.
  useEffect(() => {
    const container = modalRef.current;
    if (container && !container.contains(document.activeElement)) {
      const first = getFocusable(container)[0];
      (first ?? container).focus();
    }
    const toRestore = returnFocusRef.current;
    return () => {
      toRestore?.focus?.();
    };
  }, []);

  // C3: focus trap — Tab/Shift+Tab cycle only within the modal. When focus
  // is at the last element, Tab wraps to the first (and vice versa); if
  // focus somehow escaped the modal, pull it back to the first element.
  const handleTrapKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const container = modalRef.current;
    if (!container) return;
    const focusables = getFocusable(container);
    if (focusables.length === 0) return;

    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (!active || !container.contains(active) || active === first) {
        e.preventDefault();
        last.focus();
      }
      return;
    }
    if (!active || !container.contains(active) || active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onKeyDown={handleTrapKeyDown}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={riddle.title}
        tabIndex={-1}
        className="relative max-h-[90vh] flex flex-col w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300"
      >
        <button
          onClick={game.closeRiddle}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all hover:bg-red-100 hover:text-red-600 hover:shadow-sm active:scale-90"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Navigation Buttons */}
        {canNavigate && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                game.navigateRiddle('prev');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg text-slate-500 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
              aria-label="Previous Riddle"
            >
              <span className="text-2xl font-black">‹</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                game.navigateRiddle('next');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg text-slate-500 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
              aria-label="Next Riddle"
            >
              <span className="text-2xl font-black">›</span>
            </button>
          </>
        )}

        {/* Scrollable content (stays usable on short viewports) */}
        <div className="flex flex-col flex-1 min-h-0 p-6 sm:p-10 mx-0 sm:mx-8 overflow-y-auto">
          {/* Top Info Row: Difficulty */}
          <div className="mb-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${difficultyColors[riddle.difficulty]} shadow-sm`}
            >
              {(() => {
                const DifficultyIcon = difficultyIcons[riddle.difficulty];
                return DifficultyIcon ? (
                  <DifficultyIcon className="h-3 w-3" aria-hidden="true" />
                ) : null;
              })()}
              {difficultyLabels[riddle.difficulty]}
            </span>
          </div>

          <div className="flex items-start justify-between gap-6 mb-6">
            <h2 className="shrink flex-1 text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-loose pt-1">
              {riddle.title}
            </h2>
            {timerEnabled && (
              <div className="shrink-0 flex flex-col items-end gap-1">
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm transition-all border-2 ${game.isTimerActive ? (game.timeLeft <= 10 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-indigo-50 border-indigo-100 text-indigo-600') : 'bg-white border-slate-100 text-slate-300'}`}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {Math.floor(game.timeLeft / 60)}:
                    {(game.timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 linear ${game.timeLeft <= 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.max(0, (game.timeLeft / totalSeconds) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Image */}
          <div className="relative flex-1 min-h-0 mb-6 overflow-hidden rounded-3xl border-2 border-slate-100 shadow-inner group bg-slate-50">
            {hasImageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                <span className="text-6xl">🖼️</span>
                <span className="text-xs font-black uppercase tracking-widest">
                  Image unavailable
                </span>
              </div>
            ) : (
              <Image
                src={riddle.imageUrl}
                alt={riddle.altText || riddle.title}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                placeholder="blur"
                blurDataURL={CARD_BLUR_DATA_URL}
                onError={() => onImageError(riddle.id)}
                className="object-contain p-2"
              />
            )}
            {/* Timer Expiry Overlay: hand the choice to the player */}
            {game.timedOut && !game.showAnswer && (
              <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 z-10">
                <span className="text-5xl font-black text-red-600 bg-white/90 px-8 py-4 rounded-3xl shadow-2xl rotate-12 border-4 border-red-600">
                  TIME&apos;S UP!
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={game.revealAfterTimeout}
                    className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-red-700 hover:scale-105 active:scale-95"
                  >
                    Reveal Answer
                  </button>
                  <button
                    onClick={game.keepTryingAfterTimeout}
                    className="rounded-full bg-white px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 shadow-lg transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
                  >
                    Keep Trying
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Game Logic */}
          {!game.showAnswer ? (
            <RiddleGuessPanel riddle={riddle} game={game} />
          ) : (
            <RiddleAnswerPanel
              answer={riddle.answer}
              revealSource={game.revealSource}
              attemptCount={game.attempts[riddle.id] || 0}
              onNext={() => game.navigateRiddle('next')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
