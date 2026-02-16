/**
 * ============================================================================
 * Challenge Mode Page
 * ============================================================================
 * Timed marathon with lives - answer as many as possible!
 * URL: /quiz/challenge
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Heart, Trophy, Play, RotateCcw } from 'lucide-react';

import { QuestionCard } from '@/components/quiz/QuestionCard';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage';
import type { Question, QuizSession } from '@/types/quiz';

const CHALLENGE_TIME = 300; // 5 minutes
const MAX_LIVES = 3;

interface ChallengeState {
  questions: Question[];
  currentIndex: number;
  score: number;
  streak: number;
  lives: number;
  timeRemaining: number;
  gameOver: boolean;
  answers: Record<number, string>;
}

/** Load questions for challenge mode (mixed difficulty) */
function loadChallengeQuestions(): Question[] {
  const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
  
  let questions: Question[] = [];
  Object.values(allQuestions).forEach((subjectQuestions) => {
    questions = questions.concat(
      subjectQuestions.filter((q) => q.status === 'published')
    );
  });

  // Shuffle
  return questions.sort(() => Math.random() - 0.5);
}

/** Get high score from localStorage */
function getHighScore(): number {
  return getItem(STORAGE_KEYS.CHALLENGE_HIGH_SCORE, 0);
}

/** Save high score */
function saveHighScore(score: number): void {
  const current = getHighScore();
  if (score > current) {
    setItem(STORAGE_KEYS.CHALLENGE_HIGH_SCORE, score);
  }
}

