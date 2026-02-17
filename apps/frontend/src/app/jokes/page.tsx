'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { initialJokes } from '@/lib/initial-data';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

interface Joke {
  id: number;
  joke: string;
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

  useEffect(() => {
    // Load jokes from local storage
    const allJokes = getItem(STORAGE_KEYS.JOKES, initialJokes);
    // Filter only published jokes
    const publishedJokes = allJokes.filter((j: Joke) => j.status === 'published');
    setJokes(publishedJokes);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
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

        <div className="grid gap-6 md:grid-cols-2" role="list" aria-label="Joke categories">
          {jokeCategories.map((category) => (
            <div
              key={category.title}
              className="cursor-pointer rounded-xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
              role="listitem"
              tabIndex={0}
              aria-label={`${category.title}: ${category.description}`}
            >
              <span className="text-4xl mb-4 block" aria-hidden="true">{category.icon}</span>
              <h2 className="mb-2 text-xl font-semibold text-gray-800">
                {category.title}
              </h2>
              <p className="text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-white p-8 shadow-lg" aria-live="polite" aria-atomic="true">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
            Joke of the Day
          </h2>
          <blockquote className="text-center text-xl text-gray-700 italic" aria-label="Joke content">
            &ldquo;Why don&apos;t scientists trust atoms? Because they make up everything!&rdquo;
          </blockquote>
          <p className="mt-4 text-center text-gray-500">😂 Classic Dad Joke</p>
        </div>

        {/* Jokes List */}
        <div className="mt-12" aria-live="polite" aria-atomic="true">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">All Jokes</h2>
          <div className="grid gap-4" role="list" aria-label="Jokes list">
            {jokes.map((joke) => (
              <div key={joke.id} className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md" role="listitem" aria-label={`Joke in category ${joke.category}`}>
                <p className="text-lg text-gray-800">{joke.joke}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                    {joke.category}
                  </span>
                </div>
              </div>
            ))}
            {jokes.length === 0 && (
              <p className="text-center text-gray-500" role="status">No jokes found. Check back later!</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
