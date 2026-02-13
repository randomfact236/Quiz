'use client';
import { CollapsibleSection } from '@/components/CollapsibleSection';

const normalChapters = [
  { num: 1, title: 'Trick Questions', difficulty: 'Easy', icon: '🎯' },
  { num: 2, title: 'Puzzle Stories', difficulty: 'Easy', icon: '📖' },
  { num: 3, title: 'Number Riddles', difficulty: 'Medium', icon: '🔢' },
  { num: 4, title: 'Classic Riddles', difficulty: 'Easy', icon: '📜' },
  { num: 5, title: 'Brain Teasers', difficulty: 'Medium', icon: '🧠' },
  { num: 6, title: 'Funny Riddles', difficulty: 'Easy', icon: '😂' },
  { num: 7, title: 'Mystery Riddles', difficulty: 'Medium', icon: '🔍' },
  { num: 8, title: 'Everyday Objects', difficulty: 'Easy', icon: '🏺' },
  { num: 9, title: 'Lateral Thinking', difficulty: 'Hard', icon: '🔄' },
  { num: 10, title: 'Wordplay', difficulty: 'Medium', icon: '📝' },
];

const quickChapters = [
  { num: 11, title: 'Visual Riddles', difficulty: 'Medium', icon: '👁️' },
  { num: 12, title: 'Pattern Recognition', difficulty: 'Hard', icon: '🔲' },
  { num: 13, title: 'Short & Quick', difficulty: 'Easy', icon: '⚡' },
  { num: 14, title: 'Long Story Riddles', difficulty: 'Medium', icon: '📚' },
  { num: 15, title: 'Kids Riddles', difficulty: 'Easy', icon: '🧒' },
  { num: 16, title: 'Hardest Riddles', difficulty: 'Expert', icon: '💀' },
  { num: 17, title: 'Mixed Bag', difficulty: 'Medium', icon: '🎲' },
  { num: 18, title: 'Animal Riddles', difficulty: 'Easy', icon: '🦁' },
  { num: 19, title: 'Paradox Riddles', difficulty: 'Expert', icon: '🌀' },
  { num: 20, title: 'Deduction Riddles', difficulty: 'Hard', icon: '🔎' },
];

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Hard':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Expert':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function ChapterCard({ chapter }: { chapter: typeof normalChapters[0] }): JSX.Element {
  return (
    <div
      className="group cursor-pointer rounded-xl bg-white p-4 shadow-md transition-all hover:scale-105 hover:shadow-lg border border-gray-100 hover:border-blue-200"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl transition-transform group-hover:scale-110">{chapter.icon}</span>
        <span className="text-sm font-medium text-gray-500">
          Chapter {chapter.num}
        </span>
      </div>
      <h2 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{chapter.title}</h2>
      <span
        className={`inline-block rounded-full px-2 py-1 text-xs font-medium border ${getDifficultyColor(chapter.difficulty)}`}
      >
        {chapter.difficulty}
      </span>
    </div>
  );
}

export default function RiddlesPage(): JSX.Element {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-4 text-center text-4xl font-bold text-white">
          🧩 Riddles
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-white/80">
          Challenge yourself with 20 chapters of mind-bending riddles!
        </p>

        {/* Normal Section */}
        <CollapsibleSection
          title="Normal Section"
          subtitle="Classic riddles for thoughtful solving"
          icon="📚"
          headerColor="from-blue-500 to-indigo-500"
          defaultOpen={true}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {normalChapters.map((chapter) => (
              <ChapterCard key={chapter.num} chapter={chapter} />
            ))}
          </div>
        </CollapsibleSection>

        {/* Quick Section */}
        <CollapsibleSection
          title="Quick Section"
          subtitle="Fast-paced riddles for quick thinkers"
          icon="⚡"
          headerColor="from-orange-500 to-red-500"
          defaultOpen={true}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickChapters.map((chapter) => (
              <ChapterCard key={chapter.num} chapter={chapter} />
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </main>
  );
}
