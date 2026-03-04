'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';

import { initialJokes } from '@/lib/initial-data';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Joke {
  id: string;
  setup: string;
  punchline: string;
  joke?: string; // Legacy field
  category: string;
  status: string;
  likes?: number;
  dislikes?: number;
}

// ─── Constants (outside component to avoid recreation on every render) ────────

const ITEMS_PER_PAGE = 12;

const defaultJokeCategories = [
  { id: 1, name: 'Classic Dad Jokes', emoji: '😂', description: 'Timeless classics that never fail to get an eye-roll.' },
  { id: 2, name: 'Programming Jokes', emoji: '💻', description: 'Programming and tech humor for the nerdy dad.' },
  { id: 3, name: 'Parenting Dad Jokes', emoji: '👶', description: 'Jokes about the adventures of raising kids.' },
  { id: 4, name: 'Work Office Dad Jokes', emoji: '💼', description: 'Corporate humor for the 9-to-5 dad.' },
];

// ─── Fisher-Yates seeded shuffle (full shuffle, not charCode hack) ─────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    // LCG pseudo-random: produces a different value each iteration
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── VoteButtons sub-component (eliminates 4× code duplication) ──────────────

interface VoteButtonsProps {
  jokeId: string;
  likes: number;
  dislikes: number;
  votedJokes: Record<string, 'like' | 'dislike'>;
  disabled?: boolean;
  onVote: (e: React.MouseEvent, jokeId: string, type: 'like' | 'dislike') => void;
  variant?: 'light' | 'dark';
}

function VoteButtons({ jokeId, likes, dislikes, votedJokes, disabled, onVote, variant = 'light' }: VoteButtonsProps) {
  const voted = votedJokes[jokeId];
  const base = 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed';
  const likeActive = variant === 'light' ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400 scale-105' : 'bg-white text-orange-500 shadow-md scale-105';
  const likeInactive = variant === 'light' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-black/10 text-white hover:bg-black/20';
  const dislikeActive = variant === 'light' ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400 scale-105' : 'bg-white text-orange-500 shadow-md scale-105';
  const dislikeInactive = variant === 'light' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-black/10 text-white hover:bg-black/20';

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={(e) => onVote(e, jokeId, 'like')}
        disabled={!!voted || disabled}
        className={`${base} ${voted === 'like' ? likeActive : likeInactive} ${!!voted || disabled ? 'opacity-50' : ''}`}
        aria-label={`Like this joke. ${likes} likes`}
      >
        <span className="text-sm">👍</span> {likes}
      </button>
      <button
        onClick={(e) => onVote(e, jokeId, 'dislike')}
        disabled={!!voted || disabled}
        className={`${base} ${voted === 'dislike' ? dislikeActive : dislikeInactive} ${!!voted || disabled ? 'opacity-50' : ''}`}
        aria-label={`Dislike this joke. ${dislikes} dislikes`}
      >
        <span className="text-sm">👎</span> {dislikes}
      </button>
    </div>
  );
}

// ─── Toast sub-component ──────────────────────────────────────────────────────

function VoteToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      aria-live="polite"
      role="status"
      className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
    >
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JokesPage(): JSX.Element {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'random' | 'top'>('newest');
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [jokeOfTheDay, setJokeOfTheDay] = useState<Joke | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [jokeCategories, setJokeCategories] = useState<typeof defaultJokeCategories>([]);

  // Voting state — use a ref for in-flight guard to avoid stale-closure race condition
  const [votedJokes, setVotedJokes] = useState<Record<string, 'like' | 'dislike'>>({});
  const inFlightVotes = useRef<Set<string>>(new Set());

  // Toast state
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  // Reset to first page when filtering, sorting, or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortOrder, searchQuery]);

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Voting — synchronous (no async needed, all ops are localStorage I/O)
  const handleVote = (e: React.MouseEvent, jokeId: string, type: 'like' | 'dislike') => {
    e.stopPropagation(); // Prevent card from flipping
    // Ref-based guard: avoids stale-closure race condition on rapid double-clicks
    if (votedJokes[jokeId] || inFlightVotes.current.has(jokeId)) return;
    inFlightVotes.current.add(jokeId);

    try {
      const voteKey = type === 'like' ? 'likes' : 'dislikes'; // Extract key once, not twice
      const storedCounts = getItem<Record<string, { likes: number; dislikes: number }>>(
        STORAGE_KEYS.JOKE_VOTE_COUNTS, {}
      );
      const current = storedCounts[jokeId] || { likes: 0, dislikes: 0 };
      const updated = { ...current, [voteKey]: current[voteKey] + 1 };
      setItem(STORAGE_KEYS.JOKE_VOTE_COUNTS, { ...storedCounts, [jokeId]: updated });

      // Update jokes list with functional setter (no stale closure)
      setJokes(curr =>
        curr.map(j => j.id === jokeId ? { ...j, likes: updated.likes, dislikes: updated.dislikes } : j)
      );

      // Update Joke of the Day with functional setter (no stale closure)
      setJokeOfTheDay(prev =>
        prev?.id === jokeId ? { ...prev, likes: updated.likes, dislikes: updated.dislikes } : prev
      );

      const newVotedState = { ...votedJokes, [jokeId]: type };
      setVotedJokes(newVotedState);
      setItem(STORAGE_KEYS.VOTED_JOKES, newVotedState);
      showToast(type === 'like' ? '👍 Liked!' : '👎 Disliked!');
    } finally {
      inFlightVotes.current.delete(jokeId);
    }
  };

  // Load all data on mount
  useEffect(() => {
    const categories = getItem(STORAGE_KEYS.JOKE_CATEGORIES, defaultJokeCategories);
    setJokeCategories(categories);

    const savedVotes = getItem<Record<string, 'like' | 'dislike'>>(STORAGE_KEYS.VOTED_JOKES, {});
    setVotedJokes(savedVotes);

    const allJokes = getItem(STORAGE_KEYS.JOKES, initialJokes);
    const processedJokes = allJokes
      .filter((j: Joke) => j.status === 'published')
      .map((j: Joke) => {
        if (j.setup && j.punchline) return j;
        const fullJoke = j.joke || '';
        let setup = fullJoke, punchline = '';
        if (fullJoke.includes('?')) {
          const parts = fullJoke.split('?');
          setup = parts[0] + '?';
          punchline = parts.slice(1).join('?').trim();
        } else if (fullJoke.includes('Because')) {
          const parts = fullJoke.split('Because');
          setup = parts[0]!.trim();
          punchline = 'Because ' + parts.slice(1).join('Because').trim();
        }
        return { ...j, setup, punchline };
      });

    const storedCounts = getItem<Record<string, { likes: number; dislikes: number }>>(
      STORAGE_KEYS.JOKE_VOTE_COUNTS, {}
    );
    const hydratedJokes = processedJokes.map((j: Joke) => {
      const counts = storedCounts[j.id];
      return counts ? { ...j, likes: counts.likes, dislikes: counts.dislikes } : j;
    });

    setJokes(hydratedJokes);

    // Deterministic Joke of the Day (same joke all day, changes at midnight)
    if (hydratedJokes.length > 0) {
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      setJokeOfTheDay(hydratedJokes[seed % hydratedJokes.length] ?? hydratedJokes[0] ?? null);
    }
  }, []);

  // Multi-tab sync: propagate vote changes from other browser tabs in real-time
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.JOKE_VOTE_COUNTS && e.newValue) {
        try {
          const counts = JSON.parse(e.newValue) as Record<string, { likes: number; dislikes: number }>;
          setJokes(curr => curr.map(j => counts[j.id] ? { ...j, ...counts[j.id] } : j));
          setJokeOfTheDay(prev => prev && counts[prev.id] ? { ...prev, ...counts[prev.id] } : prev);
        } catch { /* ignore malformed data */ }
      }
      if (e.key === STORAGE_KEYS.VOTED_JOKES && e.newValue) {
        try { setVotedJokes(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  const handleShuffle = () => {
    setSortOrder('random');
    // Use bitwise OR to get an integer seed from Math.random()
    setRandomSeed(Math.random() * 100_000 | 0);
    setCurrentPage(1);
  };

  // Memoized: filter + search + sort — recomputes only when dependencies change
  const displayedJokes = useMemo(() => {
    // Filter by category (single condition, not duplicated)
    let result = activeCategory
      ? jokes.filter(j => j.category === activeCategory)
      : [...jokes];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.setup.toLowerCase().includes(q) || j.punchline.toLowerCase().includes(q)
      );
    }

    // Sort: numeric subtraction for IDs, not lexicographic localeCompare
    if (sortOrder === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sortOrder === 'top') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortOrder === 'random') {
      result = seededShuffle(result, randomSeed);
    }

    return result;
  }, [jokes, activeCategory, searchQuery, sortOrder, randomSeed]);

  // Memoized: category joke counts for sidebar display
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jokes.forEach(j => { counts[j.category] = (counts[j.category] || 0) + 1; });
    return counts;
  }, [jokes]);

  // Pagination
  const totalPages = Math.ceil(displayedJokes.length / ITEMS_PER_PAGE);
  const paginatedJokes = displayedJokes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Scroll to the top of the grid using the element's actual position
  const scrollToGrid = () => {
    const el = document.getElementById('jokes-grid');
    if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
      <VoteToast message={toast.message} visible={toast.visible} />

      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white/60 px-4 py-2 text-gray-700 transition-all hover:bg-white/80 hover:shadow-md">
          ← Back to Home
        </Link>

        <h1 className="mb-4 text-center text-4xl font-bold text-gray-800">
          😄 Dad Jokes
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-gray-600">
          Get ready for some serious eye-rolling with our collection of dad jokes!
        </p>

        {/* Synchronized Header Row (Sticky) */}
        <div className="sticky top-[73px] md:top-[61px] z-30 grid gap-10 lg:grid-cols-4 mb-6 border-b border-gray-200 py-4 bg-yellow-50/80 backdrop-blur-md -mx-4 px-4 transition-shadow">
          {/* Sidebar Header Portion */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">✨</span> Focus
            </h2>
          </div>

          {/* Main Grid Header Portion */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                <h2 className="text-2xl font-black text-gray-800">
                  {activeCategory ? `${activeCategory} (${displayedJokes.length})` : `All Jokes (${jokes.length})`}
                </h2>
                <p className="hidden lg:block text-sm text-orange-600 font-semibold italic mt-0.5">
                  &ldquo;Laughter is the shortest distance between two people.&rdquo;
                </p>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-200 transition-colors shadow-sm"
                  >
                    Clear Filter ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search bar — filters by setup or punchline keyword */}
                <div className="relative flex-1 sm:w-48 sm:flex-none">
                  <input
                    type="search"
                    placeholder="Search jokes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-white/80 py-1.5 pl-4 pr-8 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400"
                    aria-label="Search jokes by keyword"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort controls: Newest | 🔥 Top (most liked) | Shuffle */}
                <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-inner">
                  <button
                    onClick={() => setSortOrder('newest')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'newest' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortOrder('top')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'top' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    🔥 Top
                  </button>
                  <button
                    onClick={handleShuffle}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortOrder === 'random' ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                    Shuffle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Four Column Layout: Sidebar + Grid */}
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Combined Sidebar (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-[180px] md:top-[160px] space-y-10 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">

              {/* Joke of the Day */}
              <div className="space-y-4">
                {jokeOfTheDay && (
                  <div
                    className="group relative min-h-[160px] grid grid-cols-1 w-full perspective-1000 cursor-pointer"
                    onClick={() => toggleFlip(jokeOfTheDay.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={flippedCards[jokeOfTheDay.id]}
                    aria-label={flippedCards[jokeOfTheDay.id] ? 'Flip card back to question' : 'Click to reveal the punchline'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFlip(jokeOfTheDay.id);
                      }
                    }}
                  >
                    <div className={`col-start-1 row-start-1 grid grid-cols-1 relative transition-all duration-500 transform-style-3d shadow-xl hover:shadow-2xl ${flippedCards[jokeOfTheDay.id] ? 'rotate-y-180' : ''}`}>
                      {/* Front of card (Setup) */}
                      <div className="col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center backface-hidden ring-1 ring-orange-100">
                        {/* Fixed: was <h2> — broken heading hierarchy. Now a <p> with visual styling. */}
                        <p className="mb-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                          Joke of the Day
                        </p>
                        <blockquote className="mb-6 text-lg font-semibold text-gray-800 balance-text" aria-label="Joke setup">
                          &ldquo;{jokeOfTheDay.setup}&rdquo;
                        </blockquote>
                        <div className="mt-auto w-full px-2 flex flex-col items-center gap-4">
                          <VoteButtons
                            jokeId={jokeOfTheDay.id}
                            likes={jokeOfTheDay.likes || 0}
                            dislikes={jokeOfTheDay.dislikes || 0}
                            votedJokes={votedJokes}
                            onVote={handleVote}
                            variant="light"
                          />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 animate-pulse">
                            Click to Reveal
                          </p>
                        </div>
                      </div>

                      {/* Back of card (Punchline) */}
                      <div className="col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-6 text-center text-white backface-hidden rotate-y-180">
                        <p className="text-lg font-bold italic drop-shadow-md balance-text">
                          {jokeOfTheDay.punchline}
                        </p>
                        <div className="mt-6 flex items-center justify-between w-full px-2">
                          <span className="rounded-full bg-white/25 px-3 py-1 text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-wider">
                            {jokeOfTheDay.category}
                          </span>
                          <VoteButtons
                            jokeId={jokeOfTheDay.id}
                            likes={jokeOfTheDay.likes || 0}
                            dislikes={jokeOfTheDay.dislikes || 0}
                            votedJokes={votedJokes}
                            onVote={handleVote}
                            variant="dark"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Topics / Categories with counts */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">📁</span> Topics
                </h2>
                <div className="flex flex-col gap-3" role="list" aria-label="Joke categories">
                  {/* "All Jokes" — now has aria-pressed and onKeyDown (was missing both) */}
                  <div
                    onClick={() => setActiveCategory(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveCategory(null); } }}
                    className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${activeCategory === null ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={activeCategory === null}
                    aria-label="Show all jokes"
                  >
                    <span className="text-3xl" aria-hidden="true">🃏</span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">All Jokes</h3>
                      <p className="text-xs text-gray-500">The full collection · <span className="font-bold text-orange-500">{jokes.length}</span></p>
                    </div>
                  </div>
                  {jokeCategories.map((category) => {
                    const isActive = activeCategory === category.name;
                    const count = categoryCounts[category.name] || 0;
                    return (
                      <div
                        key={category.id}
                        onClick={() => setActiveCategory(isActive ? null : category.name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveCategory(isActive ? null : category.name);
                          }
                        }}
                        className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${isActive ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        aria-label={`Filter by ${category.name}. ${count} jokes`}
                      >
                        <span className="text-3xl" aria-hidden="true">{category.emoji}</span>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            {category.name}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {category.description && <>{category.description} · </>}
                            <span className="font-bold text-orange-500">{count}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Main Content: Flashcards Grid (Spans 3 columns) */}
          <div className="lg:col-span-3 space-y-8" aria-live="polite" aria-atomic="true">
            {/* Search result summary */}
            {searchQuery.trim() && (
              <p className="text-sm text-gray-500 -mb-4">
                {displayedJokes.length === 0
                  ? `No jokes found for &ldquo;${searchQuery}&rdquo;`
                  : `${displayedJokes.length} joke${displayedJokes.length !== 1 ? 's' : ''} found for &ldquo;${searchQuery}&rdquo;`}
              </p>
            )}

            <div id="jokes-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedJokes.map((joke) => (
                <div
                  key={joke.id}
                  className="group relative min-h-[120px] grid grid-cols-1 w-full perspective-1000 cursor-pointer"
                  onClick={() => toggleFlip(joke.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={flippedCards[joke.id]}
                  aria-label={flippedCards[joke.id] ? 'Flip card back to question' : 'Click to reveal the punchline'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFlip(joke.id);
                    }
                  }}
                >
                  <div
                    className={`col-start-1 row-start-1 grid grid-cols-1 relative transition-all duration-500 transform-style-3d shadow-md hover:shadow-xl ${flippedCards[joke.id] ? 'rotate-y-180' : ''}`}
                  >
                    {/* Front of card (Setup) */}
                    <div className="col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center backface-hidden border-2 border-transparent group-hover:border-orange-100">
                      {/* aria-hidden: SVG is decorative, screen readers should skip it */}
                      <span className="absolute top-4 right-4 text-gray-300" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                      </span>
                      <p className="text-base font-bold text-gray-800 balance-text">
                        {joke.setup}
                      </p>

                      <div className="mt-auto pt-6 flex flex-col items-center gap-3 w-full">
                        <VoteButtons
                          jokeId={joke.id}
                          likes={joke.likes || 0}
                          dislikes={joke.dislikes || 0}
                          votedJokes={votedJokes}
                          onVote={handleVote}
                          variant="light"
                        />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 opacity-60">
                          Click to flip
                        </p>
                      </div>
                    </div>

                    {/* Back of card (Punchline) */}
                    <div className="col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-6 text-center text-white backface-hidden rotate-y-180 shadow-inner">
                      <p className="text-base font-bold italic drop-shadow-sm balance-text">
                        {joke.punchline}
                      </p>
                      <div className="mt-4 flex flex-col gap-3 w-full">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-sm uppercase self-center">
                          {joke.category}
                        </span>
                        <div className="pt-2 border-t border-white/20">
                          <VoteButtons
                            jokeId={joke.id}
                            likes={joke.likes || 0}
                            dislikes={joke.dislikes || 0}
                            votedJokes={votedJokes}
                            onVote={handleVote}
                            variant="dark"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {paginatedJokes.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 py-16 text-center col-span-full">
                <span className="text-4xl mb-4 block" aria-hidden="true">🏜️</span>
                <p className="text-xl font-medium text-gray-600">
                  {searchQuery ? `No jokes match "${searchQuery}"` : 'No jokes found for this category.'}
                </p>
                <button
                  onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
                  className="mt-4 rounded-lg bg-orange-500 px-6 py-2 font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Show All Jokes
                </button>
              </div>
            )}

            {/* Pagination Controls with ellipsis collapse */}
            {totalPages > 1 && (
              <div
                className="mt-12 flex items-center justify-center gap-2 flex-wrap"
                role="navigation"
                aria-label="Joke pages"
              >
                <button
                  onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); scrollToGrid(); }}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                {/* Ellipsis-collapsed pagination */}
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  const near = Math.abs(page - currentPage) <= 1;
                  const isEdge = page === 1 || page === totalPages;
                  const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                  const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return <span key={`e${i}`} className="w-10 text-center text-gray-400 font-bold select-none">…</span>;
                  }
                  if (!near && !isEdge) return null;

                  return (
                    <button
                      key={i}
                      onClick={() => { setCurrentPage(page); scrollToGrid(); }}
                      className={`h-10 w-10 rounded-lg font-bold transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); scrollToGrid(); }}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
