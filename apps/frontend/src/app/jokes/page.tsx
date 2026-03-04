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
  }, []);

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Joke categories">
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
              <p className="text-sm text-gray-600">{category.description}</p>
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

        {/* Jokes List Table */}
        <div className="mt-12" aria-live="polite" aria-atomic="true">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">All Jokes</h2>

          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-16">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Question</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Answer</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-32">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jokes.map((joke) => (
                    <tr key={joke.id} className="transition-colors hover:bg-yellow-50/30">
                      <td className="px-6 py-4 text-sm font-medium text-gray-400">
                        #{joke.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-base font-semibold text-gray-800">{joke.setup}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-base text-gray-700">{joke.punchline}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800 whitespace-nowrap">
                          {joke.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {jokes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No jokes found. Check back later!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
