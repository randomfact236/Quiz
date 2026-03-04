/**
 * ============================================================================
 * image-riddles/page.tsx - Enterprise Grade
 * ============================================================================
 * Redesigned with:
 * - Table Layout (Numbering, Title/Image, Difficulty, Answer)
 * - Sticky Category Sidebar (Dad Jokes Style)
 * - Removed Timer Logic
 * ============================================================================
 */

'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
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

// -----------------------------------------------------------------------------
// Action Option Creators (Simplified - No Timer)
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

  // Filter & Sort State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'random'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // UI State
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

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

    // Filter by category (if active)
    if (activeCategory) {
      // Assuming initial data categories names match riddle category mapping if we had it,
      // but current riddle interface doesn't have a direct 'category' field.
      // Let's assume categories filter by a prefix in ID or something similar if needed,
      // or if we add a category field to ImageRiddle later. For now, since ImageRiddle
      // doesn't have a category field in its interface, we'll keep it simple.
      // Wait, let's check initial-data.
    }

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
        [result[i], result[j]] = [result[j], result[i]];
      }
    }

    return result;
  }, [riddles, difficulty, sortOrder, searchQuery, activeCategory]);

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
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white px-4 py-2 text-gray-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md">
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight text-slate-800">
            🖼️ Image Riddles
          </h1>
          <p className="text-lg text-slate-500 font-medium">Challenge your visual perception with a structured view.</p>
        </div>

        {/* Stats Summary */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-2 max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm border border-slate-100">
            <span className="text-2xl mb-1 block">🧩</span>
            <p className="text-3xl font-black text-indigo-600">{riddles.length}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Riddles</p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm border border-slate-100">
            <span className="text-2xl mb-1 block">🏷️</span>
            <p className="text-3xl font-black text-indigo-600">{categories.length}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</p>
          </div>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="grid gap-10 lg:grid-cols-4">

          {/* Sticky Sidebar: Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                <span className="text-indigo-500">📁</span> Topics
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left rounded-xl p-4 transition-all border-2 flex items-center gap-4 ${activeCategory === null ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-100' : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-200'}`}
                >
                  <span className="text-2xl">🌍</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">All Topics</h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400">View everything</p>
                  </div>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full text-left rounded-xl p-4 transition-all border-2 flex items-center gap-4 ${activeCategory === cat.name ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-100' : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-200'}`}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{cat.name}</h3>
                      <p className="text-[10px] uppercase font-bold text-slate-400 line-clamp-1">{cat.description || 'Category'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Area: Table & Controls */}
          <div className="lg:col-span-3 space-y-6">

            {/* Sticky Content Header */}
            <div className="sticky top-24 z-20 bg-slate-50/90 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 shadow-sm sm:shadow-none">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <h2 className="text-xl font-bold text-slate-800">
                  {activeCategory || 'All Riddles'} <span className="text-slate-400 font-normal">({filteredRiddles.length})</span>
                </h2>
                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="search"
                    placeholder="Search riddles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 rounded-full border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-300">🔍</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-slate-200/50 p-1 rounded-lg">
                  <button
                    onClick={() => setSortOrder('recent')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortOrder === 'recent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortOrder('random')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortOrder === 'random' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Random
                  </button>
                </div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-50"
                  aria-label="Filter by difficulty"
                >
                  <option value="all">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Riddle Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 w-16">#</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Image & Title</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 w-32">Difficulty</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 w-48">Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRiddles.map((riddle, index) => (
                      <tr
                        key={riddle.id}
                        onClick={() => handleRiddleClick(riddle)}
                        className="group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-400">{(index + 1).toString().padStart(2, '0')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-20 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shadow-sm flex-shrink-0">
                              <img
                                src={riddle.imageUrl}
                                alt={riddle.title}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <h3 className="font-bold text-slate-800 line-clamp-1">{riddle.title}</h3>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-tight ${difficultyColors[riddle.difficulty]}`}>
                            {difficultyLabels[riddle.difficulty]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className={`text-sm font-bold transition-all duration-300 ${revealedAnswers[riddle.id] ? 'text-indigo-600 blur-0' : 'text-slate-300 blur-sm select-none'}`}>
                              {riddle.answer}
                            </div>
                            <button
                              onClick={(e) => toggleRevealAnswer(riddle.id, e)}
                              className={`flex-shrink-0 rounded-lg p-1.5 transition-all ${revealedAnswers[riddle.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                              title={revealedAnswers[riddle.id] ? 'Hide Answer' : 'Reveal Answer'}
                            >
                              {revealedAnswers[riddle.id] ? '👁️' : '🕶️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRiddles.length === 0 && (
                <div className="py-20 text-center">
                  <span className="text-6xl mb-4 block">🏝️</span>
                  <h3 className="text-xl font-bold text-slate-400 italic">No riddles found here...</h3>
                  <button
                    onClick={() => { setActiveCategory(null); setDifficulty('all'); setSearchQuery(''); }}
                    className="mt-4 text-indigo-600 font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Riddle Preview & Interaction */}
        {selectedRiddle && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${difficultyColors[selectedRiddle.difficulty]}`}>
                  {difficultyLabels[selectedRiddle.difficulty]}
                </span>
                <button
                  onClick={() => setSelectedRiddle(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-8 custom-scrollbar">
                <h2 className="mb-6 text-2xl font-black text-slate-800 tracking-tight">{selectedRiddle.title}</h2>

                <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
                  <img
                    src={selectedRiddle.imageUrl}
                    alt={selectedRiddle.altText || selectedRiddle.title}
                    className="w-full object-contain bg-slate-50"
                  />
                </div>

                {/* Game Logic */}
                {!showAnswer ? (
                  <div className="space-y-6">
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
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
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
                      <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-amber-50 p-5 border border-amber-100">
                        <p className="flex items-center gap-2 text-sm font-bold text-amber-800 uppercase tracking-widest mb-1">
                          <span className="text-lg">💡</span> Hint
                        </p>
                        <p className="text-amber-900 font-medium">{selectedRiddle.hint}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-in zoom-in-95 duration-300 space-y-6">
                    <div className="rounded-3xl bg-indigo-600 p-8 text-center text-white shadow-xl">
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-indigo-200">The Answer is:</p>
                      <h3 className="text-3xl font-black">{selectedRiddle.answer}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedRiddle(null)}
                      className="w-full rounded-2xl bg-slate-800 py-4 font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-slate-700 hover:scale-[1.02]"
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
