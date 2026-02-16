/**
 * ============================================================================
 * Random Quiz Page
 * ============================================================================
 * Random questions from all subjects
 * URL: /quiz/random
 * ============================================================================
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Shuffle, Play } from 'lucide-react';

import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizNavigation } from '@/components/quiz/QuizNavigation';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import type { Question, QuizSession } from '@/types/quiz';

const QUESTION_COUNTS = [10, 20, 50];

/** Load random questions from all subjects */
function loadRandomQuestions(count: number): Question[] {
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  
  // Flatten all questions
  let questions: Question[] = [];
  Object.values(allQuestions).forEach((subjectQuestions) => {
    questions = questions.concat(
      subjectQuestions.filter((q) => q.status === 'published')
    );
  });

  // Shuffle
  questions = questions.sort(() => Math.random() - 0.5);

  // Return requested count
  return questions.slice(0, count);
}

function RandomQuizContent(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<'config' | 'playing'>('config');
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Load questions when starting
  const startQuiz = useCallback(() => {
    const loaded = loadRandomQuestions(questionCount);
    if (loaded.length === 0) {
      alert('No questions available. Please add questions in the admin panel.');
      return;
    }
    setQuestions(loaded);
    setStep('playing');
  }, [questionCount]);

  // Handle answer selection
  const selectAnswer = useCallback((option: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  }, [questions, currentIndex]);

  // Navigation
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  // Submit quiz
  const submitQuiz = useCallback(() => {
    const score = questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);

    // Create session
    const session = {
      id: Math.random().toString(36).substr(2, 9),
      subject: 'random',
      subjectName: 'Random Quiz',
      chapter: 'Mixed',
      level: 'mixed',
      questions,
      answers,
      score,
      maxScore: questions.length,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      timeTaken: 0,
      status: 'completed' as const,
    };

    // Save to history
    const history = getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
    history.push(session);
    setItem(STORAGE_KEYS.QUIZ_HISTORY, history);

    // Redirect to results
    router.push(`/quiz/results?session=${session.id}`);
  }, [questions, answers, router]);

  // Config screen
  if (step === 'config') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/quiz"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-8 shadow-lg"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Shuffle className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Random Quiz</h1>
              <p className="text-gray-600">
                Test your knowledge with random questions from all subjects!
              </p>
            </div>

            <div className="mb-8">
              <label className="mb-3 block text-center font-semibold text-gray-700">
                How many questions?
              </label>
              <div className="flex justify-center gap-3">
                {QUESTION_COUNTS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-xl px-6 py-3 font-semibold transition-colors ${
                      questionCount === count
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 font-bold text-white transition-colors hover:bg-purple-700"
            >
              <Play className="h-5 w-5" />
              Start Random Quiz
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Playing screen
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent = currentQuestion ? !!answers[currentQuestion.id] : false;
  const answeredCount = Object.keys(answers).length;

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading...</p>
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
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Quiz
          </Link>

          <div className="rounded-lg bg-white/20 px-4 py-2 text-white">
            <span className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Random Quiz
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-xl bg-white/95 p-4 shadow-lg">
          <ProgressBar
            current={currentIndex}
            total={questions.length}
            answeredQuestions={Object.fromEntries(
              Object.keys(answers).map((_, idx) => [idx, true])
            )}
          />
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={answers[currentQuestion.id] || null}
            onSelectAnswer={selectAnswer}
          />
        </motion.div>

        {/* Navigation */}
        <div className="mt-6">
          <QuizNavigation
            canGoPrevious={currentIndex > 0}
            canGoNext={!isLastQuestion}
            isLastQuestion={isLastQuestion}
            hasAnsweredCurrent={hasAnsweredCurrent}
            answeredCount={answeredCount}
            totalQuestions={questions.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onSubmit={() => setShowConfirmSubmit(true)}
          />
        </div>

        {/* Confirm Submit */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md rounded-2xl bg-white p-6"
            >
              <h2 className="mb-4 text-xl font-bold">Submit Quiz?</h2>
              {answeredCount < questions.length && (
                <p className="mb-4 text-yellow-600">
                  You&apos;ve answered {answeredCount} of {questions.length} questions.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 rounded-lg bg-gray-200 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={submitQuiz}
                  className="flex-1 rounded-lg bg-purple-500 py-3 text-white"
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

export default function RandomQuizPage(): JSX.Element {
  return <RandomQuizContent />;
}