export default function ChallengePage(): JSX.Element {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');
  const [state, setState] = useState<ChallengeState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    lives: MAX_LIVES,
    timeRemaining: CHALLENGE_TIME,
    gameOver: false,
    answers: {},
  });
  const [highScore, setHighScore] = useState(0);

  // Load high score on mount
  useEffect(() => {
    setHighScore(getHighScore());
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing' || state.gameOver) return;

    const timer = setInterval(() => {
      setState((prev) => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          return { ...prev, timeRemaining: 0, gameOver: true };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, state.gameOver]);

  // Start game
  const startGame = useCallback(() => {
    const questions = loadChallengeQuestions();
    if (questions.length === 0) {
      alert('No questions available!');
      return;
    }

    setState({
      questions,
      currentIndex: 0,
      score: 0,
      streak: 0,
      lives: MAX_LIVES,
      timeRemaining: CHALLENGE_TIME,
      gameOver: false,
      answers: {},
    });
    setGameState('playing');
  }, []);

  // Handle answer
  const handleAnswer = useCallback(
    (option: string) => {
      if (state.gameOver) return;

      const currentQuestion = state.questions[state.currentIndex];
      if (!currentQuestion) return;
      
      const isCorrect = option === currentQuestion.correctAnswer;

      setState((prev) => {
        const newAnswers = { ...prev.answers, [currentQuestion.id]: option };
        
        if (isCorrect) {
          // Correct answer
          const newStreak = prev.streak + 1;
          const streakBonus = Math.floor(newStreak / 5) * 10; // Bonus every 5 streak
          const points = 10 + streakBonus;
          
          return {
            ...prev,
            score: prev.score + points,
            streak: newStreak,
            currentIndex: prev.currentIndex + 1,
            answers: newAnswers,
            gameOver: prev.currentIndex >= prev.questions.length - 1,
          };
        } else {
          // Wrong answer
          const newLives = prev.lives - 1;
          return {
            ...prev,
            lives: newLives,
            streak: 0,
            currentIndex: prev.currentIndex + 1,
            answers: newAnswers,
            gameOver: newLives <= 0 || prev.currentIndex >= prev.questions.length - 1,
          };
        }
      });
    },
    [state.currentIndex, state.gameOver, state.questions]
  );

  // End game and save
  useEffect(() => {
    if (state.gameOver && gameState === 'playing') {
      saveHighScore(state.score);
      setHighScore(getHighScore());
      setGameState('over');

      // Save to history
      const session = {
        id: Math.random().toString(36).substr(2, 9),
        subject: 'challenge',
        subjectName: 'Challenge Mode',
        chapter: 'Marathon',
        level: 'mixed',
        questions: state.questions.slice(0, state.currentIndex + 1),
        answers: state.answers,
        score: state.score,
        maxScore: (state.currentIndex + 1) * 10,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        timeTaken: CHALLENGE_TIME - state.timeRemaining,
        status: 'completed' as const,
      };

      const history = getItem<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
      history.push(session);
      setItem(STORAGE_KEYS.QUIZ_HISTORY, history);
    }
  }, [state.gameOver, gameState, state]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // START SCREEN
  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/quiz"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-8 shadow-lg"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Challenge Mode</h1>
              <p className="text-gray-600">
                Answer as many questions as you can in 5 minutes!
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-orange-50 p-4 text-center">
                <Zap className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                <p className="text-sm font-semibold">5 Minutes</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <Heart className="mx-auto mb-2 h-6 w-6 text-red-500" />
                <p className="text-sm font-semibold">3 Lives</p>
              </div>
              <div className="rounded-xl bg-yellow-50 p-4 text-center">
                <Trophy className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                <p className="text-sm font-semibold">Streak Bonus</p>
              </div>
            </div>

            {highScore > 0 && (
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">Your High Score</p>
                <p className="text-3xl font-bold text-orange-600">{highScore}</p>
              </div>
            )}

            <button
              onClick={startGame}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-bold text-white transition-colors hover:bg-orange-700"
            >
              <Play className="h-5 w-5" />
              Start Challenge
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (gameState === 'over') {
    const isNewHighScore = state.score > 0 && state.score === highScore;
    const correctCount = Object.values(state.answers).filter(
      (answer, idx) => answer === state.questions[idx]?.correctAnswer
    ).length;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white p-8 shadow-lg"
          >
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-800">Challenge Complete!</h1>
              {isNewHighScore && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-2 inline-block rounded-full bg-yellow-100 px-4 py-1 text-yellow-800"
                >
                  🎉 New High Score!
                </motion.div>
              )}
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-orange-50 p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">{state.score}</p>
                <p className="text-sm text-gray-600">Total Score</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{correctCount}</p>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{state.currentIndex + 1}</p>
                <p className="text-sm text-gray-600">Questions Answered</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{state.streak}</p>
                <p className="text-sm text-gray-600">Best Streak</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-bold text-white transition-colors hover:bg-orange-700"
              >
                <RotateCcw className="h-5 w-5" />
                Play Again
              </button>
              <Link
                href="/quiz"
                className="flex flex-1 items-center justify-center rounded-xl bg-gray-200 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Back to Quiz
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // PLAYING SCREEN
  const currentQuestion = state.questions[state.currentIndex];
  const timePercent = (state.timeRemaining / CHALLENGE_TIME) * 100;

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header Stats */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-white/95 p-3 text-center shadow-lg">
            <p className="text-xs text-gray-500">Score</p>
            <p className="text-xl font-bold text-orange-600">{state.score}</p>
          </div>
          <div className="rounded-xl bg-white/95 p-3 text-center shadow-lg">
            <p className="text-xs text-gray-500">Streak</p>
            <p className="text-xl font-bold text-blue-600">{state.streak}</p>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-xl bg-white/95 p-3 shadow-lg">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={`h-6 w-6 ${
                  i < state.lives ? 'fill-red-500 text-red-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="rounded-xl bg-white/95 p-3 text-center shadow-lg">
            <p className="text-xs text-gray-500">Time</p>
            <p className={`text-xl font-bold ${state.timeRemaining < 30 ? 'text-red-600' : 'text-green-600'}`}>
              {formatTime(state.timeRemaining)}
            </p>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className={`h-full ${timePercent < 20 ? 'bg-red-500' : timePercent < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${timePercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <QuestionCard
            question={currentQuestion}
            questionNumber={state.currentIndex + 1}
            totalQuestions={state.questions.length}
            selectedAnswer={null}
            onSelectAnswer={handleAnswer}
            showFeedback={false}
          />
        </motion.div>

        {/* Quick Skip */}
        <div className="mt-4 text-center">
          <button
            onClick={() => handleAnswer('SKIP')}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Skip Question (-1 Life)
          </button>
        </div>
      </div>
    </div>
  );
}
