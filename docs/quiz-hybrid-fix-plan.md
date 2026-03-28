# Quiz Hybrid Pattern Fix - COMPLETE

## Overview

Fix Quiz admin section to follow hybrid architecture pattern:
- **Riddle Pattern**: Subjects/Chapters (small data, direct state)
- **Quiz Pattern**: Questions (large data, paginated)

## Problems Fixed

1. **Bug 1**: `handleRefresh()` and `onSubjectsChange?.()` not awaited - modal closes before state updates
2. **Bug 2**: Split state (allSubjects from parent, chapters from filterCounts) - causes stale UI

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│              QUIZ HYBRID PATTERN                        │
│                                                          │
│  SUBJECTS & CHAPTERS           QUESTIONS                │
│  ┌─────────────────────────┐   ┌─────────────────────┐ │
│  │ Riddle Pattern         │   │ Quiz Pattern        │ │
│  │ - Local state         │   │ - Paginated        │ │
│  │ - Direct updates      │   │ - filterCounts     │ │
│  │ - CRUD → setState()   │   │ - Pagination       │ │
│  └─────────────────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Changes Summary

| # | What | Where |
|---|------|-------|
| 1 | Add `getSubjects` to imports | Line ~21 |
| 2 | Add `localSubjects` state | Line ~50 |
| 3 | Add initial useEffect to load subjects | Line ~165 |
| 4 | Fix `handleSaveSubject` | Line ~334 |
| 5 | Fix `handleSaveChapter` | Line ~369 |
| 6 | Fix `handleConfirmDelete` | Line ~417 |
| 7 | Update `subjectsForModal` | Line ~468 |

---

## Detailed Changes

### File: `apps/frontend/src/app/admin/components/QuizMcqSection.tsx`

---

### Change 1: Add `getSubjects` Import

**FIND** (lines 5-21):
```typescript
import { 
  getFilterCounts, 
  getAllQuestions, 
  FilterCountsResponse, 
  QuizQuestion,
  createSubject,
  createChapter,
  createQuestion,
  updateSubject,
  updateChapter,
  updateQuestion,
  deleteSubject,
  deleteChapter,
  deleteQuestion,
  exportQuestionsToCSV,
  bulkActionQuestions,
} from '@/lib/quiz-api';
```

**ADD** before `exportQuestionsToCSV`:
```typescript
  getSubjects,
```

---

### Change 2: Add localSubjects State

**FIND** (around line 47):
```typescript
export default function QuizMcqSection({ allSubjects, onSubjectsChange, isLoading: isLoadingSubjects, subject }: QuizMcqSectionProps) {
  const { filters, setFilter, resetFilters } = useQuizFilters(subject?.slug === 'quiz' ? undefined : subject?.slug);
  
  const [filterCounts, setFilterCounts] = useState<FilterCountsResponse | null>(null);
```

**ADD AFTER** `const [filterCounts, setFilterCounts] = useState<FilterCountsResponse | null>(null);`:
```typescript
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);
```

---

### Change 3: Add Initial Load useEffect

**FIND** (lines ~162-175):
```typescript
  }, []);

  // Reset chapter filter when subject changes
```

**ADD BEFORE** the closing `}, []);`:
```typescript
  // Load subjects like Riddle (hybrid pattern)
  useEffect(() => {
    getSubjects()
      .then(apiSubjects => {
        setLocalSubjects(apiSubjects);
      })
      .catch(err => console.error('Failed to load subjects:', err));
  }, []);
```

**AFTER ADDING, the code should look like:**
```typescript
  useEffect(() => {
    getSubjects()
      .then(apiSubjects => {
        setLocalSubjects(apiSubjects);
      })
      .catch(err => console.error('Failed to load subjects:', err));
  }, []);

  // Reset chapter filter when subject changes
```

---

### Change 4: Fix handleSaveSubject

**FIND** (lines ~334-349):
```typescript
  const handleSaveSubject = async (data: { name: string; emoji: string; category: string }) => {
    try {
      if (subjectModalMode === 'add') {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await createSubject({ ...data, slug });
      } else if (editingSubject) {
        await updateSubject(editingSubject.id, data);
      }
      handleRefresh();
      onSubjectsChange?.();
    } catch (error: any) {
      console.error('Failed to save subject:', error);
      const errorMessage = error?.message || 'Failed to save subject';
      alert(errorMessage);
    }
  };
```

