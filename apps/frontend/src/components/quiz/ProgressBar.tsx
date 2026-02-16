/**
 * ============================================================================
 * Progress Bar Component
 * ============================================================================
 * Shows quiz progress with question indicators
 * ============================================================================
 */

'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  /** Current question index (0-based) */
  current: number;
  /** Total number of questions */
  total: number;
  /** Map of answered question IDs */
  answeredQuestions?: Record<number, boolean>;
  /** Callback when a question dot is clicked (optional navigation) */
  onQuestionClick?: (index: number) => void;
  /** Whether navigation is enabled */
  allowNavigation?: boolean;
}

export function ProgressBar({
  current,
  total,
  answeredQuestions = {},
  onQuestionClick,
  allowNavigation = false,
}: ProgressBarProps): JSX.Element {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question dots */}
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === current;
          const isAnswered = answeredQuestions[i];
          const isPast = i < current;

          return (
            <motion.button
              key={i}
              onClick={() => allowNavigation && onQuestionClick?.(i)}
              disabled={!allowNavigation}
              whileHover={allowNavigation ? { scale: 1.2 } : {}}
              whileTap={allowNavigation ? { scale: 0.9 } : {}}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                  : isAnswered
                    ? 'bg-green-500 text-white'
                    : isPast
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
              } ${allowNavigation ? 'cursor-pointer hover:bg-indigo-100' : 'cursor-default'}`}
            >
              {i + 1}
              
              {/* Answered indicator dot */}
              {isAnswered && !isCurrent && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-green-600 text-[8px] text-white">
                  ✓
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Progress text */}
      <div className="mt-2 text-center text-sm text-gray-500">
        Question {current + 1} of {total}
        {Object.keys(answeredQuestions).length > 0 && (
          <span className="ml-2 text-indigo-600">
            ({Object.keys(answeredQuestions).length} answered)
          </span>
        )}
      </div>
    </div>
  );
}
