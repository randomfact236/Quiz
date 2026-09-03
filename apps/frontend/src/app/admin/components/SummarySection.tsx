'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Image as ImageIcon,
  MessageSquare,
  Puzzle,
  Smile,
  Users,
} from 'lucide-react';
import { adminApi } from '@/lib/api-client';

/**
 * Admin dashboard Summary section (plan/12-admin-dashboard.md P1 #1):
 * totals per module, recent activity, and quick links. Data comes from the
 * same cached `GET /admin/analytics/overview` the Analytics section uses.
 */

interface AdminOverview {
  totals: {
    events: number;
    eventsLast24h: number;
    registeredUsers: number;
    guestUsers: number;
  };
  activeUsers: { dau: number; wau: number; mau: number };
  sessionsCompletedByModule: { module: string; count: number }[];
}

interface SummarySectionProps {
  onNavigate: (section: string) => void;
}

const MODULE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'quiz-mcq': {
    label: 'Quiz MCQ',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'bg-indigo-100 text-indigo-700',
  },
  'riddle-mcq': {
    label: 'Riddle MCQ',
    icon: <Puzzle className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-700',
  },
  'image-riddles': {
    label: 'Image Riddles',
    icon: <ImageIcon className="h-5 w-5" />,
    color: 'bg-emerald-100 text-emerald-700',
  },
  jokes: {
    label: 'Dad Jokes',
    icon: <Smile className="h-5 w-5" />,
    color: 'bg-amber-100 text-amber-700',
  },
};

export function SummarySection({ onNavigate }: SummarySectionProps): JSX.Element {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    adminApi
      .get<AdminOverview>('/admin/analytics/overview')
      .then((response) => setOverview(response.data))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md text-center">
        <p className="text-gray-500">
          Could not load the overview. Check that the API is running, then refresh.
        </p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white/60" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Events', value: overview.totals.events.toLocaleString() },
    { label: 'Events (24h)', value: overview.totals.eventsLast24h.toLocaleString() },
    { label: 'Registered Users', value: overview.totals.registeredUsers.toLocaleString() },
    { label: 'Guest Users', value: overview.totals.guestUsers.toLocaleString() },
    { label: 'Active (1d)', value: overview.activeUsers.dau.toLocaleString() },
    { label: 'Active (7d)', value: overview.activeUsers.wau.toLocaleString() },
    { label: 'Active (30d)', value: overview.activeUsers.mau.toLocaleString() },
    {
      label: 'Sessions Completed',
      value: overview.sessionsCompletedByModule
        .reduce((sum, m) => sum + m.count, 0)
        .toLocaleString(),
    },
  ];

  const quickLinks = [
    { section: 'users', label: 'Manage Users', icon: <Users className="h-4 w-4" /> },
    { section: 'jokes', label: 'Dad Jokes', icon: <Smile className="h-4 w-4" /> },
    { section: 'riddle-mcq', label: 'Riddle MCQ', icon: <Puzzle className="h-4 w-4" /> },
    { section: 'image-riddles', label: 'Image Riddles', icon: <ImageIcon className="h-4 w-4" /> },
    { section: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" /> },
    { section: 'analytics', label: 'Analytics', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white p-4 shadow-sm border border-slate-200"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Per-module completions */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
          <BarChart3 className="h-5 w-5 text-indigo-500" /> Completed Sessions by Module
        </h3>
        {overview.sessionsCompletedByModule.length === 0 ? (
          <p className="text-sm text-slate-500">
            No completed sessions recorded yet — play a quiz or riddle to see data here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {overview.sessionsCompletedByModule.map((m) => {
              const meta = MODULE_META[m.module];
              return (
                <div key={m.module} className="rounded-lg bg-slate-50 p-3 text-center">
                  <span
                    className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                      meta?.color ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {meta?.icon ?? <BarChart3 className="h-5 w-5" />}
                  </span>
                  <p className="text-lg font-bold text-slate-900">{m.count.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{meta?.label ?? m.module}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="mb-4 font-semibold text-slate-800">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <button
              key={link.section}
              onClick={() => onNavigate(link.section)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
