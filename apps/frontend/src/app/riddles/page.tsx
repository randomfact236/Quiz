import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Riddles',
  description: 'Challenge your mind with 20 chapters of riddles from easy to mind-bending.',
};

const riddleChapters = [
  { num: 1, title: 'Trick Questions', icon: '🤔', count: 85 },
  { num: 2, title: 'Puzzle Stories', icon: '📖', count: 100 },
  { num: 3, title: 'Logic Puzzles', icon: '🧩', count: 109 },
  { num: 4, title: 'Word Play', icon: '🔤', count: 72 },
  { num: 5, title: 'Math Riddles', icon: '🔢', count: 78 },
  { num: 6, title: 'Mystery Cases', icon: '🔍', count: 74 },
  { num: 7, title: 'Brain Teasers', icon: '🧠', count: 107 },
  { num: 8, title: 'Visual Puzzles', icon: '👁️', count: 90 },
  { num: 9, title: 'Lateral Thinking', icon: '💭', count: 79 },
  { num: 10, title: 'Classic Riddles', icon: '📜', count: 94 },
  { num: 11, title: 'Funny Riddles', icon: '😂', count: 88 },
  { num: 12, title: 'Mystery Riddles', icon: '🕵️', count: 82 },
  { num: 13, title: 'Everyday Objects', icon: '🏺', count: 76 },
  { num: 14, title: 'Wordplay', icon: '📝', count: 95 },
  { num: 15, title: 'Pattern Recognition', icon: '🔲', count: 67 },
  { num: 16, title: 'Short & Quick', icon: '⚡', count: 110 },
  { num: 17, title: 'Long Story Riddles', icon: '📚', count: 45 },
  { num: 18, title: 'Kids Riddles', icon: '🧒', count: 120 },
  { num: 19, title: 'Animal Riddles', icon: '🦁', count: 86 },
  { num: 20, title: 'Deduction Riddles', icon: '🔎', count: 71 },
];

export default function RiddlesPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8">
      <div className="mx-auto max-w-4xl">
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
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {/* Timer Challenge Card */}
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <span className="text-4xl">⏱️</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">Timer Challenge</h2>
            <p className="mb-6 text-gray-500">Race against time!</p>
            <button className="rounded-full bg-gradient-to-r from-pink-400 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg">
              All 1665 Riddles Mix
            </button>
          </div>

          {/* No Timer Challenge Card */}
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <span className="text-4xl">♾️</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">No Timer Challenge</h2>
            <p className="mb-6 text-gray-500">Take your time</p>
            <button className="rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg">
              All 1665 Riddles Mix
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {riddleChapters.map((chapter) => (
            <div
              key={chapter.num}
              className="cursor-pointer rounded-xl bg-white p-5 text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-3 flex justify-center">
                <span className="text-3xl">{chapter.icon}</span>
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-800">{chapter.title}</h3>
              <p className="text-xs text-gray-500">{chapter.count}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
