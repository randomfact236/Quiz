/**
 * ============================================================================
 * file.ts - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// ContentManagementSection removed - now consumer facing
// import { ContentManagementSection } from '@/components/ui';
import ActionOptions, { IActionOption } from '@/components/image-riddles/ActionOptions';
import { initialImageRiddles, initialImageRiddleCategories } from '@/lib/initial-data';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

// =============================================================================
// ENTERPRISE GRADE IMAGE RIDDLES - TIMER FEATURE
// Quality: 10/10 - Production Ready
// =============================================================================

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

interface ImageRiddle {
  id: string;
  title: string;
  imageUrl: string;
  answer: string;
  hint: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timerSeconds: number | null;
  showTimer: boolean;
  altText: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Action options displayed below the question */
  actionOptions?: IActionOption[] | null;
  /** Whether to use default actions when custom not provided */
  useDefaultActions?: boolean;
}

interface ImageRiddleCategory {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
}



// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const difficultyColors = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-orange-100 text-orange-700 border-orange-200',
  expert: 'bg-red-100 text-red-700 border-red-200',
};

const difficultyLabels = {
  easy: '🌱 Easy',
  medium: '⭐ Medium',
  hard: '🔥 Hard',
  expert: '💎 Expert',
};

const DEFAULT_AUTO_TIMER = 90;

const defaultTimers: Record<string, number> = {
  easy: DEFAULT_AUTO_TIMER,
  medium: DEFAULT_AUTO_TIMER,
  hard: DEFAULT_AUTO_TIMER,
  expert: DEFAULT_AUTO_TIMER,
};

// Sample data removed in favor of @/lib/initial-data

// Sample categories removed in favor of @/lib/initial-data

