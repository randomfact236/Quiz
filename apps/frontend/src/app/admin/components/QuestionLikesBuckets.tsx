/**
 * ============================================================================
 * QuestionLikesBuckets — INTERNAL admin view (BUG-037)
 * ============================================================================
 * The owner's 1-like / 2-like / 3+-like classification, derived live by
 * COUNT from the question_likes table. Nothing here is public; this is the
 * publish-workflow surface: pick well-liked questions under each bucket.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

import { adminApi } from '@/lib/api-client';

type Family = 'quiz' | 'riddle';

interface BucketEntry {
  questionId: string;
  questionText: string;
  likes: number;
}

interface FamilyBuckets {
  contentType: Family;
  one: BucketEntry[];
  two: BucketEntry[];
  threePlus: BucketEntry[];
}

function BucketTable({ title, entries }: { title: string; entries: BucketEntry[] }) {
  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
        <Heart className="h-4 w-4 text-rose-400" /> {title}
        <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs dark:bg-secondary-700">
          {entries.length}
        </span>
      </h3>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm font-semibold text-secondary-400">Empty</p>
      ) : (
        <ul className="divide-y divide-secondary-100 dark:divide-secondary-700">
          {entries.map((e) => (
            <li key={e.questionId} className="flex items-start justify-between gap-3 py-2">
              <span className="min-w-0 text-sm text-secondary-700 dark:text-secondary-200">
                {e.questionText}
              </span>
              <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-500 dark:bg-rose-500/20">
                ♥ {e.likes}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function QuestionLikesBuckets(): JSX.Element {
  const [family, setFamily] = useState<Family>('quiz');
  const [buckets, setBuckets] = useState<FamilyBuckets | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<FamilyBuckets[]>(`/admin/question-likes/buckets?contentType=${family}`)
      .then((r) => setBuckets(Array.isArray(r.data) ? (r.data[0] ?? null) : null))
      .catch(() => setBuckets(null))
      .finally(() => setLoading(false));
  }, [family]);

  useEffect(load, [load, family]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          Internal like buckets — derived from player hearts. Nothing here is shown on the public
          site; use it to pick questions worth publishing.
        </p>
        <div className="flex rounded-xl border border-secondary-200 p-1 dark:border-secondary-700">
          {(['quiz', 'riddle'] as Family[]).map((f) => (
            <button
              key={f}
              onClick={() => setFamily(f)}
              className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
                family === f
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-secondary-100 dark:bg-secondary-800"
            />
          ))}
        </div>
      ) : buckets ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <BucketTable title="1 like" entries={buckets.one} />
          <BucketTable title="2 likes" entries={buckets.two} />
          <BucketTable title="3+ likes" entries={buckets.threePlus} />
        </div>
      ) : (
        <p className="text-center text-sm font-bold text-red-500">Failed to load buckets.</p>
      )}
    </div>
  );
}
