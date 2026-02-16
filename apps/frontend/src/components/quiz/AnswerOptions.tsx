/**
 * ============================================================================
 * Answer Options Component
 * ============================================================================
 * Displays A/B/C/D answer options with selection and feedback
 * ============================================================================
 */

'use client';

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
}

export function AnswerOptions({
  options,
  selectedKey,
  correctKey,
  onSelect,
  disabled = false,
  showFeedback = false,
}: AnswerOptionsProps): JSX.Element {
  const getOptionStyle = (key: string): string => {
    const baseStyle = 'relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ';
    
    if (showFeedback && correctKey) {
      // Feedback mode - show correct/incorrect
      if (key === correctKey) {
        // Correct answer
        return baseStyle + 'border-green-500 bg-green-50 text-green-800';
      }
      if (key === selectedKey && key !== correctKey) {
        // Wrong selection
        return baseStyle + 'border-red-500 bg-red-50 text-red-800';
      }
      // Not selected
      return baseStyle + 'border-gray-200 bg-white text-gray-500 opacity-50';
    }

    // Normal mode
    if (selectedKey === key) {
      return baseStyle + 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md';
    }
    
    return baseStyle + 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50';
  };

  const getOptionLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selectedKey === option.key;
        const isCorrect = showFeedback && correctKey === option.key;
        const isWrong = showFeedback && isSelected && correctKey !== option.key;

        return (
          <motion.button
            key={option.key}
            onClick={() => !disabled && onSelect(option.key)}
            whileHover={!disabled ? { scale: 1.01 } : {}}
            whileTap={!disabled ? { scale: 0.99 } : {}}
            disabled={disabled}
            className={getOptionStyle(option.key)}
          >
            {/* Option Letter Badge */}
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${
                isSelected
                  ? 'bg-indigo-500 text-white'
                  : isCorrect
                    ? 'bg-green-500 text-white'
                    : isWrong
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600'
              }`}
            >
              {getOptionLabel(index)}
            </span>

            {/* Option Text */}
            <span className="flex-1 text-base font-medium">{option.text}</span>

            {/* Status Icon */}
            {showFeedback && (
              <span className="shrink-0">
                {isCorrect && <span className="text-2xl text-green-500">✓</span>}
                {isWrong && <span className="text-2xl text-red-500">✗</span>}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
