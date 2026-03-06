'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { GraduationCap, Briefcase, Gamepad2, Home, CheckCircle, Trophy, ChevronDown, ChevronUp, BookOpen, Puzzle } from 'lucide-react';
import { STORAGE_KEYS, getItem } from '@/lib/storage';
import { getChapterProgress } from '@/lib/progress';
import { loadQuestionsFromFile } from '@/lib/quiz-data-manager';

interface Subject {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: 'academic' | 'professional' | 'entertainment';
  order?: number;
}

interface CategorySection {
  id: 'academic' | 'professional' | 'entertainment';
  title: string;
  icon: React.ReactNode;
  colorClass: string;
}

const categories: CategorySection[] = [
  {
    id: 'academic',
    title: 'Academic',
    icon: <GraduationCap className="h-5 w-5" />,
    colorClass: 'text-blue-600',
  },
  {
    id: 'professional',
    title: 'Professional & Life',
    icon: <Briefcase className="h-5 w-5" />,
    colorClass: 'text-teal-600',
  },
  {
    id: 'entertainment',
    title: 'Entertainment & Culture',
    icon: <Gamepad2 className="h-5 w-5" />,
    colorClass: 'text-purple-600',
  },
];

// Map of icon keys to emoji or icon display
const iconDisplayMap: Record<string, string> = {
  'science': '🔬',
  'math': '🔢',
  'history': '📜',
  'geography': '🌍',
  'english': '📖',
  'environment': '🌱',
  'technology': '💻',
  'business': '💼',
  'health': '💪',
  'parenting': '👶',
  'book-open': '📚',
  'help-circle': '❓',
  'puzzle': '🧩',
  'image': '🖼️',
  'sparkles': '✨',
  'graduation-cap': '🎓',
  'briefcase': '💼',
  'gamepad-2': '🎮',
};

function getSubjectDisplay(emoji: string): string {
  // If it's a known icon key, use the mapped emoji
  if (iconDisplayMap[emoji]) {
    return iconDisplayMap[emoji];
  }
  // Otherwise, assume it's already an emoji
  return emoji;
}

function SubjectCard({ slug, emoji, name }: { slug: string; emoji: string; name: string }): JSX.Element {
  const display = getSubjectDisplay(emoji);

  return (
    <Link
      href={`/quiz?subject=${slug}`}
      className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl"
      aria-label={`Select ${name} subject`}
    >
      <span className="text-4xl" aria-hidden="true">{display}</span>
      <span className="mt-2 font-bold text-gray-800">{name}</span>
    </Link>
  );
}

function CategorySection({
  category,
  subjects,
}: {
  category: CategorySection;
  subjects: Subject[];
}): JSX.Element | null {
  if (subjects.length === 0) return null;

  return (
    <div className="mb-8">
      <div className={`mb-4 flex items-center gap-2 ${category.colorClass}`}>
        {category.icon}
        <h2 className="text-xl font-bold">{category.title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" role="list">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            slug={subject.slug}
            emoji={subject.emoji}
            name={subject.name}
          />
        ))}
      </div>
    </div>
  );
}

