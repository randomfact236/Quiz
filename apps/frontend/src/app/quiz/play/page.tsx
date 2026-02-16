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
import { ArrowLeft, Pause, Play, AlertCircle } from 'lucide-react';

import { useQuiz } from '@/hooks/useQuiz';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { QuizNavigation } from '@/components/quiz/QuizNavigation';

// Time limit in seconds (optional)
const QUIZ_TIME_LIMIT = undefined; // No time limit for now

function QuizContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Get URL params
  const subject = searchParams.get('subject') || '';
  const chapter = searchParams.get('chapter') || '';
  const level = searchParams.get('level') || '';

  // Validate params
  useEffect(() => {
    if (!subject || !chapter || !level) {
      router.push('/quiz');
    }
  }, [subject, chapter, level, router]);

  // Use quiz hook
  const quiz = useQuiz(subject, chapter, level, QUIZ_TIME_LIMIT);

  // Redirect to results when completed
  useEffect(() => {
    if (quiz.status === 'completed') {
      // Get the latest session ID from localStorage
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
      <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/quiz?subject=${subject}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Quiz
          </Link>

          {/* Pause Button */}
          <button
            onClick={() => {
              quiz.pauseQuiz();
              setShowPauseModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
        </div>

        {/* Timer (if time limit is set) */}
        {QUIZ_TIME_LIMIT && (
          <div className="mb-6">
            <QuizTimer
              timeRemaining={quiz.timeRemaining}
              totalTime={QUIZ_TIME_LIMIT}
              isRunning={quiz.status === 'playing'}
              variant="bar"
            />
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6 rounded-xl bg-white/95 p-4 shadow-lg">
          <ProgressBar
            current={quiz.currentQuestionIndex}
            total={quiz.totalQuestions}
            answeredQuestions={Object.fromEntries(
              Object.keys(quiz.answers).map((_, idx) => [idx, true])
            )}
          />
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
                totalQuestions={quiz.totalQuestions}
                selectedAnswer={quiz.answers[quiz.currentQuestion.id] || null}
                onSelectAnswer={quiz.selectAnswer}
                showFeedback={false}
                disabled={quiz.status !== 'playing'}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6">
          <QuizNavigation
            canGoPrevious={!quiz.isFirstQuestion}
            canGoNext={!quiz.isLastQuestion}
            isLastQuestion={quiz.isLastQuestion}
            hasAnsweredCurrent={quiz.hasAnsweredCurrent}
            answeredCount={quiz.answeredCount}
            totalQuestions={quiz.totalQuestions}
            onPrevious={quiz.goToPrevious}
            onNext={quiz.goToNext}
            onSubmit={() => setShowConfirmSubmit(true)}
          />
        </div>

        {/* Pause Modal */}
        {showPauseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl"
            >
              <Pause className="mx-auto mb-4 h-12 w-12 text-indigo-500" />
              <h2 className="mb-2 text-xl font-bold text-gray-800">Quiz Paused</h2>
              <p className="mb-6 text-gray-600">
                Take a breather! Your progress is saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPauseModal(false);
                    quiz.resumeQuiz();
                  }}
                  className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  <Play className="mx-auto mb-1 h-5 w-5" />
                  Resume
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
              
              {quiz.answeredCount < quiz.totalQuestions ? (
                <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">
                  <p className="font-medium">⚠️ Not all questions answered!</p>
                  <p className="text-sm">
                    You&apos;ve answered {quiz.answeredCount} of {quiz.totalQuestions} questions.
                  </p>
                </div>
              ) : (
                <p className="mb-4 text-gray-600">
                  Great job! You&apos;ve answered all questions. Ready to submit?
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    quiz.submitQuiz();
                  }}
                  className="flex-1 rounded-lg bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-600"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
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
            <p className="text-xl font-semibold text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
