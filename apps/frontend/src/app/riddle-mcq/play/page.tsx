/**
 * ============================================================================
 * Riddle Play Page (Backend Connected)
 * ============================================================================
 * Main gameplay page for riddles - fetches from backend API.
 * Layout mirrors quiz/play/page.tsx exactly.
 * URL: /riddle-mcq/play?chapterId=&level=&mode=
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Timer,
  AlertCircle,
  RotateCcw,
  Save,
  Pause,
  Play
} from 'lucide-react';

import {
  saveRiddleSession,
  loadRiddleSession,
  clearRiddleSession,
  createRiddleSession,
  setupNavigationWarning
} from '@/lib/riddle-session';
import { getRiddlesBySubject, getMixedRiddles, getRandomRiddles } from '@/lib/riddle-mcq-api';
import { adaptRiddleMcq, type Riddle, type RiddleSession } from '@/types/riddles';
import { SettingsService } from '@/services/settings.service';
import type { SystemSettings } from '@/types/settings.types';
import { RiddleCard, type RiddleCardRef } from '../components/RiddleCard';
import { FloatingBackground } from '@/components/quiz/FloatingBackground';

// Auto-save interval in milliseconds
const AUTO_SAVE_INTERVAL = 10000;

// Default time limit for timer mode (seconds per riddle)
const DEFAULT_TIME_PER_RIDDLE = 30;

// Loading component — mirrors quiz/play/page.tsx loading state exactly
function PlayPageLoading(): JSX.Element {
  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-xl font-semibold text-white">Loading riddles...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function RiddlePlayPage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading...</p>
        </div>
      </div>
    }>
      <RiddlePlayPageContent />
    </Suspense>
  );
}

function RiddlePlayPageContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL params
  const chapterId = searchParams.get('chapterId') || 'all';
  const level = searchParams.get('level') || 'all';
  const mode = (searchParams.get('mode') || 'practice') as 'timer' | 'practice';
  const chapterNameParam = searchParams.get('chapterName') || '';

  // State — mirrors quiz page structure
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [chapterName, setChapterName] = useState<string>(chapterNameParam || 'Mixed Chapters');
  const [session, setSession] = useState<RiddleSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'completed'>('loading');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExtendSession, setShowExtendSession] = useState(false);
  const [additionalRiddles, setAdditionalRiddles] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Per-riddle timer for practice mode (visual only — doesn't auto-advance)
  const PRACTICE_RIDDLE_LIMIT = 60;
  const [practiceRiddleTime, setPracticeRiddleTime] = useState(PRACTICE_RIDDLE_LIMIT);

  // Refs for RiddleCard animations — mirrors quiz page
  const riddleCardRef = useRef<RiddleCardRef>(null);
  const shownBubblesRef = useRef<Set<string>>(new Set());

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
          const config = await Promise.race([settingsPromise, timeoutPromise]) as Awaited<ReturnType<typeof SettingsService.getSettings>>;
          setSettings(config);
        } catch (err) {

        }

        let fetchedRiddles: Riddle[] = [];

        if (chapterId === 'all') {
          let mixed: { level?: string; id: string; question: string; options: string[]; correctAnswer: string; chapter?: { name?: string }; chapterId?: string; explanation?: string; hint?: string }[] = [];

          if (level && level !== 'all') {
            const response = await getRandomRiddles(level, 20);
            mixed = response.map(r => ({ ...r, level: r.level || level }));
          } else {
            mixed = await getMixedRiddles(20);
          }

          fetchedRiddles = mixed.map(r => adaptRiddleMcq(r as any));
          setChapterName(level === 'all' ? 'Mixed Subjects' : `${level.charAt(0).toUpperCase() + level.slice(1)} Level Mix`);
        } else {
          // Pass level filter to backend API (more efficient than frontend filtering)
          const response = await getRiddlesBySubject(chapterId, 1, 50, level);
          fetchedRiddles = response.data.map((r: any) => adaptRiddleMcq(r as any));
          if (fetchedRiddles.length > 0 && fetchedRiddles[0]) {
            const baseName = chapterNameParam || 'Subject';
            setChapterName(level === 'all' ? baseName : `${baseName} (${level})`);
          }
        }

        // Shuffle for variety
        fetchedRiddles = [...fetchedRiddles].sort(() => Math.random() - 0.5);
        setRiddles(fetchedRiddles);

        // Check for existing session
        const existingSession = loadRiddleSession();
        if (existingSession && existingSession.status === 'in-progress' && existingSession.chapterId === chapterId) {
          setShowResumeDialog(true);
          setStatus('paused'); // Exit loading so dialog renders
        } else {
          startNewSession(fetchedRiddles);
        }
      } catch (err) {

        setError('Failed to load riddles. Check your connection and try again.');
        setStatus('playing'); // exit loading state so error UI is visible
      }
    }

    fetchRiddles();
  }, [chapterId, level, isMounted]);

  // Start new session
  const startNewSession = useCallback((riddleList: Riddle[]) => {
    clearRiddleSession();

    let totalTimeLimit = 0;
    if (mode === 'timer') {
      const timers = settings?.riddles?.defaults?.levelTimers;
      riddleList.forEach(riddle => {
        const riddleLevel = riddle.difficulty?.toLowerCase() || 'medium';
        const perRiddleTime = timers?.[riddleLevel as keyof typeof timers] || DEFAULT_TIME_PER_RIDDLE;
        totalTimeLimit += perRiddleTime;
      });
    }

    const newSession = createRiddleSession(
      mode,
      chapterId,
      chapterName,
      (level as 'all' | 'easy' | 'medium' | 'hard' | 'expert') || 'all',
      riddleList,
      totalTimeLimit
    );
    setSession(newSession);
    setAnswers({});
    setCurrentIndex(0);
    setTimeRemaining(totalTimeLimit);
    setStatus('playing');
    setShowResumeDialog(false);
  }, [mode, chapterId, chapterName, level, settings]);

  // Resume existing session
  const resumeSession = useCallback(() => {
    const existingSession = loadRiddleSession();
    if (existingSession) {
      setSession(existingSession);
      setRiddles(existingSession.riddles);
      setAnswers(existingSession.answers);
      setCurrentIndex(Object.keys(existingSession.answers).length);
      setTimeRemaining(existingSession.timeRemaining || 0);
      setChapterName(existingSession.chapterName);
      setStatus('playing');
    }
    setShowResumeDialog(false);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (status !== 'playing' || mode !== 'timer') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, mode]);

  // Toggle pause — mirrors quiz page pauseQuiz/resumeQuiz
  const togglePause = useCallback(() => {
    setStatus(prev => prev === 'playing' ? 'paused' : 'playing');
  }, []);

  // Auto-save
  useEffect(() => {
    if (status !== 'playing' || !session) return;

    const interval = setInterval(() => {
      const updatedSession: RiddleSession = {
        ...session,
        answers,
        timeRemaining: mode === 'timer' ? timeRemaining : calculateTimeTaken(),
        lastSavedAt: new Date().toISOString(),
      };
      saveRiddleSession(updatedSession);
      setLastSaved(new Date());
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [status, session, answers, timeRemaining, mode]);

  // Navigation warning
  useEffect(() => {
    if (status !== 'playing') return;
    return setupNavigationWarning(() => {
      if (!session) return null;
      return { ...session, answers, timeRemaining: mode === 'timer' ? timeRemaining : calculateTimeTaken() };
    });
  }, [status, session, answers, timeRemaining, mode]);

  const calculateTimeTaken = useCallback(() => {
    if (!session) return 0;
    return Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
  }, [session]);

  // Practice mode per-riddle countdown — resets when navigating to a new riddle
  useEffect(() => {
    if (mode === 'timer') return;
    setPracticeRiddleTime(PRACTICE_RIDDLE_LIMIT);
  }, [currentIndex, mode]);

  useEffect(() => {
    if (mode === 'timer' || status !== 'playing') return;
    const t = setInterval(() => {
      setPracticeRiddleTime(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [currentIndex, status, mode]);

  const handleAnswerSelect = useCallback((optionLetter: string) => {
    if (!session || status !== 'playing') return;
    const currentRiddle = riddles[currentIndex];
    if (!currentRiddle) return;
    setAnswers(prev => ({ ...prev, [currentRiddle.id]: optionLetter }));
  }, [session, status, riddles, currentIndex]);

  // Navigation handlers — mirrors quiz goToNext/goToPrevious
  const handleNext = useCallback(() => {
    riddleCardRef.current?.clearBubbles();
    if (currentIndex < riddles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowConfirmSubmit(true);
    }
  }, [currentIndex, riddles.length]);

  const handlePrevious = useCallback(() => {
    riddleCardRef.current?.clearBubbles();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Helper function to check if answer is correct (handles expert/open-ended normalization)
  const isAnswerCorrect = (riddle: typeof riddles[0], userAnswer: string | undefined): boolean => {
    if (!userAnswer) return false;
    const isExpert = riddle.level === 'extreme' || riddle.difficulty === 'expert';
    if (isExpert) {
      // Expert level: case-insensitive, trim whitespace
      const normalizedUser = userAnswer.toLowerCase().trim();
      const normalizedCorrect = riddle.correctAnswer?.toLowerCase().trim() || riddle.correctOption?.toLowerCase().trim() || '';
      return normalizedUser === normalizedCorrect;
    }
    // MCQ level: direct letter comparison
    return userAnswer === riddle.correctOption;
  };

  const handleSubmit = useCallback(() => {
    if (!session) return;

    let correctCount = 0;
    riddles.forEach(r => {
      if (isAnswerCorrect(r, answers[r.id])) correctCount++;
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
    saveRiddleSession(completedSession);
    setShowConfirmSubmit(false);
    router.push(`/riddle-mcq/results?session=${session.id}`);
  }, [session, answers, riddles, calculateTimeTaken, mode, timeRemaining, router]);

  const handleExtendSession = useCallback(async () => {
    try {
      setStatus('loading');
      setShowExtendSession(false);

      let newRiddles: Riddle[] = [];
      const currentIds = new Set(riddles.map(r => r.id));

      if (chapterId === 'all') {
        if (level && level !== 'all') {
          const response = await getRandomRiddles(level, additionalRiddles + 10);
          newRiddles = response.map(r => adaptRiddleMcq({ ...r, level: r.level || level } as any));
        } else {
          const response = await getMixedRiddles(additionalRiddles + 10);
          newRiddles = response.map(r => adaptRiddleMcq(r as any));
        }
      } else {
        // Pass level filter to backend API (more efficient)
        const response = await getRiddlesBySubject(chapterId, 1, 100, level);
        newRiddles = response.data.map((r: any) => adaptRiddleMcq(r as any));
      }

      const uniqueNew = newRiddles.filter(r => !currentIds.has(r.id)).slice(0, additionalRiddles);

      if (uniqueNew.length === 0) {
        alert('No more unique riddles available for this selection.');
        setStatus('playing');
        return;
      }

      if (mode === 'timer') {
        let extraTime = 0;
        const timers = settings?.riddles?.defaults?.levelTimers;
        uniqueNew.forEach(riddle => {
          const riddleLevel = riddle.difficulty?.toLowerCase() || 'medium';
          extraTime += timers?.[riddleLevel as keyof typeof timers] || DEFAULT_TIME_PER_RIDDLE;
        });
        setTimeRemaining(prev => prev + extraTime);
      }

      setRiddles(prev => [...prev, ...uniqueNew]);

      if (session) {
        const updatedSession = { ...session, riddles: [...session.riddles, ...uniqueNew] };
        setSession(updatedSession);
        saveRiddleSession(updatedSession);
      }

      setCurrentIndex(riddles.length);
      setStatus('playing');
    } catch (err) {
      console.error('Failed to extend session:', err);
      alert('Failed to load more riddles. Please try again.');
      setStatus('playing');
    }
  }, [riddles, chapterId, level, additionalRiddles, mode, settings, session]);

  // Determine back path
  const backPath = mode === 'timer' ? '/riddle-mcq/challenge' : '/riddle-mcq/practice';

  // Format time MM:SS — same as quiz page
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentRiddle = riddles[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimerMode = mode === 'timer';
  const isTimeUp = isTimerMode && timeRemaining === 0 && status === 'playing';

  // Guard: not mounted yet
  if (!isMounted) {
    return <PlayPageLoading />;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link href={backPath} className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white hover:bg-white/30">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="rounded-2xl bg-white/95 p-8 text-center shadow-lg">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Failed to Load</h1>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return <PlayPageLoading />;
  }

  // Resume dialog
  if (showResumeDialog) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Resume Session?</h2>
            <p className="text-gray-600">
              You have an unfinished riddle session. Would you like to continue where you left off?
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={resumeSession}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Resume Session
            </button>
            <button
              onClick={() => startNewSession(riddles)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main playing screen — mirrors quiz/play/page.tsx layout exactly
  return (
    <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      {/* Floating Background Emojis */}
      <FloatingBackground count={20} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col flex-1 px-4 py-2">
        <div className="mx-auto w-full max-w-5xl flex flex-col flex-1 justify-center">

          {/* Header — compact, mirrors quiz page */}
          <div className="mb-2">
            {/* Exit Button */}
            <div className="mb-1">
              <Link
                href={backPath}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit Riddles
              </Link>
            </div>

            {/* Chapter info row + Timer — mirrors quiz subject + chapter + timer row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  {chapterName}
                </span>
                {level && level !== 'all' && (
                  <span className="text-base text-white/90 capitalize">{level}</span>
                )}
              </div>

              {/* Timer Display */}
              {isTimerMode && (status === 'playing' || status === 'paused') && (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono font-bold text-sm shadow-md ${status === 'paused'
                    ? 'bg-yellow-500 text-white'
                    : timeRemaining <= 10
                      ? 'bg-red-500 text-white animate-pulse'
                      : timeRemaining <= 20
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/90 text-gray-800'
                    }`}>
                    <Timer className="h-4 w-4" />
                    <span>{formatTime(timeRemaining)}</span>
                    {status === 'paused' && <span className="ml-1 text-xs">(PAUSED)</span>}
                  </div>

                  {/* Pause/Resume Button */}
                  <button
                    onClick={togglePause}
                    className="rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
                    title={status === 'paused' ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {/* Auto-save indicator — only shown non-timer when saved */}
              {!isTimerMode && lastSaved && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-white/60">
                  <Save className="h-3 w-3" />
                  Saved
                </div>
              )}
            </div>
          </div>

          {/* Riddle Card */}
          <AnimatePresence mode="wait">
            {currentRiddle && (
              <motion.div
                key={currentRiddle.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RiddleCard
                  ref={riddleCardRef}
                  shownBubblesRef={shownBubblesRef}
                  riddle={currentRiddle}
                  riddleNumber={currentIndex + 1}
                  totalRiddles={riddles.length}
                  selectedAnswer={answers[currentRiddle.id] || null}
                  onSelectAnswer={(answer) => {
                    handleAnswerSelect(answer);
                  }}
                  showFeedback={true}
                  disabled={status !== 'playing'}
                  score={Object.entries(answers).reduce((acc, [id, ans]) => {
                    const riddle = riddles.find(r => r.id === id);
                    return acc + (riddle && ans === riddle.correctOption ? 1 : 0);
                  }, 0)}
                  maxScore={riddles.length}
                  timeUp={isTimeUp}
                  questionTimeRemaining={mode === 'timer' ? timeRemaining : practiceRiddleTime}
                  questionTimeLimit={mode === 'timer' ? Math.max(1, Math.round(timeRemaining / Math.max(1, riddles.length - currentIndex))) : PRACTICE_RIDDLE_LIMIT}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back + N / Total + Next Navigation — mirrors quiz page exactly */}
          <div className="mt-4 flex items-center justify-between gap-4 pb-4">
            <button
              onClick={() => {
                riddleCardRef.current?.clearBubbles();
                handlePrevious();
              }}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <span className="text-sm text-white/70">
              {currentIndex + 1} / {riddles.length}
            </span>

            <button
              onClick={() => {
                riddleCardRef.current?.clearBubbles();
                if (currentIndex >= riddles.length - 1) {
                  setShowConfirmSubmit(true);
                } else {
                  handleNext();
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
            >
              {currentIndex >= riddles.length - 1 ? 'Submit' : 'Next'}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

        </div>
      </div>

      {/* Confirm Submit Modal — mirrors quiz page (2 buttons: Continue + Submit) */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Submit Riddles?
            </h2>

            {answeredCount < riddles.length ? (
              <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">
                <p className="font-medium">⚠️ Not all riddles answered!</p>
                <p className="text-sm">
                  You&apos;ve answered {answeredCount} of {riddles.length} riddles.
                </p>
              </div>
            ) : (
              <p className="mb-4 text-gray-600">
                You&apos;ve answered all riddles. Ready to see your results?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  setShowExtendSession(true);
                }}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  handleSubmit();
                  setShowConfirmSubmit(false);
                }}
                className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Extend Session Modal — mirrors quiz Extend Quiz modal */}
      {showExtendSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Extend Session
            </h2>

            <div className="mb-4 space-y-3">
              <p className="text-gray-600">
                You&apos;ve answered <strong>{answeredCount}</strong> of <strong>{riddles.length}</strong> riddles.
              </p>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  Add more riddles to keep the session going!
                </p>
              </div>

              <p className="text-sm text-gray-500">
                How many additional riddles would you like to add?
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAdditionalRiddles(Math.max(1, additionalRiddles - 1))}
                  disabled={additionalRiddles <= 1}
                  className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={additionalRiddles}
                  onChange={(e) => setAdditionalRiddles(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="h-10 w-20 rounded-lg border border-gray-300 text-center font-semibold"
                />
                <button
                  onClick={() => setAdditionalRiddles(Math.min(20, additionalRiddles + 1))}
                  disabled={additionalRiddles >= 20}
                  className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <p className="text-xs text-gray-400">
                New riddles will be added without repeating any you&apos;ve already seen.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendSession(false)}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendSession}
                className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Add &amp; Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
