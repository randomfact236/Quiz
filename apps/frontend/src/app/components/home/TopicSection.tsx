'use client';

import { useEffect, useState, useMemo } from 'react';
import { GraduationCap, Briefcase, Gamepad2 } from 'lucide-react';
import { TopicCard } from './TopicCard';
import { STORAGE_KEYS, getItem } from '@/lib/storage';

interface Subject {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: 'academic' | 'professional' | 'entertainment';
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
          <h3 className={`font-semibold ${colorClass.includes('blue') ? 'text-indigo-700' : colorClass.includes('green') ? 'text-teal-700' : 'text-purple-700'}`}>
            ━━━━ {title} ━━━━
          </h3>
        </div>
        <span className={`${colorClass.includes('blue') ? 'text-indigo-500' : colorClass.includes('green') ? 'text-teal-500' : 'text-purple-500'} transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {expanded && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function TopicsSection(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [academicExpanded, setAcademicExpanded] = useState(true);
  const [professionalExpanded, setProfessionalExpanded] = useState(true);
  const [entertainmentExpanded, setEntertainmentExpanded] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    // Load subjects from localStorage
    const loadSubjects = () => {
      const storedSubjects = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
      // Sort by order field
      const sortedSubjects = storedSubjects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSubjects(sortedSubjects);
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

  // Group subjects by category
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

  // Default topics if no subjects configured
  const defaultAcademicTopics = [
    { href: '/quiz?subject=science', emoji: '🔬', label: 'Science' },
    { href: '/quiz?subject=math', emoji: '🔢', label: 'Math' },
    { href: '/quiz?subject=history', emoji: '📜', label: 'History' },
    { href: '/quiz?subject=geography', emoji: '🌍', label: 'Geography' },
    { href: '/quiz?subject=english', emoji: '📖', label: 'English' },
    { href: '/quiz?subject=environment', emoji: '🌱', label: 'Environment' },
  ];

  const defaultProfessionalTopics = [
    { href: '/quiz?subject=technology', emoji: '💻', label: 'Technology' },
    { href: '/quiz?subject=business', emoji: '💼', label: 'Business' },
    { href: '/quiz?subject=health', emoji: '💪', label: 'Health' },
    { href: '/quiz?subject=parenting', emoji: '👶', label: 'Parenting' },
  ];

  const defaultEntertainmentTopics = [
    { emoji: '🐾', label: 'Animals', soon: true, href: '/quiz/animals' },
    { emoji: '🎬', label: 'Movies', soon: true, href: '/quiz/movies' },
    { emoji: '🏆', label: 'Sports', soon: true, href: '/quiz/sports' },
    { emoji: '🍔', label: 'Food', soon: true, href: '/quiz/food' },
    { emoji: '🎨', label: 'Art', soon: true, href: '/quiz/art' },
  ];

  const hasSubjects = subjects.length > 0;

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
        <div className="space-y-2 p-4 pt-0">
          {/* Academic Section */}
          <Section
            title="ACADEMIC"
            colorClass="bg-gradient-to-r from-blue-50 to-indigo-50"
            expanded={academicExpanded}
            onToggle={() => setAcademicExpanded(!academicExpanded)}
            icon={<GraduationCap className="h-4 w-4 text-indigo-600" />}
          >
            {hasSubjects ? (
              subjectsByCategory.academic.map((subject) => (
                <TopicCard 
                  key={subject.id} 
                  href={`/quiz?subject=${subject.slug}`} 
                  emoji={subject.emoji} 
                  label={subject.name} 
                />
              ))
            ) : (
              defaultAcademicTopics.map((topic) => (
                <TopicCard key={topic.label} {...topic} />
              ))
            )}
          </Section>

          {/* Professional & Life Section */}
          <Section
            title="PROFESSIONAL & LIFE"
            colorClass="bg-gradient-to-r from-green-50 to-teal-50"
            expanded={professionalExpanded}
            onToggle={() => setProfessionalExpanded(!professionalExpanded)}
            icon={<Briefcase className="h-4 w-4 text-teal-600" />}
          >
            {hasSubjects ? (
              subjectsByCategory.professional.map((subject) => (
                <TopicCard 
                  key={subject.id} 
                  href={`/quiz?subject=${subject.slug}`} 
                  emoji={subject.emoji} 
                  label={subject.name} 
                />
              ))
            ) : (
              defaultProfessionalTopics.map((topic) => (
                <TopicCard key={topic.label} {...topic} />
              ))
            )}
          </Section>

          {/* Entertainment & Culture Section */}
          <Section
            title="ENTERTAINMENT & CULTURE"
            colorClass="bg-gradient-to-r from-purple-50 to-pink-50"
            expanded={entertainmentExpanded}
            onToggle={() => setEntertainmentExpanded(!entertainmentExpanded)}
            icon={<Gamepad2 className="h-4 w-4 text-purple-600" />}
          >
            {hasSubjects ? (
              subjectsByCategory.entertainment.map((subject) => (
                <TopicCard 
                  key={subject.id} 
                  href={`/quiz?subject=${subject.slug}`} 
                  emoji={subject.emoji} 
                  label={subject.name} 
                />
              ))
            ) : (
              defaultEntertainmentTopics.map((topic) => (
                <TopicCard key={topic.label} {...topic} />
              ))
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