**REPLACE WITH**:
```typescript
  const handleSaveSubject = async (data: { name: string; emoji: string; category: string }) => {
    try {
      if (subjectModalMode === 'add') {
        const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await createSubject({ ...data, slug });
      } else if (editingSubject) {
        await updateSubject(editingSubject.id, data);
      }
      // HYBRID: Direct subjects update (Riddle pattern)
      const apiSubjects = await getSubjects();
      setLocalSubjects(apiSubjects);
      // Also refresh questions/counts (Quiz pattern)
      await handleRefresh();
    } catch (error: any) {
      console.error('Failed to save subject:', error);
      const errorMessage = error?.message || 'Failed to save subject';
      alert(errorMessage);
    }
  };
```

---

### Change 5: Fix handleSaveChapter

**FIND** (lines ~369-383):
```typescript
  const handleSaveChapter = async (data: { name: string; subjectId: string }) => {
    try {
      if (chapterModalMode === 'add') {
        await createChapter(data);
      } else if (editingChapter) {
        await updateChapter(editingChapter.id, data);
      }
      handleRefresh();
      onSubjectsChange?.();
    } catch (error: any) {
      console.error('Failed to save chapter:', error);
      const errorMessage = error?.message || 'Failed to save chapter';
      alert(errorMessage);
    }
  };
```

**REPLACE WITH**:
```typescript
  const handleSaveChapter = async (data: { name: string; subjectId: string }) => {
    try {
      if (chapterModalMode === 'add') {
        await createChapter(data);
      } else if (editingChapter) {
        await updateChapter(editingChapter.id, data);
      }
      // HYBRID: Direct subjects refresh (Riddle pattern)
      const apiSubjects = await getSubjects();
      setLocalSubjects(apiSubjects);
      // Also refresh filter counts (Quiz pattern)
      await handleRefresh();
    } catch (error: any) {
      console.error('Failed to save chapter:', error);
      const errorMessage = error?.message || 'Failed to save chapter';
      alert(errorMessage);
    }
  };
```

---

### Change 6: Fix handleConfirmDelete

**FIND** (lines ~417-440):
```typescript
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      switch (deleteTarget.type) {
        case 'subject':
          await deleteSubject(deleteTarget.id);
          onSubjectsChange?.();
          break;
        case 'chapter':
          await deleteChapter(deleteTarget.id);
          onSubjectsChange?.();
          break;
        case 'question':
          await deleteQuestion(deleteTarget.id);
          break;
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };
```

**REPLACE WITH**:
```typescript
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      switch (deleteTarget.type) {
        case 'subject':
          await deleteSubject(deleteTarget.id);
          // HYBRID: Direct subjects refresh (Riddle pattern)
          const subjectsAfterDelete = await getSubjects();
          setLocalSubjects(subjectsAfterDelete);
          break;
        case 'chapter':
          await deleteChapter(deleteTarget.id);
          // HYBRID: Direct subjects refresh (Riddle pattern)
          const subjectsAfterChapterDelete = await getSubjects();
          setLocalSubjects(subjectsAfterChapterDelete);
          break;
        case 'question':
          await deleteQuestion(deleteTarget.id);
          break;
      }
      // Quiz pattern: refresh counts and questions
      await handleRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };
```

---

### Change 7: Update subjectsForModal

**FIND** (line ~468):
```typescript
  const subjectsForModal = allSubjects.map(s => ({ id: s.id, name: s.name, slug: s.slug }));
```

**REPLACE WITH**:
```typescript
  const subjectsForModal = localSubjects.map(s => ({ id: s.id, name: s.name, slug: s.slug }));
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/frontend/src/app/admin/components/QuizMcqSection.tsx` | 7 changes above |

**No backend changes needed** - `clearQuizCaches()` with `quiz:*` is already correct.

## Verification Checklist

- [ ] Create chapter → Chapter appears in ChapterFilter immediately
- [ ] Edit chapter → Changes visible immediately
- [ ] Delete chapter → Chapter removed from UI immediately
- [ ] Create subject → Subject appears in SubjectFilter immediately
- [ ] Edit subject → Changes visible immediately
- [ ] Delete subject → Subject removed from UI immediately
- [ ] Create/edit/delete → Question list refreshes correctly
- [ ] Filter counts update correctly after CRUD
- [ ] Subject modal dropdown shows all subjects

## Rollback Plan

If issues persist:
1. Revert all changes to QuizMcqSection.tsx
2. Check backend cache clearing (`quiz:*` pattern) - already verified correct
3. Verify Redis has correct keys: `docker exec quiz-redis redis-cli KEYS "quiz:*"`
4. Check browser network tab for API responses
5. Check browser console for errors
