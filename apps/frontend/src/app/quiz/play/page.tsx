/**
 * ============================================================================
 * Quiz Play Page
 * ============================================================================
 * Main quiz game interface
 * URL: /quiz/play?subject=X&chapter=Y&level=Z
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { useQuiz } from '@/hooks/useQuiz';
import { QuestionCard, type QuestionCardRef } from '@/components/quiz/QuestionCard';
import { FloatingBackground } from '@/components/quiz/FloatingBackground';
import { STORAGE_KEYS, getItem } from '@/lib/storage';
import { SettingsService } from '@/services/settings.service';

// Default time limits (will be overridden by settings)
const DEFAULT_TIME_LIMITS = {
  normal: undefined, // No time limit
  timer: 30, // 30 seconds per question default
};

function QuizContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExtendQuiz, setShowExtendQuiz] = useState(false);
  const [additionalQuestions, setAdditionalQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Ref to control QuestionCard bubble effects
  const questionCardRef = useRef<QuestionCardRef>(null);
  
  // Track which questions have shown bubbles (persists across navigation)
  const shownBubblesRef = useRef<Set<number>>(new Set());

  // Get URL params
  const subject = searchParams?.get('subject') || '';
  const chapter = searchParams?.get('chapter') || '';
  const level = searchParams?.get('level') || '';
  const mode = searchParams?.get('mode') || 'normal';
  const type = searchParams?.get('type') || ''; // 'challenge' for challenge modes

  // Check if this is a challenge mode
  const isChallengeMode = type === 'challenge' || subject === 'all';

  // Load timer settings from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const defaultTimer = settings.quiz?.defaults?.timeLimit || 30;
        
        if (mode === 'timer') {
          setTimeLimit(defaultTimer);
        } else {
          setTimeLimit(undefined);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fall back to default
        setTimeLimit(mode === 'timer' ? DEFAULT_TIME_LIMITS.timer : undefined);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    loadSettings();
  }, [mode]);

  // Validate params
  useEffect(() => {
    if (!subject || !chapter || !level) {
      router.push('/quiz');
    }
  }, [subject, chapter, level, router]);

  // Determine timer mode
  const isTimerMode = mode === 'timer';
  const timerMode = isTimerMode ? 'per-question' : undefined;

  // Get subject name and emoji
  const subjects = getItem<{ slug: string; name: string; emoji: string }[]>(STORAGE_KEYS.SUBJECTS, []);
  const subjectData = subjects.find(s => s.slug === subject);
  const subjectName = isChallengeMode 
    ? 'Challenge Mode' 
    : (subjectData?.name || subject);
  const subjectEmoji = subjectData?.emoji || '📚';

  // Use quiz hook - only initialize after settings are loaded
  const quiz = useQuiz(
    subject, 
    chapter, 
    level, 
    timeLimit, 
    timerMode,
    isChallengeMode
  );

  // Redirect to results when completed
  useEffect(() => {
    if (quiz.status === 'completed') {
      const history = JSON.parse(localStorage.getItem('aiquiz:quiz-history') || '[]');
      const latestSession = history[history.length - 1];
      if (latestSession) {
        router.push(`/quiz/results?session=${latestSession.id}`);
      }
    }
  }, [quiz.status, router]);

  // Loading state
  if (quiz.status === 'loading' || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
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
            <h1 className="mb-2 text-2xl font-bold text-gray-800">
              No Questions Available
            </h1>
            <p className="mb-4 text-gray-600">
              There are no published questions for this selection.
            </p>
            <Link
              href={isChallengeMode ? '/quiz' : `/quiz?subject=${subject}`}
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
            >
              {isChallengeMode ? 'Back to Quiz' : 'Choose Another Chapter'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if time is up
  const isTimeUp = isTimerMode && quiz.timeRemaining === 0 && quiz.status === 'playing';

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
                href={isChallengeMode ? '/quiz' : `/quiz?subject=${subject}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit Quiz
              </Link>
            </div>

            {/* Subject & Chapter Info */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {subjectName}
              </span>
              <span className="text-base text-white/90">
                {isChallengeMode ? `${level === 'all' ? 'All Levels' : level}` : chapter}
              </span>
              {isTimerMode && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                  ⏱️ {quiz.timeRemaining}s
                </span>
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
                  totalQuestions={Math.min(quiz.totalQuestions, 10)}
                  selectedAnswer={quiz.answers[quiz.currentQuestion.id] || null}
                  onSelectAnswer={(answer) => {
                    quiz.selectAnswer(answer);
                    // Manual navigation - user clicks Next to advance
                  }}
                  showFeedback={true}
                  disabled={quiz.status !== 'playing'}
                  subjectEmoji={subjectEmoji}
                  score={quiz.score}
                  maxScore={Math.min(quiz.totalQuestions, 10)}
                  timeUp={isTimeUp}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Back and Next Navigation Buttons */}
          <div className="mt-4 flex items-center justify-between gap-4 pb-4">
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
            
            <span className="text-sm text-white/70">
              {quiz.currentQuestionIndex + 1} / {Math.min(quiz.totalQuestions, 10)}
            </span>
            
            <button
              onClick={() => {
                questionCardRef.current?.clearBubbles();
                if (quiz.currentQuestionIndex >= Math.min(quiz.totalQuestions, 10) - 1) {
                  setShowConfirmSubmit(true);
                } else {
                  quiz.goToNext();
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
            >
              {quiz.currentQuestionIndex >= Math.min(quiz.totalQuestions, 10) - 1 ? 'Submit' : 'Next'}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
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
              Submit Quiz?
            </h2>
            
            {quiz.answeredCount < Math.min(quiz.totalQuestions, 10) ? (
              <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">
                <p className="font-medium">⚠️ Not all questions answered!</p>
                <p className="text-sm">
                  You&apos;ve answered {quiz.answeredCount} of {Math.min(quiz.totalQuestions, 10)} questions.
                </p>
              </div>
            ) : (
              <p className="mb-4 text-gray-600">
                You&apos;ve answered all questions. Ready to see your results?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  quiz.submitQuiz();
                }}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
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
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Continue Quiz?
            </h2>
            <p className="mb-4 text-gray-600">
              Would you like to add more questions to your quiz?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Questions (1-20)
              </label>
              <input
                type="number"
                min={1}
                max={Math.min(20, quiz.availableQuestions)}
                value={additionalQuestions}
                onChange={(e) => setAdditionalQuestions(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                {quiz.availableQuestions} more questions available
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendQuiz(false)}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
              >
                No, Submit
              </button>
              <button
                onClick={() => {
                  quiz.extendQuiz(additionalQuestions);
                  setShowExtendQuiz(false);
                }}
                disabled={additionalQuestions < 1 || additionalQuestions > quiz.availableQuestions}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                Add & Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function QuizPlayPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-xl font-semibold text-white">Loading quiz...</p>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
