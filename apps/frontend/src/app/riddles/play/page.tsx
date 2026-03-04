/**
 * ============================================================================
 * Riddle Play Page (Backend Connected)
 * ============================================================================
 * Main gameplay page for riddles - fetches from backend API
 * URL: /riddles/play?chapterId=&level=&mode=
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  RotateCcw,
  Save,
  Loader2,
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
import { getRiddlesByChapter, getMixedRiddles, getRandomRiddles } from '@/lib/riddles-api';
import { adaptQuizRiddle, type Riddle, type RiddleSession } from '@/types/riddles';
import { SettingsService } from '@/services/settings.service';
import type { SystemSettings } from '@/types/settings.types';
import { RiddleCard, type RiddleCardRef } from '../components/RiddleCard';
import { FloatingBackground } from '@/components/quiz/FloatingBackground';

// Auto-save interval in milliseconds
const AUTO_SAVE_INTERVAL = 10000;

// Default time limit for timer mode (seconds per riddle)
const DEFAULT_TIME_PER_RIDDLE = 30;

// Loading component for Suspense
function PlayPageLoading(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading riddles...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function RiddlePlayPage(): JSX.Element {
  return (
    <Suspense fallback={<PlayPageLoading />}>
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

  // State
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [chapterName, setChapterName] = useState<string>('Mixed Chapters');
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

  // Refs for RiddleCard animations
  const riddleCardRef = useRef<RiddleCardRef>(null);
  const shownBubblesRef = useRef<Set<string>>(new Set());

  // Ensure component is mounted before fetching to prevent hydration mismatch/suspense hangs
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch riddles from backend
  useEffect(() => {
    if (!isMounted) return;

    async function fetchRiddles() {
      try {
        setStatus('loading');
        setError(null);

        // Fetch settings (with timeout to avoid blocking if backend is slow)
        try {
          const settingsPromise = SettingsService.getSettings();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Settings timeout')), 5000)
          );
          const config = await Promise.race([settingsPromise, timeoutPromise]) as Awaited<ReturnType<typeof SettingsService.getSettings>>;
          setSettings(config);
        } catch (err) {
          console.warn('Could not load settings, using defaults:', err);
        }

        let fetchedRiddles: Riddle[] = [];

        if (chapterId === 'all') {
          // Get mixed riddles from all chapters
          let mixed: { level?: string; id: string; question: string; options: string[]; correctAnswer: string; chapter?: { name?: string }; chapterId: string; explanation?: string; hint?: string }[] = [];

          if (level && level !== 'all') {
            // Fetch riddles filtered by level using random endpoint
            const response = await getRandomRiddles(level, 20);
            mixed = response.map(r => ({ ...r, level: r.level || level }));
          } else {
            // Get mixed riddles from all levels
            mixed = await getMixedRiddles(20);
          }

          fetchedRiddles = mixed.map(r => adaptQuizRiddle(r as any));
          setChapterName(level === 'all' ? 'Mixed Chapters' : `${level.charAt(0).toUpperCase() + level.slice(1)} Level Mix`);
        } else {
          // Get riddles for specific chapter
          const response = await getRiddlesByChapter(chapterId, 1, 50);

          // Filter by level if specified
          let filteredData = response.data;
          if (level && level !== 'all') {
            filteredData = filteredData.filter(r => r.level?.toLowerCase() === level.toLowerCase());
          }

          fetchedRiddles = filteredData.map(adaptQuizRiddle);
          if (fetchedRiddles.length > 0 && fetchedRiddles[0]) {
            const baseName = fetchedRiddles[0].chapter;
            setChapterName(level === 'all' ? baseName : `${baseName} (${level})`);
          }
        }

        // Shuffle riddles for variety
        fetchedRiddles = [...fetchedRiddles].sort(() => Math.random() - 0.5);

        setRiddles(fetchedRiddles);

        // Check for existing session
        const existingSession = loadRiddleSession();
        if (existingSession && existingSession.status === 'in-progress' && existingSession.chapterId === chapterId) {
          setShowResumeDialog(true);
          setStatus('paused'); // Exit loading state so the dialog can render
        } else {
          // Create new session
          startNewSession(fetchedRiddles);
        }
      } catch (err) {
        console.warn('Failed to fetch riddles:', err);
        setError('Failed to load riddles. Check your connection and try again.');
        setStatus('playing'); // exit loading state so error UI is visible
      }
    }

    fetchRiddles();
  }, [chapterId, level, isMounted]);

  // Start new session helper
  const startNewSession = useCallback((riddleList: Riddle[]) => {
    clearRiddleSession();

    // Calculate total time limit based on per-difficulty settings
    let totalTimeLimit = 0;
    if (mode === 'timer') {
      const timers = settings?.riddles?.defaults?.levelTimers;
      riddleList.forEach(riddle => {
        const riddleLevel = riddle.difficulty?.toLowerCase() || 'medium';
        // Use configured timer or fallback to default
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

  // Timer effect for timer mode
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

  const togglePause = useCallback(() => {
    setStatus(prev => prev === 'playing' ? 'paused' : 'playing');
  }, []);

  // Auto-save effect
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

  // Navigation warning for unsaved progress
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
    const startTime = new Date(session.startedAt).getTime();
    return Math.floor((Date.now() - startTime) / 1000);
  }, [session]);

  const handleAnswerSelect = useCallback((optionIndex: number) => {
    if (!session || status !== 'playing') return;

    const currentRiddle = riddles[currentIndex];
    if (!currentRiddle) return;

    const optionLetter = String.fromCharCode(65 + optionIndex);

    setAnswers(prev => ({
      ...prev,
      [currentRiddle.id]: optionLetter
    }));
  }, [session, status, riddles, currentIndex]);

  const handleNext = useCallback(() => {
    riddleCardRef.current?.clearBubbles();
    if (currentIndex < riddles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reached the end, show confirm submit
      setShowConfirmSubmit(true);
    }
  }, [currentIndex, riddles.length]);

  const handlePrevious = useCallback(() => {
    riddleCardRef.current?.clearBubbles();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    if (!session) return;

    setStatus('loading');

    // Calculate final correct count strictly for the completed session object
    let correctCount = 0;
    riddles.forEach((r) => {
      // Find the answer if available natively or fallback to A/B/C/D mapping
      const mappedAns = answers[r.id];
      if (mappedAns === r.correctOption) {
        correctCount++;
      }
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

    // Save final status before redirecting to ensure History loads it properly
    saveRiddleSession(completedSession);

    setShowConfirmSubmit(false);

    // Redirect to results page
    router.push(`/riddles/results?session=${session.id}`);
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
          newRiddles = response.map(r => adaptQuizRiddle({ ...r, level: r.level || level } as any));
        } else {
          const response = await getMixedRiddles(additionalRiddles + 10);
          newRiddles = response.map(r => adaptQuizRiddle(r as any));
        }
      } else {
        const response = await getRiddlesByChapter(chapterId, 1, 100);
        let filteredData = response.data;
        if (level && level !== 'all') {
          filteredData = filteredData.filter(r => r.level?.toLowerCase() === level.toLowerCase());
        }
        newRiddles = filteredData.map(adaptQuizRiddle);
      }

      // Filter out riddles we already have
      const uniqueNewRiddles = newRiddles.filter(r => !currentIds.has(r.id)).slice(0, additionalRiddles);

      if (uniqueNewRiddles.length === 0) {
        alert('No more unique riddles available for this selection.');
        setStatus('playing');
        return;
      }

      // Add time for new riddles if timer mode
      if (mode === 'timer') {
        let extraTime = 0;
        const timers = settings?.riddles?.defaults?.levelTimers;
        uniqueNewRiddles.forEach(riddle => {
          const riddleLevel = riddle.difficulty?.toLowerCase() || 'medium';
          extraTime += timers?.[riddleLevel as keyof typeof timers] || DEFAULT_TIME_PER_RIDDLE;
        });
        setTimeRemaining(prev => prev + extraTime);
      }

      setRiddles(prev => [...prev, ...uniqueNewRiddles]);

      // Update session in storage
      if (session) {
        const updatedSession = {
          ...session,
          riddles: [...session.riddles, ...uniqueNewRiddles]
        };
        setSession(updatedSession);
        saveRiddleSession(updatedSession);
      }

      setCurrentIndex(riddles.length); // Move to the first new riddle
      setStatus('playing');
    } catch (err) {
      console.error('Failed to extend session:', err);
      alert('Failed to load more riddles. Please try again.');
      setStatus('playing');
    }
  }, [riddles, chapterId, level, additionalRiddles, mode, settings, session]);

  // Determine back path based on mode
  const backPath = mode === 'timer' ? '/riddles/challenge' : '/riddles/practice';

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentRiddle = riddles[currentIndex];
  const progress = riddles.length > 0 ? ((currentIndex + 1) / riddles.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  if (!isMounted) {
    return <PlayPageLoading />;
  }

  // Prioritize error state over loading state so the spinner doesn't persist
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link href={backPath} className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="text-center py-20 bg-white/50 rounded-2xl">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return <PlayPageLoading />;
  }

  // Resume Dialog has precedence over loading state if we want to show it
  if (showResumeDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] flex items-center justify-center px-4">
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


  // Playing Screen
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      {/* Floating Background Emojis */}
      <FloatingBackground count={20} />

      <div className="relative z-10 mx-auto max-w-4xl w-full px-4 py-8 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={backPath} className="inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 hover:bg-white/60">
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>


          <div className="flex items-center gap-4">
            {mode === 'timer' && (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold shadow-sm transition-colors duration-300 ${status === 'paused' ? 'bg-yellow-500 text-white' :
                  timeRemaining <= 10 ? 'bg-red-500 text-white animate-pulse' :
                    timeRemaining <= 20 ? 'bg-orange-500 text-white' :
                      'bg-white/80 text-gray-800'
                  }`}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                  {status === 'paused' && <span className="ml-1 text-xs">(PAUSED)</span>}
                </div>

                {/* Pause/Resume Button */}
                {(status === 'playing' || status === 'paused') && (
                  <button
                    onClick={togglePause}
                    className="rounded-full bg-white/40 p-2 text-gray-800 transition-colors hover:bg-white/60 shadow-sm"
                    title={status === 'paused' ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}

            {lastSaved && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                <Save className="h-3 w-3" />
                Auto-saved
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Riddle {currentIndex + 1} of {riddles.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-white/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Riddle Card with Animations */}
        <AnimatePresence mode="wait">
          {currentRiddle && (
            <motion.div
              key={currentRiddle.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <RiddleCard
                ref={riddleCardRef}
                shownBubblesRef={shownBubblesRef}
                riddle={currentRiddle}
                riddleNumber={currentIndex + 1}
                totalRiddles={riddles.length}
                selectedAnswer={answers[currentRiddle.id] || null}
                onSelectAnswer={(answer) => {
                  handleAnswerSelect(answer.charCodeAt(0) - 65);
                }}
                showFeedback={true}
                disabled={status !== 'playing'}
                score={Object.values(answers).reduce((acc, ans, idx) => acc + (ans === riddles[idx]?.correctOption ? 1 : 0), 0)}
                maxScore={riddles.length}
                timeUp={mode === 'timer' && timeRemaining === 0}
              />
            </motion.div>
          )}
        </AnimatePresence>


        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 rounded-xl bg-white/60 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80"
          >
            Previous
          </button>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center max-w-[50%]">
            {riddles.map((riddle, idx) => (
              <button
                key={riddle.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${idx === currentIndex
                  ? 'bg-indigo-600 w-6 sm:w-8'
                  : answers[riddle.id] ? 'bg-green-400' : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentIndex >= riddles.length - 1) {
                setShowConfirmSubmit(true);
              } else {
                handleNext();
              }
            }}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            {currentIndex >= riddles.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>

        {/* Answered Progress */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          {answeredCount} of {riddles.length} riddles answered
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Submit Challenge?
            </h2>

            {answeredCount < riddles.length ? (
              <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800 border border-yellow-200">
                <p className="font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Not all riddles answered!</p>
                <p className="text-sm mt-1">
                  You&apos;ve answered {answeredCount} of {riddles.length} riddles.
                </p>
              </div>
            ) : (
              <p className="mb-4 text-gray-600">
                You&apos;ve answered all riddles. Ready to see your results?
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  setShowExtendSession(true);
                }}
                className="flex-1 rounded-xl bg-purple-100 py-3 font-semibold text-purple-700 transition-colors hover:bg-purple-200"
              >
                Extend Session
              </button>
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Extend Session Modal */}
      {showExtendSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Extend Riddle Session
            </h2>

            <div className="mb-6 space-y-4">
              <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100">
                <p className="text-sm text-indigo-800">
                  Want to keep going? You can add more random riddles to your current session.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many more riddles?
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAdditionalRiddles(Math.max(1, additionalRiddles - 1))}
                    disabled={additionalRiddles <= 1}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50 text-xl"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={additionalRiddles}
                    onChange={(e) => setAdditionalRiddles(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="h-12 flex-1 rounded-xl border border-gray-300 text-center font-bold text-lg"
                  />
                  <button
                    onClick={() => setAdditionalRiddles(Math.min(20, additionalRiddles + 1))}
                    disabled={additionalRiddles >= 20}
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50 text-xl"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">New riddles will match your current chapter and difficulty settings.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExtendSession(false);
                  setShowConfirmSubmit(true);
                }}
                className="flex-1 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleExtendSession}
                className="flex-[2] rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Add Riddles
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
