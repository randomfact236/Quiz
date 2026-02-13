import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riddles',
  description: 'Challenge your mind with 20 chapters of riddles from easy to mind-bending.',
};

const riddleChapters = [
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
      return 'bg-green-100 text-green-700';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'Hard':
      return 'bg-orange-100 text-orange-700';
    case 'Expert':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function RiddlesPage(): JSX.Element {
  return (
    <main id="main-content" className="min-h-screen bg-secondary-50 px-4 py-12">
      <div className="container mx-auto">
        <h1 className="mb-4 text-center text-4xl font-bold text-secondary-900">
          🧩 Riddles
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-secondary-600">
          Challenge yourself with 20 chapters of mind-bending riddles!
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {riddleChapters.map((chapter) => (
            <div
              key={chapter.num}
              className="card hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{chapter.icon}</span>
                <span className="text-sm font-medium text-secondary-500">
                  Chapter {chapter.num}
                </span>
              </div>
              <h2 className="font-semibold text-secondary-900 mb-2">{chapter.title}</h2>
              <span
                className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(chapter.difficulty)}`}
              >
                {chapter.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}