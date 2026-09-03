/**
 * useImageRiddleGame — modal game state machine.
 * Owns the per-riddle gameplay loop: timer, guess checking (normalized
 * matcher), attempts/feedback, reveal sources, timeout choices, navigation,
 * and the action-id → handler wiring (A2: share + skip implemented,
 * unsupported presets dropped at render time).
 *
 * Comments integration (comments-system plan §3): every submitted guess is
 * posted to the riddle's feed (fire-and-forget), and Reveal Answer with zero
 * prior guesses opens the chip-to-reveal picker ("How close were you?")
 * before revealing — already-guessed users reveal directly.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { IActionOption } from '@/components/image-riddles/ActionOptions';
import { postCommentOptimistic, type CommentChipValue } from '@/lib/comments-api';
import { isImageRiddleAnswerCorrect } from '@/lib/image-riddle-answer';
import { recordImageRiddleEngagement } from '@/lib/image-riddles-api';
import type { ImageRiddle } from '@/lib/image-riddles-api';

import { resolveTimerSeconds } from '../lib/game';
import { selectModalActions } from '../lib/default-actions';

import { useImageRiddleTimers } from './useImageRiddleTimers';
import { useRiddleKeyboardNav } from './useRiddleKeyboardNav';

export type ImageRiddleRevealSource = 'correct' | 'revealed' | null;

export interface UseImageRiddleGameArgs {
  /** Visible (filtered/paginated) riddles, used for modal navigation. */
  riddles: ImageRiddle[];
  onSolved: (id: string) => void;
  onRevealed: (id: string) => void;
}

