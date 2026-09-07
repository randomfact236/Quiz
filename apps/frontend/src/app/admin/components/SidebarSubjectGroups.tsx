'use client';

/**
 * ============================================================================
 * SidebarSubjectGroups — subject→group assignment in the admin sidebar
 * ============================================================================
 * Sub-menu content under the "Quiz MCQ" dashboard item. Lists the three
 * homepage groups — Academic / Entertainment & Culture / Professional & Life —
 * with every subject as a draggable chip; drop a chip on a group card to
 * reassign it (persists via the subject update API; the homepage "Quiz Topics"
 * section reads `category` on its next fetch). Keyboard drag works too:
 * focus a chip, Space to lift, arrows to choose a group, Space to drop.
 * Open/close is owned by the parent (page.tsx chevron).
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GripVertical, RefreshCw } from 'lucide-react';

import { adminApi } from '@/lib/api-client';

interface AdminSubject {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

const GROUPS = ['Academic', 'Entertainment & Culture', 'Professional & Life'] as const;
const ALL_KEYS = [...GROUPS, 'Unassigned'] as const;

function groupOf(subject: AdminSubject): string {
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

/** Draggable subject pill. Renders in-place; the floating ghost is a DragOverlay. */
function SubjectChip({
  subject,
  dragging,
  saving,
}: {
  subject: AdminSubject;
  dragging: boolean;
  saving: boolean;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: subject.id,
    data: { subject },
    disabled: saving,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={`Drag ${subject.name} to a group`}
      className={`group flex cursor-grab touch-none items-center gap-1.5 rounded-lg bg-gray-700/80 px-2 py-1.5 text-xs text-gray-100 shadow-sm transition-colors hover:bg-gray-600 active:cursor-grabbing ${isDragging || dragging ? 'opacity-40' : ''} ${saving ? 'cursor-wait opacity-60' : ''}`}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-secondary-400 opacity-40 transition-opacity group-hover:opacity-100" />
      <span className="truncate">
        {subject.emoji} {subject.name}
      </span>
    </div>
  );
}

/** Group card — a drop target for subject pills. */
function GroupCard({
  group,
  items,
  savingId,
}: {
  group: string;
  items: AdminSubject[];
  savingId: string | null;
}): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: group });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-2.5 transition-all ${isOver ? 'bg-gray-800 ring-2 ring-blue-500' : 'bg-gray-800/50'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-gray-300">
          {group}
        </span>
        <span className="shrink-0 rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-bold text-gray-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p
          className={`flex min-h-[32px] items-center justify-center rounded-md border border-dashed text-xs ${isOver ? 'border-blue-400 text-blue-300' : 'border-gray-700 text-gray-500 dark:text-secondary-400'}`}
        >
          {isOver ? 'Drop here' : 'Empty'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <SubjectChip key={s.id} subject={s} dragging={false} saving={savingId === s.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarSubjectGroups(): JSX.Element {
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<AdminSubject | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const assign = useCallback(
    async (id: string, group: string): Promise<void> => {
      setSavingId(id);
      try {
        await adminApi.put(`/quiz-mcq/subjects/${id}`, {
          category: group === 'Unassigned' ? '' : group,
        });
        await load();
      } catch {
        // assignment failures surface on next load; keep the sub-menu quiet
      } finally {
        setSavingId(null);
      }
    },
    [load]
  );

  const onDragStart = (event: DragStartEvent): void => {
    setActiveSubject((event.active.data.current?.['subject'] as AdminSubject) ?? null);
  };

  const onDragEnd = (event: DragEndEvent): void => {
    setActiveSubject(null);
    const subject = event.active.data.current?.['subject'] as AdminSubject | undefined;
    const target = event.over?.id as string | undefined;
    if (!subject || !target) return;
    if (groupOf(subject) === target) return; // dropped back where it was
    void assign(subject.id, target);
  };

  const byGroup = ALL_KEYS.map((group) => ({
    group,
    items: subjects.filter((s) => groupOf(s) === group),
  }));

  if (isLoading) {
    return <p className="py-2 text-xs text-gray-500 dark:text-secondary-400">Loading subjects…</p>;
  }

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-secondary-400">
          {subjects.length} subjects
        </span>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1 text-xs text-gray-400 dark:text-secondary-400 hover:text-gray-200"
          title="Reload subjects"
        >
          <RefreshCw className="w-3 h-3" /> reload
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveSubject(null)}
      >
        <div className="space-y-2">
          {byGroup.map(({ group, items }) => (
            <GroupCard key={group} group={group} items={items} savingId={savingId} />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeSubject ? (
            <div className="flex rotate-2 items-center gap-1.5 rounded-lg bg-gray-600 px-2 py-1.5 text-xs text-white shadow-xl ring-2 ring-blue-400">
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              <span className="max-w-[160px] truncate">
                {activeSubject.emoji} {activeSubject.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
