/**
 * ============================================================================
 * Answer Options Component
 * ============================================================================
 * Displays answer options based on difficulty level:
 * - Easy: stored options when authored, else True/False fallback
 * - Medium: 2 options
 * - Hard: 3 options
 * - Expert: 4 options
 * - Extreme: No options (text input)
 * Style: Lightly visible by default, with instant feedback
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AnswerOptionsProps {
  /** Option key (A, B, C, D) */
  options: { key: string; text: string }[];
  /** Currently selected option key */
  selectedKey: string | null;
  /** Correct answer key (for feedback mode) */
  correctKey?: string;
  /** Callback when option is selected */
  onSelect: (key: string) => void;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Whether to show correct/incorrect feedback */
  showFeedback?: boolean;
  /** Difficulty level to determine number of options */
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
}

/** Fallback pair for easy questions authored without stored options */
const TRUE_FALSE_OPTIONS = [
  { key: 'A', text: 'True' },
  { key: 'B', text: 'False' },
];

export function AnswerOptions({
  options,
  selectedKey,
  correctKey,
  onSelect,
  disabled = false,
  showFeedback = false,
  level,
}: AnswerOptionsProps): JSX.Element {
  const [extremeAnswer, setExtremeAnswer] = useState('');

  const getOptionStyle = (key: string, hasSelection: boolean): string => {
    const baseStyle =
      'relative flex items-center justify-center rounded-xl border-2 py-3 px-4 text-center text-base font-medium transition-all duration-200 w-full ';

    // If selection made, show feedback colors
    if (hasSelection && showFeedback && correctKey) {
      if (key === correctKey) {
        // Correct answer - green
        return baseStyle + 'border-green-500 bg-green-50 text-green-800';
      }
      if (key === selectedKey && key !== correctKey) {
        // Wrong selection - red
        return baseStyle + 'border-red-500 bg-red-50 text-red-800';
      }
      // Locked affordance: unselected options dim further once an answer is in
      return baseStyle + 'border-gray-200 bg-gray-50 text-gray-400 opacity-40';
    }

    // No selection yet - lightly visible
    if (selectedKey === key) {
      return baseStyle + 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-md';
    }

    // Default lightly visible state
    return (
      baseStyle +
      'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
    );
  };

  // Get options based on difficulty level
  const getOptionsForLevel = () => {
    // Easy: prefer the stored options when the question actually has them;
    // fall back to True/False only for legacy questions authored blank.
    const hasStoredOptions = options
      .slice(0, 2)
      .every((option) => option.text && option.text.trim().length > 0);

    switch (level) {
      case 'easy':
        return hasStoredOptions ? options.slice(0, 2) : TRUE_FALSE_OPTIONS;
      case 'medium':
        // 2 options
        return options.slice(0, 2);
      case 'hard':
        // 3 options
        return options.slice(0, 3);
      case 'expert':
        // 4 options (all)
        return options;
      case 'extreme':
        // No options - handled separately
        return [];
      default:
        return options;
    }
  };

  const displayOptions = getOptionsForLevel();
  const hasSelection = selectedKey !== null;

  // Get grid columns based on number of options
  const getGridClass = () => {
    const count = displayOptions.length;
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1';
  };

  // Extreme mode - text input with explicit submit.
  // The answer only locks on the Submit button / Enter key — typing alone
  // never fires onSelect, so a half-typed answer can't be scored by a timer.
  if (level === 'extreme') {
    const submitted = hasSelection;
    const canSubmit = extremeAnswer.trim().length > 0 && !submitted && !disabled;

    const submitExtremeAnswer = () => {
      if (!canSubmit) return;
      onSelect(extremeAnswer.trim());
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
          <label
            htmlFor="extreme-answer-input"
            className="mb-2 block text-sm font-medium text-gray-600"
          >
            Type your answer:
          </label>
          <input
            id="extreme-answer-input"
            type="text"
            value={submitted ? (selectedKey ?? '') : extremeAnswer}
            onChange={(e) => setExtremeAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitExtremeAnswer();
              }
            }}
            disabled={disabled || submitted}
            placeholder="Enter your answer here..."
            aria-label="Type your answer"
            className="w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-lg focus:border-indigo-400 focus:outline-none disabled:bg-gray-100"
          />
          {!submitted && (
            <button
              onClick={submitExtremeAnswer}
              disabled={!canSubmit}
              className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Submit Answer
            </button>
          )}
        </div>
        {showFeedback && submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
            role="status"
            aria-live="polite"
          >
            <span className="text-sm text-gray-500">Correct answer: {correctKey || 'N/A'}</span>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${getGridClass()}`} role="radiogroup" aria-label="Answer choices">
      {displayOptions.map((option) => {
        const isSelected = selectedKey === option.key;
        const isCorrect = showFeedback && correctKey === option.key;
        const isWrong = showFeedback && isSelected && correctKey !== option.key;

        return (
          <motion.button
            key={option.key}
            onClick={() => !disabled && !hasSelection && onSelect(option.key)}
            whileHover={!disabled && !hasSelection ? { scale: 1.02 } : {}}
            whileTap={!disabled && !hasSelection ? { scale: 0.98 } : {}}
            disabled={disabled || hasSelection}
            role="radio"
            aria-checked={isSelected}
            className={getOptionStyle(option.key, hasSelection)}
          >
            {/* Option Text */}
            <span className="text-lg font-medium">{option.text}</span>

            {/* Status Icon for Feedback */}
            {showFeedback && hasSelection && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                {isCorrect && <span className="text-2xl text-green-600">✓</span>}
                {isWrong && <span className="text-2xl text-red-500">✕</span>}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
