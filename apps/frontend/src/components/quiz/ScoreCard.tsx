/**
 * ============================================================================
 * Score Card Component
 * ============================================================================
 * Displays quiz score summary with grade
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Target } from 'lucide-react';
import { formatTimeCompact } from '@/lib/utils';

interface ScoreCardProps {
  /** Score (number of correct answers) */
  score: number;
  /** Total number of questions */
  total: number;
  /** Percentage (0-100) */
  percentage: number;
  /** Letter grade */
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  /** Time taken in seconds */
  timeTaken: number;
}

export function ScoreCard({
  score,
  total,
  percentage,
  grade,
  timeTaken,
}: ScoreCardProps): JSX.Element {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (score === 0) {
      setDisplayScore(0);
      return;
    }

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setDisplayScore(current);
      if (current >= score) clearInterval(timer);
    }, 100);

    return () => clearInterval(timer);
  }, [score]);
  // Get grade color
  const getGradeColor = (g: string): string => {
    switch (g) {
      case 'A+':
      case 'A':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'B':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'C':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'D':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'F':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  // Get feedback message
  const getFeedbackMessage = (p: number): string => {
    if (p >= 90) return 'Outstanding! 🎉';
    if (p >= 80) return 'Great job! 👏';
    if (p >= 70) return 'Good work! 👍';
    if (p >= 60) return 'Keep practicing! 💪';
    return "Don't give up! 📚";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-white p-8 shadow-lg"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Quiz Completed!</h2>
        <p className="text-gray-600">{getFeedbackMessage(percentage)}</p>
      </div>

      {/* Grade Circle */}
      <div className="mb-8 flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 ${getGradeColor(
            grade
          )}`}
        >
          <span className="text-4xl font-bold">{grade}</span>
          <span className="text-sm">Grade</span>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Score */}
        <div className="rounded-xl bg-indigo-50 p-4 text-center">
          <Trophy className="mx-auto mb-2 h-6 w-6 text-indigo-500" />
          <p className="text-2xl font-bold text-indigo-700">
            {displayScore}/{total}
          </p>
          <p className="text-xs text-indigo-600">Correct Answers</p>
        </div>

        {/* Percentage */}
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <Target className="mx-auto mb-2 h-6 w-6 text-green-500" />
          <p className="text-2xl font-bold text-green-700">{Math.round(percentage)}%</p>
          <p className="text-xs text-green-600">Accuracy</p>
        </div>

        {/* Time */}
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-blue-500" />
          <p className="text-2xl font-bold text-blue-700">{formatTimeCompact(timeTaken)}</p>
          <p className="text-xs text-blue-600">Time Taken</p>
        </div>
      </div>
    </motion.div>
  );
}
