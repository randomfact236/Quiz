'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { initialJokes } from '@/lib/initial-data';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

interface Joke {
  id: number;
  setup: string;
  punchline: string;
  joke?: string; // Legacy field
  category: string;
  status: string;
}

const jokeCategories = [
  {
    title: 'Classic Dad Jokes',
    description: 'Timeless classics that never fail to get an eye-roll.',
    icon: '😄',
    color: 'yellow',
  },
  {
    title: 'Programming Jokes',
    description: 'Programming and tech humor for the nerdy dad.',
    icon: '💻',
    color: 'blue',
  },
  {
    title: 'Parenting Dad Jokes',
    description: 'Jokes about the adventures of raising kids.',
    icon: '👶',
    color: 'pink',
  },
  {
    title: 'Work Office Dad Jokes',
    description: 'Corporate humor for the 9-to-5 dad.',
    icon: '💼',
    color: 'gray',
  },
];

export default function JokesPage(): JSX.Element {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'random'>('newest');
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [jokeOfTheDay, setJokeOfTheDay] = useState<Joke | null>(null);
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  const toggleFlip = (id: number) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
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

    setJokes(processedJokes);

    // Deterministic Joke of the Day based on date
    if (processedJokes.length > 0) {
      const today = new Date();
      // Use year, month, day to get a steady seed for the day
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      // Ensure we always pick the same index for a given day
      const dayIndex = seed % processedJokes.length;
      setJokeOfTheDay(processedJokes[dayIndex] ?? processedJokes[0] ?? null);
    }
  }, []);

  const handleShuffle = () => {
    setSortOrder('random');
    setRandomSeed(Math.random());
  };

  const displayedJokes = activeCategory
    ? jokes.filter(j => j.category === activeCategory || j.category === jokeCategories.find(c => c.title === activeCategory)?.title)
    : [...jokes]; // Clone to safely sort

  // Apply sorting
  if (sortOrder === 'newest') {
    displayedJokes.sort((a, b) => b.id - a.id);
  } else if (sortOrder === 'random') {
    // Basic seeded shuffle for the current render loop
    displayedJokes.sort((a, b) => {
      const hashA = (a.id * randomSeed) % 1;
      const hashB = (b.id * randomSeed) % 1;
      return hashA - hashB;
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar: Joke of the Day & Categories */}
          <div className="space-y-8 lg:col-span-1">
            {/* Dynamic Joke of the Day */}
            {jokeOfTheDay && (
              <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-orange-100" aria-live="polite" aria-atomic="true">
                <h2 className="mb-4 text-center text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  <span className="text-2xl">🌟</span> Joke of the Day
                </h2>
                <blockquote className="text-center text-lg font-medium text-gray-800 mb-3" aria-label="Joke setup">
                  &ldquo;{jokeOfTheDay.setup}&rdquo;
                </blockquote>
                <p className="text-center text-md text-orange-600 font-bold italic" aria-label="Joke punchline">
                  {jokeOfTheDay.punchline}
                </p>
                <div className="mt-4 flex justify-center">
                  <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                    {jokeOfTheDay.category}
                  </span>
                </div>
              </div>
            )}

            {/* Categories */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-800">Categories</h2>
              <div className="flex flex-col gap-3" role="list" aria-label="Joke categories">
                {jokeCategories.map((category) => {
                  const isActive = activeCategory === category.title;
                  return (
                    <div
                      key={category.title}
                      onClick={() => setActiveCategory(isActive ? null : category.title)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveCategory(isActive ? null : category.title);
                        }
                      }}
                      className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition-all hover:translate-x-1 hover:shadow-md border-2 flex items-center gap-4 ${isActive ? 'border-orange-500 ring-1 ring-orange-200' : 'border-transparent'
                        }`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      aria-label={`Filter by ${category.title}`}
                    >
                      <span className="text-3xl" aria-hidden="true">{category.icon}</span>
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          {category.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content: Flashcards Grid */}
          <div className="lg:col-span-2" aria-live="polite" aria-atomic="true">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeCategory ? `${activeCategory} (${displayedJokes.length})` : `All Jokes (${jokes.length})`}
                </h2>
                {activeCategory && (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 transition-colors whitespace-nowrap"
                  >
                    Clear ✕
                  </button>
                )}
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${sortOrder === 'newest'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Newest
                </button>
                <button
                  onClick={handleShuffle}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${sortOrder === 'random'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                  Shuffle
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">

              {displayedJokes.map((joke) => (
                <div
                  key={joke.id}
                  className="group relative h-64 w-full perspective-1000 cursor-pointer"
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
                    className={`relative h-full w-full rounded-2xl transition-all duration-500 transform-style-3d shadow-md hover:shadow-xl ${flippedCards[joke.id] ? 'rotate-y-180' : ''
                      }`}
                  >
                    {/* Front of card (Setup) */}
                    <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white p-8 text-center backface-hidden border-2 border-transparent group-hover:border-orange-100">
                      <span className="absolute top-4 right-4 text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                      </span>
                      <p className="text-xl font-bold text-gray-800 balance-text">
                        {joke.setup}
                      </p>
                      <p className="absolute bottom-4 text-xs font-semibold uppercase tracking-wider text-orange-400">
                        Click to flip
                      </p>
                    </div>

                    {/* Back of card (Punchline) */}
                    <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-8 text-center text-white backface-hidden rotate-y-180">
                      <p className="text-2xl font-bold italic drop-shadow-sm balance-text">
                        {joke.punchline}
                      </p>
                      <div className="absolute bottom-4 flex w-full justify-center">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                          {joke.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {displayedJokes.length === 0 && (
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
          </div>
        </div>
      </div>
    </main>
  );
}
