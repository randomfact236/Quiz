'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

import { initialRiddles } from '@/lib/initial-data';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

interface Riddle {
  id: number;
  question: string;
  options: string[];
  correctOption: string;
  difficulty: string;
  chapter: string;
  status: string;
}

const ALL_CHAPTERS = [
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

export default function RiddlesPage(): JSX.Element {
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  useEffect(() => {
    const allRiddles = getItem(STORAGE_KEYS.RIDDLES, initialRiddles);
    const publishedRiddles = allRiddles.filter((r: Riddle) => r.status === 'published');
    setRiddles(publishedRiddles);
  }, []);

  const chapterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    riddles.forEach((r) => {
      counts[r.chapter] = (counts[r.chapter] || 0) + 1;
    });
    return counts;
  }, [riddles]);

  const filteredRiddles = useMemo(() => {
    if (!selectedChapter) {return riddles;}
    return riddles.filter((r) => r.chapter === selectedChapter);
  }, [riddles, selectedChapter]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white/60 hover:shadow-md">
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            <span className="mx-2">🎭</span>
            Riddles
            <span className="mx-2">🎭</span>
          </h1>
          <p className="text-lg text-gray-600">Challenge your brain!</p>
        </div>

        {/* Mode Selection Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2" role="group" aria-label="Game mode selection">
          {/* Timer Challenge Card */}
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <span className="text-4xl" aria-hidden="true">⏱️</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">Timer Challenge</h2>
            <p className="mb-6 text-gray-500">Race against time!</p>
            <button
              onClick={() => alert("Game mode coming soon!")}
              className="rounded-full bg-gradient-to-r from-pink-400 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
              aria-label="Start timer challenge mode"
            >
              Start Challenge
            </button>
          </div>

          {/* No Timer Challenge Card */}
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <span className="text-4xl" aria-hidden="true">♾️</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">No Timer Challenge</h2>
            <p className="mb-6 text-gray-500">Take your time</p>
            <button
              onClick={() => alert("Game mode coming soon!")}
              className="rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
              aria-label="Start practice mode without timer"
            >
              Practice Mode
            </button>
          </div>
        </div>

        {/* Browse by Chapter Section */}
        <div className="mb-6 text-center">
          <h2 className="mb-8 text-2xl font-bold text-gray-700">
            <span className="mr-2">📚</span>
            Browse by Chapter
          </h2>
        </div>

        {/* Chapter Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-12" role="group" aria-label="Riddle chapters">
          {ALL_CHAPTERS.map((chapter) => (
            <div
              key={chapter.title}
              onClick={() => setSelectedChapter(selectedChapter === chapter.title ? null : chapter.title)}
              className={`cursor-pointer rounded-xl p-5 text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg
                ${selectedChapter === chapter.title ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white'}
              `}
              role="button"
              aria-label={`${chapter.title} chapter with ${chapterCounts[chapter.title] || 0} riddles`}
              aria-pressed={selectedChapter === chapter.title}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedChapter(selectedChapter === chapter.title ? null : chapter.title);
                }
              }}
            >
              <div className="mb-3 flex justify-center">
                <span className="text-3xl" aria-hidden="true">{chapter.icon}</span>
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-800">{chapter.title}</h3>
              <p className="text-xs text-gray-500">{chapterCounts[chapter.title] || 0} Riddles</p>
            </div>
          ))}
        </div>

        {/* Riddles List */}
        <div className="space-y-6" aria-live="polite" aria-atomic="true">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedChapter ? `${selectedChapter} Riddles` : 'All Riddles'}
            </h2>
            {selectedChapter && (
              <button
                onClick={() => setSelectedChapter(null)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
                aria-label="Clear chapter filter"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="grid gap-4" role="list" aria-label={selectedChapter ? `${selectedChapter} riddles` : 'All riddles'}>
            {filteredRiddles.map((riddle) => (
              <div key={riddle.id} className="rounded-lg bg-white p-6 shadow-sm" role="listitem" aria-label={`Riddle: ${riddle.question}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${riddle.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      riddle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}
                    aria-label={`Difficulty: ${riddle.difficulty}`}
                  >
                    {riddle.difficulty.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{riddle.chapter}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{riddle.question}</h3>
                <details className="group">
                  <summary 
                    className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-sm font-medium list-none"
                    aria-label="Reveal answer"
                    aria-expanded="false"
                  >
                    Answer
                  </summary>
                  <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-md" aria-live="polite">
                    {riddle.options[riddle.correctOption.charCodeAt(0) - 65]}
                  </p>
                </details>
              </div>
            ))}
            {filteredRiddles.length === 0 && (
              <div className="text-center py-12 bg-white/50 rounded-xl" role="status">
                <p className="text-gray-500">No riddles found in this chapter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
