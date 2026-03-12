'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { GraduationCap, Briefcase, Gamepad2, Home, CheckCircle, Trophy, ChevronDown, ChevronUp, BookOpen, Puzzle } from 'lucide-react';
import { getSubjects, getQuestionsBySubject, getSubjectBySlug, getQuestionsByChapter } from '@/lib/quiz-api';
import { getChapterProgress } from '@/lib/progress';
import type { QuizSubject } from '@/lib/quiz-api';

type SubjectCategory = 'academic' | 'professional' | 'entertainment';

interface Subject extends QuizSubject {
  category: SubjectCategory;
  order?: number;
}



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

function SubjectCard({ slug, emoji, name, questionCount, isLive, isActive }: { slug: string; emoji: string; name: string; questionCount: number; isLive: boolean; isActive: boolean }): JSX.Element {
  const display = getSubjectDisplay(emoji);
  const isAvailable = isActive && isLive;

  return (
    <Link
      href={isAvailable ? `/quiz?subject=${slug}` : '#'}
      className={`flex flex-col items-center rounded-2xl p-6 text-center shadow-lg transition-all ${isAvailable ? 'bg-white/95 hover:scale-105 hover:bg-white hover:shadow-xl cursor-pointer' : 'bg-gray-100/50 cursor-not-allowed opacity-75'}`}
      aria-label={isAvailable ? `Select ${name} subject` : `${name} - Coming Soon`}
    >
      <span className="text-4xl" aria-hidden="true">{display}</span>
      <span className="mt-2 font-bold text-gray-800">{name}</span>
      {isAvailable ? (
        <span className="mt-1 text-xs font-medium text-green-600">✓ {questionCount} questions</span>
      ) : (
        <span className="mt-1 text-xs font-medium text-gray-500">Coming Soon</span>
      )}
    </Link>
  );
}

function CategorySection({
  title,
  icon,
  colorClass,
  subjects,
  questionCounts,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  subjects: Subject[];
  questionCounts: Record<string, number>;
  isOpen: boolean;
  onToggle: () => void;
}): JSX.Element | null {
  if (subjects.length === 0) {
    return null;
  }

  const totalQuestions = subjects.reduce((sum, subject) => sum + (questionCounts[subject.slug] || 0), 0);

  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between mb-4 p-4 rounded-xl bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 ${colorClass}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-xl font-bold text-white">{title.toUpperCase()}</h2>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full text-white">
            {subjects.length} subjects • {totalQuestions} questions
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
      </button>
      
      {isOpen && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" role="list">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              slug={subject.slug}
              emoji={subject.emoji}
              name={subject.name}
              questionCount={questionCounts[subject.slug] || 0}
              isLive={(questionCounts[subject.slug] || 0) > 0}
              isActive={subject.isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to determine styling for categories dynamically
function getCategoryDesign(categoryName: string) {
  const name = categoryName.toLowerCase();

  if (name.includes('academic') || name.includes('science') || name.includes('math') || name.includes('school')) {
    return {
      colorClass: 'text-blue-600',
      icon: <GraduationCap className="h-5 w-5" />
    };
  }
  if (name.includes('professional') || name.includes('life') || name.includes('business') || name.includes('tech')) {
    return {
      colorClass: 'text-teal-600',
      icon: <Briefcase className="h-5 w-5" />
    };
  }
  if (name.includes('entertainment') || name.includes('culture') || name.includes('game') || name.includes('fun')) {
    return {
      colorClass: 'text-purple-600',
      icon: <Gamepad2 className="h-5 w-5" />
    };
  }

  return {
    colorClass: 'text-gray-600',
    icon: <BookOpen className="h-5 w-5" />
  };
}

function SubjectSelection(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsData = await getSubjects(false);
        const sortedSubjects = subjectsData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as Subject[];
        setSubjects(sortedSubjects);

        const counts: Record<string, number> = {};
        for (const subject of subjectsData) {
          try {
            const questions = await getQuestionsBySubject(subject.slug, 'published');
            if (questions.total > 0) {
              counts[subject.slug] = questions.total;
            }
          } catch {
            console.error(`Failed to load questions for subject: ${subject.slug}`);
          }
        }
        setQuestionCounts(counts);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Group subjects dynamically based on category string
  const subjectsByCategory = useMemo(() => {
    const grouped: Record<string, Subject[]> = {};

    subjects.forEach((subject) => {
      const category = subject.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(subject);
    });

    return grouped;
  }, [subjects]);

  const sortedCategories = Object.keys(subjectsByCategory).sort();

  // Initialize all categories as open by default
  useEffect(() => {
    if (sortedCategories.length > 0 && openCategories.size === 0) {
      setOpenCategories(new Set(sortedCategories));
    }
  }, [sortedCategories]);

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
        {sortedCategories.map((categoryName) => {
          const catSubjects = subjectsByCategory[categoryName] || [];
          const design = getCategoryDesign(categoryName);

          return (
            <CategorySection
              key={categoryName}
              title={categoryName}
              icon={design.icon}
              colorClass={design.colorClass}
              subjects={catSubjects}
              questionCounts={questionCounts}
              isOpen={openCategories.has(categoryName)}
              onToggle={() => toggleCategory(categoryName)}
            />
          );
        })}
      </div>
    </div>
  );
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
    const loadChapters = async () => {
      try {
        const subjectData = await getSubjectBySlug(subject);

        const chapterMap = new Map<string, ChapterInfo>();

        if (subjectData.chapters && subjectData.chapters.length > 0) {
          for (const chapter of subjectData.chapters) {
            const progress = getChapterProgress(subject, chapter.name);
            chapterMap.set(chapter.id, {
              name: chapter.name,
              questionCount: 0,
              levels: new Set(),
              isCompleted: progress?.completed ?? false,
              bestScore: progress?.bestScore ?? 0,
              attempts: progress?.attempts ?? 0,
            });
          }

          for (const chapter of subjectData.chapters) {
            try {
              const questions = await getQuestionsByChapter(chapter.id);
              const chapterInfo = chapterMap.get(chapter.id);
              if (chapterInfo) {
                chapterInfo.questionCount = questions.data.length;
                questions.data.forEach(q => {
                  chapterInfo.levels.add(q.level);
                });
              }
            } catch (error) {
              console.error(`Failed to load questions for chapter ${chapter.id}:`, error);
            }
          }
        }

        const chapterArray = Array.from(chapterMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setChapters(chapterArray);
      } catch (error) {
        console.error('Failed to load chapters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
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
      try {
        const subjectData = await getSubjectBySlug(subject);

        const foundChapter = subjectData.chapters?.find(c => c.name === chapter);

        if (foundChapter) {
          const questions = await getQuestionsByChapter(foundChapter.id);

          const counts: Record<string, number> = {};
          levels.forEach(level => {
            counts[level] = questions.data.filter(q =>
              q.level === level.toLowerCase() &&
              q.status === 'published'
            ).length;
          });
          setQuestionCounts(counts);
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
      }
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
