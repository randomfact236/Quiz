# Quiz Module - Code Quality Issues

**Date:** March 23, 2026  
**Status:** Pending Cleanup  
**Severity:** HIGH (1), MEDIUM (5)

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Dead Code (unused methods) | 1 | HIGH |
| Unused Imports | 5 | MEDIUM |
| Duplicate Functions | 3 | HIGH |
| Duplicate Pages | 2 | HIGH |
| Unused Return Values | 1 | MEDIUM |

---

## 🔴 HIGH Severity Issues

### Issue #1: Dead Method - `getStatusCounts()`

**File:** `apps/backend/src/quiz/quiz.service.ts`  
**Lines:** 727-729

```typescript
async getStatusCounts(): Promise<StatusCountResponse> {
  return this.bulkActionService.getStatusCounts(this.questionRepo);
}
```

**Problem:** Method is defined but never called from any controller or service.

**Action:** Remove this method.

---

### Issue #2: Duplicate Functions in `useQuiz.ts`

**File:** `apps/frontend/src/hooks/useQuiz.ts`  
**Lines:** 74-203

Three nearly identical functions share ~90% identical logic:

| Function | Lines | Purpose |
|----------|-------|---------|
| `loadQuestions()` | 74-110 | Load base questions, slice to 10 |
| `loadAdditionalQuestions()` | 113-159 | Load with excludeIds filtering |
| `countAvailableQuestions()` | 162-203 | Return count only |

**Shared Logic:**
```typescript
if (subject === 'all') {
  if (level === 'all') {
    questions = await getMixedQuestions(count + excludeIds.length);
  } else {
    questions = await getRandomQuestions(level, count + excludeIds.length);
  }
} else {
  // Same subject/chapter/level filtering logic repeated 3 times
}
```

**Action:** Refactor into a single configurable function with options parameter.

---

### Issue #3: Duplicate Pages

**Files:**
- `apps/frontend/src/app/quiz/practice-mode/page.tsx` (399 lines)
- `apps/frontend/src/app/quiz/timer-challenge/page.tsx` (399 lines)

**Problem:** 99% identical code. Only differences:

| Difference | practice-mode | timer-challenge |
|------------|---------------|-----------------|
| Icon | `GraduationCap` | `Timer` |
| URL param | `mode=practice` | `mode=timer` |
| Page title | Practice Mode | Timer Challenge |
| Button text | Start Complete Mix Practice | Start Complete Mix Challenge |

**Action:** Create shared component `QuizModeSelector.tsx` that accepts `mode` prop.

---

## 🟡 MEDIUM Severity Issues

### Issue #4: Unused Imports - Controller

**File:** `apps/backend/src/quiz/quiz.controller.ts`

| Line | Import | Used? |
|------|--------|-------|
| 17 | `Type` from 'class-transformer' | ❌ NO |
| 18 | `IsBoolean` from 'class-validator' | ❌ NO |
| 28 | `StatusFilterDto` from bulk-action.dto | ❌ NO |

**Action:** Remove unused imports.

---

### Issue #5: Unused Imports - Service

**File:** `apps/backend/src/quiz/quiz.service.ts`  
**Line:** 5

```typescript
import { Repository, DataSource, FindOptionsWhere, In, ILike } from 'typeorm';
```

| Import | Used? |
|--------|-------|
| `Repository` | ✅ YES |
| `DataSource` | ✅ YES |
| `In` | ✅ YES |
| `FindOptionsWhere` | ❌ NO |
| `ILike` | ❌ NO |

**Note:** `ILike` is NOT imported but `ILIKE` is used directly in query builder strings (TypeORM allows this).

**Action:** Remove `FindOptionsWhere` and `ILike` from import.

---

### Issue #6: Unused Return Values - useQuizSubjects Hook

**File:** `apps/frontend/src/hooks/useQuizSubjects.ts`  
**Lines:** 64-71

```typescript
return {
  subjects,        // ✅ USED
  total,           // ❌ NOT USED
  isLoading,       // ❌ NOT USED
  isEmpty,         // ❌ NOT USED
  error,           // ❌ NOT USED
  refetch,         // ✅ USED (aliased as refetchSubjects)
};
```

**Consumer:** `apps/frontend/src/app/admin/page.tsx` line 67
```typescript
const { subjects: dbSubjects, refetch: refetchSubjects } = useQuizSubjects();
```

**Action:** Either:
- Remove unused return values (minor breaking change)
- Keep for future use (document as planned)

---

## 📋 Cleanup Checklist

- [ ] Remove `getStatusCounts()` method from `quiz.service.ts`
- [ ] Remove unused imports from `quiz.controller.ts` (`Type`, `IsBoolean`, `StatusFilterDto`)
- [ ] Remove unused imports from `quiz.service.ts` (`FindOptionsWhere`, `ILike`)
- [ ] Refactor duplicate functions in `useQuiz.ts` into single helper
- [ ] Create shared `QuizModeSelector` component
- [ ] Remove duplicate page OR document why they must remain separate

---

## Files with NO Issues

| File | Status |
|------|--------|
| `quiz.module.ts` | ✅ Clean |
| `subject.entity.ts` | ✅ Clean |
| `chapter.entity.ts` | ✅ Clean |
| `question.entity.ts` | ✅ Clean |
| `quiz-api.ts` | ✅ Clean |
| `quiz-data-manager.ts` | ✅ Clean |
| `quiz/page.tsx` | ✅ Clean |
| `quiz/play/page.tsx` | ✅ Clean |
| `quiz/results/page.tsx` | ✅ Clean |

---

## Impact Assessment

| Impact Area | Severity | Notes |
|------------|----------|-------|
| Runtime Errors | None | Code doesn't execute |
| Bundle Size | Low | Unused imports add ~2KB |
| Maintainability | Medium | Confusing for new developers |
| Performance | None | Dead code is eliminated at build |

**Risk of Removal:** LOW - All identified issues are truly unused code with no runtime impact.
