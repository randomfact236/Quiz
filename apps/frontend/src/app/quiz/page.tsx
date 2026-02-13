'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function QuizContent(): JSX.Element {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject');
  const chapter = searchParams.get('chapter');
  const mode = searchParams.get('mode');

  // If chapter is selected, show level selection
  if (subject && chapter) {
    return <LevelSelection subject={subject} chapter={chapter} />;
  }

  // If subject is selected, show chapter selection
  if (subject) {
    return <ChapterSelection subject={subject} />;
  }

  // If mode is timer or practice, show mode page
  if (mode === 'timer') {
    return <TimerChallengesPage />;
  }

  if (mode === 'practice') {
    return <PracticeModePage />;
  }

  // Default: show subject selection
  return <SubjectSelection />;
}

function SubjectSelection(): JSX.Element {
  const subjects = [
    { id: 'science', emoji: '🔬', name: 'Science' },
    { id: 'math', emoji: '🔢', name: 'Math' },
    { id: 'history', emoji: '📜', name: 'History' },
    { id: 'geography', emoji: '🌍', name: 'Geography' },
    { id: 'english', emoji: '📖', name: 'English' },
    { id: 'environment', emoji: '🌱', name: 'Environment' },
    { id: 'technology', emoji: '💻', name: 'Technology' },
    { id: 'business', emoji: '💼', name: 'Business' },
    { id: 'health', emoji: '💪', name: 'Health' },
    { id: 'parenting', emoji: '👶', name: 'Parenting' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30">
          ← Back to Home
        </Link>

        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          📚 Choose a Subject
        </h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {subjects.map((subj) => (
            <Link
              key={subj.id}
              href={`/quiz?subject=${subj.id}`}
              className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl"
            >
              <span className="text-4xl">{subj.emoji}</span>
              <span className="mt-2 font-bold text-gray-800">{subj.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function ChapterSelection({ subject }: { subject: string }): JSX.Element {
  const subjectInfo: Record<string, { emoji: string; name: string; chapters: string[] }> = {
    science: { 
      emoji: '🔬', 
      name: 'Science',
      chapters: ['Physics Basics', 'Chemistry Fundamentals', 'Biology Essentials', 'Earth Science', 'Astronomy', 'Scientific Method', 'Matter & Energy', 'Forces & Motion', 'Living Organisms', 'Ecosystems', 'Human Body', 'Cells & Genetics', 'Periodic Table', 'Chemical Reactions', 'Light & Sound', 'Electricity', 'Magnetism', 'Weather & Climate', 'Space Exploration', 'Scientific Discoveries']
    },
    math: { 
      emoji: '🔢', 
      name: 'Math',
      chapters: ['Arithmetic', 'Algebra Basics', 'Geometry', 'Fractions', 'Decimals', 'Percentages', 'Word Problems', 'Statistics', 'Probability', 'Ratios', 'Measurement', 'Time & Money', 'Patterns', 'Graphs', 'Equations', 'Angles', 'Shapes', 'Area & Perimeter', 'Volume', 'Problem Solving']
    },
    history: { 
      emoji: '📜', 
      name: 'History',
      chapters: ['Ancient Civilizations', 'Medieval Period', 'Renaissance', 'Industrial Revolution', 'World Wars', 'Cold War', 'Modern History', 'Revolutionary Movements', 'Famous Leaders', 'Ancient Egypt', 'Roman Empire', 'Greek Civilization', 'Asian History', 'American History', 'European History', 'African History', 'World Cultures', 'Historical Events', 'Archaeology', 'Historical Figures']
    },
    geography: { 
      emoji: '🌍', 
      name: 'Geography',
      chapters: ['World Continents', 'Countries', 'Capitals', 'Oceans & Seas', 'Mountains', 'Rivers & Lakes', 'Deserts', 'Climate Zones', 'Population', 'Natural Resources', 'Landmarks', 'Maps & Coordinates', 'Flags', 'Currencies', 'Languages', 'Cultures', 'Ecosystems', 'Natural Disasters', 'Urban Geography', 'Exploration']
    },
    english: { 
      emoji: '📖', 
      name: 'English',
      chapters: ['Grammar Basics', 'Vocabulary', 'Reading Comprehension', 'Writing Skills', 'Punctuation', 'Spelling', 'Parts of Speech', 'Sentence Structure', 'Literature', 'Poetry', 'Shakespeare', 'Novels', 'Short Stories', 'Essays', 'Creative Writing', 'Idioms', 'Synonyms & Antonyms', 'Homophones', 'Figures of Speech', 'Language History']
    },
    environment: { 
      emoji: '🌱', 
      name: 'Environment',
      chapters: ['Ecosystems', 'Climate Change', 'Renewable Energy', 'Conservation', 'Pollution', 'Recycling', 'Endangered Species', 'Biodiversity', 'Water Cycle', 'Carbon Footprint', 'Sustainable Living', 'Natural Resources', 'Deforestation', 'Oceans & Marine Life', 'Wildlife Protection', 'Green Technology', 'Environmental Laws', 'Global Warming', 'Habitats', 'Environmental Science']
    },
    technology: { 
      emoji: '💻', 
      name: 'Technology',
      chapters: ['Computer Basics', 'Internet', 'Programming', 'Software', 'Hardware', 'Networking', 'Cybersecurity', 'Artificial Intelligence', 'Mobile Technology', 'Cloud Computing', 'Data Science', 'Web Development', 'Operating Systems', 'Databases', 'Digital Communication', 'IoT', 'Blockchain', 'Robotics', 'Tech History', 'Future Tech']
    },
    business: { 
      emoji: '💼', 
      name: 'Business',
      chapters: ['Entrepreneurship', 'Marketing', 'Finance', 'Management', 'Economics', 'Accounting', 'Business Ethics', 'Leadership', 'Negotiation', 'Business Law', 'Investment', 'Banking', 'Stock Market', 'Startups', 'E-commerce', 'Global Business', 'Human Resources', 'Operations', 'Strategy', 'Business Communication']
    },
    health: { 
      emoji: '💪', 
      name: 'Health',
      chapters: ['Nutrition', 'Exercise', 'Mental Health', 'First Aid', 'Diseases', 'Medicine', 'Hygiene', 'Sleep', 'Stress Management', 'Healthy Lifestyle', 'Vitamins', 'Diet Plans', 'Fitness Goals', 'Body Systems', 'Common Illnesses', 'Prevention', 'Mental Wellness', 'Physical Therapy', 'Health Myths', 'Public Health']
    },
    parenting: { 
      emoji: '👶', 
      name: 'Parenting',
      chapters: ['Baby Care', 'Toddler Development', 'Child Psychology', 'Education', 'Discipline', 'Nutrition for Kids', 'Safety', 'Sleep Training', 'Potty Training', 'Screen Time', 'Sibling Rivalry', 'Teen Years', 'Communication', 'Building Confidence', 'Emotional Intelligence', 'Learning Disabilities', 'Gifted Children', 'Special Needs', 'Family Activities', 'Work-Life Balance']
    },
  };

  const info = subjectInfo[subject] || { emoji: '📚', name: subject, chapters: Array.from({length: 20}, (_, i) => `Chapter ${i + 1}`) };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/quiz" className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30">
          ← Back to Subjects
        </Link>

        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          {info.emoji} {info.name} {info.emoji}
        </h1>
        <p className="mb-8 text-center text-white/80">Select a Chapter</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {info.chapters.map((chapterName, index) => (
            <Link
              key={index}
              href={`/quiz?subject=${subject}&chapter=${index + 1}`}
              className="flex flex-col items-center rounded-xl bg-white/95 p-4 text-center shadow-md transition-all hover:scale-105 hover:bg-white hover:shadow-lg"
            >
              <span className="mb-1 text-lg font-bold text-gray-400">Ch.{index + 1}</span>
              <span className="text-sm font-medium text-gray-700">{chapterName}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function LevelSelection({ subject, chapter }: { subject: string; chapter: string }): JSX.Element {
  const subjectInfo: Record<string, { emoji: string; name: string }> = {
    science: { emoji: '🔬', name: 'Science' },
    math: { emoji: '🔢', name: 'Math' },
    history: { emoji: '📜', name: 'History' },
    geography: { emoji: '🌍', name: 'Geography' },
    english: { emoji: '📖', name: 'English' },
    environment: { emoji: '🌱', name: 'Environment' },
    technology: { emoji: '💻', name: 'Technology' },
    business: { emoji: '💼', name: 'Business' },
    health: { emoji: '💪', name: 'Health' },
    parenting: { emoji: '👶', name: 'Parenting' },
  };

  const info = subjectInfo[subject] || { emoji: '📚', name: subject };

  const levels = [
    { id: 'easy', color: 'bg-green-500', label: '🟢 EASY', sublabel: 'True or False', timer: '1:00 min' },
    { id: 'medium', color: 'bg-yellow-500', label: '🟡 MEDIUM', sublabel: '2 Options', timer: '1:30 min' },
    { id: 'hard', color: 'bg-orange-500', label: '🟠 HARD', sublabel: '3 Options', timer: '2:00 min' },
    { id: 'expert', color: 'bg-red-500', label: '🔴 EXPERT', sublabel: '4 Options', timer: '2:30 min' },
    { id: 'extreme', color: 'bg-gray-800', label: '⚫ EXTREME', sublabel: 'Text Answer', timer: '3:00 min' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/quiz?subject=${subject}`} className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30">
          ← Back to Chapters
        </Link>

        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          {info.emoji} Chapter {chapter} {info.emoji}
        </h1>
        <p className="mb-8 text-center text-white/80">{info.name}</p>

        {/* Normal Level Section */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
            <h2 className="text-xl font-bold text-white">📚 Normal Level</h2>
            <p className="text-sm text-white/80">Practice at your own pace - No time limit</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-5">
            {levels.map((level) => (
              <button
                key={`normal-${level.id}`}
                className={`rounded-xl ${level.color} p-4 text-center text-white transition-all hover:scale-105 hover:shadow-lg`}
              >
                <div className="font-bold">{level.label}</div>
                <div className="mt-2 text-xs">{level.sublabel}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Pick Section */}
        <div className="overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
            <h2 className="text-xl font-bold text-white">⚡ Quick Pick</h2>
            <p className="text-sm text-white/80">Time-bound challenge - Beat the clock!</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-5">
            {levels.map((level) => (
              <button
                key={`quick-${level.id}`}
                className={`rounded-xl ${level.color} p-4 text-center text-white transition-all hover:scale-105 hover:shadow-lg`}
              >
                <div className="font-bold">{level.label}</div>
                <div className="mt-2 text-xs">⏱️ {level.timer}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function TimerChallengesPage(): JSX.Element {
  const subjects = [
    { id: 'science', name: 'Science', emoji: '🔬' },
    { id: 'math', name: 'Math', emoji: '🔢' },
    { id: 'history', name: 'History', emoji: '📜' },
    { id: 'geography', name: 'Geography', emoji: '🌍' },
    { id: 'english', name: 'English', emoji: '📖' },
    { id: 'environment', name: 'Environment', emoji: '🌱' },
    { id: 'technology', name: 'Technology', emoji: '💻' },
    { id: 'business', name: 'Business', emoji: '💼' },
    { id: 'health', name: 'Health', emoji: '💪' },
    { id: 'parenting', name: 'Parenting', emoji: '👶' },
  ];

  const levels = [
    { id: 'easy', color: 'bg-green-500', label: '🟢 EASY' },
    { id: 'medium', color: 'bg-yellow-500', label: '🟡 MEDIUM' },
    { id: 'hard', color: 'bg-orange-500', label: '🟠 HARD' },
    { id: 'expert', color: 'bg-red-500', label: '🔴 EXPERT' },
    { id: 'extreme', color: 'bg-gray-800', label: '⚫ EXTREME' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30">
          ← Back to Home
        </Link>

        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          ⏱️ Timer Challenges ⏱️
        </h1>

        {/* Subject-wise Mix */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4">
            <h2 className="text-xl font-bold text-white">📚 Subject-wise Mix</h2>
            <p className="text-sm text-white/80">Choose level - All 20 chapters mixed per subject</p>
          </div>
          <div className="p-4">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {levels.map((level) => (
                <button
                  key={`subject-${level.id}`}
                  className={`rounded-xl ${level.color} p-3 text-center text-white transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <div className="font-bold text-sm">{level.label}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  className="rounded-xl bg-gradient-to-r from-teal-100 to-emerald-100 p-3 text-center transition-all hover:scale-105 hover:shadow-lg border border-teal-200"
                >
                  <div className="text-xl">{subject.emoji}</div>
                  <div className="text-xs font-semibold text-teal-800">{subject.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level-wise Mix */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            <h2 className="text-xl font-bold text-white">🌈 Level-wise Mix (All Subjects)</h2>
            <p className="text-sm text-white/80">Same level, all subjects mixed</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-5">
            {levels.map((level) => (
              <button
                key={level.id}
                className={`rounded-xl ${level.color} p-4 text-center text-white transition-all hover:scale-105 hover:shadow-lg`}
              >
                <div className="font-bold">{level.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Complete Mix */}
        <div className="overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4">
            <h2 className="text-xl font-bold text-white">🔥 Complete Mix</h2>
            <p className="text-sm text-white/80">All subjects, all levels, all chapters mixed!</p>
          </div>
          <div className="p-4">
            <button className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-center text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg">
              🌟 START COMPLETE MIX
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function PracticeModePage(): JSX.Element {
  const subjects = [
    { id: 'science', name: 'Science', emoji: '🔬' },
    { id: 'math', name: 'Math', emoji: '🔢' },
    { id: 'history', name: 'History', emoji: '📜' },
    { id: 'geography', name: 'Geography', emoji: '🌍' },
    { id: 'english', name: 'English', emoji: '📖' },
    { id: 'environment', name: 'Environment', emoji: '🌱' },
    { id: 'technology', name: 'Technology', emoji: '💻' },
    { id: 'business', name: 'Business', emoji: '💼' },
    { id: 'health', name: 'Health', emoji: '💪' },
    { id: 'parenting', name: 'Parenting', emoji: '👶' },
  ];

  const levels = [
    { id: 'easy', color: 'bg-green-500', label: '🟢 EASY' },
    { id: 'medium', color: 'bg-yellow-500', label: '🟡 MEDIUM' },
    { id: 'hard', color: 'bg-orange-500', label: '🟠 HARD' },
    { id: 'expert', color: 'bg-red-500', label: '🔴 EXPERT' },
    { id: 'extreme', color: 'bg-gray-800', label: '⚫ EXTREME' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30">
          ← Back to Home
        </Link>

        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          🎯 Practice Mode 🎯
        </h1>

        {/* Subject-wise Mix */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4">
            <h2 className="text-xl font-bold text-white">📚 Subject-wise Mix</h2>
            <p className="text-sm text-white/80">Choose level - All 20 chapters mixed per subject</p>
          </div>
          <div className="p-4">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {levels.map((level) => (
                <button
                  key={`subject-${level.id}`}
                  className={`rounded-xl ${level.color} p-3 text-center text-white transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <div className="font-bold text-sm">{level.label}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  className="rounded-xl bg-gradient-to-r from-cyan-100 to-blue-100 p-3 text-center transition-all hover:scale-105 hover:shadow-lg border border-cyan-200"
                >
                  <div className="text-xl">{subject.emoji}</div>
                  <div className="text-xs font-semibold text-cyan-800">{subject.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level-wise Mix */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4">
            <h2 className="text-xl font-bold text-white">🌈 Level-wise Mix (All Subjects)</h2>
            <p className="text-sm text-white/80">Same level, all subjects mixed - No timer</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-5">
            {levels.map((level) => (
              <button
                key={level.id}
                className={`rounded-xl ${level.color} p-4 text-center text-white transition-all hover:scale-105 hover:shadow-lg`}
              >
                <div className="font-bold">{level.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Complete Mix */}
        <div className="overflow-hidden rounded-2xl bg-white/95 shadow-lg">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
            <h2 className="text-xl font-bold text-white">🔥 Complete Mix</h2>
            <p className="text-sm text-white/80">Ultimate practice - No timer</p>
          </div>
          <div className="p-4">
            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 p-6 text-center text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg">
              🌟 START COMPLETE MIX
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QuizPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]"><p className="text-xl text-white">Loading...</p></div>}>
      <QuizContent />
    </Suspense>
  );
}
