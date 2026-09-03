/**
 * ============================================================================
 * Stats Section Component
 * ============================================================================
 * Displays user statistics on the home page
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, BookOpen, Flame, Globe2, Users, ListChecks, Puzzle } from 'lucide-react';
import { getTotalStats } from '@/lib/progress';
import { api } from '@/lib/api-client';

/**
 * Site-wide stats source (plan/10-landing-shared-ui.md P1): the public
 * /analytics/summary endpoint. Falls back to the visitor's local stats when
 * the API is unreachable, so the section never renders empty.
 */
interface PublicSummary {
  totalSessionsCompleted: number;
  sessionsCompletedByModule: { module: string; count: number }[];
  activeQuizzers30d: number;
}

const moduleCount = (summary: PublicSummary, moduleName: string): number =>
  summary.sessionsCompletedByModule.find((m) => m.module === moduleName)?.count ?? 0;

interface StatItemProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

function StatItem({ value, label, icon, color }: StatItemProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`rounded-xl ${color} p-4 text-center backdrop-blur`}
    >
      <div className="mb-2 flex justify-center text-white/80">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/80">{label}</p>
    </motion.div>
  );
}

export function StatsSection(): JSX.Element {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    averageScore: 0,
    bestStreak: 0,
  });
  const [summary, setSummary] = useState<PublicSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      const data = getTotalStats();
      setStats(data);
      setIsLoading(false);
    };

    loadStats();

    // Site-wide stats (fire-and-forget; local stats remain the fallback).
    api
      .get<PublicSummary>('/analytics/summary')
      .then((response) => setSummary(response.data))
      .catch(() => undefined);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('aiquiz:')) {
        loadStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
    );
  }

  const statItems = summary
    ? [
        {
          value: summary.totalSessionsCompleted.toLocaleString(),
          label: 'Sessions Completed (site-wide)',
          icon: <Globe2 className="h-6 w-6" />,
          color: 'bg-yellow-500/30',
        },
        {
          value: summary.activeQuizzers30d.toLocaleString(),
          label: 'Active Quizzers (30 days)',
          icon: <Users className="h-6 w-6" />,
          color: 'bg-blue-500/30',
        },
        {
          value: moduleCount(summary, 'quiz-mcq').toLocaleString(),
          label: 'Quiz Sessions',
          icon: <ListChecks className="h-6 w-6" />,
          color: 'bg-green-500/30',
        },
        {
          value: moduleCount(summary, 'riddle-mcq').toLocaleString(),
          label: 'Riddle Sessions',
          icon: <Puzzle className="h-6 w-6" />,
          color: 'bg-orange-500/30',
        },
      ]
    : [
        {
          value: stats.totalQuizzes.toString(),
          label: 'Quizzes Taken',
          icon: <Trophy className="h-6 w-6" />,
          color: 'bg-yellow-500/30',
        },
        {
          value: stats.totalQuestions.toString(),
          label: 'Questions Answered',
          icon: <BookOpen className="h-6 w-6" />,
          color: 'bg-blue-500/30',
        },
        {
          value: `${stats.averageScore}%`,
          label: 'Avg Score',
          icon: <Target className="h-6 w-6" />,
          color: 'bg-green-500/30',
        },
        {
          value: `${stats.bestStreak} day${stats.bestStreak !== 1 ? 's' : ''}`,
          label: 'Best Streak',
          icon: <Flame className="h-6 w-6" />,
          color: 'bg-orange-500/30',
        },
      ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
      {statItems.map((stat) => (
        <StatItem key={stat.label} {...stat} />
      ))}
    </div>
  );
}
