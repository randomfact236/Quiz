/**
 * ============================================================================
 * Practice Mode Page
 * ============================================================================
 * No timer, no pressure - focus on learning
 * URL: /quiz/practice?subject=X&chapter=Y
 * ============================================================================
 */

'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

import { QuestionCard } from '@/components/quiz/QuestionCard';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { STORAGE_KEYS, getItem } from '@/lib/storage';
import type { Question } from '@/types/quiz';

/** Load questions for practice */
function loadPracticeQuestions(subject: string, chapter: string): Question[] {
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  const subjectQuestions = allQuestions[subject] || [];
  
  return subjectQuestions.filter(
    (q) => q.chapter === chapter && q.status === 'published'
  );
}

/** Load missed questions from history */
function loadMissedQuestions(subject: string, chapter: string): Question[] {
  const history = getItem(STORAGE_KEYS.QUIZ_HISTORY, []);
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  const subjectQuestions = allQuestions[subject] || [];
  
  // Find questions that were answered incorrectly
  const missedIds = new Set<number>();
  history.forEach((session: { subject: string; chapter: string; questions: Question[]; answers: Record<number, string> }) => {
    if (session.subject === subject && session.chapter === chapter) {
      session.questions.forEach((q: Question) => {
        if (session.answers[q.id] !== q.correctAnswer) {
          missedIds.add(q.id);
        }
      });
    }
  });
  
  return subjectQuestions.filter(
    (q) => q.chapter === chapter && missedIds.has(q.id) && q.status === 'published'
  );
}

function PracticeContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const subject = searchParams.get('subject') || '';
  const chapter = searchParams.get('chapter') || '';
  const mode = searchParams.get('mode') || 'all'; // 'all' or 'missed'
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load questions
  useEffect(() => {
    if (!subject || !chapter) {
      router.push('/quiz');
      return;
    }

    const loaded = mode === 'missed' 
      ? loadMissedQuestions(subject, chapter)
      : loadPracticeQuestions(subject, chapter);
    
    setQuestions(loaded);
    setIsLoading(false);
  }, [subject, chapter, mode, router]);

  // Handle answer
  const handleAnswer = useCallback((option: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || answers[currentQuestion.id]) return;

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    setShowExplanation(true);
  }, [questions, currentIndex, answers]);

  // Next question
  const handleNext = useCallback(() => {
    setShowExplanation(false);
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  // Previous question
  const handlePrevious = useCallback(() => {
    setShowExplanation(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Retry
  const handleRetry = useCallback(() => {
    setAnswers({});
    setShowExplanation(false);
    setCurrentIndex(0);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
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
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-800">
              {mode === 'missed' ? 'No Missed Questions' : 'No Questions Available'}
            </h1>
            <p className="text-gray-600">
              {mode === 'missed'
                ? 'Great job! You haven\'t missed any questions in this chapter.'
                : 'There are no questions available for this chapter yet.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-white">No more questions</div>
      </div>
    );
  }
  
  const currentAnswer = answers[currentQuestion.id];
  const isCorrect = currentAnswer === currentQuestion.correctAnswer;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([id, answer]) => {
      const q = questions.find((q) => q.id === parseInt(id));
      return q && answer === q.correctAnswer;
    }
  ).length;

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
            Back
          </Link>

          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-white/20 px-4 py-2 text-white">
              <BookOpen className="mr-2 inline h-4 w-4" />
              Practice Mode
            </span>
            <span className="rounded-lg bg-white/20 px-4 py-2 text-white">
              {correctCount}/{answeredCount} Correct
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-xl bg-white/95 p-4 shadow-lg">
          <ProgressBar
            current={currentIndex}
            total={questions.length}
            answeredQuestions={Object.fromEntries(
              Object.keys(answers).map((id) => {
                const idx = questions.findIndex((q) => q.id === parseInt(id));
                return [idx, true];
              })
            )}
          />
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={currentAnswer || null}
            onSelectAnswer={handleAnswer}
            showFeedback={showExplanation}
          />
        </motion.div>

        {/* Explanation */}
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 rounded-xl bg-white p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              {isCorrect ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="font-bold text-green-600">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="font-bold text-red-600">Incorrect</span>
                </>
              )}
            </div>
            
            <p className="text-gray-700 mb-2">
              The correct answer is <strong>{currentQuestion.correctAnswer}</strong>
            </p>
            
            {currentQuestion.explanation && (
              <div className="mt-3 rounded-lg bg-blue-50 p-4 text-blue-800">
                <p className="font-semibold">Explanation:</p>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}

            {!currentQuestion.explanation && (
              <p className="mt-3 text-sm text-gray-500 italic">
                No explanation available for this question.
              </p>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-gray-700 shadow-md transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            ← Previous
          </button>

          {isLastQuestion ? (
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 rounded-xl bg-emerald-100 px-6 py-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-200"
              >
                <RotateCcw className="h-4 w-4" />
                Practice Again
              </button>
              <Link
                href={`/quiz?subject=${subject}`}
                className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
              >
                Done
              </Link>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
            >
              Next Question →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticePage(): JSX.Element {
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
      <PracticeContent />
    </Suspense>
  );
}
