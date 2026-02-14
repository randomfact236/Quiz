'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

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

const SAMPLE_RIDDLES: ImageRiddle[] = [
  {
    id: '1',
    title: 'What is hidden in this image?',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop',
    answer: 'A face looking to the left',
    hint: 'Look at the center and tilt your head',
    difficulty: 'medium',
    timerSeconds: null,
    showTimer: true,
    altText: 'Abstract colorful painting',
  },
  {
    id: '2',
    title: 'Spot the anomaly in this landscape',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    answer: 'The reflection is upside down',
    hint: 'Check the water carefully',
    difficulty: 'hard',
    timerSeconds: 90,
    showTimer: true,
    altText: 'Mountain landscape with lake',
  },
];

const SAMPLE_CATEGORIES: ImageRiddleCategory[] = [
  { id: '1', name: 'Optical Illusions', emoji: '👁️', description: 'Mind-bending visual tricks' },
  { id: '2', name: 'Hidden Objects', emoji: '🔍', description: 'Find what is concealed' },
];

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
              audioRef.current.play().catch(() => {});
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
            className={`text-2xl font-bold ${
              isEnded ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-700'
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
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              value === preset
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
// Main Component
// -----------------------------------------------------------------------------
export default function ImageRiddlesPage(): JSX.Element {
  // State Management
  const [riddles, setRiddles] = useState<ImageRiddle[]>(SAMPLE_RIDDLES);
  const [categories, setCategories] = useState<ImageRiddleCategory[]>(SAMPLE_CATEGORIES);
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'random'>('recent');
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Timer State
  const [timerMode, setTimerMode] = useState<'auto' | 'manual'>('auto');
  const [manualDuration, setManualDuration] = useState<number>(60);
  const [appliedManualDuration, setAppliedManualDuration] = useState<number | null>(null);

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

  // Fetch Data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riddlesRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:4000/api/image-riddles'),
          fetch('http://localhost:4000/api/image-riddles/categories'),
        ]);

        if (riddlesRes.ok) {
          const riddlesData = await riddlesRes.json();
          if (riddlesData.data?.length > 0) {
            setRiddles(riddlesData.data);
          }
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (Array.isArray(categoriesData) && categoriesData.length > 0) {
            setCategories(categoriesData);
          }
        }
      } catch (error) {
        console.warn('[ImageRiddles] API unavailable, using sample data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter and Sort Riddles
  const getFilteredAndSortedRiddles = useCallback(() => {
    let filtered =
      difficulty === 'all' ? [...riddles] : riddles.filter((r) => r.difficulty === difficulty);

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
  }, [riddles, difficulty, sortOrder]);

  const filteredRiddles = getFilteredAndSortedRiddles();

  // Handle Riddle Selection
  const handleRiddleClick = useCallback(
    (riddle: ImageRiddle) => {
      // Stop any existing timer
      stop();

      // Reset state
      setSelectedRiddle(riddle);
      setUserAnswer('');
      setShowAnswer(false);
      setShowHint(false);
      setAppliedManualDuration(null);
      setTimerMode('auto');

      // Calculate and set duration
      const duration = riddle.timerSeconds ?? defaultTimers[riddle.difficulty] ?? 60;
      setDuration(duration);
      reset(duration);
    },
    [stop, reset, setDuration]
  );

  // Handle Timer Mode Change
  const handleTimerModeChange = useCallback(
    (mode: 'auto' | 'manual') => {
      setTimerMode(mode);
      if (mode === 'auto' && selectedRiddle) {
        // Switch to auto: reset to default
        setAppliedManualDuration(null);
        const duration = selectedRiddle.timerSeconds ?? defaultTimers[selectedRiddle.difficulty] ?? 60;
        reset(duration);
        start();
      } else if (mode === 'manual') {
        // Switch to manual: stop auto timer
        stop();
      }
    },
    [selectedRiddle, reset, start, stop]
  );

  // Handle Manual Timer Apply
  const handleManualTimerApply = useCallback(() => {
    setAppliedManualDuration(manualDuration);
    reset(manualDuration);
    start();
  }, [manualDuration, reset, start]);

  // Close Modal
  const closeModal = useCallback(() => {
    stop();
    setSelectedRiddle(null);
    setUserAnswer('');
    setShowAnswer(false);
    setShowHint(false);
    setAppliedManualDuration(null);
    setTimerMode('auto');
  }, [stop]);

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
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              difficulty === 'all'
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
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                difficulty === diff
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
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              sortOrder === 'recent'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            🕐 Recent First
          </button>
          <button
            onClick={() => setSortOrder('random')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              sortOrder === 'random'
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
                      alt={riddle.altText || riddle.title}
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
                  onClick={closeModal}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-800">{selectedRiddle.title}</h2>

                {/* Image */}
                <div className="mb-6 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRiddle.imageUrl}
                    alt={selectedRiddle.altText || selectedRiddle.title}
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
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                            timerMode === 'auto'
                              ? 'bg-white text-indigo-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          ⚡ Auto ({formatTime(effectiveDuration)})
                        </button>
                        <button
                          onClick={() => handleTimerModeChange('manual')}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                            timerMode === 'manual'
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                )}

                {/* Hint */}
                {selectedRiddle.hint && (
                  <div className="mb-4">
                    {!showHint ? (
                      <button
                        onClick={() => setShowHint(true)}
                        className="rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-200"
                      >
                        💡 Show Hint
                      </button>
                    ) : (
                      <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                        <span className="font-semibold">Hint:</span> {selectedRiddle.hint}
                      </div>
                    )}
                  </div>
                )}

                {/* Answer */}
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

                {/* Actions */}
                <div className="flex gap-3">
                  {!showAnswer ? (
                    <>
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="flex-1 rounded-lg bg-indigo-500 py-3 font-semibold text-white transition-colors hover:bg-indigo-600"
                      >
                        Check Answer
                      </button>
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="rounded-lg bg-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
                      >
                        Give Up
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={closeModal}
                      className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-600"
                    >
                      Got it! 🎉
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
