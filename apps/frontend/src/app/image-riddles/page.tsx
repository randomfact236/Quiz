/**
 * ============================================================================
 * image-riddles/page.tsx - Enterprise Grade
 * ============================================================================
 * Redesigned with:
 * - 3-Column Card Layout (Difficulty Top-Left, Time Top-Right)
 * - 2-Column Sticky Category Sidebar
 * - Full-Width Sticky Unified Header
 * - Pagination (12 Items per Page)
 * - Compact Stats Profile
 * ============================================================================
 */

'use client';

import Link from 'next/link';
import { useState, useCallback, useMemo } from 'react';
import ActionOptions, { IActionOption } from '@/components/image-riddles/ActionOptions';
import { initialImageRiddles, initialImageRiddleCategories } from '@/lib/initial-data';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

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
  timerSeconds?: number | null; // Added back for display purposes
  altText: string | null;
  createdAt?: string;
  updatedAt?: string;
  actionOptions?: IActionOption[] | null;
  useDefaultActions?: boolean;
}

interface ImageRiddleCategory {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
}

const ITEMS_PER_PAGE = 12;

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

const defaultTimers = {
  easy: 90,
  medium: 120,
  hard: 150,
  expert: 180,
};

const formatTime = (seconds?: number | null, diff?: string): string => {
  const s = seconds ?? defaultTimers[diff as keyof typeof defaultTimers] ?? 90;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

// -----------------------------------------------------------------------------
// Action Option Creators
// -----------------------------------------------------------------------------

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

function createGiveUpAction(now: Date): IActionOption {
  return {
    id: 'give-up', label: 'Reveal', type: 'button', style: 'danger', size: 'md',
    icon: '👁️', iconPosition: 'left', ariaLabel: 'Reveal answer', keyboardShortcut: 'Alt+G',
    isEnabled: true, isVisible: true, position: 'below_question', order: 30,
    tooltip: 'Reveal the answer (Alt+G)',
    visibilityConditions: { showWhenAnswerHidden: true },
    analyticsEvent: 'gave_up', createdAt: now, updatedAt: now,
  };
}

function getDefaultActions(_riddle: ImageRiddle): IActionOption[] {
  const now = new Date();
  return [
    createCheckAnswerAction(now),
    createHintAction(now),
    createGiveUpAction(now),
  ];
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function ImageRiddlesPage(): JSX.Element {
  // Data State
  const [riddles] = useState<ImageRiddle[]>(() => getItem(STORAGE_KEYS.IMAGE_RIDDLES, initialImageRiddles));
  const [categories] = useState<ImageRiddleCategory[]>(initialImageRiddleCategories);

  // Filter, Sort, & Pagination State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'random'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Handlers with Pagination Reset
  const handleCategoryChange = (cat: string | null) => { setActiveCategory(cat); setCurrentPage(1); };
  const handleDifficultyChange = (d: string) => { setDifficulty(d); setCurrentPage(1); };
  const handleSortChange = (s: 'recent' | 'random') => { setSortOrder(s); setCurrentPage(1); };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  // Reset page-level game state when selecting a new riddle
  const resetRiddleState = useCallback(() => {
    setUserAnswer('');
    setShowAnswer(false);
    setShowHint(false);
  }, []);

  const handleRiddleClick = useCallback((riddle: ImageRiddle) => {
    setSelectedRiddle(riddle);
    resetRiddleState();
  }, [resetRiddleState]);

  const toggleRevealAnswer = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter and Sort Logic
  const filteredRiddles = useMemo(() => {
    let result = [...riddles];

    // Filter by difficulty
    if (difficulty !== 'all') {
      result = result.filter(r => r.difficulty === difficulty);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.answer.toLowerCase().includes(q)
      );
    }

    // Apply Sort
    if (sortOrder === 'random') {
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j] as ImageRiddle, result[i] as ImageRiddle];
      }
    }

    return result;
  }, [riddles, difficulty, sortOrder, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRiddles.length / ITEMS_PER_PAGE);
  const paginatedRiddles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRiddles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRiddles, currentPage]);

  const handleAction = useCallback((action: IActionOption, riddle: ImageRiddle) => {
    switch (action.id) {
      case 'check-answer':
        if (userAnswer.trim().toLowerCase() === riddle.answer.toLowerCase()) {
          setShowAnswer(true);
          setRevealedAnswers(prev => ({ ...prev, [riddle.id]: true }));
        } else {
          alert('Not quite right. Try again!');
        }
        break;
      case 'show-hint':
        setShowHint(true);
        break;
      case 'give-up':
        setShowAnswer(true);
        setRevealedAnswers(prev => ({ ...prev, [riddle.id]: true }));
        break;
      default:
        break;
    }
  }, [userAnswer]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md">
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-4xl font-black tracking-tight text-slate-800">
            🖼️ Image Riddles
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Challenge your perception</p>
        </div>

        {/* Compact Stats Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 max-w-[320px] mx-auto">
          <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-2xl font-black text-indigo-600 leading-none mb-1">{riddles.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-2xl font-black text-indigo-600 leading-none mb-1">{categories.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Topics</p>
          </div>
        </div>

        {/* Sticky Content Header (Full Width, Above Grid) */}
        <div className="sticky top-20 z-30 mb-8 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h2 className="text-lg font-black text-slate-800 tracking-tight whitespace-nowrap">
              {activeCategory || 'All Riddles'} <span className="text-slate-400 font-bold ml-1">({filteredRiddles.length})</span>
            </h2>
            <div className="h-6 w-[2px] bg-slate-100 hidden sm:block"></div>
            <div className="relative flex-1 sm:flex-none">
              <input
                type="search"
                placeholder="Search riddles..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full sm:w-64 rounded-full border-2 border-slate-100 bg-slate-50 py-2 pl-4 pr-10 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
              />
              <span className="absolute right-3 top-2.5 text-slate-300">🔍</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleSortChange('recent')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${sortOrder === 'recent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Recent
              </button>
              <button
                onClick={() => handleSortChange('random')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${sortOrder === 'random' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Mix
              </button>
            </div>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
              aria-label="Filter by difficulty"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="grid gap-10 lg:grid-cols-4 items-start">

          {/* Sticky Sidebar: Categories (2 Column Grid) */}
          <div className="lg:col-span-1 sticky top-[168px] z-20">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
              <span className="text-indigo-400">📁</span> Topics
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`w-full text-left rounded-xl p-3 transition-all border-2 flex flex-col items-center justify-center text-center gap-1 ${activeCategory === null ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
              >
                <span className="text-xl">🌍</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-700">All</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`w-full text-left rounded-xl p-3 transition-all border-2 flex flex-col items-center justify-center text-center gap-1 ${activeCategory === cat.name ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                  title={cat.name}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 line-clamp-1 break-all w-full px-1">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Area: Grid & Pagination */}
          <div className="lg:col-span-3 space-y-6">

            {/* Riddle Grid (3 columns) */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedRiddles.map((riddle) => (
                <div
                  key={riddle.id}
                  onClick={() => handleRiddleClick(riddle)}
                  className="group cursor-pointer flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                    <img
                      src={riddle.imageUrl}
                      alt={riddle.altText || riddle.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Top Overlay Gradient for readability */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent"></div>

                    {/* Difficulty Badge (Top Left) */}
                    <div className={`absolute top-4 left-4 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${difficultyColors[riddle.difficulty]} border-none bg-white/90`}>
                      {difficultyLabels[riddle.difficulty]}
                    </div>

                    {/* Time Badge (Top Right) */}
                    <div className="absolute top-4 right-4 flex items-center justify-center rounded-full bg-slate-900/60 shadow-sm px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      ⏱️ {formatTime(riddle.timerSeconds, riddle.difficulty)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="mb-4 line-clamp-2 text-lg font-black tracking-tight text-slate-800 leading-snug">
                      {riddle.title}
                    </h3>

                    {/* Answer Reveal Section */}
                    <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                      <div className={`text-sm font-bold transition-all duration-500 overflow-hidden line-clamp-1 ${revealedAnswers[riddle.id] ? 'text-indigo-600 blur-0' : 'text-slate-300 blur-sm select-none'}`}>
                        {revealedAnswers[riddle.id] ? riddle.answer : 'Answer Hidden'}
                      </div>
                      <button
                        onClick={(e) => toggleRevealAnswer(riddle.id, e)}
                        className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${revealedAnswers[riddle.id] ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                      >
                        {revealedAnswers[riddle.id] ? '👁️ Hide' : '🕶️ Reveal'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRiddles.length === 0 && (
              <div className="py-24 text-center rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200">
                <span className="text-6xl mb-6 block">✨</span>
                <h3 className="text-xl font-black text-slate-400 mb-2">Nothing matches your search...</h3>
                <button
                  onClick={() => { handleCategoryChange(null); handleDifficultyChange('all'); setSearchQuery(''); }}
                  className="mt-6 rounded-full bg-indigo-600 px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-center gap-4 pb-12">
                <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-100">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
                    aria-label="Previous page"
                  >
                    <span className="text-xl font-bold">‹</span>
                  </button>

                  <div className="px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    <span className="text-slate-800">{currentPage}</span> / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
                    aria-label="Next page"
                  >
                    <span className="text-xl font-bold">›</span>
                  </button>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Showing {Math.min(filteredRiddles.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} - {Math.min(filteredRiddles.length, currentPage * ITEMS_PER_PAGE)} of {filteredRiddles.length}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Modal: Riddle Preview & Interaction */}
        {selectedRiddle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative h-[90vh] flex flex-col w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${difficultyColors[selectedRiddle.difficulty]} bg-white shadow-sm`}>
                  {difficultyLabels[selectedRiddle.difficulty]}
                </span>
                <button
                  onClick={() => setSelectedRiddle(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-sm font-bold text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Non-Scrollable Dynamic Content */}
              <div className="flex flex-col flex-1 min-h-0 p-6 sm:p-8">
                <h2 className="shrink-0 mb-4 text-2xl font-black text-slate-800 tracking-tight leading-snug">{selectedRiddle.title}</h2>

                <div className="relative flex-1 min-h-0 mb-6 overflow-hidden rounded-3xl border-2 border-slate-100 shadow-inner group bg-slate-50">
                  <img
                    src={selectedRiddle.imageUrl}
                    alt={selectedRiddle.altText || selectedRiddle.title}
                    className="absolute inset-0 h-full w-full object-contain p-2"
                  />
                  <div className="absolute top-4 right-4 flex items-center justify-center rounded-full bg-slate-900/60 shadow-sm px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    ⏱️ {formatTime(selectedRiddle.timerSeconds, selectedRiddle.difficulty)}
                  </div>
                </div>

                {/* Game Logic */}
                {!showAnswer ? (
                  <div className="shrink-0 space-y-4">
                    <div>
                      <label htmlFor="riddle-answer" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                        Your Guess:
                      </label>
                      <input
                        id="riddle-answer"
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAction({ id: 'check-answer' } as any, selectedRiddle); }}
                        placeholder="Type your answer..."
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                        autoFocus
                      />
                    </div>

                    <ActionOptions
                      actions={selectedRiddle.actionOptions || getDefaultActions(selectedRiddle)}
                      gameState={{
                        isTimerRunning: false,
                        isTimerPaused: false,
                        isTimeUp: false,
                        isAnswerRevealed: showAnswer,
                        hasUserAnswer: userAnswer.length > 0,
                        timeLeft: 0,
                      }}
                      position="below_question"
                      onAction={(action) => handleAction(action, selectedRiddle)}
                      className="justify-center gap-4"
                    />

                    {showHint && selectedRiddle.hint && (
                      <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-amber-50 p-5 border border-amber-100 shadow-sm">
                        <p className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                          <span className="text-base">💡</span> Hint
                        </p>
                        <p className="text-amber-900 font-bold">{selectedRiddle.hint}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="shrink-0 animate-in zoom-in-95 duration-300 space-y-4">
                    <div className="rounded-[2.5rem] bg-indigo-600 p-6 sm:p-8 text-center text-white shadow-xl relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 text-9xl opacity-10">✨</div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">The Answer is:</p>
                      <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{selectedRiddle.answer}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedRiddle(null)}
                      className="w-full rounded-2xl bg-slate-800 py-3 sm:py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-slate-700 hover:scale-[1.02] active:scale-95"
                    >
                      Close Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
