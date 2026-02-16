/**
 * ============================================================================
 * Achievements Page
 * ============================================================================
 * Display all achievements and user's progress
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, Star } from 'lucide-react';
import { getAllAchievementsWithStatus, getAchievementStats, type AchievementWithStatus } from '@/lib/achievements';

function AchievementCard({
  achievement,
  index,
}: {
  achievement: AchievementWithStatus;
  index: number;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative rounded-xl border-2 p-4 transition-all ${
        achievement.unlocked
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Icon */}
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
          achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-200'
        }`}
      >
        {achievement.unlocked ? achievement.icon : <Lock className="h-5 w-5 text-gray-400" />}
      </div>

      {/* Name */}
      <h3
        className={`mb-1 font-bold ${
          achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {achievement.name}
      </h3>

      {/* Description */}
      <p className="mb-3 text-sm text-gray-600">{achievement.description}</p>

      {/* Progress */}
      {!achievement.unlocked && achievement.progress > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-indigo-600">
              {Math.round(achievement.progress)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievement.progress}%` }}
              className="h-full bg-indigo-500"
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          </div>
        </div>
      )}

      {/* Unlocked badge */}
      {achievement.unlocked && achievement.unlockedAt && (
        <div className="absolute right-3 top-3 rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-yellow-900">
          <Star className="mr-1 inline h-3 w-3" />
          Unlocked
        </div>
      )}
    </motion.div>
  );
}

export default function AchievementsPage(): JSX.Element {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = () => {
      const allAchievements = getAllAchievementsWithStatus();
      const achievementStats = getAchievementStats();
      setAchievements(allAchievements);
      setStats(achievementStats);
      setIsLoading(false);
    };

    loadAchievements();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('aiquiz:')) {
        loadAchievements();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-xl font-semibold text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Title Section */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100"
          >
            <Trophy className="h-10 w-10 text-yellow-600" />
          </motion.div>
          <h1 className="mb-2 text-3xl font-bold text-white">Achievements</h1>
          <p className="text-white/80">Track your progress and unlock rewards!</p>
        </div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats.unlocked}</p>
              <p className="text-sm text-gray-500">Unlocked</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-600">{stats.percentage}%</p>
              <p className="text-sm text-gray-500">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentage}%` }}
              className="h-full bg-yellow-400"
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
