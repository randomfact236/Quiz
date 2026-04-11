/**
 * ============================================================================
 * Quiz Play Page
 * ============================================================================
 * Main quiz game interface
 * URL: /quiz/play?subject=X&chapter=Y&level=Z
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Timer, Pause, Play, Plus, Minus, Zap, Link2 } from 'lucide-react';

import { useQuiz } from '@/hooks/useQuiz';
import { QuestionCard, type QuestionCardRef } from '@/components/quiz/QuestionCard';
import { FloatingBackground } from '@/components/quiz/FloatingBackground';
import { getSubjectMeta } from '@/lib/quiz-api';
import { SettingsService } from '@/services/settings.service';

// Default time limits per level (in seconds) - fallback if settings not available
const DEFAULT_TIME_LIMITS: Record<string, number> = {
  easy: 30,
  medium: 45,
  hard: 60,
  expert: 90,
  extreme: 120,
};

function QuizContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExtendQuiz, setShowExtendQuiz] = useState(false);
  const [additionalQuestions, setAdditionalQuestions] = useState(5);
  const [preQuizExtraQuestions, setPreQuizExtraQuestions] = useState(0);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectEmoji, setSubjectEmoji] = useState<string>('📚');
  const [hasStarted, setHasStarted] = useState(false);

  // Ref to control QuestionCard bubble effects
  const questionCardRef = useRef<QuestionCardRef>(null);

  // Track which questions have shown bubbles (persists across navigation)
  const shownBubblesRef = useRef<Set<string>>(new Set());

  // Get URL params
  const subject = searchParams?.get('subject') || '';
  const chapter = searchParams?.get('chapter') || '';
  const level = searchParams?.get('level') || '';
  const mode = searchParams?.get('mode') || 'normal';
  const questionParam = parseInt(searchParams?.get('question') || '0', 10) || null;
  const type = searchParams?.get('type') || '';

  // Share toast state
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Load timer settings from settings
  useEffect(() => {
    const loadTimerSettings = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const levelTimers = settings.quiz?.defaults?.levelTimers;

        if (mode === 'timer' && level) {
          // Use level-specific timer if available, otherwise fallback to default
          const levelKey = level.toLowerCase();
          const timerValue =
            levelTimers?.[levelKey as keyof typeof levelTimers] ??
            DEFAULT_TIME_LIMITS[levelKey] ??
            30;
          setTimeLimit(timerValue);
        } else {
          setTimeLimit(undefined);
        }
      } catch (error) {
        console.error('Failed to load timer settings:', error);
        // Fallback to default time limits
        if (mode === 'timer' && level) {
          setTimeLimit(DEFAULT_TIME_LIMITS[level.toLowerCase()] ?? 30);
        } else {
          setTimeLimit(undefined);
        }
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadTimerSettings();
  }, [mode, level]);

  // Load subject data from API
  useEffect(() => {
    const loadSubjectData = async () => {
      if (!subject || subject === 'all') {
        setSubjectName('All Subjects');
        setSubjectEmoji('📚');
        return;
      }
      try {
        const subjectData = await getSubjectMeta(subject);
        setSubjectName(subjectData.name);
        setSubjectEmoji(subjectData.emoji);
      } catch (error) {
        console.error('Failed to load subject data:', error);
        setSubjectName(subject);
      }
    };

    loadSubjectData();
  }, [subject]);

  // Validate params
  useEffect(() => {
    if (!subject || !chapter || !level) {
      router.push('/quiz');
    }
  }, [subject, chapter, level, router]);

  // Determine timer mode
  const isTimerMode = mode === 'timer';
  const timerMode = isTimerMode ? 'per-question' : undefined;

  // Use quiz hook
  const quiz = useQuiz(subject, chapter, level, timeLimit, timerMode, questionParam);

  // Redirect to results when completed
  useEffect(() => {
    if (quiz.status === 'completed' && quiz.sessionId) {
      router.push(`/quiz/results?session=${quiz.sessionId}`);
    }
  }, [quiz.status, quiz.sessionId, router]);

  // Sync question number to URL - only when quiz has started
  useEffect(() => {
    if (hasStarted && quiz.status === 'playing' && quiz.totalQuestions > 0) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      const currentQuestionNum = String(quiz.currentQuestionIndex + 1);
      const existingParam = params.get('question');
      if (existingParam !== currentQuestionNum) {
        params.set('question', currentQuestionNum);
        router.replace(`/quiz/play?${params.toString()}`, { scroll: false });
      }
    }
  }, [quiz.currentQuestionIndex, quiz.status, quiz.totalQuestions, hasStarted]);

  // Share handler
  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          setShareToast(
            `Link copied! Question ${quiz.currentQuestionIndex + 1} of ${quiz.totalQuestions}`
          );
          setTimeout(() => setShareToast(null), 2000);
        })
        .catch(() => {
          setShareToast('Failed to copy link');
          setTimeout(() => setShareToast(null), 2000);
        });
    }
  }, [quiz.currentQuestionIndex, quiz.totalQuestions]);

  // Get next skipped question index
  const getNextSkippedIndex = useCallback((): number | null => {
    if (quiz.manuallySkipped.size === 0) return null;
    const skippedArray = Array.from(quiz.manuallySkipped);
    const questionIds = quiz.questions.map((q) => q.id);
    const skippedIndices = skippedArray
      .map((id) => questionIds.indexOf(id))
      .filter((idx) => idx >= 0 && idx > quiz.currentQuestionIndex)
      .sort((a, b) => a - b);
    if (skippedIndices.length > 0) {
      const idx = skippedIndices[0];
      return idx !== undefined ? idx : null;
    }
    // If no skipped ahead, wrap around to first skipped
    const allSkippedIndices = skippedArray
      .map((id) => questionIds.indexOf(id))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b);
    const idx = allSkippedIndices[0];
    return idx !== undefined ? idx : null;
  }, [quiz.manuallySkipped, quiz.questions, quiz.currentQuestionIndex]);

  // Loading state
  if (quiz.status === 'loading' || isLoadingSettings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // No questions found
  if (quiz.totalQuestions === 0) {
    return (
      <div className="bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/quiz?subject=${subject}`}
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chapters
          </Link>

          <div className="rounded-2xl bg-white/95 p-8 text-center shadow-lg">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-800">No Questions Available</h1>
            <p className="mb-4 text-gray-600">
              There are no published questions for this chapter and difficulty level.
            </p>
            <Link
              href={`/quiz?subject=${subject}`}
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
            >
              Choose Another Chapter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if time is up
  const isTimeUp = isTimerMode && quiz.timeRemaining === 0 && quiz.status === 'playing';

  // Pre-quiz summary screen
  if (!hasStarted) {
    const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);
    const modeDisplay = mode === 'timer' ? 'Timer Mode' : 'Normal Mode';
    const totalAvailable = quiz.availableQuestions?.length || 0;
    const sessionSize = quiz.sessionSize || 10;
    const availableExtra = totalAvailable - sessionSize;
    const finalQuestionCount = sessionSize + preQuizExtraQuestions;

    const handleStartQuiz = () => {
      if (preQuizExtraQuestions > 0 && availableExtra > 0) {
        quiz.addMoreQuestions(preQuizExtraQuestions);
      }
      setHasStarted(true);
    };

    return (
      <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <FloatingBackground count={15} />

        <div className="relative z-10 flex flex-col flex-1 px-3 py-4">
          <div className="mx-auto w-full max-w-lg">
            {/* Back Button */}
            {(() => {
              const type = searchParams?.get('type');
              const backUrl =
                type === 'challenge' && mode === 'practice'
                  ? '/quiz/practice-mode'
                  : type === 'challenge' && mode === 'timer'
                    ? '/quiz/timer-challenge'
                    : `/quiz?subject=${subject}&chapter=${encodeURIComponent(chapter)}`;
              return (
                <Link
                  href={backUrl}
                  className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Mode Selection
                </Link>
              );
            })()}

            {/* Pre-quiz Summary Card */}
            <div className="rounded-2xl bg-white/95 p-5 shadow-2xl">
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{subjectEmoji}</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{subjectName} Quiz</h1>
                <p className="text-gray-500 text-sm">Ready to test your knowledge?</p>
              </div>

              {/* Quiz Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{finalQuestionCount}</div>
                  <div className="text-xs text-gray-600">Questions</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{levelDisplay}</div>
                  <div className="text-xs text-gray-600">Difficulty</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {mode === 'timer' ? '⏱️' : '🎯'}
                  </div>
                  <div className="text-xs text-gray-600">{modeDisplay}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{chapter}</div>
                  <div className="text-xs text-gray-600">Chapter</div>
                </div>
              </div>

              {/* Add More Questions Section */}
              {availableExtra > 0 && (
                <div className="bg-purple-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700 text-sm">Add More Questions:</span>
                    <span className="text-xs text-purple-600">{availableExtra} more available</span>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={0}
                    max={Math.min(20, availableExtra)}
                    value={preQuizExtraQuestions}
                    onChange={(e) => setPreQuizExtraQuestions(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer mb-3"
                  />

                  {/* Dropdown and +/- Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() =>
                        setPreQuizExtraQuestions(Math.max(0, preQuizExtraQuestions - 1))
                      }
                      disabled={preQuizExtraQuestions <= 0}
                      className="h-8 w-8 rounded-full bg-purple-200 text-purple-700 font-bold hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <select
                      value={preQuizExtraQuestions}
                      onChange={(e) => setPreQuizExtraQuestions(parseInt(e.target.value))}
                      className="h-8 px-3 rounded-lg border border-purple-300 bg-white text-gray-700 font-semibold text-sm cursor-pointer"
                    >
                      {Array.from({ length: Math.min(20, availableExtra) + 1 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() =>
                        setPreQuizExtraQuestions(
                          Math.min(Math.min(20, availableExtra), preQuizExtraQuestions + 1)
                        )
                      }
                      disabled={preQuizExtraQuestions >= Math.min(20, availableExtra)}
                      className="h-8 w-8 rounded-full bg-purple-200 text-purple-700 font-bold hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {preQuizExtraQuestions > 0 && (
                    <p className="text-center text-xs text-purple-600 mt-1">
                      +{preQuizExtraQuestions} extra question{preQuizExtraQuestions > 1 ? 's' : ''}{' '}
                      will be added
                    </p>
                  )}
                </div>
              )}

              {/* Mode Description */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-gray-600 text-sm text-center">
                  {mode === 'timer'
                    ? '⏱️ You have limited time to answer each question. Think fast!'
                    : '🎯 Take your time and answer each question carefully.'}
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartQuiz}
                className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all"
              >
                {preQuizExtraQuestions > 0
                  ? `🚀 Start Quiz (${finalQuestionCount} Questions)`
                  : '🚀 Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      {/* Floating Background Emojis */}
      <FloatingBackground count={20} />

      {/* Main Content - Fill available space */}
      <div className="relative z-10 flex flex-col flex-1 px-4 py-2">
        <div className="mx-auto w-full max-w-5xl flex flex-col flex-1 justify-center">
          {/* Header Section - Minimal spacing */}
          <div className="mb-2">
            {/* Exit Button */}
            <div className="mb-1">
              <Link
                href={
                  type === 'challenge' && mode === 'practice'
                    ? '/quiz/practice-mode'
                    : type === 'challenge' && mode === 'timer'
                      ? '/quiz/timer-challenge'
                      : `/quiz?subject=${subject}&chapter=${encodeURIComponent(chapter)}`
                }
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit Quiz
              </Link>
            </div>

            {/* Subject & Chapter Info with Timer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  {subjectName}
                </span>
                <span className="text-base text-white/90">{chapter}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Skipped Button */}
                {quiz.manuallySkipped.size > 0 && (
                  <button
                    onClick={() => {
                      const nextSkipped = getNextSkippedIndex();
                      if (nextSkipped !== null) {
                        quiz.jumpToQuestion(nextSkipped);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    Skipped ({quiz.manuallySkipped.size})
                  </button>
                )}

                {/* Unvisited Button - Only shown when arrived via shared link and not dismissed */}
                {quiz.startFromShare && quiz.startFromShare > 1 && !quiz.dismissedUnvisited && (
                  <button
                    onClick={quiz.dismissUnvisited}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-purple-600 transition-colors"
                  >
                    <Link2 className="h-3 w-3" />
                    Unvisited ({(quiz.startFromShare ?? 0) - 1})
                  </button>
                )}
              </div>

              {/* Timer Display */}
              {isTimerMode && (quiz.status === 'playing' || quiz.status === 'paused') && (
                <div className="flex items-center gap-2">
                  {/* Timer Clock */}
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono font-bold text-sm shadow-md ${
                      quiz.status === 'paused'
                        ? 'bg-yellow-500 text-white'
                        : quiz.timeRemaining <= 10
                          ? 'bg-red-500 text-white animate-pulse'
                          : quiz.timeRemaining <= 20
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/90 text-gray-800'
                    }`}
                  >
                    <Timer className="h-4 w-4" />
                    <span>
                      {Math.floor(quiz.timeRemaining / 60)}:
                      {(quiz.timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                    {quiz.status === 'paused' && <span className="ml-1 text-xs">(PAUSED)</span>}
                  </div>

                  {/* Pause/Resume Button */}
                  <button
                    onClick={() =>
                      quiz.status === 'paused' ? quiz.resumeQuiz() : quiz.pauseQuiz()
                    }
                    className="rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
                    title={quiz.status === 'paused' ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {quiz.status === 'paused' ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            {quiz.currentQuestion && (
              <motion.div
                key={quiz.currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <QuestionCard
                  ref={questionCardRef}
                  shownBubblesRef={shownBubblesRef}
                  question={quiz.currentQuestion}
                  questionNumber={quiz.currentQuestionIndex + 1}
                  totalQuestions={quiz.totalQuestions}
                  selectedAnswer={quiz.answers[quiz.currentQuestion.id] || null}
                  onSelectAnswer={(answer) => {
                    quiz.selectAnswer(answer);
                  }}
                  showFeedback={true}
                  disabled={quiz.status !== 'playing'}
                  subjectEmoji={subjectEmoji}
                  score={quiz.score}
                  maxScore={quiz.totalQuestions}
                  timeUp={isTimeUp}
                  onShare={handleShare}
                  {...(isTimerMode && {
                    questionTimeRemaining: quiz.timeRemaining,
                    questionTimeLimit: timeLimit ?? 60,
                  })}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation and Progress - Below Question Container */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                questionCardRef.current?.clearBubbles();
                quiz.goToPrevious();
              }}
              disabled={quiz.currentQuestionIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">
                Progress
              </span>
              <span className="text-sm font-bold text-white">
                {quiz.currentQuestionIndex + 1} / {quiz.totalQuestions}
              </span>
            </div>

            <div className="flex gap-2">
              {/* Skip Button - Shown when not answered */}
              {!quiz.hasAnsweredCurrent && (
                <button
                  onClick={() => {
                    questionCardRef.current?.clearBubbles();
                    if (quiz.currentQuestionIndex >= quiz.totalQuestions - 1) {
                      setShowConfirmSubmit(true);
                    } else {
                      quiz.handleSkip();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20 border border-white/20"
                >
                  Skip
                </button>
              )}

              {/* Next/Submit Button */}
              <button
                onClick={() => {
                  questionCardRef.current?.clearBubbles();
                  if (quiz.currentQuestionIndex >= quiz.totalQuestions - 1) {
                    setShowConfirmSubmit(true);
                  } else {
                    quiz.goToNext();
                  }
                }}
                disabled={!quiz.hasAnsweredCurrent}
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all ${
                  quiz.hasAnsweredCurrent
                    ? 'bg-white text-indigo-600 shadow-lg scale-105'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {quiz.currentQuestionIndex >= quiz.totalQuestions - 1 ? 'Submit' : 'Next'}
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-800 px-4 py-2 text-sm text-white shadow-lg"
          >
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-800">Submit Quiz?</h2>

            {quiz.answeredCount < quiz.totalQuestions ? (
              <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">
                <p className="font-medium">⚠️ Not all questions answered!</p>
                <p className="text-sm">
                  You&apos;ve answered {quiz.answeredCount} of {quiz.totalQuestions} questions.
                </p>
              </div>
            ) : (
              <p className="mb-4 text-gray-600">
                You&apos;ve answered all questions. Ready to see your results?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  setShowExtendQuiz(true);
                }}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Continue Quiz
              </button>
              <button
                onClick={() => {
                  quiz.submitQuiz();
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

      {/* Extend Quiz Modal */}
      {showExtendQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-800">Extend Quiz</h2>

            <div className="mb-4 space-y-3">
              <p className="text-gray-600">
                You&apos;ve answered <strong>{quiz.answeredCount}</strong> of{' '}
                <strong>{quiz.totalQuestions}</strong> questions.
              </p>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>{quiz.availableCount}</strong> more questions available in this level
                </p>
              </div>

              <p className="text-sm text-gray-500">
                How many additional questions would you like to add?
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAdditionalQuestions(Math.max(1, additionalQuestions - 1))}
                  disabled={additionalQuestions <= 1}
                  className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.min(20, quiz.availableCount)}
                  value={additionalQuestions}
                  onChange={(e) =>
                    setAdditionalQuestions(
                      Math.max(
                        1,
                        Math.min(Math.min(20, quiz.availableCount), parseInt(e.target.value) || 1)
                      )
                    )
                  }
                  className="h-10 w-20 rounded-lg border border-gray-300 text-center font-semibold"
                />
                <button
                  onClick={() =>
                    setAdditionalQuestions(
                      Math.min(Math.min(20, quiz.availableCount), additionalQuestions + 1)
                    )
                  }
                  disabled={additionalQuestions >= Math.min(20, quiz.availableCount)}
                  className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <p className="text-xs text-gray-400">
                New questions will be added without repeating any you&apos;ve already seen.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendQuiz(false)}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                {quiz.availableCount > 0 ? 'Cancel' : 'Close'}
              </button>
              {quiz.availableCount > 0 ? (
                <button
                  onClick={() => {
                    quiz.addMoreQuestions(additionalQuestions);
                    setShowExtendQuiz(false);
                    setTimeout(() => {
                      quiz.goToNext();
                    }, 100);
                  }}
                  disabled={additionalQuestions > quiz.availableCount}
                  className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add & Continue
                </button>
              ) : (
                <div className="flex-1 rounded-lg bg-red-50 p-2 text-center text-xs font-semibold text-red-600 border border-red-200">
                  Maximum Limit Reached
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function QuizPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-xl font-semibold text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