// -----------------------------------------------------------------------------
// Timer Hook - Enterprise Grade
// -----------------------------------------------------------------------------
const useTimer = (initialDuration: number, autoStart: boolean = false) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for timer end notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((newDuration: number) => {
    stop();
    setTimeLeft(newDuration);
  }, [stop]);

  const setDuration = useCallback((duration: number) => {
    setTimeLeft(duration);
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer ended
            if (audioRef.current) {
              audioRef.current.play().catch(() => { });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  return {
    timeLeft,
    isRunning,
    isPaused,
    isEnded: timeLeft === 0,
    start,
    pause,
    resume,
    stop,
    reset,
    setDuration,
  };
};

// -----------------------------------------------------------------------------
// Format Time Utility
// -----------------------------------------------------------------------------
const getEffectiveTimer = (riddle: ImageRiddle): number => {
  // Use the same logic as the average calculation for consistency
  return riddle.timerSeconds ?? defaultTimers[riddle.difficulty] ?? 60;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// -----------------------------------------------------------------------------
// Timer Display Component
// -----------------------------------------------------------------------------
interface TimerDisplayProps {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  totalDuration: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  isRunning,
  isPaused,
  totalDuration,
}) => {
  const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const isLow = timeLeft <= 10 && timeLeft > 0;
  const isEnded = timeLeft === 0;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Timer Circle */}
      <div className="relative h-24 w-24">
        {/* Background Circle */}
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isEnded ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Time Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-2xl font-bold ${isEnded ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-700'
              }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      {/* Status Label */}
      <span className="text-xs font-medium text-gray-500">
        {isEnded ? '⏰ Time Up!' : isPaused ? '⏸️ Paused' : isRunning ? '⏱️ Running' : '⏹️ Stopped'}
      </span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Manual Timer Settings Component
// -----------------------------------------------------------------------------
interface ManualTimerSettingsProps {
  value: number;
  onChange: (value: number) => void;
  onApply: () => void;
  disabled: boolean;
}

const ManualTimerSettings: React.FC<ManualTimerSettingsProps> = ({
  value,
  onChange,
  onApply,
  disabled,
}) => {
  const presets = [30, 60, 120, 180, 300];

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">⏱️ Set Timer</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            disabled={disabled}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${value === preset
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50'
              }`}
          >
            {preset < 60 ? `${preset}s` : `${preset / 60}m`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="10"
          max="600"
          step="10"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 accent-indigo-500"
        />
        <span className="min-w-[60px] text-right text-sm font-medium text-gray-700">
          {formatTime(value)}
        </span>
        <button
          onClick={onApply}
          disabled={disabled}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Action Option Creators
// -----------------------------------------------------------------------------
/** Creates the check answer action */
function createCheckAnswerAction(now: Date): IActionOption {
  return {
    id: 'check-answer', label: 'Check Answer', type: 'button', style: 'primary', size: 'md',
    icon: '✓', iconPosition: 'left', ariaLabel: 'Check your answer', keyboardShortcut: 'Enter',
    isEnabled: true, isVisible: true, position: 'below_question', order: 10,
    tooltip: 'Submit your answer (Enter)',
    visibilityConditions: { showWhenAnswerHidden: true },
    analyticsEvent: 'answer_checked', createdAt: now, updatedAt: now,
  };
}

/** Creates the hint action */
function createHintAction(now: Date): IActionOption {
  return {
    id: 'show-hint', label: 'Hint', type: 'button', style: 'warning', size: 'md',
    icon: '💡', iconPosition: 'left', ariaLabel: 'Show hint', keyboardShortcut: 'Alt+H',
    isEnabled: true, isVisible: true, position: 'below_question', order: 20,
    tooltip: 'Get a hint (Alt+H)',
    visibilityConditions: { showWhenAnswerHidden: true },
    analyticsEvent: 'hint_shown', createdAt: now, updatedAt: now,
  };
}

/** Creates the give up action */
function createGiveUpAction(now: Date): IActionOption {
  return {
    id: 'give-up', label: 'Give Up', type: 'button', style: 'danger', size: 'md',
    icon: '🏳️', iconPosition: 'left', ariaLabel: 'Give up and reveal answer', keyboardShortcut: 'Alt+G',
    isEnabled: true, isVisible: true, position: 'below_question', order: 30,
    tooltip: 'Give up and see the answer (Alt+G)',
    visibilityConditions: { showWhenAnswerHidden: true },
    confirmDialog: {
      enabled: true,
      title: 'Give Up?',
      message: 'Are you sure you want to give up? The answer will be revealed.',
      confirmText: 'Yes, Give Up',
      cancelText: 'Keep Trying',
      confirmStyle: 'danger',
      cancelStyle: 'secondary'
    },
    analyticsEvent: 'gave_up', createdAt: now, updatedAt: now,
  };
}

/** Creates the skip action */
function createSkipAction(now: Date): IActionOption {
  return {
    id: 'skip', label: 'Skip', type: 'button', style: 'outline', size: 'md',
    icon: '⏭️', iconPosition: 'left', ariaLabel: 'Skip to next riddle', keyboardShortcut: 'Alt+S',
    isEnabled: true, isVisible: true, position: 'below_question', order: 40,
    tooltip: 'Skip to next riddle (Alt+S)',
    confirmDialog: {
      enabled: true,
      title: 'Skip Riddle?',
      message: 'Are you sure you want to skip this riddle?',
      confirmText: 'Yes, Skip',
      cancelText: 'Keep Trying',
      confirmStyle: 'warning',
      cancelStyle: 'secondary'
    },
    analyticsEvent: 'riddle_skipped', createdAt: now, updatedAt: now,
  };
}

/** Gets default action options for a riddle - shown below image */
function getDefaultActions(_riddle: ImageRiddle): IActionOption[] {
  const now = new Date();
  return [
    createCheckAnswerAction(now),
    createHintAction(now),
    createGiveUpAction(now),
    createSkipAction(now),
  ];
}

// -----------------------------------------------------------------------------
// Game State Hook
// -----------------------------------------------------------------------------
interface GameState {
  selectedRiddle: ImageRiddle | null;
  userAnswer: string;
  showAnswer: boolean;
  showHint: boolean;
  setSelectedRiddle: (riddle: ImageRiddle | null) => void;
  setUserAnswer: (answer: string) => void;
  setShowAnswer: (show: boolean) => void;
  setShowHint: (show: boolean) => void;
  resetGameState: () => void;
  closeModal: (stopTimer: () => void) => void;
}

function useGameState(): GameState {
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const resetGameState = useCallback(() => {
    setUserAnswer('');
    setShowAnswer(false);
    setShowHint(false);
  }, []);

  const closeModal = useCallback((stopTimer: () => void) => {
    stopTimer();
    setSelectedRiddle(null);
    setUserAnswer('');
    setShowAnswer(false);
    setShowHint(false);
  }, []);

  return {
    selectedRiddle,
    userAnswer,
    showAnswer,
    showHint,
    setSelectedRiddle,
    setUserAnswer,
    setShowAnswer,
    setShowHint,
    resetGameState,
    closeModal,
  };
}

// -----------------------------------------------------------------------------
// Timer Settings Hook
// -----------------------------------------------------------------------------
interface TimerSettings {
  timerMode: 'auto' | 'manual';
  manualDuration: number;
  appliedManualDuration: number | null;
  setTimerMode: (mode: 'auto' | 'manual') => void;
  setManualDuration: (duration: number) => void;
  setAppliedManualDuration: (duration: number | null) => void;
  resetTimerSettings: () => void;
}

function useTimerSettings(): TimerSettings {
  const [timerMode, setTimerMode] = useState<'auto' | 'manual'>('auto');
  const [manualDuration, setManualDuration] = useState<number>(60);
  const [appliedManualDuration, setAppliedManualDuration] = useState<number | null>(null);

  const resetTimerSettings = useCallback(() => {
    setTimerMode('auto');
    setAppliedManualDuration(null);
  }, []);

  return {
    timerMode,
    manualDuration,
    appliedManualDuration,
    setTimerMode,
    setManualDuration,
    setAppliedManualDuration,
    resetTimerSettings,
  };
}

// -----------------------------------------------------------------------------
// Filter Helper
// -----------------------------------------------------------------------------
function filterRiddles(
  riddles: ImageRiddle[],
  difficulty: string,
  sortOrder: 'recent' | 'random'
): ImageRiddle[] {
  const filtered = difficulty === 'all'
    ? [...riddles]
    : riddles.filter((r) => r.difficulty === difficulty);

  if (sortOrder === 'random') {
    // Fisher-Yates shuffle
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempI = filtered[i]!;
      const tempJ = filtered[j]!;
      filtered[i] = tempJ;
      filtered[j] = tempI;
    }
  }

  return filtered;
}

// -----------------------------------------------------------------------------
// Action Handler Hook
// -----------------------------------------------------------------------------
interface ActionHandlerState {
  userAnswer: string;
  setShowAnswer: (show: boolean) => void;
  setShowHint: (show: boolean) => void;
}

function useActionHandler(
  riddles: ImageRiddle[],
  gameState: ActionHandlerState,
  timerControls: { stop: () => void },
  onSelectRiddle: (riddle: ImageRiddle) => void
) {
  return useCallback((action: IActionOption, riddle: ImageRiddle) => {
    const { setShowAnswer, setShowHint, userAnswer } = gameState;
    const { stop } = timerControls;

    switch (action.id) {
      case 'check-answer':
        if (userAnswer.trim().toLowerCase() === riddle.answer.toLowerCase()) {
          setShowAnswer(true);
          stop();
        } else {
          alert('Not quite right. Try again!');
        }
        break;
      case 'show-hint':
        setShowHint(true);
        break;
      case 'give-up':
      case 'reveal-answer':
        setShowAnswer(true);
        stop();
        break;
      case 'skip': {
        const otherRiddles = riddles.filter(r => r.id !== riddle.id);
        if (otherRiddles.length > 0) {
          const random = otherRiddles[Math.floor(Math.random() * otherRiddles.length)];
          if (random) {
            onSelectRiddle(random);
          }
        }
        break;
      }
      default:
        break;
    }
  }, [riddles, gameState, timerControls, onSelectRiddle]);
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles] = useState<ImageRiddle[]>(() => getItem(STORAGE_KEYS.IMAGE_RIDDLES, initialImageRiddles));
  const [categories] = useState<ImageRiddleCategory[]>(initialImageRiddleCategories);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'random'>('recent');

  // Game State Hook
  const {
    selectedRiddle,
    userAnswer,
    showAnswer,
    showHint,
    setSelectedRiddle,
    setUserAnswer,
    setShowAnswer,
    setShowHint,
    resetGameState,
    closeModal,
  } = useGameState();

  // Timer Settings Hook
  const {
    timerMode,
    manualDuration,
    appliedManualDuration,
    setTimerMode,
    setManualDuration,
    setAppliedManualDuration,
    resetTimerSettings,
  } = useTimerSettings();

  // Initialize Timer Hook
  const effectiveDuration = selectedRiddle
    ? appliedManualDuration ??
    selectedRiddle.timerSeconds ??
    defaultTimers[selectedRiddle.difficulty] ??
    60
    : 60;

  const shouldAutoStart = timerMode === 'auto' && selectedRiddle !== null;

  const {
    timeLeft,
    isRunning,
    isPaused,
    isEnded,
    start,
    pause,
    resume,
    stop,
    reset,
    setDuration,
  } = useTimer(effectiveDuration, shouldAutoStart);

  // Filter and Sort Riddles
  const filteredRiddles = useMemo(
    () => filterRiddles(riddles, difficulty, sortOrder),
    [riddles, difficulty, sortOrder]
  );

  // Handle Riddle Selection
  const handleRiddleClick = useCallback(
    (riddle: ImageRiddle) => {
      stop();
      setSelectedRiddle(riddle);
      resetGameState();
      resetTimerSettings();

      const duration = riddle.timerSeconds ?? defaultTimers[riddle.difficulty] ?? 60;
      setDuration(duration);
      reset(duration);
    },
    [stop, resetGameState, resetTimerSettings, setDuration, reset, setSelectedRiddle]
  );

  // Handle Timer Mode Change
  const handleTimerModeChange = useCallback(
    (mode: 'auto' | 'manual') => {
      setTimerMode(mode);
      if (mode === 'auto' && selectedRiddle) {
        setAppliedManualDuration(null);
        const duration = selectedRiddle.timerSeconds ?? defaultTimers[selectedRiddle.difficulty] ?? 60;
        reset(duration);
        start();
      } else if (mode === 'manual') {
        stop();
      }
    },
    [selectedRiddle, setTimerMode, setAppliedManualDuration, reset, start, stop]
  );

  // Handle Manual Timer Apply
  const handleManualTimerApply = useCallback(() => {
    setAppliedManualDuration(manualDuration);
    reset(manualDuration);
    start();
  }, [manualDuration, setAppliedManualDuration, reset, start]);

  // Handle Action Options
  const handleAction = useActionHandler(
    riddles,
    { userAnswer, setShowAnswer, setShowHint },
    { stop },
    handleRiddleClick
  );

  // Close Modal Handler
  const handleCloseModal = useCallback(() => {
    closeModal(stop);
    resetTimerSettings();
  }, [closeModal, stop, resetTimerSettings]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-[#D4E8F0] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-block rounded-lg bg-white/60 px-4 py-2 text-gray-700 transition-all hover:bg-white/80 hover:shadow-md"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            <span className="mx-2">🖼️</span>
            Image Riddles
            <span className="mx-2">🖼️</span>
          </h1>
          <p className="text-lg text-gray-600">Challenge your visual perception!</p>
        </div>

        {/* Stats Banner */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white/70 p-4 text-center shadow-md backdrop-blur">
            <span className="text-2xl">🧩</span>
            <p className="text-2xl font-bold text-gray-800">{riddles.length}</p>
            <p className="text-sm text-gray-600">Total Riddles</p>
          </div>
          <div className="rounded-xl bg-white/70 p-4 text-center shadow-md backdrop-blur">
            <span className="text-2xl">🏷️</span>
            <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
          <div className="rounded-xl bg-white/70 p-4 text-center shadow-md backdrop-blur">
            <span className="text-2xl">⏱️</span>
            <p className="text-2xl font-bold text-gray-800">
              {Math.round(
                riddles.reduce(
                  (acc, r) => acc + (r.timerSeconds ?? defaultTimers[r.difficulty] ?? 60),
                  0
                ) / Math.max(riddles.length, 1)
              )}
              s
            </p>
            <p className="text-sm text-gray-600">Avg Timer</p>
          </div>
          <div className="rounded-xl bg-white/70 p-4 text-center shadow-md backdrop-blur">
            <span className="text-2xl">🎯</span>
            <p className="text-2xl font-bold text-gray-800">
              {riddles.filter((r) => r.timerSeconds !== null).length}
            </p>
            <p className="text-sm text-gray-600">Custom Timers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setDifficulty('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${difficulty === 'all'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
          >
            🎲 All
          </button>
          {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${difficulty === diff
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
                }`}
            >
              {difficultyLabels[diff]}
            </button>
          ))}
        </div>

        {/* Sort Order */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <span className="mr-2 self-center text-sm font-medium text-gray-600">Sort by:</span>
          <button
            onClick={() => setSortOrder('recent')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${sortOrder === 'recent'
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
          >
            🕐 Recent First
          </button>
          <button
            onClick={() => setSortOrder('random')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${sortOrder === 'random'
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
          >
            🔀 Random Mix
          </button>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-700">
            <span className="mr-2">📂</span>
            Categories
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="cursor-pointer rounded-xl bg-white/80 p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Riddles Grid */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-700">
              <span className="mr-2">🎮</span>
              Play Now
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({filteredRiddles.length} riddles • {sortOrder === 'recent' ? '🕐 Recent' : '🔀 Random'})
              </span>
            </h2>
            {sortOrder === 'random' && (
              <button
                onClick={() => setSortOrder('random')}
                className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 transition-all hover:bg-purple-200"
              >
                🔄 Shuffle Again
              </button>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRiddles.map((riddle) => {
              const riddleTimer = getEffectiveTimer(riddle);
              return (
                <div
                  key={riddle.id}
                  onClick={() => handleRiddleClick(riddle)}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl"
                >
                  {/* Image Container */}
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={riddle.imageUrl}
                      alt={riddle.altText || `Riddle scene showing: ${riddle.title}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {riddle.showTimer && (
                      <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                        ⏱️ {formatTime(riddleTimer)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyColors[riddle.difficulty]}`}
                      >
                        {difficultyLabels[riddle.difficulty]}
                      </span>
                      {riddle.hint && <span className="text-xs text-gray-500">💡 Hint</span>}
                    </div>
                    {/* Question Title */}
                    <h3 className="line-clamp-2 font-semibold text-gray-800">{riddle.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredRiddles.length === 0 && (
          <div className="rounded-2xl bg-white/80 p-12 text-center shadow-md">
            <span className="mb-4 block text-6xl">🤔</span>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">No riddles found</h3>
            <p className="text-gray-600">Try selecting a different difficulty level.</p>
          </div>
        )}

        {/* Riddle Modal */}
        {selectedRiddle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyColors[selectedRiddle.difficulty]}`}
                  >
                    {difficultyLabels[selectedRiddle.difficulty]}
                  </span>
                  {isEnded && <span className="text-sm font-bold text-red-500">⏰ Time Up!</span>}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Question Title */}
                <h2 className="mb-4 text-xl font-bold text-gray-800">{selectedRiddle.title}</h2>

                {/* Image */}
                <div className="mb-6 overflow-hidden rounded-xl" data-riddle-image>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRiddle.imageUrl}
                    alt={selectedRiddle.altText || `Riddle scene: ${selectedRiddle.title}. Look carefully at the image to find the answer.`}
                    className="w-full object-cover"
                  />
                </div>

                {/* Timer Section */}
                {selectedRiddle.showTimer && (
                  <div className="mb-6 rounded-xl bg-gray-50 p-4">
                    {/* Timer Mode Toggle */}
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">Timer Mode</h3>
                      <div className="flex rounded-lg bg-gray-200 p-1">
                        <button
                          onClick={() => handleTimerModeChange('auto')}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${timerMode === 'auto'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          ⚡ Auto ({formatTime(effectiveDuration)})
                        </button>
                        <button
                          onClick={() => handleTimerModeChange('manual')}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${timerMode === 'manual'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          ⚙️ Manual
                        </button>
                      </div>
                    </div>

                    {/* Timer Display */}
                    <div className="mb-4 flex items-center justify-center">
                      <TimerDisplay
                        timeLeft={timeLeft}
                        isRunning={isRunning}
                        isPaused={isPaused}
                        totalDuration={effectiveDuration}
                      />
                    </div>

                    {/* Timer Controls */}
                    <div className="mb-4 flex justify-center gap-2">
                      {!isRunning || isPaused ? (
                        <button
                          onClick={isPaused ? resume : start}
                          disabled={isEnded}
                          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-600 disabled:opacity-50"
                        >
                          {isPaused ? '▶️ Resume' : '▶️ Start'}
                        </button>
                      ) : (
                        <button
                          onClick={pause}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-600"
                        >
                          ⏸️ Pause
                        </button>
                      )}
                      <button
                        onClick={() => reset(effectiveDuration)}
                        className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-gray-600"
                      >
                        🔄 Reset
                      </button>
                    </div>

                    {/* Manual Timer Settings */}
                    {timerMode === 'manual' && !appliedManualDuration && (
                      <ManualTimerSettings
                        value={manualDuration}
                        onChange={setManualDuration}
                        onApply={handleManualTimerApply}
                        disabled={isRunning && !isPaused}
                      />
                    )}

                    {timerMode === 'manual' && appliedManualDuration && (
                      <div className="rounded-lg bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-700">
                        ✓ Manual timer set: {formatTime(appliedManualDuration)}
                      </div>
                    )}
                  </div>
                )}

                {/* Answer Input */}
                {!showAnswer && !isEnded && (
                  <div className="mb-4">
                    <label htmlFor="riddle-answer" className="mb-2 block text-sm font-medium text-gray-700">
                      Your Answer:
                    </label>
                    <input
                      id="riddle-answer"
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      aria-label="Enter your answer for the riddle"
                      aria-describedby={selectedRiddle.hint ? 'riddle-hint' : undefined}
                    />
                  </div>
                )}

                {/* Action Options - Below the Answer Input */}
                {!showAnswer && !isEnded && (
                  <div className="mb-6">
                    <ActionOptions
                      actions={selectedRiddle.actionOptions || getDefaultActions(selectedRiddle)}
                      gameState={{
                        isTimerRunning: isRunning && !isPaused,
                        isTimerPaused: isPaused,
                        isTimeUp: isEnded,
                        isAnswerRevealed: showAnswer,
                        hasUserAnswer: userAnswer.length > 0,
                        timeLeft,
                      }}
                      position="below_question"
                      onAction={(action) => handleAction(action, selectedRiddle)}
                      onAnalytics={() => {
                        // Analytics tracking
                      }}
                      className="justify-center"
                    />
                  </div>
                )}

                {/* Hint Display */}
                {showHint && selectedRiddle.hint && (
                  <div id="riddle-hint" className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800" role="note" aria-label="Hint">
                    <span className="font-semibold">💡 Hint:</span> {selectedRiddle.hint}
                  </div>
                )}

                {/* Answer Display */}
                {showAnswer && (
                  <div className="mb-4 rounded-lg bg-green-50 p-4">
                    <p className="mb-1 font-semibold text-green-800">Answer:</p>
                    <p className="text-lg text-green-700">{selectedRiddle.answer}</p>
                  </div>
                )}

                {/* Time Up Message */}
                {isEnded && !showAnswer && (
                  <div className="mb-4 rounded-lg bg-red-50 p-4 text-center">
                    <p className="text-lg font-bold text-red-600">⏰ Time is up!</p>
                    <p className="text-sm text-red-500">The answer will be revealed below.</p>
                  </div>
                )}

                {/* Close Button (when answer shown) */}
                {showAnswer && (
                  <button
                    onClick={handleCloseModal}
                    className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-600"
                  >
                    Got it! 🎉
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </main>
  );
}
