/**
 * ============================================================================
 * Riddle Practice Mode Page
 * ============================================================================
 * Multiple riddle modes without timer - Chapter wise, Level wise, Complete Mix
 * URL: /riddles/practice
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GraduationCap, Target, Layers, Grid3X3, ChevronDown, ChevronUp } from 'lucide-react';

import { STORAGE_KEYS, getItem } from '@/lib/storage';
import type { Riddle } from '@/types/riddles';

interface ChapterInfo {
  title: string;
  icon: string;
}

// Riddle difficulty levels (extreme removed)
const levels = ['Easy', 'Medium', 'Hard', 'Expert'] as const;

type Level = typeof levels[number];

const levelEmojis: Record<Level, string> = {
  'Easy': '🌱',
  'Medium': '🌿',
  'Hard': '🌲',
  'Expert': '🔥'
};

const levelColors: Record<Level, string> = {
  'Easy': 'from-green-400 to-green-600',
  'Medium': 'from-blue-400 to-blue-600',
  'Hard': 'from-orange-400 to-orange-600',
  'Expert': 'from-red-400 to-red-600'
};

const ALL_CHAPTERS: ChapterInfo[] = [
  { title: 'Trick Questions', icon: '🤔' },
  { title: 'Puzzle Stories', icon: '📖' },
  { title: 'Logic Puzzles', icon: '🧩' },
  { title: 'Word Play', icon: '🔤' },
  { title: 'Math Riddles', icon: '🔢' },
  { title: 'Mystery Cases', icon: '🔍' },
  { title: 'Brain Teasers', icon: '🧠' },
  { title: 'Visual Puzzles', icon: '👁️' },
  { title: 'Lateral Thinking', icon: '💭' },
  { title: 'Classic Riddles', icon: '📜' },
  { title: 'Funny Riddles', icon: '😂' },
  { title: 'Mystery Riddles', icon: '🕵️' },
  { title: 'Everyday Objects', icon: '🏺' },
  { title: 'Wordplay', icon: '📝' },
  { title: 'Pattern Recognition', icon: '🔲' },
  { title: 'Short & Quick', icon: '⚡' },
  { title: 'Long Story Riddles', icon: '📚' },
  { title: 'Kids Riddles', icon: '🧒' },
  { title: 'Animal Riddles', icon: '🦁' },
  { title: 'Deduction Riddles', icon: '🔎' },
];

interface LevelCount {
  chapterWise: Record<string, Record<string, number>>;
  allChapter: Record<string, number>;
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

export default function RiddlePracticePage(): JSX.Element {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Foldable sections state - default expanded
  const [chapterWiseOpen, setChapterWiseOpen] = useState(true);
  const [allChapterOpen, setAllChapterOpen] = useState(true);
  const [completeMixOpen, setCompleteMixOpen] = useState(true);
  
  // Expanded chapter for showing levels
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  
  // Riddle counts
  const [levelCounts, setLevelCounts] = useState<LevelCount>({
    chapterWise: {},
    allChapter: {},
    completeMix: 0
  });

  useEffect(() => {
    setIsHydrated(true);
    
    // Calculate riddle counts
    const allRiddles = getItem<Riddle[]>(STORAGE_KEYS.RIDDLES, []);
    const publishedRiddles = allRiddles.filter(r => r.status === 'published');
    
    const counts: LevelCount = {
      chapterWise: {},
      allChapter: {},
      completeMix: 0
    };
    
    // Initialize counts
    levels.forEach(level => {
      counts.allChapter[level.toLowerCase()] = 0;
    });
    
    // Count riddles
    publishedRiddles.forEach(riddle => {
      const level = riddle.difficulty?.toLowerCase() || 'medium';
      const chapter = riddle.chapter;
      
      // Chapter wise count
      if (!counts.chapterWise[chapter]) {
        counts.chapterWise[chapter] = {};
      }
      if (!counts.chapterWise[chapter][level]) {
        counts.chapterWise[chapter][level] = 0;
      }
      counts.chapterWise[chapter][level]++;
      
      // All chapter level wise count
      if (counts.allChapter[level] !== undefined) {
        counts.allChapter[level]++;
      }
      
      // Complete mix count
      counts.completeMix++;
    });
    
    setLevelCounts(counts);
  }, []);

  // Group chapters into rows of 4 for desktop
  const chapterRows = useMemo(() => chunkArray(ALL_CHAPTERS, 4), []);

  const handleStartChapterWise = (chapter: string, level: Level) => {
    router.push(`/riddles/play?chapter=${encodeURIComponent(chapter)}&level=${level.toLowerCase()}&mode=practice`);
  };

  const handleStartAllChapterLevelWise = (level: Level) => {
    router.push(`/riddles/play?chapter=all&level=${level.toLowerCase()}&mode=practice`);
  };

  const handleStartCompleteMix = () => {
    router.push(`/riddles/play?chapter=all&level=all&mode=practice`);
  };

  const getChapterWiseCount = (chapter: string, level: Level): number => {
    return levelCounts.chapterWise[chapter]?.[level.toLowerCase()] || 0;
  };

  const getAllChapterCount = (level: Level): number => {
    return levelCounts.allChapter[level.toLowerCase()] || 0;
  };

  const getTotalRiddlesForChapter = (chapter: string): number => {
    const chapterCounts = levelCounts.chapterWise[chapter] || {};
    return Object.values(chapterCounts).reduce((sum, count) => sum + count, 0);
  };

  const toggleChapter = (title: string) => {
    setExpandedChapter(expandedChapter === title ? null : title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link 
          href="/riddles" 
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Riddles
        </Link>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center text-3xl font-bold text-gray-800"
        >
          <span className="mr-2">📚</span>
          Riddle Practice Mode
        </motion.h1>
        
        <div className="space-y-6">
          {/* Chapter Wise Mix */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setChapterWiseOpen(!chapterWiseOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Chapter Wise Mix</span>
                  <span className="text-sm opacity-90">Click a chapter to select difficulty level</span>
                </div>
              </div>
              {chapterWiseOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            
            {chapterWiseOpen && (
              <div className="p-6">
                {/* Chapters Grid with Full Width Levels */}
                <div className="flex flex-col gap-3">
                  {chapterRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="contents">
                      {/* Chapters Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {row.map((chapter) => {
                          const totalRiddles = getTotalRiddlesForChapter(chapter.title);
                          const isExpanded = expandedChapter === chapter.title;
                          
                          return (
                            <button
                              key={chapter.title}
                              onClick={() => toggleChapter(chapter.title)}
                              disabled={totalRiddles === 0}
                              className={`flex flex-col items-center rounded-xl p-4 text-center shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                isExpanded 
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300' 
                                  : 'bg-gray-50 border-2 border-gray-200 hover:border-blue-200'
                              }`}
                            >
                              <span className="text-3xl mb-1">{chapter.icon}</span>
                              <span className={`font-semibold text-sm ${isExpanded ? 'text-white' : 'text-gray-800'}`}>
                                {chapter.title}
                              </span>
                              <span className={`text-xs mt-1 ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                                {isHydrated ? `${totalRiddles} riddles` : '...'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Full Width Levels - shown if any chapter in this row is expanded */}
                      <AnimatePresence>
                        {row.some(c => c.title === expandedChapter) && expandedChapter && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                              <p className="text-center text-sm text-gray-600 mb-3">
                                Select difficulty level for <span className="font-semibold text-blue-600">
                                  {expandedChapter}
                                </span>
                              </p>
                              <div className="grid grid-cols-4 gap-3">
                                {levels.map((level) => {
                                  const count = getChapterWiseCount(expandedChapter, level);
                                  return (
                                    <button
                                      key={`${expandedChapter}-${level}`}
                                      onClick={() => handleStartChapterWise(expandedChapter, level)}
                                      disabled={count === 0}
                                      title={`${level}: ${count} riddles`}
                                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                                        count > 0 ? `bg-gradient-to-br ${levelColors[level]}` : 'bg-gray-300'
                                      }`}
                                    >
                                      <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                                      <span className="font-semibold text-sm">{level}</span>
                                      <span className="text-xs mt-1 opacity-90">{count} riddles</span>
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

          {/* All Chapter Level Wise Mix */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setAllChapterOpen(!allChapterOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Layers className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">All Chapter Level Wise Mix</span>
                  <span className="text-sm opacity-90">Riddles from all chapters at selected difficulty</span>
                </div>
              </div>
              {allChapterOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            
            {allChapterOpen && (
              <div className="p-6">
                <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {levels.map((level) => {
                    const count = isHydrated ? getAllChapterCount(level) : 0;
                    return (
                      <button
                        key={`all-chapter-${level}`}
                        onClick={() => handleStartAllChapterLevelWise(level)}
                        disabled={count === 0}
                        className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${levelColors[level]} p-4 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                        <span className="font-semibold text-sm">{level}</span>
                        <span className="mt-1 text-xs opacity-90">
                          {isHydrated ? `${count} riddles` : '...'}
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
            className="rounded-2xl bg-white shadow-lg overflow-hidden"
          >
            <button
              onClick={() => setCompleteMixOpen(!completeMixOpen)}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            >
              <div className="flex items-center gap-4">
                <Grid3X3 className="h-8 w-8" />
                <div className="text-left">
                  <span className="text-xl font-bold block">Complete Mix</span>
                  <span className="text-sm opacity-90">All chapters, all levels - Ultimate practice!</span>
                </div>
              </div>
              {completeMixOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            
            {completeMixOpen && (
              <div className="p-6 text-center">
                <p className="mb-4 text-gray-600">
                  Practice with riddles from all chapters and all difficulty levels!
                </p>
                <div className="mb-6 flex justify-center gap-4 text-sm">
                  <span className="rounded-full bg-purple-100 px-4 py-2 text-purple-700">
                    {isHydrated ? `${levelCounts.completeMix} Total Riddles` : 'Loading...'}
                  </span>
                  <span className="rounded-full bg-pink-100 px-4 py-2 text-pink-700">
                    4 Difficulty Levels
                  </span>
                </div>
                <button
                  onClick={handleStartCompleteMix}
                  disabled={!isHydrated || levelCounts.completeMix === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GraduationCap className="h-5 w-5" />
                  Start Complete Mix Practice
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
