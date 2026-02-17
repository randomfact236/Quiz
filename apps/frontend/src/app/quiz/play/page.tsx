/**
 * ============================================================================
 * Quiz Play Page
 * ============================================================================
 * Main quiz game interface
 * URL: /quiz/play?subject=X&chapter=Y&level=Z
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { useQuiz } from '@/hooks/useQuiz';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { FloatingBackground } from '@/components/quiz/FloatingBackground';
import { STORAGE_KEYS, getItem } from '@/lib/storage';

// Time limits based on mode (in seconds)
const TIME_LIMITS = {
  normal: undefined, // No time limit
  timer: 30, // 30 seconds per question
};

function QuizContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExtendQuiz, setShowExtendQuiz] = useState(false);
  const [additionalQuestions, setAdditionalQuestions] = useState(5);

  // Get URL params
  const subject = searchParams?.get('subject') || '';
  const chapter = searchParams?.get('chapter') || '';
  const level = searchParams?.get('level') || '';
  const mode = searchParams?.get('mode') || 'normal';

  // Validate params
  useEffect(() => {
    if (!subject || !chapter || !level) {
      router.push('/quiz');
    }
  }, [subject, chapter, level, router]);

  // Determine time limit and timer mode
  const isTimerMode = mode === 'timer';
  const timeLimit = isTimerMode ? TIME_LIMITS.timer : TIME_LIMITS.normal;
  const timerMode = isTimerMode ? 'per-question' : undefined;

  // Get subject name and emoji
  const subjects = getItem<{ slug: string; name: string; emoji: string }[]>(STORAGE_KEYS.SUBJECTS, []);
  const subjectData = subjects.find(s => s.slug === subject);
  const subjectName = subjectData?.name || subject;
  const subjectEmoji = subjectData?.emoji || '📚';

  // Use quiz hook
  const quiz = useQuiz(subject, chapter, level, timeLimit, timerMode);

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
  if (quiz.status === 'loading') {
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
                href={`/quiz?subject=${subject}`}
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
              <span className="text-base text-white/90">{chapter}</span>
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
              onClick={() => quiz.goToPrevious()}
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
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Extend Quiz
            </h2>
            
            <div className="mb-4 space-y-3">
              <p className="text-gray-600">
                You&apos;ve answered <strong>{quiz.answeredCount}</strong> of <strong>{quiz.totalQuestions}</strong> questions.
              </p>
              
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>{quiz.availableQuestions}</strong> more questions available in this level
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
                  max={Math.min(20, quiz.availableQuestions)}
                  value={additionalQuestions}
                  onChange={(e) => setAdditionalQuestions(Math.max(1, Math.min(Math.min(20, quiz.availableQuestions), parseInt(e.target.value) || 1)))}
                  className="h-10 w-20 rounded-lg border border-gray-300 text-center font-semibold"
                />
                <button
                  onClick={() => setAdditionalQuestions(Math.min(Math.min(20, quiz.availableQuestions), additionalQuestions + 1))}
                  disabled={additionalQuestions >= Math.min(20, quiz.availableQuestions)}
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
                {quiz.availableQuestions > 0 ? 'Cancel' : 'Close'}
              </button>
              {quiz.availableQuestions > 0 && (
                <button
                  onClick={() => {
                    quiz.extendQuiz(additionalQuestions);
                    setShowExtendQuiz(false);
                    // Go to next question (first new one)
                    if (quiz.currentQuestionIndex >= quiz.totalQuestions - 1) {
                      quiz.goToNext();
                    }
                  }}
                  disabled={additionalQuestions > quiz.availableQuestions}
                  className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add & Continue
                </button>
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
    <Suspense fallback={
      <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
