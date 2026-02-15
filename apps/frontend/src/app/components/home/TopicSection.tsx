'use client';

import { useState } from 'react';
import { TopicCard } from './TopicCard';

interface SectionProps {
  title: string;
  colorClass: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, colorClass, expanded, onToggle, children }: SectionProps): JSX.Element {
  return (
    <div className={`rounded-xl ${colorClass} p-3`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between"
        aria-label={expanded ? `Collapse ${title} section` : `Expand ${title} section`}
        aria-expanded={expanded}
      >
        <h3 className={`font-semibold ${colorClass.includes('blue') ? 'text-indigo-700' : colorClass.includes('green') ? 'text-teal-700' : 'text-purple-700'}`}>
          ━━━━ {title} ━━━━
        </h3>
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

  const academicTopics = [
    { href: '/quiz?subject=science', emoji: '🔬', label: 'Science' },
    { href: '/quiz?subject=math', emoji: '🔢', label: 'Math' },
    { href: '/quiz?subject=history', emoji: '📜', label: 'History' },
    { href: '/quiz?subject=geography', emoji: '🌍', label: 'Geography' },
    { href: '/quiz?subject=english', emoji: '📖', label: 'English' },
    { href: '/quiz?subject=environment', emoji: '🌱', label: 'Environment' },
  ];

  const professionalTopics = [
    { href: '/quiz?subject=technology', emoji: '💻', label: 'Technology' },
    { href: '/quiz?subject=business', emoji: '💼', label: 'Business' },
    { href: '/quiz?subject=health', emoji: '💪', label: 'Health' },
    { href: '/quiz?subject=parenting', emoji: '👶', label: 'Parenting' },
  ];

  const entertainmentTopics = [
    { emoji: '🐾', label: 'Animals', soon: true },
    { emoji: '🎬', label: 'Movies', soon: true },
    { emoji: '🏆', label: 'Sports', soon: true },
    { emoji: '🍔', label: 'Food', soon: true },
    { emoji: '🎨', label: 'Art', soon: true },
  ];

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
          <Section
            title="ACADEMIC"
            colorClass="bg-gradient-to-r from-blue-50 to-indigo-50"
            expanded={academicExpanded}
            onToggle={() => setAcademicExpanded(!academicExpanded)}
          >
            {academicTopics.map((topic) => (
              <TopicCard key={topic.label} {...topic} />
            ))}
          </Section>

          <Section
            title="PROFESSIONAL & LIFE"
            colorClass="bg-gradient-to-r from-green-50 to-teal-50"
            expanded={professionalExpanded}
            onToggle={() => setProfessionalExpanded(!professionalExpanded)}
          >
            {professionalTopics.map((topic) => (
              <TopicCard key={topic.label} {...topic} />
            ))}
          </Section>

          <Section
            title="ENTERTAINMENT & CULTURE"
            colorClass="bg-gradient-to-r from-purple-50 to-pink-50"
            expanded={entertainmentExpanded}
            onToggle={() => setEntertainmentExpanded(!entertainmentExpanded)}
          >
            {entertainmentTopics.map((topic) => (
              <TopicCard key={topic.label} {...topic} />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}
