'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Shuffle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { initialJokes } from '@/lib/initial-data';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

interface Joke {
  id: number;
  question: string;
  answer: string;
  category: string;
  status: string;
  /** @deprecated Use question field instead */
  joke?: string;
}

const jokeCategories = [
  {
    title: 'Classic Dad Jokes',
    description: 'Timeless classics that never fail to get an eye-roll.',
    icon: '😄',
    color: 'yellow',
  },
  {
    title: 'Tech Geek Dad Jokes',
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel');

  // Load jokes from local storage
  useEffect(() => {
    const allJokes = getItem<Joke[]>(STORAGE_KEYS.JOKES, initialJokes);
    // Filter only published jokes and ensure they have the new format
    const publishedJokes = allJokes
      .filter((j: Joke) => j.status === 'published')
      .map((j: Joke) => ({
        ...j,
        question: j.question || j.joke || 'No question',
        answer: j.answer || '',
      }));
    
    // Shuffle jokes for random order
    const shuffled = [...publishedJokes].sort(() => Math.random() - 0.5);
    setJokes(shuffled);
    setIsLoading(false);
  }, []);

  // Filter jokes by category
  const filteredJokes = selectedCategory
    ? jokes.filter((j) => j.category === selectedCategory)
    : jokes;

  const currentJoke = filteredJokes[currentIndex];

  // Navigation handlers
  const goToNext = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % filteredJokes.length);
  }, [filteredJokes.length]);

  const goToPrevious = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + filteredJokes.length) % filteredJokes.length);
  }, [filteredJokes.length]);

  const shuffleJokes = useCallback(() => {
    setShowAnswer(false);
    setJokes((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  }, []);

  const resetToStart = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex(0);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'carousel') return;
      
      switch (e.key) {
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case ' ': // Spacebar
          e.preventDefault();
          setShowAnswer((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, viewMode]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
          <p className="text-xl text-gray-600">Loading jokes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 text-gray-700 transition-all hover:bg-white/80 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('carousel')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'carousel' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
            >
              One by One
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-white/60 text-gray-700 hover:bg-white/80'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        <h1 className="mb-4 text-center text-4xl font-bold text-gray-800">
          😄 Dad Jokes
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-gray-600">
          Get ready for some serious eye-rolling with our collection of dad jokes!
          {viewMode === 'carousel' && (
            <span className="block mt-2 text-sm text-gray-500">
              Use ← → arrow keys to navigate, Space to reveal answer
            </span>
          )}
        </p>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setCurrentIndex(0);
              setShowAnswer(false);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-yellow-100'
            }`}
          >
            All
          </button>
          {jokeCategories.map((category) => (
            <button
              key={category.title}
              onClick={() => {
                setSelectedCategory(category.title);
                setCurrentIndex(0);
                setShowAnswer(false);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category.title
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-yellow-100'
              }`}
            >
              {category.icon} {category.title}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-6 text-center text-sm text-gray-500">
          {filteredJokes.length > 0 ? (
            <span>
              Showing {currentIndex + 1} of {filteredJokes.length} jokes
              {selectedCategory && ` in ${selectedCategory}`}
            </span>
          ) : (
            <span>No jokes found in this category</span>
          )}
        </div>

        {/* Carousel View */}
        {viewMode === 'carousel' && filteredJokes.length > 0 && currentJoke && (
          <div className="mb-8">
            {/* Joke Card */}
            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentJoke.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-white p-8 shadow-lg"
                >
                  {/* Category Badge */}
                  <div className="mb-4 flex justify-center">
                    <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      {currentJoke.category}
                    </span>
                  </div>

                  {/* Question */}
                  <h2 className="mb-6 text-center text-2xl font-medium text-gray-800">
                    {currentJoke.question}
                  </h2>

                  {/* Answer Section */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="mb-4 inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white transition-all hover:bg-yellow-600 hover:shadow-md"
                    >
                      {showAnswer ? (
                        <>
                          <EyeOff className="h-5 w-5" />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="h-5 w-5" />
                          Reveal Answer
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {showAnswer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full overflow-hidden"
                        >
                          <div className="rounded-xl bg-yellow-50 p-6 text-center">
                            <p className="text-xl font-semibold text-yellow-800">
                              {currentJoke.answer || '🤔 No punchline available'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={goToPrevious}
                disabled={filteredJokes.length <= 1}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>

              <button
                onClick={shuffleJokes}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md transition-all hover:bg-gray-50"
                title="Shuffle Jokes"
              >
                <Shuffle className="h-5 w-5" />
                Shuffle
              </button>

              <button
                onClick={resetToStart}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md transition-all hover:bg-gray-50"
                title="Start Over"
              >
                <RefreshCw className="h-5 w-5" />
                Restart
              </button>

              <button
                onClick={goToNext}
                disabled={filteredJokes.length <= 1}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredJokes.map((joke, index) => (
              <JokeListItem key={joke.id} joke={joke} index={index + 1} />
            ))}
            {filteredJokes.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center shadow-md">
                <p className="text-gray-500">No jokes found in this category.</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Info Cards - Only show in carousel mode */}
        {viewMode === 'carousel' && !selectedCategory && (
          <div className="mt-12">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Browse by Category
            </h2>
            <div className="grid gap-6 md:grid-cols-2" role="list" aria-label="Joke categories">
              {jokeCategories.map((category) => (
                <button
                  key={category.title}
                  onClick={() => setSelectedCategory(category.title)}
                  className="rounded-xl bg-white p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
                  role="listitem"
                  aria-label={`${category.title}: ${category.description}`}
                >
                  <span className="mb-4 block text-4xl" aria-hidden="true">{category.icon}</span>
                  <h2 className="mb-2 text-xl font-semibold text-gray-800">
                    {category.title}
                  </h2>
                  <p className="text-gray-600">{category.description}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {jokes.filter((j) => j.category === category.title).length} jokes
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Joke List Item Component
function JokeListItem({ joke, index }: { joke: Joke; index: number }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-400">#{index}</span>
              <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                {joke.category}
              </span>
            </div>
            <p className="text-lg text-gray-800">{joke.question}</p>
          </div>
          <div className="text-gray-400">
            {isOpen ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t bg-yellow-50 px-6 py-4">
              <p className="text-lg font-medium text-yellow-800">
                {joke.answer || '🤔 No punchline available'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