function SubjectSelection(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load subjects from localStorage
    const loadSubjects = () => {
      const storedSubjects = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
      // Sort by order field
      const sortedSubjects = storedSubjects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSubjects(sortedSubjects);
      setIsLoading(false);
    };

    loadSubjects();

    // Listen for storage changes (when admin updates subjects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SUBJECTS) {
        loadSubjects();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Group subjects by category and sort by order
  const subjectsByCategory = useMemo(() => {
    const grouped: { academic: Subject[]; professional: Subject[]; entertainment: Subject[] } = {
      academic: [],
      professional: [],
      entertainment: [],
    };

    subjects.forEach((subject) => {
      const category = subject.category;
      if (category === 'academic' || category === 'professional' || category === 'entertainment') {
        grouped[category].push(subject);
      }
    });

    return grouped;
  }, [subjects]);

  // Default subjects if none configured
  const defaultSubjects: Subject[] = [
    { id: 1, slug: 'science', name: 'Science', emoji: 'science', category: 'academic' },
    { id: 2, slug: 'math', name: 'Math', emoji: 'math', category: 'academic' },
    { id: 3, slug: 'history', name: 'History', emoji: 'history', category: 'academic' },
    { id: 4, slug: 'geography', name: 'Geography', emoji: 'geography', category: 'academic' },
    { id: 5, slug: 'english', name: 'English', emoji: 'english', category: 'academic' },
    { id: 6, slug: 'technology', name: 'Technology', emoji: 'technology', category: 'professional' },
    { id: 7, slug: 'business', name: 'Business', emoji: 'business', category: 'professional' },
    { id: 8, slug: 'health', name: 'Health', emoji: 'health', category: 'professional' },
    { id: 9, slug: 'parenting', name: 'Parenting', emoji: 'parenting', category: 'professional' },
  ];

  const displayByCategory = subjects.length > 0 ? subjectsByCategory : {
    academic: defaultSubjects.filter(s => s.category === 'academic'),
    professional: defaultSubjects.filter(s => s.category === 'professional'),
    entertainment: defaultSubjects.filter(s => s.category === 'entertainment'),
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Special Quiz Modes */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Link
          href="/"
          className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-center text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <Home className="mb-2 h-8 w-8" />
          <span className="font-bold">Back to Home</span>
        </Link>

        <Link
          href="/quiz/timer-challenge"
          className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-5 text-center text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <Puzzle className="mb-2 h-8 w-8" />
          <span className="font-bold">Timer Challenge</span>
        </Link>

        <Link
          href="/quiz/practice-mode"
          className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-center text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <BookOpen className="mb-2 h-8 w-8" />
          <span className="font-bold">Practice Mode</span>
        </Link>


      </div>

      {/* Subjects by Category */}
      <h1 className="mb-6 text-center text-3xl font-bold text-white">
        📚 Choose a Subject
      </h1>

      <div>
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            subjects={displayByCategory[category.id]}
          />
        ))}
      </div>
    </div>
  );
}

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status?: 'published' | 'draft' | 'trash';
}

interface ChapterInfo {
  name: string;
  questionCount: number;
  levels: Set<string>;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
}

