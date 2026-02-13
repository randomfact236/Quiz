'use client';

import { CollapsibleSection } from '@/components/CollapsibleSection';

const normalChapters = [
  { num: 1, title: 'Classic Dad Jokes', icon: '😄', count: 25 },
  { num: 2, title: 'Punny One-Liners', icon: '📝', count: 30 },
  { num: 3, title: 'Animal Jokes', icon: '🐶', count: 20 },
  { num: 4, title: 'Food & Cooking', icon: '🍕', count: 22 },
  { num: 5, title: 'Sports Humor', icon: '⚽', count: 18 },
  { num: 6, title: 'School & Education', icon: '🎓', count: 24 },
  { num: 7, title: 'Science Jokes', icon: '🔬', count: 20 },
  { num: 8, title: 'Math Puns', icon: '🔢', count: 19 },
  { num: 9, title: 'Music Jokes', icon: '🎵', count: 21 },
  { num: 10, title: 'Travel & Vacation', icon: '✈️', count: 23 },
];

const quickChapters = [
  { num: 11, title: 'Tech Geek Jokes', icon: '💻', count: 28 },
  { num: 12, title: 'Programming Puns', icon: '👨‍💻', count: 32 },
  { num: 13, title: 'Office Humor', icon: '💼', count: 26 },
  { num: 14, title: 'Meeting Jokes', icon: '📊', count: 18 },
  { num: 15, title: 'Parenting Jokes', icon: '👶', count: 35 },
  { num: 16, title: 'Marriage Humor', icon: '💑', count: 22 },
  { num: 17, title: 'Doctor Jokes', icon: '👨‍⚕️', count: 20 },
  { num: 18, title: 'Construction Puns', icon: '🏗️', count: 17 },
  { num: 19, title: 'Holiday Jokes', icon: '🎄', count: 24 },
  { num: 20, title: 'Birthday Humor', icon: '🎂', count: 19 },
];

function ChapterCard({ chapter }: { chapter: typeof normalChapters[0] }): JSX.Element {
  return (
    <div
      className="group cursor-pointer rounded-xl bg-white p-4 shadow-md transition-all hover:scale-105 hover:shadow-lg border border-gray-100 hover:border-yellow-200"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl transition-transform group-hover:scale-110">{chapter.icon}</span>
        <span className="text-sm font-medium text-gray-500">
          Chapter {chapter.num}
        </span>
      </div>
      <h2 className="font-semibold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">{chapter.title}</h2>
      <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 border border-yellow-200">
        {chapter.count} jokes
      </span>
    </div>
  );
}

export default function JokesPage(): JSX.Element {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-4 text-center text-4xl font-bold text-white">
          😄 Dad Jokes
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-white/80">
          Get ready for some serious eye-rolling with our collection of 400+ dad jokes!
        </p>

        {/* Normal Section */}
        <CollapsibleSection
          title="Normal Section"
          subtitle="Classic dad jokes for all occasions"
          icon="📚"
          headerColor="from-yellow-500 to-amber-500"
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
          subtitle="Quick laughs for busy dads"
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

        {/* Joke of the Day */}
        <div className="mt-8 rounded-2xl bg-white/95 p-8 shadow-lg">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            🌟 Joke of the Day
          </h2>
          <blockquote className="text-center text-xl text-gray-700 italic">
            &ldquo;Why don&apos;t scientists trust atoms? Because they make up everything!&rdquo;
          </blockquote>
          <p className="mt-4 text-center text-gray-500">😂 Classic Dad Joke</p>
        </div>
      </div>
    </main>
  );
}
