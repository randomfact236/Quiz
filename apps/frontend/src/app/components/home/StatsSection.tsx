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
import { Trophy, Target, BookOpen, Flame } from 'lucide-react';
import { getTotalStats } from '@/lib/progress';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      const data = getTotalStats();
      setStats(data);
      setIsLoading(false);
    };

    loadStats();

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
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-white/10"
          />
        ))}
      </div>
    );
  }

  const statItems = [
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
