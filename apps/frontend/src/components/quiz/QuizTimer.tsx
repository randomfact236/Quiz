/**
 * ============================================================================
 * Quiz Timer Component
 * ============================================================================
 * Displays countdown timer for quiz
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';

interface QuizTimerProps {
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Total time allocated in seconds */
  totalTime: number;
  /** Whether timer is running */
  isRunning: boolean;
  /** Variant style */
  variant?: 'bar' | 'circle' | 'minimal';
}

export function QuizTimer({
  timeRemaining,
  totalTime,
  isRunning: _isRunning,
  variant = 'bar',
}: QuizTimerProps): JSX.Element {
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Calculate percentage remaining
  const percentage = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update warning states
  useEffect(() => {
    setIsWarning(timeRemaining <= 30 && timeRemaining > 10);
    setIsCritical(timeRemaining <= 10);
  }, [timeRemaining]);

  // Get color based on time remaining
  const getColorClass = (): string => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-indigo-500';
  };

  const getTextClass = (): string => {
    if (isCritical) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-gray-700';
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 font-mono text-lg font-semibold ${getTextClass()}`}>
        <Clock className="h-5 w-5" />
        {formatTime(timeRemaining)}
        {isCritical && <AlertCircle className="h-5 w-5 animate-pulse" />}
      </div>
    );
  }

  if (variant === 'circle') {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={isCritical ? '#ef4444' : isWarning ? '#eab308' : '#6366f1'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className={`absolute text-center font-mono text-sm font-bold ${getTextClass()}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
    );
  }

  // Bar variant (default)
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className={`flex items-center gap-2 font-mono text-lg font-semibold ${getTextClass()}`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeRemaining)}
        </div>
        {isCritical && (
          <span className="flex items-center gap-1 text-sm font-medium text-red-600 animate-pulse">
            <AlertCircle className="h-4 w-4" />
            Time running out!
          </span>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className={`h-full ${getColorClass()}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
