/**
 * ============================================================================
 * Question Review Component
 * ============================================================================
 * Shows question with user's answer and correct answer
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { Question } from '@/types/quiz-mcq';
import { isAnswerCorrect } from '@/lib/quiz-mcq-scoring';

interface QuestionReviewProps {
  /** The question */
  question: Question;
  /** User's answer (A/B/C/D) */
  userAnswer: string;
  /** Question number */
  questionNumber: number;
}

export function QuestionReview({
  question,
  userAnswer,
  questionNumber,
}: QuestionReviewProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  const isAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer.trim() !== '';
  const isCorrect = isAnswered && isAnswerCorrect(question, userAnswer);
  const isExtreme = question.level === 'extreme';
  // MCQ: correct answer is identified by its letter (correctLetter holds the
  // text in correctAnswer, which never matches an option key).
  const correctKey = isExtreme ? null : question.correctLetter;
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 p-4 ${isCorrect ? 'border-green-200 dark:border-green-500/30 bg-green-200 dark:bg-green-500/10' : isAnswered ? 'border-red-200 dark:border-red-500/30 bg-red-200 dark:bg-red-500/10' : 'border-amber-200 dark:border-amber-500/30 bg-amber-200 dark:bg-amber-500/10'}`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3">
          {/* Question Number */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-secondary-800 text-sm font-bold text-gray-700 dark:text-secondary-200">
            {questionNumber}
          </span>

          {/* Question Preview */}
          <p className="line-clamp-1 font-medium text-gray-800 dark:text-secondary-100">
            {question.question}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Icon */}
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : isAnswered ? (
            <XCircle className="h-6 w-6 text-red-500" />
          ) : (
            <MinusCircle className="h-6 w-6 text-amber-500" />
          )}

          {/* Expand Icon */}
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-secondary-400" />
          </motion.span>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-gray-200 dark:border-secondary-700 pt-4">
              {/* Full Question */}
              <p className="mb-4 text-gray-800 dark:text-secondary-100">{question.question}</p>

              {/* Options */}
              <div className="space-y-2">
                {options.map((opt) => {
                  const isUserChoice = opt.key === userAnswer;
                  const isCorrectAnswer = opt.key === correctKey;

                  let style = 'rounded-lg border-2 p-3 ';
                  if (isCorrectAnswer) {
                    style += 'border-green-500 bg-green-100 text-green-800';
                  } else if (isUserChoice && !isCorrect) {
                    style += 'border-red-500 bg-red-100 text-red-800';
                  } else {
                    style += 'border-gray-200 bg-white text-gray-600';
                  }

                  return (
                    <div key={opt.key} className={style}>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm font-bold ${isCorrectAnswer ? 'bg-green-500 text-white' : isUserChoice && !isCorrect ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300'}`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrectAnswer && (
                          <span className="text-sm font-medium text-green-600 dark:text-green-300">
                            Correct
                          </span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="text-sm font-medium text-red-600 dark:text-red-300">
                            Your answer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extreme question - show actual answer text */}
              {isExtreme && (
                <div
                  className={`mt-4 rounded-lg border-2 p-4 ${isCorrect ? 'border-green-500 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300' : 'border-gray-300 dark:border-secondary-600 bg-gray-50 dark:bg-secondary-800 text-gray-600 dark:text-secondary-300'}`}
                >
                  <p className="text-sm font-medium">Your answer:</p>
                  <p className="text-lg">{isAnswered ? userAnswer : '(not answered)'}</p>
                  <p className="mt-2 text-sm font-medium">Correct answer:</p>
                  <p className="text-lg font-semibold">{question.correctAnswer}</p>
                </div>
              )}

              {/* Explanation (if available) */}
              {question.explanation && (
                <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 p-4 text-blue-800 dark:text-blue-300">
                  <p className="font-semibold">Explanation:</p>
                  <p className="text-sm">{question.explanation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
