'use client';

import { useEffect, useState, useMemo } from 'react';
import { GraduationCap, Briefcase, Gamepad2, BookOpen } from 'lucide-react';
import { TopicCard } from './TopicCard';
import { getSubjects, getQuestionsBySubject } from '@/lib/quiz-api';
import type { QuizSubject } from '@/lib/quiz-api';

interface Subject extends QuizSubject {
  category: string;
  order?: number;
}

interface SectionProps {
  title: string;
  colorClass: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}

function Section({ title, colorClass, expanded, onToggle, children, icon }: SectionProps): JSX.Element {
  return (
    <div className={`rounded-xl ${colorClass} p-3`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between"
        aria-label={expanded ? `Collapse ${title} section` : `Expand ${title} section`}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`font-semibold ${colorClass.includes('blue') ? 'text-indigo-700' :
            colorClass.includes('green') ? 'text-teal-700' :
              colorClass.includes('purple') ? 'text-purple-700' :
                'text-gray-700'
            }`}>
            ━━━━ {title.toUpperCase()} ━━━━
          </h3>
        </div>
        <span className={`${colorClass.includes('blue') ? 'text-indigo-500' :
          colorClass.includes('green') ? 'text-teal-500' :
            colorClass.includes('purple') ? 'text-purple-500' :
              'text-gray-500'
          } transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {children}
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
      colorClass: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      icon: <GraduationCap className="h-4 w-4 text-indigo-600" />
    };
  }
  if (name.includes('professional') || name.includes('life') || name.includes('business') || name.includes('tech')) {
    return {
      colorClass: 'bg-gradient-to-r from-green-50 to-teal-50',
      icon: <Briefcase className="h-4 w-4 text-teal-600" />
    };
  }
  if (name.includes('entertainment') || name.includes('culture') || name.includes('game') || name.includes('fun')) {
    return {
      colorClass: 'bg-gradient-to-r from-purple-50 to-pink-50',
      icon: <Gamepad2 className="h-4 w-4 text-purple-600" />
    };
  }

  // Default fallback style for unknown categories
  return {
    colorClass: 'bg-gradient-to-r from-gray-50 to-slate-50',
    icon: <BookOpen className="h-4 w-4 text-gray-600" />
  };
}

export function TopicsSection(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsData = await getSubjects(false);
        const sortedSubjects = subjectsData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as Subject[];

        const counts: Record<string, number> = {};
        for (const subject of subjectsData) {
          try {
            const questions = await getQuestionsBySubject(subject.slug, 'published');
            if (questions.length > 0) {
              counts[subject.slug] = questions.length;
            }
          } catch (err) {
            console.error(`Failed to load questions for ${subject.slug}:`, err);
          }
        }

        setSubjects(sortedSubjects);
        setQuestionCounts(counts);

        // Initialize all found categories to be expanded by default
        const uniqueCategories = Array.from(new Set(sortedSubjects.map(s => s.category || 'Other')));
        const initialExpandedState: Record<string, boolean> = {};
        uniqueCategories.forEach(cat => {
          initialExpandedState[cat] = true;
        });

        // Merge with existing state so we don't overwrite user toggles if it re-renders
        setCategoryExpanded(prev => ({ ...initialExpandedState, ...prev }));

      } catch (error) {
        console.error('Failed to load subjects:', error);
        setError(error instanceof Error ? error.message : 'Failed to load topics');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleCategory = (category: string) => {
    setCategoryExpanded(prev => ({ ...prev, [category]: !prev[category] }));
  };

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

  const hasAnySubjects = subjects.length > 0;
  const sortedCategories = Object.keys(subjectsByCategory).sort(); // Sort categories alphabetically

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
      <button
        onClick={() => setTopicsExpanded(!topicsExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
        aria-label={topicsExpanded ? 'Collapse Topics section' : 'Expand Topics section'}
        aria-expanded={topicsExpanded}
      >
        <h2 className="text-xl font-bold text-gray-800">📚 Topics</h2>
        <span className={`text-gray-500 transition-transform ${topicsExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {topicsExpanded && (
        <div className="space-y-4 p-4 pt-0">
          {error ? (
            <div className="py-8 text-center text-red-400">
              <p className="text-3xl mb-2">⚠️</p>
              <p className="text-sm font-medium">Failed to load topics</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center text-gray-400">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <p className="text-sm">Loading topics...</p>
            </div>
          ) : !hasAnySubjects ? (
            <div className="py-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-medium">No quiz topics available yet.</p>
              <p className="text-xs mt-1">Check back soon or ask the admin to add subjects.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map((categoryName) => {
                const dbSubjects = subjectsByCategory[categoryName] || [];
                const design = getCategoryDesign(categoryName);

                // Fallback to true if undefined
                const isExpanded = categoryExpanded[categoryName] ?? true;

                return (
                  <Section
                    key={categoryName}
                    title={categoryName}
                    colorClass={design.colorClass}
                    expanded={isExpanded}
                    onToggle={() => toggleCategory(categoryName)}
                    icon={design.icon}
                  >
                    {dbSubjects.map((subject) => (
                      <TopicCard
                        key={subject.id}
                        href={(questionCounts[subject.slug] || 0) > 0 ? `/quiz?subject=${subject.slug}` : '#'}
                        emoji={subject.emoji}
                        label={subject.name}
                        soon={(questionCounts[subject.slug] || 0) === 0}
                      />
                    ))}
                  </Section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
