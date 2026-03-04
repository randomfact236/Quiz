'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { initialJokes } from '@/lib/initial-data';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

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

const defaultJokeCategories = [
  { id: 1, name: 'Classic Dad Jokes', emoji: '😂', description: 'Timeless classics that never fail to get an eye-roll.' },
  { id: 2, name: 'Programming Jokes', emoji: '💻', description: 'Programming and tech humor for the nerdy dad.' },
  { id: 3, name: 'Parenting Dad Jokes', emoji: '👶', description: 'Jokes about the adventures of raising kids.' },
  { id: 4, name: 'Work Office Dad Jokes', emoji: '💼', description: 'Corporate humor for the 9-to-5 dad.' },
];

export default function JokesPage(): JSX.Element {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'random'>('newest');
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [jokeOfTheDay, setJokeOfTheDay] = useState<Joke | null>(null);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

  const [jokeCategories, setJokeCategories] = useState<typeof defaultJokeCategories>([]);

  // Voting state
  const [votedJokes, setVotedJokes] = useState<{ [key: string]: 'like' | 'dislike' }>({});
  const [isVoting, setIsVoting] = useState<{ [key: string]: boolean }>({});

  // Reset to first page when filtering or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortOrder]);

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVote = async (e: React.MouseEvent, jokeId: string, type: 'like' | 'dislike') => {
    e.stopPropagation(); // Prevent card from flipping
    if (votedJokes[jokeId] || isVoting[jokeId]) return;

    try {
      setIsVoting(prev => ({ ...prev, [jokeId]: true }));

      // Since jokes are stored locally, we track vote counts in localStorage too.
      // Read current stored counts, increment, and save back.
      const storedCounts = getItem<{ [key: string]: { likes: number; dislikes: number } }>(
        STORAGE_KEYS.JOKE_VOTE_COUNTS,
        {}
      );
      const current = storedCounts[jokeId] || { likes: 0, dislikes: 0 };
      const updated = {
        ...current,
        [type === 'like' ? 'likes' : 'dislikes']: current[type === 'like' ? 'likes' : 'dislikes'] + 1,
      };
      const newCounts = { ...storedCounts, [jokeId]: updated };
      setItem(STORAGE_KEYS.JOKE_VOTE_COUNTS, newCounts);

      // Update local joke state to reflect new count
      setJokes(currentJokes =>
        currentJokes.map(j =>
          j.id === jokeId ? { ...j, likes: updated.likes, dislikes: updated.dislikes } : j
        )
      );

      // Update Joke of the Day if it's the one that was voted on
      if (jokeOfTheDay && jokeOfTheDay.id === jokeId) {
        setJokeOfTheDay({ ...jokeOfTheDay, likes: updated.likes, dislikes: updated.dislikes });
      }

      // Record vote in local storage to prevent multi-voting
      const newVotedState = { ...votedJokes, [jokeId]: type };
      setVotedJokes(newVotedState);
      setItem(STORAGE_KEYS.VOTED_JOKES, newVotedState);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(prev => ({ ...prev, [jokeId]: false }));
    }
  };

  useEffect(() => {
    // Load categories from local storage
    const categories = getItem(STORAGE_KEYS.JOKE_CATEGORIES, defaultJokeCategories);
    setJokeCategories(categories);

    // Load local voting history
    const savedVotes = getItem<{ [key: string]: 'like' | 'dislike' }>(STORAGE_KEYS.VOTED_JOKES, {});
    setVotedJokes(savedVotes);

    // Load jokes from local storage
    const allJokes = getItem(STORAGE_KEYS.JOKES, initialJokes);

    // Filter published and transform legacy jokes if necessary
    const processedJokes = allJokes
      .filter((j: Joke) => j.status === 'published')
      .map((j: Joke) => {
        // If we have setup and punchline, we're good
        if (j.setup && j.punchline) return j;

        // Handle legacy joke field by splitting at '?' or '.'
        const fullJoke = j.joke || '';
        let setup = fullJoke;
        let punchline = '';

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

    // Load persisted vote counts and apply to jokes
    const storedCounts = getItem<{ [key: string]: { likes: number; dislikes: number } }>(
      STORAGE_KEYS.JOKE_VOTE_COUNTS,
      {}
    );
    const hydratedJokes = processedJokes.map((j: Joke) => {
      const counts = storedCounts[j.id];
      return counts ? { ...j, likes: counts.likes, dislikes: counts.dislikes } : j;
    });

    setJokes(hydratedJokes);

    // Deterministic Joke of the Day based on date
    if (processedJokes.length > 0) {
      const today = new Date();
      // Use year, month, day to get a steady seed for the day
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      // Ensure we always pick the same index for a given day
      const dayIndex = seed % processedJokes.length;
      setJokeOfTheDay(hydratedJokes[dayIndex] ?? hydratedJokes[0] ?? null);
    }
  }, []);

  const handleShuffle = () => {
    setSortOrder('random');
    setRandomSeed(Math.random());
    setCurrentPage(1);
  };

  const displayedJokes = activeCategory
    ? jokes.filter(j => j.category === activeCategory || j.category === jokeCategories.find(c => c.name === activeCategory)?.name)
    : [...jokes]; // Clone to safely sort

  // Apply sorting
  if (sortOrder === 'newest') {
    // Fallback string compare or timestamp if available, otherwise just use order
    displayedJokes.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  } else if (sortOrder === 'random') {
    // Basic seeded shuffle utilizing character codes
    displayedJokes.sort((a, b) => {
      const charA = String(a.id).charCodeAt(0) || 1;
      const charB = String(b.id).charCodeAt(0) || 1;
      const hashA = (charA * randomSeed) % 1;
      const hashB = (charB * randomSeed) % 1;
      return hashA - hashB;
    });
  }

  // Pagination Logic
  const totalPages = Math.ceil(displayedJokes.length / ITEMS_PER_PAGE);
  const paginatedJokes = displayedJokes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
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
              <span className="text-xl">✨</span> Focus
            </h2>
          </div>

          {/* Main Grid Header Portion */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
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

              <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-inner w-full sm:w-auto">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${sortOrder === 'newest'
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Newest
                </button>
                <button
                  onClick={handleShuffle}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${sortOrder === 'random'
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                  Shuffle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Four Column Layout: Sidebar + Grid */}
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Combined Sidebar (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-[180px] md:top-[160px] space-y-10 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
              {/* Joke of the Day (Now starts directly at top) */}
              <div className="space-y-4">
                {jokeOfTheDay && (
                  <div
                    className="group relative min-h-[160px] grid grid-cols-1 w-full perspective-1000 cursor-pointer"
                    onClick={() => toggleFlip(jokeOfTheDay.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={flippedCards[jokeOfTheDay.id]}
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
                        <h2 className="mb-4 flex items-center justify-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                          Joke of the Day
                        </h2>
                        <blockquote className="mb-6 text-lg font-semibold text-gray-800 balance-text" aria-label="Joke setup">
                          &ldquo;{jokeOfTheDay.setup}&rdquo;
                        </blockquote>
                        <div className="mt-auto w-full px-2 flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleVote(e, jokeOfTheDay.id, 'like')}
                              disabled={!!votedJokes[jokeOfTheDay.id] || isVoting[jokeOfTheDay.id]}
                              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-all ${votedJokes[jokeOfTheDay.id] === 'like'
                                ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50'
                                }`}
                              aria-label="Like"
                            >
                              👍 {jokeOfTheDay.likes || 0}
                            </button>
                            <button
                              onClick={(e) => handleVote(e, jokeOfTheDay.id, 'dislike')}
                              disabled={!!votedJokes[jokeOfTheDay.id] || isVoting[jokeOfTheDay.id]}
                              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-all ${votedJokes[jokeOfTheDay.id] === 'dislike'
                                ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50'
                                }`}
                              aria-label="Dislike"
                            >
                              👎 {jokeOfTheDay.dislikes || 0}
                            </button>
                          </div>
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleVote(e, jokeOfTheDay.id, 'like')}
                              disabled={!!votedJokes[jokeOfTheDay.id] || isVoting[jokeOfTheDay.id]}
                              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-all ${votedJokes[jokeOfTheDay.id] === 'like'
                                ? 'bg-white text-orange-500 shadow-sm'
                                : 'bg-black/10 text-white hover:bg-black/20 disabled:opacity-50'
                                }`}
                              aria-label="Like"
                            >
                              👍 {jokeOfTheDay.likes || 0}
                            </button>
                            <button
                              onClick={(e) => handleVote(e, jokeOfTheDay.id, 'dislike')}
                              disabled={!!votedJokes[jokeOfTheDay.id] || isVoting[jokeOfTheDay.id]}
                              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-all ${votedJokes[jokeOfTheDay.id] === 'dislike'
                                ? 'bg-white text-orange-500 shadow-sm'
                                : 'bg-black/10 text-white hover:bg-black/20 disabled:opacity-50'
                                }`}
                              aria-label="Dislike"
                            >
                              👎 {jokeOfTheDay.dislikes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Topics / Categories */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">📁</span> Topics
                </h2>
                <div className="flex flex-col gap-3" role="list" aria-label="Joke categories">
                  <div
                    onClick={() => setActiveCategory(null)}
                    className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${activeCategory === null ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'
                      }`}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="text-3xl">🃏</span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">All Jokes</h3>
                      <p className="text-xs text-gray-500">The full collection</p>
                    </div>
                  </div>
                  {jokeCategories.map((category) => {
                    const isActive = activeCategory === category.name;
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
                        className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${isActive ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'
                          }`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        aria-label={`Filter by ${category.name}`}
                      >
                        <span className="text-3xl" aria-hidden="true">{category.emoji}</span>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            {category.name}
                          </h3>
                          {category.description && <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>}
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedJokes.map((joke) => (
                <div
                  key={joke.id}
                  className="group relative min-h-[120px] grid grid-cols-1 w-full perspective-1000 cursor-pointer"
                  onClick={() => toggleFlip(joke.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={flippedCards[joke.id]}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFlip(joke.id);
                    }
                  }}
                >
                  <div
                    className={`col-start-1 row-start-1 grid grid-cols-1 relative transition-all duration-500 transform-style-3d shadow-md hover:shadow-xl ${flippedCards[joke.id] ? 'rotate-y-180' : ''
                      }`}
                  >
                    {/* Front of card (Setup) */}
                    <div className="col-start-1 row-start-1 flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center backface-hidden border-2 border-transparent group-hover:border-orange-100">
                      <span className="absolute top-4 right-4 text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                      </span>
                      <p className="text-base font-bold text-gray-800 balance-text">
                        {joke.setup}
                      </p>

                      <div className="mt-auto pt-6 flex flex-col items-center gap-3 w-full">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={(e) => handleVote(e, joke.id, 'like')}
                            disabled={!!votedJokes[joke.id] || isVoting[joke.id]}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${votedJokes[joke.id] === 'like'
                              ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400 scale-105'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50'
                              }`}
                            aria-label="Like"
                          >
                            <span className="text-sm">👍</span> {joke.likes || 0}
                          </button>
                          <button
                            onClick={(e) => handleVote(e, joke.id, 'dislike')}
                            disabled={!!votedJokes[joke.id] || isVoting[joke.id]}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${votedJokes[joke.id] === 'dislike'
                              ? 'bg-orange-100 text-orange-600 shadow-sm ring-1 ring-orange-400 scale-105'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50'
                              }`}
                            aria-label="Dislike"
                          >
                            <span className="text-sm">👎</span> {joke.dislikes || 0}
                          </button>
                        </div>
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

                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/20">
                          <button
                            onClick={(e) => handleVote(e, joke.id, 'like')}
                            disabled={!!votedJokes[joke.id] || isVoting[joke.id]}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${votedJokes[joke.id] === 'like'
                              ? 'bg-white text-orange-500 shadow-md scale-105'
                              : 'bg-black/10 text-white hover:bg-black/20 disabled:opacity-50'
                              }`}
                            aria-label="Like"
                          >
                            <span className="text-sm">👍</span> {joke.likes || 0}
                          </button>
                          <button
                            onClick={(e) => handleVote(e, joke.id, 'dislike')}
                            disabled={!!votedJokes[joke.id] || isVoting[joke.id]}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${votedJokes[joke.id] === 'dislike'
                              ? 'bg-white text-orange-500 shadow-md scale-105'
                              : 'bg-black/10 text-white hover:bg-black/20 disabled:opacity-50'
                              }`}
                            aria-label="Dislike"
                          >
                            <span className="text-sm">👎</span> {joke.dislikes || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {paginatedJokes.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 py-16 text-center col-span-full">
                <span className="text-4xl mb-4 block">🏜️</span>
                <p className="text-xl font-medium text-gray-600">No jokes found for this category.</p>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="mt-4 rounded-lg bg-orange-500 px-6 py-2 font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Show All Jokes
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit"
                  aria-label="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`h-10 w-10 rounded-lg font-bold transition-all ${currentPage === i + 1
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-inherit"
                  aria-label="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