function ChapterSelection({ subject }: { subject: string }): JSX.Element {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load questions from JSON file first, then fall back to localStorage
    const loadQuestions = async () => {
      let allQuestions: Record<string, Question[]> = {};
      
      try {
        const fileQuestions = await loadQuestionsFromFile();
        if (fileQuestions && Object.keys(fileQuestions).length > 0) {
          allQuestions = fileQuestions;
        } else {
          allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
        }
      } catch {
        allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
      }
      
      const subjectQuestions = allQuestions[subject] || [];

      const chapterMap = new Map<string, ChapterInfo>();

      subjectQuestions.forEach(q => {
        if (q.status === 'trash') return;

        const chapterName = q.chapter || 'General';

        if (!chapterMap.has(chapterName)) {
          const progress = getChapterProgress(subject, chapterName);

          chapterMap.set(chapterName, {
            name: chapterName,
            questionCount: 0,
            levels: new Set(),
            isCompleted: progress?.completed ?? false,
            bestScore: progress?.bestScore ?? 0,
            attempts: progress?.attempts ?? 0,
          });
        }

        const chapter = chapterMap.get(chapterName)!;
        chapter.questionCount++;
        chapter.levels.add(q.level);
      });

      const chapterArray = Array.from(chapterMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setChapters(chapterArray);
      setIsLoading(false);
    };

    loadQuestions();
  }, [subject]);

  if (isLoading) {
    return (
      <div>
        <Link
          href="/quiz"
          className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
        >
          ← Back to Subjects
        </Link>
        <div className="flex h-64 items-center justify-center">
          <div className="text-2xl text-white">Loading chapters...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/quiz"
        className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
      >
        ← Back to Subjects
      </Link>
      <h1 className="mb-8 text-center text-3xl font-bold text-white">
        📖 {subject.charAt(0).toUpperCase() + subject.slice(1)} - Select Chapter
      </h1>

      {chapters.length === 0 ? (
        <div className="rounded-2xl bg-white/95 p-8 text-center shadow-lg">
          <p className="text-gray-600">No chapters available for this subject yet.</p>
          <p className="mt-2 text-sm text-gray-500">Questions need to be added in the admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {chapters.map((chapter, index) => (
            <Link
              key={chapter.name}
              href={`/quiz?subject=${subject}&chapter=${encodeURIComponent(chapter.name)}`}
              className="flex items-center gap-4 rounded-2xl bg-white/95 p-5 shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${chapter.isCompleted
                ? 'bg-green-100 text-green-600'
                : chapter.attempts > 0
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-indigo-100 text-indigo-600'
                }`}>
                {chapter.isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{chapter.name}</h3>
                <p className="text-sm text-gray-500">
                  {chapter.questionCount} questions • {Array.from(chapter.levels).join(', ')}
                </p>
                {chapter.attempts > 0 && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <Trophy className="h-3 w-3" />
                      Best: {chapter.bestScore}
                    </span>
                    <span className="text-gray-400">
                      ({chapter.attempts} attempt{chapter.attempts !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>
              <span className="text-2xl text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const levels = ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'];
const levelEmojis: Record<string, string> = {
  'Easy': '🌱',
  'Medium': '🌿',
  'Hard': '🌲',
  'Expert': '🔥',
  'Extreme': '💀'
};
const levelColors: Record<string, string> = {
  'Easy': 'from-green-400 to-green-600',
  'Medium': 'from-blue-400 to-blue-600',
  'Hard': 'from-orange-400 to-orange-600',
  'Expert': 'from-red-400 to-red-600',
  'Extreme': 'from-purple-500 to-pink-600'
};

function ModeSelection({ subject, chapter }: { subject: string; chapter: string }): JSX.Element {
  const [normalOpen, setNormalOpen] = useState(true);
  const [timerOpen, setTimerOpen] = useState(true);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadQuestions = async () => {
      let allQuestions: Record<string, Question[]> = {};
      
      try {
        const fileQuestions = await loadQuestionsFromFile();
        if (fileQuestions && Object.keys(fileQuestions).length > 0) {
          allQuestions = fileQuestions;
        } else {
          allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
        }
      } catch {
        allQuestions = getItem<Record<string, Question[]>>(STORAGE_KEYS.QUESTIONS, {});
      }
      
      const subjectQuestions = allQuestions[subject] || [];

      const counts: Record<string, number> = {};
      levels.forEach(level => {
        counts[level] = subjectQuestions.filter(q =>
          q.chapter === chapter &&
          q.level === level.toLowerCase() &&
          q.status === 'published'
        ).length;
      });
      setQuestionCounts(counts);
    };

    loadQuestions();
  }, [subject, chapter]);

  const isLoading = Object.keys(questionCounts).length === 0;

  return (
    <div>
      <Link
        href={`/quiz?subject=${subject}`}
        className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
      >
        ← Back to Chapters
      </Link>
      <h1 className="mb-8 text-center text-3xl font-bold text-white">
        🎮 Select Mode & Difficulty
      </h1>

      <div className="space-y-6">
        {/* Normal Mode Section */}
        <div className="rounded-2xl bg-white/95 shadow-lg overflow-hidden">
          <button
            onClick={() => setNormalOpen(!normalOpen)}
            className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎯</span>
              <div className="text-left">
                <span className="text-xl font-bold block">Normal Mode</span>
                <span className="text-sm opacity-90">Take your time, no pressure</span>
              </div>
            </div>
            {normalOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>

          {normalOpen && (
            <div className="p-6">
              <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {levels.map((level) => {
                  const count = questionCounts[level] || 0;
                  return (
                    <Link
                      key={`normal-${level}`}
                      href={`/quiz/play?subject=${subject}&chapter=${encodeURIComponent(chapter)}&level=${level.toLowerCase()}&mode=normal`}
                      className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${levelColors[level]} p-4 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg ${count === 0 ? 'opacity-50' : ''}`}
                    >
                      <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                      <span className="font-semibold text-sm">{level}</span>
                      <span className="mt-1 text-xs opacity-90">
                        {!isLoading ? `${count} questions` : 'Loading...'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Timer Mode Section */}
        <div className="rounded-2xl bg-white/95 shadow-lg overflow-hidden">
          <button
            onClick={() => setTimerOpen(!timerOpen)}
            className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">⏱️</span>
              <div className="text-left">
                <span className="text-xl font-bold block">Timer Mode</span>
                <span className="text-sm opacity-90">30 seconds per question - Race against the clock!</span>
              </div>
            </div>
            {timerOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>

          {timerOpen && (
            <div className="p-6">
              <p className="mb-4 text-sm text-gray-600">Select difficulty level:</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {levels.map((level) => {
                  const count = questionCounts[level] || 0;
                  return (
                    <Link
                      key={`timer-${level}`}
                      href={`/quiz/play?subject=${subject}&chapter=${encodeURIComponent(chapter)}&level=${level.toLowerCase()}&mode=timer`}
                      className={`flex flex-col items-center rounded-xl bg-gradient-to-br ${levelColors[level]} p-4 text-center text-white shadow-md transition-all hover:scale-105 hover:shadow-lg ${count === 0 ? 'opacity-50' : ''}`}
                    >
                      <span className="text-2xl mb-1">{levelEmojis[level]}</span>
                      <span className="font-semibold text-sm">{level}</span>
                      <span className="mt-1 text-xs opacity-90">
                        {!isLoading ? `${count} questions` : 'Loading...'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelSelection({ subject, chapter, mode }: { subject: string; chapter: string; mode: 'normal' | 'timer' }): JSX.Element {
  const levels = ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'];
  const levelEmojis: Record<string, string> = {
    'Easy': '🌱',
    'Medium': '🌿',
    'Hard': '🌲',
    'Expert': '🔥',
    'Extreme': '💀'
  };

  const levelColors: Record<string, string> = {
    'Easy': 'from-green-400 to-green-600',
    'Medium': 'from-blue-400 to-blue-600',
    'Hard': 'from-orange-400 to-orange-600',
    'Expert': 'from-red-400 to-red-600',
    'Extreme': 'from-purple-500 to-pink-600'
  };

  return (
    <div>
      <Link
        href={`/quiz?subject=${subject}&chapter=${encodeURIComponent(chapter)}`}
        className="mb-6 inline-block rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
      >
        ← Back to Mode
      </Link>
      <h1 className="mb-4 text-center text-3xl font-bold text-white">
        {mode === 'timer' ? '⏱️ Timer Mode' : '🎯 Normal Mode'}
      </h1>
      <p className="mb-8 text-center text-white/80">
        Select difficulty level
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {levels.map((level) => (
          <Link
            key={level}
            href={`/quiz/play?subject=${subject}&chapter=${encodeURIComponent(chapter)}&level=${level.toLowerCase()}&mode=${mode}`}
            className={`flex flex-col items-center rounded-2xl bg-gradient-to-br ${levelColors[level]} p-6 text-center text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
          >
            <span className="text-3xl mb-2">{levelEmojis[level]}</span>
            <span className="font-bold">{level}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuizContent(): JSX.Element {
  const searchParams = useSearchParams();
  const subject = searchParams?.get('subject') || '';
  const chapter = searchParams?.get('chapter') || '';
  const mode = searchParams?.get('mode') || '';

  // If chapter + mode is selected, show level selection
  if (subject && chapter && (mode === 'normal' || mode === 'timer')) {
    return <LevelSelection subject={subject} chapter={chapter} mode={mode} />;
  }

  // If chapter is selected, show mode selection
  if (subject && chapter) {
    return <ModeSelection subject={subject} chapter={chapter} />;
  }

  // If subject is selected, show chapter selection
  if (subject) {
    return <ChapterSelection subject={subject} />;
  }

  // Default: show subject selection
  return <SubjectSelection />;
}

export default function QuizPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="text-2xl text-white">Loading...</div>
          </div>
        }>
          <QuizContent />
        </Suspense>
      </div>
    </main>
  );
}
