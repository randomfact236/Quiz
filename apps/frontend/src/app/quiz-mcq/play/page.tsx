/**
 * ============================================================================
 * Quiz Play Page
 * ============================================================================
 * Main quiz game interface — orchestration only; UI sections live in
 * ./components/ (PreQuizSummary, GameHeader, SubmitConfirmModal,
 * ExtendSessionModal, ResumePromptModal).
 * URL: /quiz-mcq/play?subject=X&chapter=Y&level=Z
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { useQuizMcq } from '@/hooks/useQuizMcq';
import { QuestionCard, type QuestionCardRef } from '@/components/quiz-mcq/QuestionCard';
import { FloatingBackground } from '@/components/quiz-mcq/FloatingBackground';
import { getSubjectMeta } from '@/lib/quiz-mcq-api';
import { SettingsService } from '@/services/settings.service';

import { ResumePromptModal } from './components/ResumePromptModal';
import { PreQuizSummary } from './components/PreQuizSummary';
import { GameHeader } from './components/GameHeader';
import { SubmitConfirmModal } from './components/SubmitConfirmModal';
import { ExtendSessionModal } from './components/ExtendSessionModal';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get URL params first (needed for hasStarted)
  const subject = searchParams?.get('subject') || '';
  const chapter = searchParams?.get('chapter') || '';
  const level = searchParams?.get('level') || '';
  const mode = searchParams?.get('mode') || 'normal';
  const questionParam = parseInt(searchParams?.get('question') || '0', 10) || null;
  const totalParam = parseInt(searchParams?.get('total') || '0', 10) || null;
  const isSharedLink = searchParams?.get('shared') === 'true';
  const type = searchParams?.get('type') || '';

  const [hasStarted, setHasStarted] = useState(() => isSharedLink || !!questionParam);

  // Ref to control QuestionCard bubble effects
  const questionCardRef = useRef<QuestionCardRef>(null);

  // Track which questions have shown bubbles (persists across navigation)
  const shownBubblesRef = useRef<Set<string>>(new Set());

  // Share toast state
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Back/exit target shared by pre-quiz and in-game headers
  const backHref =
    type === 'challenge' && mode === 'practice'
      ? '/quiz-mcq/practice-mode'
      : type === 'challenge' && mode === 'timer'
        ? '/quiz-mcq/timer-challenge'
        : `/quiz-mcq?subject=${subject}&chapter=${encodeURIComponent(chapter)}`;

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
      router.push('/quiz-mcq');
    }
  }, [subject, chapter, level, router]);

  // Determine timer mode
  const isTimerMode = mode === 'timer';
  const timerMode = isTimerMode ? 'per-question' : undefined;

  // Use quiz hook
  const quiz = useQuizMcq(
    subject,
    chapter,
    level,
    timeLimit,
    timerMode,
    questionParam,
    totalParam,
    mode,
    type,
    isSharedLink
  );

  // Redirect to results when completed
  useEffect(() => {
    if (quiz.status === 'completed' && quiz.sessionId) {
      router.push(`/quiz-mcq/results?session=${quiz.sessionId}`);
    }
  }, [quiz.status, quiz.sessionId, router]);

  // Keyboard shortcuts: 1-4 / A-D select an option, Enter = Next/Submit.
  // Skipped while typing in the extreme input or when a modal is open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (quiz.status !== 'playing') return;
      if (showConfirmSubmit || showExtendQuiz) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (target?.isContentEditable) return;

      const isTimeUp = isTimerMode && quiz.timeRemaining === 0;
      if (isTimeUp) return;

      const optionCount =
        level === 'easy' || level === 'medium'
          ? 2
          : level === 'hard'
            ? 3
            : level === 'expert'
              ? 4
              : 0;

      const letters = ['a', 'b', 'c', 'd'];
      const key = e.key.toLowerCase();
      const letterIndex = letters.indexOf(key);
      const numberIndex = ['1', '2', '3', '4'].indexOf(key);
      const optionIndex = letterIndex >= 0 ? letterIndex : numberIndex;

      if (
        optionCount > 0 &&
        !quiz.hasAnsweredCurrent &&
        optionIndex >= 0 &&
        optionIndex < optionCount
      ) {
        e.preventDefault();
        quiz.selectAnswer(letters[optionIndex]!);
        return;
      }

      if (e.key === 'Enter' && quiz.hasAnsweredCurrent) {
        e.preventDefault();
        if (quiz.currentQuestionIndex >= quiz.totalQuestions - 1) {
          setShowConfirmSubmit(true);
        } else {
          quiz.goToNext();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    quiz.status,
    quiz.hasAnsweredCurrent,
    quiz.currentQuestionIndex,
    quiz.totalQuestions,
    quiz.timeRemaining,
    quiz.selectAnswer,
    quiz.goToNext,
    level,
    isTimerMode,
    showConfirmSubmit,
    showExtendQuiz,
  ]);

  // Sync question number to URL - only when quiz has started.
  // Uses history.replaceState directly: high-frequency updates don't need to
  // round-trip through the Next.js router (no subscriber notifications /
  // re-render churn per navigation).
  useEffect(() => {
    if (hasStarted && quiz.status === 'playing' && quiz.totalQuestions > 0) {
      const currentQuestionNum = String(quiz.currentQuestionIndex + 1);
      const url = new URL(window.location.href);
      if (url.searchParams.get('question') !== currentQuestionNum) {
        url.searchParams.set('question', currentQuestionNum);
        window.history.replaceState(null, '', url.toString());
      }
    }
  }, [quiz.currentQuestionIndex, quiz.status, quiz.totalQuestions, hasStarted]);

  // Share handler
  const handleShare = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('question', String(quiz.currentQuestionIndex + 1));
      url.searchParams.set('total', String(quiz.sessionSize));
      url.searchParams.set('shared', 'true');
      navigator.clipboard
        .writeText(url.toString())
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
  }, [quiz.currentQuestionIndex, quiz.totalQuestions, quiz.sessionSize]);

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

  // Resume prompt modal
  if (isMounted && quiz.showResumePrompt && quiz.pendingResumeState) {
    const saved = quiz.pendingResumeState;
    return (
      <ResumePromptModal
        currentQuestionIndex={saved.currentQuestionIndex}
        sessionSize={saved.sessionSize}
        answeredCount={Object.keys(saved.answers).length}
        onResume={() => {
          quiz.handleResumeSession();
          setHasStarted(true);
        }}
        onStartFresh={() => {
          quiz.handleStartFresh();
          setHasStarted(false);
        }}
      />
    );
  }

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
            href={`/quiz-mcq?subject=${subject}`}
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
              href={`/quiz-mcq?subject=${subject}`}
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

    return (
      <PreQuizSummary
        backHref={backHref}
        subjectName={subjectName}
        subjectEmoji={subjectEmoji}
        chapter={chapter}
        levelDisplay={levelDisplay}
        modeDisplay={modeDisplay}
        mode={mode}
        finalQuestionCount={finalQuestionCount}
        availableExtra={availableExtra}
        extraQuestions={preQuizExtraQuestions}
        onExtraQuestionsChange={setPreQuizExtraQuestions}
        onStart={() => {
          if (preQuizExtraQuestions > 0 && availableExtra > 0) {
            quiz.addMoreQuestions(preQuizExtraQuestions);
          }
          setHasStarted(true);
        }}
      />
    );
  }

  return (
    <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      {/* Floating Background Emojis */}
      <FloatingBackground count={20} />

      {/* Main Content - Fill available space */}
      <div className="relative z-10 flex flex-col flex-1 px-4 py-2">
        <div className="mx-auto w-full max-w-5xl flex flex-col flex-1 justify-center">
          {/* Header Section */}
          <GameHeader
            backHref={backHref}
            subjectName={subjectName}
            chapter={chapter}
            skippedCount={quiz.manuallySkipped.size}
            onJumpToSkipped={() => {
              const nextSkipped = getNextSkippedIndex();
              if (nextSkipped !== null) {
                quiz.jumpToQuestion(nextSkipped);
              }
            }}
            unvisitedCount={
              isSharedLink && quiz.startFromShare ? (quiz.startFromShare ?? 0) - 1 : null
            }
            onDismissUnvisited={quiz.dismissUnvisited}
            isTimerMode={isTimerMode}
            quizStatus={quiz.status}
            timeRemaining={quiz.timeRemaining}
            onPauseToggle={() => (quiz.status === 'paused' ? quiz.resumeQuiz() : quiz.pauseQuiz())}
          />

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
                    ? 'animate-pulse bg-white text-indigo-600 shadow-lg scale-105'
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
        <SubmitConfirmModal
          answeredCount={quiz.answeredCount}
          totalQuestions={quiz.totalQuestions}
          onCancel={() => {
            setShowConfirmSubmit(false);
            setShowExtendQuiz(true);
          }}
          onSubmit={() => {
            quiz.submitQuiz();
            setShowConfirmSubmit(false);
          }}
        />
      )}

      {/* Extend Quiz Modal */}
      {showExtendQuiz && (
        <ExtendSessionModal
          answeredCount={quiz.answeredCount}
          totalQuestions={quiz.totalQuestions}
          availableCount={quiz.availableCount}
          additionalQuestions={additionalQuestions}
          onAdditionalQuestionsChange={setAdditionalQuestions}
          onClose={() => setShowExtendQuiz(false)}
          onAddAndContinue={(count) => {
            quiz.addMoreQuestions(count);
            setShowExtendQuiz(false);
            setTimeout(() => {
              quiz.goToNext();
            }, 100);
          }}
        />
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
