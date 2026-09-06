'use client';

/**
 * ============================================================================
 * SidebarWorlds — subject→world assignment in the admin sidebar
 * ============================================================================
 * Collapsible sidebar group (open by default) listing the three homepage
 * worlds — Academic / Entertainment & Culture / Professional & Life — with
 * every subject and a compact select to reassign it. Persists via the
 * subject update API; the homepage "Quiz Topics" section reads `category`
 * on its next fetch. Same data as SubjectCategoryManager (content area),
 * relocated to the sidebar per owner request.
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, FolderOpen, RefreshCw } from 'lucide-react';

import { adminApi } from '@/lib/api-client';

interface AdminSubject {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

const WORLDS = ['Academic', 'Entertainment & Culture', 'Professional & Life'] as const;
const ALL_KEYS = [...WORLDS, 'Unassigned'] as const;

function worldOf(subject: AdminSubject): string {
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

export function SidebarWorlds({ expanded }: { expanded: boolean }): JSX.Element {
  const [open, setOpen] = useState(true); // open by default (owner request)
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.get<{ data: AdminSubject[] }>(
        '/quiz-mcq/subjects?includeInactive=true&limit=200'
      );
      setSubjects(res.data.data ?? []);
    } catch {
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assign = async (id: string, world: string): Promise<void> => {
    setSavingId(id);
    try {
      await adminApi.put(`/quiz-mcq/subjects/${id}`, { category: world });
      await load();
    } catch {
      // assignment failures surface on next load; keep the sidebar quiet
    } finally {
      setSavingId(null);
    }
  };

  const byWorld = ALL_KEYS.map((world) => ({
    world,
    items: subjects.filter((s) => worldOf(s) === world),
  }));

  if (!expanded) {
    // Collapsed icon rail — just the group icon.
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center py-2 text-gray-500 hover:bg-gray-800"
        title="Subject worlds"
      >
        <FolderOpen className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="mb-1 border-y border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-2 mt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" /> Subject Worlds
        </span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-3 h-3" />
        </span>
      </button>

      {open && (
        <div className="px-3 pb-2">
          {isLoading ? (
            <p className="py-2 text-xs text-gray-500">Loading subjects…</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">{subjects.length} subjects</span>
                <button
                  onClick={() => void load()}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200"
                  title="Reload subjects"
                >
                  <RefreshCw className="w-3 h-3" /> reload
                </button>
              </div>
              {byWorld.map(({ world, items }) => (
                <div key={world} className="rounded-lg bg-gray-900/60 p-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-gray-300">
                      {world}
                    </span>
                    <span className="rounded-full bg-gray-800 px-1.5 text-[10px] font-bold text-gray-400">
                      {items.length}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-[11px] text-gray-600">—</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {items.map((s) => (
                        <li key={s.id} className="flex items-center gap-1.5">
                          <span className="min-w-0 flex-1 truncate text-[11px] text-gray-300">
                            {s.emoji} {s.name}
                          </span>
                          <select
                            value={world === 'Unassigned' ? '' : world}
                            disabled={savingId === s.id}
                            onChange={(e) => void assign(s.id, e.target.value || 'Unassigned')}
                            aria-label={`Assign ${s.name} to a world`}
                            className="max-w-[110px] rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px] text-gray-200"
                          >
                            {ALL_KEYS.map((w) => (
                              <option key={w} value={w === 'Unassigned' ? '' : w}>
                                {w === 'Unassigned' ? '—' : w}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
