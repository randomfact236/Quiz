# Quiz Code Cleanup Plan

## Status: ✅ COMPLETED

| Section | Status | Notes |
|---------|--------|-------|
| 1: Dead states | ✅ DONE | Removed `questionCounts`, `subjectStatusCounts` |
| 2: formatTime | ✅ DONE | Created `formatTimeMMSS`, `formatTimeCompact` in utils |
| 3: ModalFooter | ✅ DONE | Created `ModalFooter` component |
| 4: getCategoryDesign | ❌ SKIPPED | Context-specific variations |
| 5: Orphaned file | ✅ DONE | `QuizManagementSection.tsx` already deleted |

---

## Summary of Changes

### Section 1: Dead States Removed
**File:** `apps/frontend/src/app/admin/page.tsx`

- Removed `questionCounts` state + setter
- Removed `subjectStatusCounts` state + setter
- Removed `getQuestionCountBySubject` import
- Removed entire `fetchQuestionCounts` useEffect (~20 lines)

### Section 2: formatTime Functions Consolidated
**File:** `apps/frontend/src/lib/utils.ts` (added)
- `formatTimeMMSS(seconds)` → "01:30" format
- `formatTimeCompact(seconds)` → "1m 30s" format

**Updated files:**
- `QuizTimer.tsx` → uses `formatTimeMMSS`
- `ScoreCard.tsx` → uses `formatTimeCompact`
- `riddle-mcq/play/page.tsx` → uses `formatTimeMMSS`

### Section 3: ModalFooter Component Created
**New file:** `apps/frontend/src/components/ui/ModalFooter.tsx`

**Updated files:**
- `SubjectModal.tsx` → uses `ModalFooter`
- `ChapterModal.tsx` → uses `ModalFooter`
- `QuestionModal.tsx` → uses `ModalFooter`

**Note:** `ActionOptions.tsx` not updated (uses different semantics - `onCancel`/`onConfirm` with danger variant)

---

## Skipped Section

### Section 4: getCategoryDesign (SKIPPED)
**Full details:** `docs/cleanup-plan/SECTION_3_SKIPPED.md` (kept for reference)

**Reason:** The two implementations have context-specific variations:

| Aspect | quiz/page.tsx | TopicSection.tsx |
|--------|---------------|------------------|
| colorClass | `text-blue-600` (text color) | `bg-gradient-to-r from-blue-50 to-indigo-50` (background gradient) |
| icon size | `h-5 w-5` | `h-4 w-4` |
| icon color | none | `text-indigo-600` |

**Decision:** Risk of introducing subtle bugs outweighs the -32 lines savings.

**Future consideration:** Could consolidate with a config object approach:
```typescript
const CATEGORY_CONFIG = {
  academic: {
    textColor: 'text-blue-600',
    bgGradient: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    iconName: 'GraduationCap',
    iconSize: 'h-5 w-5',
    iconColor: 'text-indigo-600'
  },
  // ...
};

function getCategoryDesign(categoryName: string, style: 'text' | 'bg' = 'text') {
  // returns appropriate style based on param
}
```

---

## Net Code Reduction

| Section | Lines Removed |
|---------|---------------|
| 1: Dead states | ~30 |
| 2: formatTime | ~12 |
| 3: Modal Footer | ~40 |
| **Total** | **~82 lines** |

---

## Related Documentation

- Riddle cleanup plan: `docs/clean-riddle-plan.md`
