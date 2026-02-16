/**
 * ============================================================================
 * Quiz Navigation Component
 * ============================================================================
 * Navigation buttons for quiz (Previous, Next, Submit)
 * ============================================================================
 */

'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Flag } from 'lucide-react';

interface QuizNavigationProps {
  /** Whether user can go to previous question */
  canGoPrevious: boolean;
  /** Whether user can go to next question */
  canGoNext: boolean;
  /** Whether this is the last question */
  isLastQuestion: boolean;
  /** Whether current question is answered */
  hasAnsweredCurrent: boolean;
  /** Number of answered questions */
  answeredCount: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Callback for previous button */
  onPrevious: () => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback for submit button */
  onSubmit: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

export function QuizNavigation({
  canGoPrevious,
  canGoNext,
  isLastQuestion,
  hasAnsweredCurrent: _hasAnsweredCurrent,
  answeredCount,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
}: QuizNavigationProps): JSX.Element {
  const allAnswered = answeredCount === totalQuestions;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Previous Button */}
      <motion.button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        whileHover={canGoPrevious ? { scale: 1.02 } : {}}
        whileTap={canGoPrevious ? { scale: 0.98 } : {}}
        className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
          canGoPrevious
            ? 'bg-white text-gray-700 shadow-md hover:bg-gray-50'
            : 'cursor-not-allowed bg-gray-100 text-gray-400'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
        Previous
      </motion.button>

      {/* Progress Info */}
      <div className="hidden text-center sm:block">
        <span className="text-sm text-gray-500">
          {answeredCount} of {totalQuestions} answered
        </span>
        {!allAnswered && (
          <p className="text-xs text-yellow-600">
            {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Next / Submit Button */}
      {isLastQuestion ? (
        // Submit Button
        <motion.button
          onClick={onSubmit}
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-colors ${
            allAnswered
              ? 'bg-green-500 shadow-lg hover:bg-green-600'
              : 'bg-indigo-500 shadow-lg hover:bg-indigo-600'
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              {allAnswered ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Flag className="h-5 w-5" />
              )}
              {allAnswered ? 'Submit Quiz' : 'Submit Anyway'}
            </>
          )}
        </motion.button>
      ) : (
        // Next Button
        <motion.button
          onClick={onNext}
          disabled={!canGoNext}
          whileHover={canGoNext ? { scale: 1.02 } : {}}
          whileTap={canGoNext ? { scale: 0.98 } : {}}
          className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
            canGoNext
              ? 'bg-indigo-500 text-white shadow-md hover:bg-indigo-600'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}
