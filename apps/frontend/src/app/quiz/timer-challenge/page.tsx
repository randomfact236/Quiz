/**
 * ============================================================================
 * Timer Challenge Mode Page
 * ============================================================================
 * Multiple quiz modes with timer - Subject wise, Level wise, Complete Mix
 * URL: /quiz/timer-challenge
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer, Target, Layers, Grid3X3, ChevronDown, ChevronUp } from 'lucide-react';

import { STORAGE_KEYS, getItem } from '@/lib/storage';
import type { Question } from '@/types/quiz';

interface SubjectInfo {
  slug: string;
  name: string;
  emoji: string;
}

const levels = ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'] as const;

type Level = typeof levels[number];

const levelEmojis: Record<Level, string> = {
  'Easy': '🌱',
  'Medium': '🌿',
  'Hard': '🌲',
  'Expert': '🔥',
  'Extreme': '💀'
};

const levelColors: Record<Level, string> = {
  'Easy': 'from-green-400 to-green-600',
  'Medium': 'from-blue-400 to-blue-600',
  'Hard': 'from-orange-400 to-orange-600',
  'Expert': 'from-red-400 to-red-600',
  'Extreme': 'from-purple-500 to-pink-600'
};

interface LevelCount {
  subjectWise: Record<string, Record<string, number>>;
  allSubject: Record<string, number>;
  completeMix: number;
}

// Group array into chunks of size n
function chunkArray<T>(arr: T[], n: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    chunks.push(arr.slice(i, i + n));
  }
  return chunks;
}

export default function TimerChallengePage(): JSX.Element {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Foldable sections state - default expanded
  const [subjectWiseOpen, setSubjectWiseOpen] = useState(true);
  const [allSubjectOpen, setAllSubjectOpen] = useState(true);
  const [completeMixOpen, setCompleteMixOpen] = useState(true);
  
  // Expanded subject for showing levels
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
  // Question counts
  const [levelCounts, setLevelCounts] = useState<LevelCount>({
    subjectWise: {},
    allSubject: {},
    completeMix: 0
  });

  useEffect(() => {
    setIsHydrated(true);
    
    // Load subjects
    const storedSubjects = getItem<SubjectInfo[]>(STORAGE_KEYS.SUBJECTS, []);
    const defaultSubjects: SubjectInfo[] = [
      { slug: 'science', name: 'Science', emoji: '🔬' },
      { slug: 'math', name: 'Math', emoji: '🔢' },
      { slug: 'history', name: 'History', emoji: '📜' },
      { slug: 'geography', name: 'Geography', emoji: '🌍' },
      { slug: 'english', name: 'English', emoji: '📖' },
      { slug: 'technology', name: 'Technology', emoji: '💻' },
      { slug: 'business', name: 'Business', emoji: '💼' },
      { slug: 'health', name: 'Health', emoji: '💪' },
    ];
    const subjectList = storedSubjects.length > 0 ? storedSubjects : defaultSubjects;
    setSubjects(subjectList);
    
    // Calculate question counts
    const allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
    const counts: LevelCount = {
      subjectWise: {},
      allSubject: {},
      completeMix: 0
    };
    
    // Initialize counts
    levels.forEach(level => {
      counts.allSubject[level.toLowerCase()] = 0;
    });
    
    // Count questions
    Object.entries(allQuestions).forEach(([subjectSlug, subjectQuestions]) => {
      counts.subjectWise[subjectSlug] = {};
      
      subjectQuestions.forEach(q => {
        if (q.status === 'published' && q.level) {
          const level = q.level.toLowerCase();
          
          // Subject wise count
          if (!counts.subjectWise[subjectSlug]) {
            counts.subjectWise[subjectSlug] = {};
          }
          if (!counts.subjectWise[subjectSlug][level]) {
            counts.subjectWise[subjectSlug][level] = 0;
          }
          counts.subjectWise[subjectSlug][level]++;
          
          // All subject level wise count
          if (counts.allSubject[level] !== undefined) {
            counts.allSubject[level]++;
          }
          
          // Complete mix count
          counts.completeMix++;
        }
      });
    });
    
    setLevelCounts(counts);
  }, []);

  // Group subjects into rows of 4 for desktop
  const subjectRows = useMemo(() => chunkArray(subjects, 4), [subjects]);

  const handleStartSubjectWise = (subject: string, level: Level) => {
    router.push(`/quiz/play?subject=${subject}&chapter=all&level=${level.toLowerCase()}&mode=timer&type=challenge`);
  };

  const handleStartAllSubjectLevelWise = (level: Level) => {
    router.push(`/quiz/play?subject=all&chapter=all&level=${level.toLowerCase()}&mode=timer&type=challenge`);
  };

  const handleStartCompleteMix = () => {
    router.push(`/quiz/play?subject=all&chapter=all&level=all&mode=timer&type=challenge`);
  };

  const getSubjectWiseCount = (subject: string, level: Level): number => {
    return levelCounts.subjectWise[subject]?.[level.toLowerCase()] || 0;
  };

  const getAllSubjectCount = (level: Level): number => {
    return levelCounts.allSubject[level.toLowerCase()] || 0;
  };

  const getTotalQuestionsForSubject = (subject: string): number => {
    const subjectCounts = levelCounts.subjectWise[subject] || {};
    return Object.values(subjectCounts).reduce((sum, count) => sum + count, 0);
  };

  const toggleSubject = (slug: string) => {
    setExpandedSubject(expandedSubject === slug ? null : slug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link 
          href="/quiz" 
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quiz
        </Link>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center text-3xl font-bold text-white"
        >
          <span className="mr-2">⏱️</span>
          Timer Challenge Mode
        </motion.h1>
        
        <div className="space-y-6">
          {/* Subject Wise Mix */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/95 shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setSubjectWiseOpen(!subjectWiseOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Subject Wise Mix</span>
                  <span className="text-sm opacity-90">Click a subject to select difficulty level</span>
                </div>
              </div>
              {subjectWiseOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            
            {subjectWiseOpen && (
              <div className="p-6">
                {/* Subjects Grid with Full Width Levels */}
                <div className="flex flex-col gap-3">
                  {subjectRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="contents">
                      {/* Subjects Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {row.map((subject) => {
                          const totalQuestions = getTotalQuestionsForSubject(subject.slug);
                          const isExpanded = expandedSubject === subject.slug;
                          
                          return (
                            <button
                              key={subject.slug}
                              onClick={() => toggleSubject(subject.slug)}
                              disabled={totalQuestions === 0}
                              className={`flex flex-col items-center rounded-xl p-4 text-center shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                isExpanded 
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300' 
                                  : 'bg-white border-2 border-gray-100 hover:border-blue-200'
                              }`}
                            >
                              <span className="text-3xl mb-1">{subject.emoji}</span>
                              <span className={`font-semibold text-sm ${isExpanded ? 'text-white' : 'text-gray-800'}`}>
                                {subject.name}
                              </span>
                              <span className={`text-xs mt-1 ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                                {isHydrated ? `${totalQuestions} Qs` : '...'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Full Width Levels - shown if any subject in this row is expanded */}
                      <AnimatePresence>
                        {row.some(s => s.slug === expandedSubject) && expandedSubject && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                              <p className="text-center text-sm text-gray-600 mb-3">
                                Select difficulty level for <span className="font-semibold text-blue-600">
                                  {subjects.find(s => s.slug === expandedSubject)?.name}
                                </span>
                              </p>
                              <div className="grid grid-cols-5 gap-3">
                                {levels.map((level) => {
                                  const count = getSubjectWiseCount(expandedSubject, level);
                                  return (
                                    <button
                                      key={`${expandedSubject}-${level}`}
                                      onClick={() => handleStartSubjectWise(expandedSubject, level)}
                                      disabled={count === 0}
                                      title={`${level}: ${count} questions`}
                                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                                        count > 0 ? `bg-gradient-to-br ${levelColors[level]}` : 'bg-gray-300'
                                      }`}
                                    >
                                      <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                                      <span className="font-semibold text-sm">{level}</span>
                                      <span className="text-xs mt-1 opacity-90">{count} Qs</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* All Subject Level Wise Mix */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/95 shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setAllSubjectOpen(!allSubjectOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Layers className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">All Subject Level Wise Mix</span>
                  <span className="text-sm opacity-90">Questions from all subjects at selected difficulty</span>
                </div>
              </div>
              {allSubjectOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            
            {allSubjectOpen && (
              <div className="p-6">
                <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {levels.map((level) => {
                    const count = isHydrated ? getAllSubjectCount(level) : 0;
                    return (
                      <button
                        key={`all-subject-${level}`}
                        onClick={() => handleStartAllSubjectLevelWise(level)}
                        disabled={count === 0}
                        className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${levelColors[level]} p-4 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                        <span className="font-semibold text-sm">{level}</span>
                        <span className="mt-1 text-xs opacity-90">
                          {isHydrated ? `${count} Qs` : '...'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Complete Mix */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/95 shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setCompleteMixOpen(!completeMixOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Grid3X3 className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Complete Mix</span>
                  <span className="text-sm opacity-90">All subjects, all levels - Ultimate challenge!</span>
                </div>
              </div>
              {completeMixOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            
            {completeMixOpen && (
              <div className="p-6 text-center">
                <p className="mb-4 text-gray-600">
                  Challenge yourself with questions from all subjects and all difficulty levels!
                </p>
                <div className="mb-6 flex justify-center gap-4 text-sm">
                  <span className="rounded-full bg-purple-100 px-4 py-2 text-purple-700">
                    {isHydrated ? `${levelCounts.completeMix} Total Questions` : 'Loading...'}
                  </span>
                  <span className="rounded-full bg-pink-100 px-4 py-2 text-pink-700">
                    All 5 Levels
                  </span>
                </div>
                <button
                  onClick={handleStartCompleteMix}
                  disabled={!isHydrated || levelCounts.completeMix === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Timer className="h-5 w-5" />
                  Start Complete Mix Challenge
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
