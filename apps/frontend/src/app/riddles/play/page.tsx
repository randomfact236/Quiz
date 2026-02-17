/**
 * ============================================================================
 * Riddle Play Page
 * ============================================================================
 * Main gameplay page for riddles with session persistence
 * URL: /riddles/play?chapter=&level=&mode=
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  Home,
  Save
} from 'lucide-react';

import { STORAGE_KEYS, getItem } from '@/lib/storage';
import { 
  saveRiddleSession, 
  loadRiddleSession, 
  clearRiddleSession,
  createRiddleSession,
  setupNavigationWarning
} from '@/lib/riddle-session';
import type { Riddle, RiddleSession, RiddleResult } from '@/types/riddles';

// Auto-save interval in milliseconds (10 seconds as per Phase 0)
const AUTO_SAVE_INTERVAL = 10000;

// Default time limit for timer mode (30 seconds per riddle)
const DEFAULT_TIME_PER_RIDDLE = 30;

// Loading component for Suspense
function PlayPageLoading(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function RiddlePlayPage(): JSX.Element {
  return (
    <Suspense fallback={<PlayPageLoading />}>
      <RiddlePlayPageContent />
    </Suspense>
  );
}

// Inner component that uses useSearchParams
function RiddlePlayPageContent(): JSX.Element {
  const searchParams = useSearchParams();
  
  // URL params
  const chapter = searchParams.get('chapter') || 'all';
  const level = searchParams.get('level') || 'all';
  const mode = (searchParams.get('mode') || 'practice') as 'timer' | 'practice';
  
  // State
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [session, setSession] = useState<RiddleSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'completed'>('loading');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [result, setResult] = useState<RiddleResult | null>(null);
  
  // Load riddles and check for existing session
  useEffect(() => {
    const allRiddles = getItem<Riddle[]>(STORAGE_KEYS.RIDDLES, []);
    const publishedRiddles = allRiddles.filter(r => r.status === 'published');
    
    // Filter riddles based on params
    let filtered = publishedRiddles;
    
    if (chapter !== 'all') {
      filtered = filtered.filter(r => r.chapter === chapter);
    }
    
    if (level !== 'all') {
      filtered = filtered.filter(r => r.difficulty === level);
    }
    
    // Shuffle riddles for variety
    filtered = [...filtered].sort(() => Math.random() - 0.5);
    
    setRiddles(filtered);
    
    // Check for existing session
    const existingSession = loadRiddleSession();
    if (existingSession && existingSession.status === 'in-progress') {
      setShowResumeDialog(true);
    } else {
      // Create new session
      const timeLimit = mode === 'timer' ? filtered.length * DEFAULT_TIME_PER_RIDDLE : undefined;
      const newSession = createRiddleSession(
        mode,
        chapter,
        level as 'all' | 'easy' | 'medium' | 'hard' | 'expert',
        filtered,
        timeLimit
      );
      setSession(newSession);
      setTimeRemaining(timeLimit || 0);
      setStatus('playing');
    }
  }, [chapter, level, mode]);
  
  // Resume existing session
  const resumeSession = useCallback(() => {
    const existingSession = loadRiddleSession();
    if (existingSession) {
      setSession(existingSession);
      setRiddles(existingSession.riddles);
      setAnswers(existingSession.answers);
      setCurrentIndex(Object.keys(existingSession.answers).length);
      setTimeRemaining(existingSession.timeRemaining || 0);
      setStatus('playing');
    }
    setShowResumeDialog(false);
  }, []);
  
  // Start new session (discard existing)
  const startNewSession = useCallback(() => {
    clearRiddleSession();
    const timeLimit = mode === 'timer' ? riddles.length * DEFAULT_TIME_PER_RIDDLE : undefined;
    const newSession = createRiddleSession(
      mode,
      chapter,
      level as 'all' | 'easy' | 'medium' | 'hard' | 'expert',
      riddles,
      timeLimit
    );
    setSession(newSession);
    setAnswers({});
    setCurrentIndex(0);
    setTimeRemaining(timeLimit || 0);
    setStatus('playing');
    setShowResumeDialog(false);
  }, [mode, chapter, level, riddles]);
  
  // Timer effect for timer mode
  useEffect(() => {
    if (status !== 'playing' || mode !== 'timer') return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto-submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, mode]);
  
  // Auto-save effect (Phase 0: every 10 seconds)
  useEffect(() => {
    if (status !== 'playing' || !session) return;
    
    const interval = setInterval(() => {
      const updatedSession: RiddleSession = {
        ...session,
        answers,
        timeRemaining: mode === 'timer' ? timeRemaining : calculateTimeTaken(),
        lastSavedAt: new Date().toISOString(),
      };
      saveRiddleSession(updatedSession);
      setLastSaved(new Date());
    }, AUTO_SAVE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [status, session, answers, timeRemaining, mode]);
  
  // Navigation warning for unsaved progress
  useEffect(() => {
    if (status !== 'playing') return;
    
    return setupNavigationWarning(() => {
      if (!session) return null;
      return {
        ...session,
        answers,
        timeRemaining: mode === 'timer' ? timeRemaining : calculateTimeTaken(),
      };
    });
  }, [status, session, answers, timeRemaining, mode]);
  
  const calculateTimeTaken = () => {
    if (!session) return 0;
    const startTime = new Date(session.startedAt).getTime();
    return Math.floor((Date.now() - startTime) / 1000);
  };
  
  const handleAnswerSelect = (optionIndex: number) => {
    if (!session || status !== 'playing') return;
    
    const currentRiddle = riddles[currentIndex];
    if (!currentRiddle) return;
    
    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, etc.
    
    setAnswers(prev => ({
      ...prev,
      [currentRiddle.id]: optionLetter
    }));
  };
  
  const handleNext = () => {
    if (currentIndex < riddles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const handleSubmit = () => {
    if (!session) return;
    
    // Calculate score and result
    let correctCount = 0;
    const byDifficulty = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
      expert: { correct: 0, total: 0 },
    };
    
    riddles.forEach(riddle => {
      const userAnswer = answers[riddle.id];
      const isCorrect = userAnswer === riddle.correctOption;
      const diff = riddle.difficulty as keyof typeof byDifficulty;
      
      byDifficulty[diff].total++;
      if (isCorrect) {
        correctCount++;
        byDifficulty[diff].correct++;
      }
    });
    
    const percentage = riddles.length > 0 ? Math.round((correctCount / riddles.length) * 100) : 0;
    
    // Determine grade
    let grade: RiddleResult['grade'] = 'F';
    if (percentage >= 95) grade = 'A+';
    else if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    
    const completedSession: RiddleSession = {
      ...session,
      answers,
      score: correctCount,
      timeTaken: calculateTimeTaken(),
      timeRemaining: mode === 'timer' ? timeRemaining : 0,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    
    const resultData: RiddleResult = {
      session: completedSession,
      correctCount,
      incorrectCount: riddles.length - correctCount,
      percentage,
      grade,
      byDifficulty,
    };
    
    setResult(resultData);
    setStatus('completed');
    clearRiddleSession();
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const currentRiddle = riddles[currentIndex];
  const progress = riddles.length > 0 ? ((currentIndex + 1) / riddles.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading riddles...</p>
        </div>
      </div>
    );
  }
  
  // Resume Dialog
  if (showResumeDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Resume Session?</h2>
            <p className="text-gray-600">
              You have an unfinished riddle session. Would you like to continue where you left off?
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={resumeSession}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Resume Session
            </button>
            <button
              onClick={startNewSession}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Results Screen
  if (status === 'completed' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Riddle Challenge Complete!</h1>
              <p className="text-gray-600">Here&apos;s how you performed</p>
            </div>
            
            {/* Score Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={result.percentage >= 70 ? '#10B981' : result.percentage >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(result.percentage / 100) * 440} 440`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-800">{result.grade}</span>
                  <span className="text-sm text-gray-500">{result.percentage}%</span>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{result.correctCount}</p>
                <p className="text-xs text-green-600/70">Correct</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{result.incorrectCount}</p>
                <p className="text-xs text-red-600/70">Incorrect</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{formatTime(result.session.timeTaken)}</p>
                <p className="text-xs text-blue-600/70">Time</p>
              </div>
            </div>
            
            {/* Difficulty Breakdown */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-3">By Difficulty</h3>
              <div className="space-y-2">
                {Object.entries(result.byDifficulty).map(([diff, stats]) => (
                  <div key={diff} className="flex items-center gap-3">
                    <span className="w-16 text-sm capitalize text-gray-600">{diff}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          stats.total > 0 && stats.correct / stats.total >= 0.7 
                            ? 'bg-green-500' 
                            : stats.total > 0 && stats.correct / stats.total >= 0.4 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: stats.total > 0 ? `${(stats.correct / stats.total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right text-gray-600">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Link 
                href="/riddles"
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
              >
                <Home className="h-5 w-5 inline mr-2" />
                Back to Riddles
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                <RotateCcw className="h-5 w-5 inline mr-2" />
                Play Again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Playing Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/riddles"
            className="inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>
          
          <div className="flex items-center gap-4">
            {mode === 'timer' && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${
                timeRemaining < 30 ? 'bg-red-100 text-red-600' : 'bg-white/60 text-gray-700'
              }`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            )}
            
            {lastSaved && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                <Save className="h-3 w-3" />
                Auto-saved
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Riddle {currentIndex + 1} of {riddles.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-white/40 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Riddle Card */}
        {currentRiddle && (
          <motion.div 
            key={currentRiddle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            {/* Difficulty Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold
                ${currentRiddle.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentRiddle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    currentRiddle.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                }`}
              >
                {currentRiddle.difficulty.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">{currentRiddle.chapter}</span>
            </div>
            
            {/* Question */}
            <h2 className="text-xl font-medium text-gray-900 mb-6">
              {currentRiddle.question}
            </h2>
            
            {/* Options */}
            <div className="space-y-3">
              {currentRiddle.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const isSelected = answers[currentRiddle.id] === optionLetter;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {optionLetter}
                      </span>
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 rounded-xl bg-white/60 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {riddles.map((riddle, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-indigo-600 w-6' 
                    : answers[riddle.id] 
                      ? 'bg-green-400' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {currentIndex === riddles.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
        
        {/* Answered Progress */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          {answeredCount} of {riddles.length} riddles answered
        </div>
      </div>
    </div>
  );
}