export function useImageRiddleGame({ riddles, onSolved, onRevealed }: UseImageRiddleGameArgs) {
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [revealSource, setRevealSource] = useState<ImageRiddleRevealSource>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [showLetterCount, setShowLetterCount] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [chipPrompt, setChipPrompt] = useState(false);

  const {
    timeLeft,
    isActive,
    start: startTimer,
    stop: stopTimer,
  } = useImageRiddleTimers(useCallback(() => setTimedOut(true), []));

  const resetTransientState = useCallback(() => {
    setUserAnswer('');
    setShowAnswer(false);
    setShowHint(false);
    setWrongAnswer(false);
    setRevealSource(null);
    setTimedOut(false);
    setShareOpen(false);
    setChipPrompt(false);
  }, []);

  // #18: modal history integration. Opening the modal pushes a history entry
  // so browser Back closes the modal instead of leaving the page; closing
  // via the UI (✕/Escape/Next) pops that entry via history.back(). The ref
  // tracks whether the current modal session pushed an entry so popstate
  // (fired by our own back()) never pops a second one.
  const modalHistoryRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      modalHistoryRef.current = false; // pushed entry consumed by this pop
      setSelectedRiddle(null);
      stopTimer();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [stopTimer]);

  const openRiddle = useCallback(
    (riddle: ImageRiddle) => {
      // Only the closed → open transition pushes a history entry; in-modal
      // navigation (next/prev) reuses it.
      if (!selectedRiddle) {
        // Engagement counter (plan/04-image-riddles.md P1 #1): one view per
        // modal opening (in-modal next/prev navigations are not new views).
        void recordImageRiddleEngagement(riddle.id, 'view');
        window.history.pushState({ imageRiddleModal: true }, '');
        modalHistoryRef.current = true;
      }
      setSelectedRiddle(riddle);
      resetTransientState();
      // Untimed riddles (showTimer=false) start with an inactive clock.
      startTimer(riddle.showTimer !== false ? resolveTimerSeconds(riddle) : 0);
      setShowLetterCount(riddle.difficulty === 'hard' || riddle.difficulty === 'expert');
    },
    [selectedRiddle, resetTransientState, startTimer]
  );

  const closeRiddle = useCallback(() => {
    setSelectedRiddle(null);
    stopTimer();
    if (modalHistoryRef.current) {
      modalHistoryRef.current = false;
      // Pops the pushed entry; the resulting popstate clears state again
      // (no-op). If the user reopens before the pop lands, the popstate
      // simply closes that fresh modal — the entry accounting stays correct.
      window.history.back();
    }
  }, [stopTimer]);

  const navigateRiddle = useCallback(
    (direction: 'next' | 'prev') => {
      if (!selectedRiddle || riddles.length === 0) return;
      const currentIndex = riddles.findIndex((r) => r.id === selectedRiddle.id);
      if (currentIndex === -1) return;
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= riddles.length) newIndex = 0;
      if (newIndex < 0) newIndex = riddles.length - 1;
      const nextRiddle = riddles[newIndex];
      if (nextRiddle) openRiddle(nextRiddle);
    },
    [selectedRiddle, riddles, openRiddle]
  );

  const checkAnswer = useCallback(() => {
    if (!selectedRiddle || showAnswer) return;
    setAttempts((prev) => ({ ...prev, [selectedRiddle.id]: (prev[selectedRiddle.id] || 0) + 1 }));
    // Engagement counters (plan/04-image-riddles.md P1 #1).
    void recordImageRiddleEngagement(selectedRiddle.id, 'attempt');
    // Every submitted guess lands in the riddle's feed (plan §1). The server
    // recomputes correctness — the local check only drives gameplay UX.
    const guessText = userAnswer.trim();
    if (guessText.length > 0) {
      postCommentOptimistic({
        contentType: 'image-riddle',
        contentId: selectedRiddle.id,
        kind: 'guess',
        text: guessText,
      });
    }
    const isCorrect = isImageRiddleAnswerCorrect({
      answer: selectedRiddle.answer,
      alternativeAnswers: selectedRiddle.alternativeAnswers,
      guess: userAnswer,
    });
    if (isCorrect) {
      setShowAnswer(true);
      setRevealSource('correct');
      setWrongAnswer(false);
      onSolved(selectedRiddle.id);
      onRevealed(selectedRiddle.id);
      void recordImageRiddleEngagement(selectedRiddle.id, 'solve');
    } else {
      setWrongAnswer(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [selectedRiddle, showAnswer, userAnswer, onSolved, onRevealed]);

  const performReveal = useCallback(() => {
    if (!selectedRiddle) return;
    setShowAnswer(true);
    setRevealSource('revealed');
    setWrongAnswer(false);
    onRevealed(selectedRiddle.id);
  }, [selectedRiddle, onRevealed]);

  /** Give-up reveal: zero submitted guesses → chip picker first (plan §3.2). */
  const revealAnswer = useCallback(() => {
    if (!selectedRiddle) return;
    if ((attempts[selectedRiddle.id] || 0) === 0) {
      setChipPrompt(true);
      return;
    }
    performReveal();
  }, [selectedRiddle, attempts, performReveal]);

  /** Chip tap: post (optimistic) then reveal — never blocks on the network. */
  const chooseChip = useCallback(
    (chip: CommentChipValue) => {
      if (!selectedRiddle) return;
      postCommentOptimistic({
        contentType: 'image-riddle',
        contentId: selectedRiddle.id,
        kind: 'chip',
        chip,
      });
      setChipPrompt(false);
      performReveal();
    },
    [selectedRiddle, performReveal]
  );

  /** Escape hatch from the chip picker — reveal without a confession. */
  const skipChipPrompt = useCallback(() => {
    setChipPrompt(false);
    performReveal();
  }, [performReveal]);
  const revealAfterTimeout = useCallback(() => {
    setTimedOut(false);
    revealAnswer();
  }, [revealAnswer]);
  const keepTryingAfterTimeout = useCallback(() => setTimedOut(false), []);

  const changeAnswer = useCallback((value: string) => {
    setUserAnswer(value);
    setWrongAnswer(false);
  }, []);

  // Map every supported action id (local defaults + backend presets) to a
  // handler so every rendered button does something (upgrade plan A2).
  const handleAction = useCallback(
    (action: IActionOption) => {
      switch (action.id) {
        case 'check-answer':
        case 'submit-answer':
          checkAnswer();
          break;
        case 'show-hint':
          setShowHint((prev) => !prev);
          break;
        case 'give-up':
        case 'reveal-answer':
          revealAnswer();
          break;
        case 'skip': // move to the next riddle without revealing
          navigateRiddle('next');
          break;
        case 'share': // open the explicit share menu (FB/X/WhatsApp/LinkedIn/Copy/Save)
          setShareOpen(true);
          break;
        default:
          break;
      }
    },
    [checkAnswer, revealAnswer, navigateRiddle]
  );

  const modalActions = useMemo(
    () => (selectedRiddle ? selectModalActions(selectedRiddle) : []),
    [selectedRiddle]
  );

  // Keyboard navigation: Escape closes; arrows navigate outside inputs.
  useRiddleKeyboardNav(Boolean(selectedRiddle), closeRiddle, navigateRiddle);

  return {
    selectedRiddle,
    userAnswer,
    showAnswer,
    showHint,
    wrongAnswer,
    revealSource,
    timedOut,
    showLetterCount,
    shake,
    attempts,
    shareOpen,
    chipPrompt,
    timeLeft,
    isTimerActive: isActive,
    modalActions,
    openRiddle,
    closeRiddle,
    navigateRiddle,
    checkAnswer,
    changeAnswer,
    handleAction,
    revealAfterTimeout,
    keepTryingAfterTimeout,
    chooseChip,
    skipChipPrompt,
    closeShare: () => setShareOpen(false),
    toggleLetterCount: () => setShowLetterCount((prev) => !prev),
  };
}

export type ImageRiddleGame = ReturnType<typeof useImageRiddleGame>;
