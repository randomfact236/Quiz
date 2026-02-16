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
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import type { Question } from '@/types/quiz';

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

  const isCorrect = userAnswer === question.correctAnswer;
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
      className={`rounded-xl border-2 p-4 ${
        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3">
          {/* Question Number */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700">
            {questionNumber}
          </span>

          {/* Question Preview */}
          <p className="line-clamp-1 font-medium text-gray-800">
            {question.question}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Icon */}
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}

          {/* Expand Icon */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-gray-400" />
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
            <div className="mt-4 border-t border-gray-200 pt-4">
              {/* Full Question */}
              <p className="mb-4 text-gray-800">{question.question}</p>

              {/* Options */}
              <div className="space-y-2">
                {options.map((opt) => {
                  const isUserChoice = opt.key === userAnswer;
                  const isCorrectAnswer = opt.key === question.correctAnswer;

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
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm font-bold ${
                            isCorrectAnswer
                              ? 'bg-green-500 text-white'
                              : isUserChoice && !isCorrect
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrectAnswer && (
                          <span className="text-sm font-medium text-green-600">
                            Correct
                          </span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="text-sm font-medium text-red-600">
                            Your answer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation (if available) */}
              {question.explanation && (
                <div className="mt-4 rounded-lg bg-blue-50 p-4 text-blue-800">
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
