'use client';

/**
 * ============================================================================
 * SubjectCategoryManager — assign subjects to homepage worlds (plan/13 §4b)
 * ============================================================================
 * The three headings from the owner's homepage design (Academic /
 * Professional & Life / Entertainment & Culture). Each subject shows a
 * select to move it between worlds; the change persists via the subject
 * update API and the homepage "Quiz Topics" section picks it up on its
 * next fetch (subjects carry `category`).
 * ============================================================================
 */

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';

import { useSubjectMutation } from '../hooks/useSubjectMutation';
import type { QuizSubject } from '@/lib/quiz-mcq-api';

export const SUBJECT_WORLDS = [
  'Academic',
  'Professional & Life',
  'Entertainment & Culture',
] as const;

const WORLDS_WITH_UNASSIGNED: readonly string[] = [...SUBJECT_WORLDS, 'Unassigned'];

const WORLD_STYLES: Record<string, { banner: string; card: string } | undefined> = {
  Academic: {
    banner: 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border-indigo-200',
    card: 'border-indigo-200 bg-indigo-50/60',
  },
  'Professional & Life': {
    banner: 'bg-gradient-to-r from-teal-100 to-teal-50 text-teal-800 border-teal-200',
    card: 'border-teal-200 bg-teal-50/60',
  },
  'Entertainment & Culture': {
    banner: 'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-800 border-pink-200',
    card: 'border-pink-200 bg-pink-50/60',
  },
  Unassigned: {
    banner: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200',
    card: 'border-gray-200 bg-gray-50/60',
  },
};

function worldOf(subject: QuizSubject): string {
  const cat = (subject.category || '').trim().toLowerCase();
  if (cat === 'academic') return 'Academic';
  if (cat === 'professional' || cat === 'professional & life' || cat === 'professional and life')
    return 'Professional & Life';
  if (
    cat === 'entertainment' ||
    cat === 'entertainment & culture' ||
    cat === 'entertainment and culture'
  )
    return 'Entertainment & Culture';
  return 'Unassigned';
}

export function SubjectCategoryManager({ subjects }: { subjects: QuizSubject[] }): JSX.Element {
  const { update, isUpdating, updateError } = useSubjectMutation();
  const [savedId, setSavedId] = useState<string | null>(null);

  const assign = (id: string, world: string): void => {
    update(
      { id, dto: { category: world } },
      {
        onSuccess: () => {
          setSavedId(id);
          setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 2000);
        },
      }
    );
  };

  const byWorld = WORLDS_WITH_UNASSIGNED.map((world) => ({
    world,
    items: subjects.filter((s) => worldOf(s) === world),
  }));

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
        <FolderOpen className="h-5 w-5 text-indigo-500" /> Subject worlds
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Assign each subject to a homepage world — the public &ldquo;Quiz Topics&rdquo; section
        groups subjects under these three headings and auto-orders them by play clicks.
      </p>

      {updateError && (
        <p className="mb-3 text-sm text-red-600">
          Failed to save the last change. Please try again.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {byWorld.map(({ world, items }) => {
          const style = WORLD_STYLES[world] ?? {
            banner: 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200',
            card: 'border-gray-200 bg-gray-50/60',
          };
          return (
            <div
              key={world}
              className={`rounded-xl border p-4 ${style.card}`}
              data-testid={`world-${world}`}
            >
              <div className={`mb-3 rounded-lg border px-3 py-2 text-center ${style.banner}`}>
                <span className="text-sm font-extrabold uppercase tracking-wide">{world}</span>
                <span className="ml-2 rounded-full bg-white/80 px-2 text-xs font-bold">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="py-2 text-center text-xs text-slate-400">No subjects assigned</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((subject) => (
                    <li
                      key={subject.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 shadow-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                        {subject.emoji} {subject.name}
                      </span>
                      <select
                        value={world === 'Unassigned' ? '' : world}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next) assign(subject.id, next);
                          else assign(subject.id, 'Unassigned');
                        }}
                        disabled={isUpdating}
                        aria-label={`Assign ${subject.name} to a world`}
                        className="rounded-md border border-slate-300 px-1.5 py-1 text-xs text-slate-600"
                      >
                        {WORLDS_WITH_UNASSIGNED.map((w) => (
                          <option key={w} value={w === 'Unassigned' ? '' : w}>
                            {w === 'Unassigned' ? 'Unassigned' : w}
                          </option>
                        ))}
                      </select>
                      {savedId === subject.id && (
                        <span className="text-xs font-bold text-emerald-600">✓</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
