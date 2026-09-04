/**
 * ============================================================================
 * useRiddlePlay — riddle gameplay orchestration
 * ============================================================================
 * Extracted from app/riddle-mcq/play/page.tsx (quality-gate split). Owns the
 * fetch/resume/autosave/submit flow; the page is render-only.
 *
 * Persistence: consolidated module (lib/riddle-persistence.ts) — two-key resume (snapshot written
 * once per session start/extend, lightweight progress per autosave tick.
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import {
  saveRiddleSession,
  clearRiddleSession,
  createRiddleSession,
  setupNavigationWarning,
  loadRiddleResume,
  saveRiddleResume,
  saveRiddleResumeQuestions,
  clearRiddleResume,
} from '@/lib/riddle-persistence';
import { getRiddlesBySubject, getMixedRiddles, getRandomRiddles } from '@/lib/riddle-mcq-api';
import { saveRiddleResult } from '@/lib/riddle-progress';
import { checkAchievements, toastAchievementUnlocks } from '@/lib/achievements';
import { isRiddleAnswerCorrect } from '@/lib/riddle-scoring';
import { registerExitHook, track } from '@/lib/analytics';
import { shuffle } from '@/lib/utils';
import { adaptRiddleMcq, type Riddle, type RiddleSession } from '@/types/riddles';
import { SettingsService } from '@/services/settings.service';
import type { PublicSettings } from '@/services/settings.service';

import { useRiddleTimers, type RiddlePlayStatus } from './useRiddleTimers';

// Auto-save interval in milliseconds
const AUTO_SAVE_INTERVAL = 10000;

// Default time limit for timer mode (seconds per riddle)
const DEFAULT_TIME_PER_RIDDLE = 30;

// Base session size shown on the pre-game summary (extras added via picker)
const BASE_SESSION_SIZE = 10;

export interface UseRiddlePlayParams {
  subjectId: string;
  level: string;
  mode: 'timer' | 'practice';
  chapterNameParam: string;
}

export function useRiddlePlay({ subjectId, level, mode, chapterNameParam }: UseRiddlePlayParams) {
  const router = useRouter();

  // State — mirrors quiz page structure
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [pool, setPool] = useState<Riddle[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [chapterName, setChapterName] = useState<string>(chapterNameParam || 'Mixed Chapters');
  const [session, setSession] = useState<RiddleSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [manuallySkipped, setManuallySkipped] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [status, setStatus] = useState<RiddlePlayStatus>('loading');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExtendSession, setShowExtendSession] = useState(false);
  const [additionalRiddles, setAdditionalRiddles] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Mount guard to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch riddles from backend — mirrors quiz page's loadTimerSettings + fetch pattern
  useEffect(() => {
    if (!isMounted) return;

    async function fetchRiddles() {
      try {
        setStatus('loading');
        setError(null);

        // Load settings (with timeout, same as before)
        try {
          const settingsPromise = SettingsService.getSettings();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Settings timeout')), 5000)
          );
          const config = (await Promise.race([settingsPromise, timeoutPromise])) as Awaited<
            ReturnType<typeof SettingsService.getSettings>
          >;
          setSettings(config);
        } catch (err) {}

        let fetchedRiddles: Riddle[] = [];

        if (subjectId === 'all') {
          let mixed: {
            level?: string;
            id: string;
            question: string;
            options: string[];
            correctAnswer: string;
            chapter?: { name?: string };
            chapterId?: string;
            explanation?: string;
            hint?: string;
          }[] = [];

          if (level && level !== 'all') {
            // Over-fetch so the pre-game picker can offer extras
            const response = await getRandomRiddles(level, 40);
            mixed = response.map((r) => ({ ...r, level: r.level || level }));
          } else {
            mixed = await getMixedRiddles(40);
          }

          fetchedRiddles = mixed.map((r) => adaptRiddleMcq(r as any));
          setChapterName(
            level === 'all'
              ? 'Mixed Subjects'
              : `${level.charAt(0).toUpperCase() + level.slice(1)} Level Mix`
          );
        } else {
          // Pass level filter to backend API (more efficient than frontend filtering)
          const response = await getRiddlesBySubject(subjectId, 1, 100, level);
          fetchedRiddles = response.data.map((r: any) => adaptRiddleMcq(r as any));
          if (fetchedRiddles.length > 0 && fetchedRiddles[0]) {
            const baseName = chapterNameParam || 'Subject';
            setChapterName(level === 'all' ? baseName : `${baseName} (${level})`);
          }
        }

        // Shuffle for variety (unbiased Fisher-Yates)
        fetchedRiddles = shuffle(fetchedRiddles);

        // Check for a resumable session (two-key store: snapshot + progress)
        const resume = loadRiddleResume();
        if (
          resume &&
          resume.subjectId === subjectId &&
          resume.level === level &&
          Object.keys(resume.answers).length > 0
        ) {
          setPool(fetchedRiddles);
          setShowResumeDialog(true);
          setStatus('paused'); // Exit loading so dialog renders
        } else {
          // Hold at the pre-game summary; session starts on user action
          setPool(fetchedRiddles);
          setStatus('ready');
        }
      } catch (err) {
        setError('Failed to load riddles. Check your connection and try again.');
        setStatus('playing'); // exit loading state so error UI is visible
      }
    }

    fetchRiddles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, level, isMounted]);

  // Start new session
  const startNewSession = useCallback(
    (riddleList: Riddle[]) => {
      clearRiddleSession();

      let totalTimeLimit = 0;
      if (mode === 'timer') {
        const timers = settings?.riddles?.defaults?.levelTimers;
        riddleList.forEach((riddle) => {
          const riddleLevel = riddle.difficulty?.toLowerCase() || 'medium';
          const perRiddleTime =
            timers?.[riddleLevel as keyof typeof timers] || DEFAULT_TIME_PER_RIDDLE;
          totalTimeLimit += perRiddleTime;
        });
      }

      const newSession = createRiddleSession(
        mode,
        subjectId,
        chapterName,
        (level as 'all' | 'easy' | 'medium' | 'hard' | 'expert') || 'all',
        riddleList,
        totalTimeLimit
      );
      // Two-key store: riddle snapshot written once; progress written per tick
      const identity = { mode, subjectId, level };
      saveRiddleResumeQuestions(identity, riddleList);
      saveRiddleResume(identity, {
        answers: {},
        timeRemaining: totalTimeLimit,
        startedAt: newSession.startedAt,
      });
      setSession(newSession);
      setRiddles(riddleList);
      setAnswers({});
      setCurrentIndex(0);
      setTimeRemaining(totalTimeLimit);
      setStatus('playing');
      setShowResumeDialog(false);
      hintsUsedRef.current = 0;

      // Analytics plan §4.1: session_started with setup dimensions.
      track(
        'session_started',
        {
          mode,
          subject: subjectId,
          chapter: chapterName,
          level: level || 'all',
          questionCount: riddleList.length,
        },
        { module: 'riddle-mcq', sessionId: newSession.id }
      );
    },
    [mode, subjectId, level, chapterName, settings]
  );

  // Resume existing session
  const resumeSession = useCallback(() => {
    const resume = loadRiddleResume();
    if (resume) {
      const resumedRiddles = (resume.availableRiddles ?? []) as Riddle[];
      setSession({
        ...createRiddleSession(
          mode,
          subjectId,
          chapterName,
          (level as 'all' | 'easy' | 'medium' | 'hard' | 'expert') || 'all',
          resumedRiddles,
          resume.timeRemaining || 0
        ),
        id: session?.id || `riddle_${Date.now()}`,
        answers: resume.answers,
        status: 'in-progress',
        startedAt: resume.startedAt,
        timeRemaining: resume.timeRemaining,
      });
      setRiddles(resumedRiddles);
      setAnswers(resume.answers);
      setCurrentIndex(Object.keys(resume.answers).length);
      setTimeRemaining(resume.timeRemaining || 0);
      setStatus('playing');
      setHasStarted(true);
      hintsUsedRef.current = 0;

      // Analytics plan §4.1: session_resumed with saved progress.
      track(
        'session_resumed',
        {
          mode,
          subject: subjectId,
          progressAtSave: Object.keys(resume.answers).length,
        },
        { module: 'riddle-mcq', sessionId: session?.id }
      );
    }
    setShowResumeDialog(false);
  }, [mode, subjectId, level, chapterName, session]);

  useRiddleTimers({ status, mode, setTimeRemaining });

  // ==================== Abandonment (analytics plan §4b A1) ====================
  // Snapshot of the in-flight session for exit-time `session_abandoned`
  // events. Cleared synchronously in handleSubmit so a submitted session is
  // never reported as abandoned by the router.push unmount racing effects.
  const exitSnapshotRef = useRef<{
    sessionId: string;
    subject: string;
    chapter: string;
    level: string;
    mode: 'timer' | 'practice';
    startedAt: number;
    total: number;
    answered: number;
    lastIndex: number;
    paused: boolean;
  } | null>(null);
  const abandonedSessionsRef = useRef<Set<string>>(new Set());

  // Analytics plan §4b A3: hints were a dead metric — session.hintsUsed was
  // initialized to 0 and never incremented (RiddleCard kept hint state local).
  const hintsUsedRef = useRef(0);

  const emitAbandon = useCallback(() => {
    const snap = exitSnapshotRef.current;
    if (!snap || abandonedSessionsRef.current.has(snap.sessionId)) return;
    abandonedSessionsRef.current.add(snap.sessionId);
    track(
      'session_abandoned',
      {
        mode: snap.mode,
        subject: snap.subject,
        chapter: snap.chapter,
        level: snap.level,
        questionCount: snap.total,
        answeredCount: snap.answered,
        lastQuestionIndex: snap.lastIndex,
        timeTaken: Math.max(0, Math.floor((Date.now() - snap.startedAt) / 1000)),
        statusBefore: snap.paused ? 'paused' : 'playing',
      },
      { module: 'riddle-mcq', sessionId: snap.sessionId }
    );
  }, []);

  // True page exits ride the analytics exit hook so the abandon event joins
  // the exit beacon batch; SPA exits (Exit link unmount) emit on cleanup.
  useEffect(() => {
    const unregister = registerExitHook((reason) => {
      if (reason === 'pagehide') emitAbandon();
    });
    return () => {
      unregister();
      emitAbandon();
    };
  }, [emitAbandon]);

  // Keep the abandonment snapshot in sync with the live session.
  useEffect(() => {
    if (session && hasStarted && (status === 'playing' || status === 'paused')) {
      exitSnapshotRef.current = {
        sessionId: session.id,
        subject: session.subjectId,
        chapter: session.subjectName,
        level: session.difficulty,
        mode,
        startedAt: new Date(session.startedAt).getTime(),
        total: riddles.length,
        answered: Object.keys(answers).length,
        lastIndex: currentIndex,
        paused: status === 'paused',
      };
    } else if (status === 'completed') {
      exitSnapshotRef.current = null;
    }
  }, [session, hasStarted, status, mode, riddles.length, answers, currentIndex]);

  // Analytics plan §4b A3: hint_used with a real per-session counter.
  const handleHintShown = useCallback(() => {
    if (!session) return;
    const currentRiddle = riddles[currentIndex];
    if (!currentRiddle) return;
    hintsUsedRef.current += 1;
    track(
      'hint_used',
      {
        questionId: currentRiddle.id,
        subject: session.subjectId,
        level: session.difficulty,
        hintNumber: hintsUsedRef.current,
      },
      { module: 'riddle-mcq', sessionId: session.id }
    );
  }, [session, riddles, currentIndex]);

  // Toggle pause — mirrors quiz page pauseQuiz/resumeQuiz
  const togglePause = useCallback(() => {
    setStatus((prev) => (prev === 'playing' ? 'paused' : 'playing'));
  }, []);

  // Auto-save — lightweight progress key only (riddle snapshot written once at
  // session start); refs keep the interval from resetting on every answer
  const progressRef = useRef({ answers, timeRemaining });
  useEffect(() => {
    progressRef.current = { answers, timeRemaining };
  }, [answers, timeRemaining]);

  useEffect(() => {
    if (status !== 'playing' || !session) return;

    const interval = setInterval(() => {
      saveRiddleResume(
        { mode, subjectId, level },
        {
          answers: progressRef.current.answers,
          timeRemaining: progressRef.current.timeRemaining,
          startedAt: session.startedAt,
        }
      );
      setLastSaved(new Date());
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [status, mode, subjectId, level, session]);

  // Navigation warning
  useEffect(() => {
    if (status !== 'playing') return;
    return setupNavigationWarning(() => {
      if (!session) return null;
      return {
        ...session,
        answers,
        timeRemaining: mode === 'timer' ? timeRemaining : calculateTimeTaken(),
      };
    });
  }, [status, session, answers, timeRemaining, mode]);

  const calculateTimeTaken = useCallback(() => {
    if (!session) return 0;
    return Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
  }, [session]);

  const handleAnswerSelect = useCallback(
    (optionLetter: string) => {
      if (!session || status !== 'playing') return;
      const currentRiddle = riddles[currentIndex];
      if (!currentRiddle) return;
      // Analytics plan §4.2: question_answered (before the state flip, using
      // the shared scorer so correctness matches results-page logic).
      track(
        'question_answered',
        {
          questionId: currentRiddle.id,
          subject: session.subjectId,
          chapter: session.subjectName,
          level: session.difficulty,
          selectedOption: optionLetter,
          correct: isRiddleAnswerCorrect(currentRiddle, optionLetter),
        },
        { module: 'riddle-mcq', sessionId: session.id }
      );
      setAnswers((prev) => ({ ...prev, [currentRiddle.id]: optionLetter }));
    },
    [session, status, riddles, currentIndex]
  );

  // Start a new session from the pre-game summary with the chosen size
  const beginSession = useCallback(
    (extraCount: number) => {
      const list = pool.slice(0, BASE_SESSION_SIZE + Math.max(0, extraCount));
      if (list.length === 0) return;
      setManuallySkipped(new Set());
      startNewSession(list);
      setHasStarted(true);
    },
    [pool, startNewSession]
  );

  // Skip current riddle (marks it; jump back later via the header chip)
  const handleSkip = useCallback(() => {
    if (!session || status !== 'playing') return;
    const currentRiddle = riddles[currentIndex];
    if (!currentRiddle) return;
    // Analytics plan §4.2: manual skip.
    track(
      'question_skipped',
      { questionId: currentRiddle.id, manual: true },
      { module: 'riddle-mcq', sessionId: session.id }
    );
    setManuallySkipped((prev) => new Set(prev).add(currentRiddle.id));
    if (currentIndex >= riddles.length - 1) {
      setShowConfirmSubmit(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [session, status, riddles, currentIndex]);

  // Jump to the next skipped riddle after the current one (wraps around)
  const jumpToNextSkipped = useCallback(() => {
    if (manuallySkipped.size === 0) return;
    const ids = riddles.map((r) => r.id);
    const skippedIndices = Array.from(manuallySkipped)
      .map((id) => ids.indexOf(id))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b);
    const after = skippedIndices.find((idx) => idx > currentIndex);
    const target = after !== undefined ? after : skippedIndices[0];
    if (target !== undefined) setCurrentIndex(target);
  }, [manuallySkipped, riddles, currentIndex]);

  // Navigation handlers — mirrors quiz goToNext/goToPrevious
  const handleNext = useCallback(() => {
    if (currentIndex < riddles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowConfirmSubmit(true);
    }
  }, [currentIndex, riddles.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    if (!session) return;

    // Completion wins over abandonment even if the router.push unmount races
    // the snapshot-sync effect.
    exitSnapshotRef.current = null;

    let correctCount = 0;
    riddles.forEach((r) => {
      if (isRiddleAnswerCorrect(r, answers[r.id])) correctCount++;
    });

    const completedSession: RiddleSession = {
      ...session,
      answers,
      score: correctCount,
      timeTaken: calculateTimeTaken(),
      timeRemaining: mode === 'timer' ? timeRemaining : 0,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    setStatus('completed');
    saveRiddleSession(completedSession); // full payload, one-time, for results

    // Achievements/progress integration (plan/03-riddle-mcq.md P1 #1): riddles
    // previously fed nothing. Record the completion, then evaluate unlocks.
    saveRiddleResult(completedSession);
    const unlocked = checkAchievements();
    toastAchievementUnlocks(unlocked);

    // Analytics plan §4.1: session_completed (both manual submit and the
    // time-up auto-submit funnel through here).
    track(
      'session_completed',
      {
        mode,
        subject: session.subjectId,
        chapter: session.subjectName,
        level: session.difficulty,
        questionCount: riddles.length,
        score: correctCount,
        maxScore: riddles.length,
        percentage: riddles.length > 0 ? Math.round((correctCount / riddles.length) * 100) : 0,
        correctCount,
        incorrectCount: riddles.length - correctCount,
        answeredCount: Object.keys(answers).length,
        skippedCount: manuallySkipped.size,
        hintsUsed: hintsUsedRef.current,
        timeTaken: completedSession.timeTaken,
      },
      { module: 'riddle-mcq', sessionId: session.id }
    );

    clearRiddleResume();
    setShowConfirmSubmit(false);
    router.push(`/riddle-mcq/results?session=${session.id}`);
  }, [session, answers, riddles, calculateTimeTaken, mode, timeRemaining, manuallySkipped, router]);

  // Time-up auto-submit — single side-effect path outside the timer's state updater
  useEffect(() => {
    if (mode !== 'timer' || status !== 'playing' || !session) return;
    if (timeRemaining > 0) return;
    handleSubmit();
  }, [mode, status, session, timeRemaining, handleSubmit]);

  const handleExtendSession = useCallback(async () => {
    try {
      setStatus('loading');
      setShowExtendSession(false);

      let newRiddles: Riddle[] = [];
      const currentIds = new Set(riddles.map((r) => r.id));

      if (subjectId === 'all') {
        if (level && level !== 'all') {
          const response = await getRandomRiddles(level, additionalRiddles + 10);
          newRiddles = response.map((r) =>
            adaptRiddleMcq({ ...r, level: r.level || level } as any)
          );
        } else {
          const response = await getMixedRiddles(additionalRiddles + 10);
          newRiddles = response.map((r) => adaptRiddleMcq(r as any));
        }
      } else {
        // Pass level filter to backend API (more efficient)
        const response = await getRiddlesBySubject(subjectId, 1, 100, level);
        newRiddles = response.data.map((r: any) => adaptRiddleMcq(r as any));
      }

      const uniqueNew = newRiddles.filter((r) => !currentIds.has(r.id)).slice(0, additionalRiddles);

      if (uniqueNew.length === 0) {
        alert('No more unique riddles available for this selection.');
        setStatus('playing');
        return;
      }

      let extraTimeSeconds = 0;
      if (mode === 'timer') {
        let extraTime = 0;
        const timers = settings?.riddles?.defaults?.levelTimers;
        uniqueNew.forEach((riddle) => {
          const riddleLevel = riddle.difficulty?.toLowerCase() || 'medium';
          extraTime += timers?.[riddleLevel as keyof typeof timers] || DEFAULT_TIME_PER_RIDDLE;
        });
        extraTimeSeconds = extraTime;
        setTimeRemaining((prev) => prev + extraTime);
      }

      setRiddles((prev) => [...prev, ...uniqueNew]);

      if (session) {
        const updatedSession = { ...session, riddles: [...session.riddles, ...uniqueNew] };
        setSession(updatedSession);
        // Pool grew — rewrite the snapshot so resume has the full set
        saveRiddleResumeQuestions({ mode, subjectId, level }, updatedSession.riddles);
      }

      // Analytics plan §4b A2: extend-session usage was untracked.
      track(
        'session_extended',
        {
          mode,
          subject: subjectId,
          level: level || 'all',
          addedCount: uniqueNew.length,
          timeAddedSeconds: extraTimeSeconds,
        },
        { module: 'riddle-mcq', sessionId: session?.id }
      );

      setCurrentIndex(riddles.length);
      setStatus('playing');
    } catch (err) {
      console.error('Failed to extend session:', err);
      alert('Failed to load more riddles. Please try again.');
      setStatus('playing');
    }
  }, [riddles, subjectId, level, additionalRiddles, mode, settings, session]);

  const currentRiddle = riddles[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimerMode = mode === 'timer';
  const isTimeUp = isTimerMode && timeRemaining === 0 && status === 'playing';

  // Live score via the shared scorer — expert open-ended answers included
  const liveScore = useMemo(
    () => riddles.reduce((acc, r) => acc + (isRiddleAnswerCorrect(r, answers[r.id]) ? 1 : 0), 0),
    [riddles, answers]
  );

  return {
    // data / status
    riddles,
    pool,
    hasStarted,
    currentRiddle,
    currentIndex,
    answers,
    timeRemaining,
    status,
    error,
    isMounted,
    lastSaved,
    chapterName,
    liveScore,
    answeredCount,
    isTimerMode,
    isTimeUp,
    skippedCount: manuallySkipped.size,

    // dialogs
    showResumeDialog,
    showConfirmSubmit,
    setShowConfirmSubmit,
    showExtendSession,
    setShowExtendSession,
    additionalRiddles,
    setAdditionalRiddles,

    // actions
    beginSession,
    handleSkip,
    jumpToNextSkipped,
    startNewSession,
    resumeSession,
    togglePause,
    handleAnswerSelect,
    handleNext,
    handlePrevious,
    handleSubmit,
    handleExtendSession,
    handleHintShown,
  };
}
