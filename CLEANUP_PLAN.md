# Code Cleanup Plan

## Status Overview

| Round   | Status     | Issues                 |
| ------- | ---------- | ---------------------- |
| Round 1 | ✅ DONE    | #2, #4, #14            |
| Round 2 | ⏳ PENDING | #7, #8, #6, #9, #10    |
| Round 3 | ⏳ PENDING | #15, #17               |
| Skipped | ❌ SKIP    | #16 (stale count risk) |

---

## Round 1 — ✅ COMPLETED

### #2 — Dead `createMutation` in `useChapters.ts` ✅

**File:** `apps/frontend/src/features/quiz/hooks/useChapters.ts`
**What was done:**

- Removed `createMutation` definition (was lines 29-51)
- Removed `create`, `isCreating`, `createError` from return object
- Removed unused imports: `createChapter`, `CreateChapterDto`
- Kept `updateMutation` and `deleteMutation` (used externally)

### #4 — Redundant UUID_REGEX in `bulkActionQuestions` ✅

**File:** `apps/frontend/src/lib/quiz-api.ts`
**What was done:**

- Removed `UUID_REGEX` constant and validation check (was lines 373-379)
- Backend `@Matches` decorator still validates UUIDs

### #14 — Unused `_subjectId` parameter ✅

**File:** `apps/backend/src/quiz/quiz.service.ts`
**What was done:**

- Changed `clearQuizCaches(_subjectId?: string)` → `clearQuizCaches()`
- Updated 3 call sites: `createChapter`, `updateChapter`, `deleteChapter`

---

## Round 2 — Pending

### #7 — Remove unused mutations from `useChapters.ts`

**File:** `apps/frontend/src/features/quiz/hooks/useChapters.ts`
**Current state:** Has `updateMutation` and `deleteMutation`
**External usage:**

- `chaptersQuery.delete` — used in `QuizMcqContainer.tsx:141` ✅ KEEP
- `chaptersQuery.update` — NOT used anywhere ❌ REMOVE
  **Changes:**
- Remove `updateMutation` definition (lines 27-53)
- Remove from return object: `update`, `isUpdating`, `updateError`
- Remove unused import: `updateChapter`
- Keep only `deleteMutation` and its return values

### #8 — Remove unused mutations from `useSubjects.ts`

**File:** `apps/frontend/src/features/quiz/hooks/useSubjects.ts`
**Current state:** Has `createMutation`, `updateMutation`, `deleteMutation` with optimistic updates
**External usage:**

- `subjectsQuery.delete` — used in `QuizMcqContainer.tsx:129` ✅ KEEP
- `subjectsQuery.create` — NOT used anywhere ❌ REMOVE
- `subjectsQuery.update` — NOT used anywhere ❌ REMOVE
  **Changes:**
- Remove `createMutation` and `updateMutation` definitions
- Remove from return object: `create`, `update`, `isCreating`, `isUpdating`, `createError`, `updateError`
- Remove unused imports: `createSubject`, `updateSubject`, `CreateSubjectDto`
- Keep only `deleteMutation` and its return values

### #6 — Inline handler wrappers in QuestionModal

**File:** `apps/frontend/src/features/quiz/components/modals/QuestionModal.tsx`
**Current state:** 3 one-liner handler functions (lines 101-114)
**Changes:**

- Remove `handleOptionChange` → inline as `onChange={(e) => setOptions(prev => prev.map((o, i) => i === index ? e.target.value : o))}`
- Remove `handleSubjectChange` → inline as `onChange={(e) => setSubjectId(e.target.value)}`
- Remove `handleChapterChange` → inline as `onChange={(e) => setChapterId(e.target.value)}`

### #9 — Fix `any` types in `useQuestionMutation.ts`

**File:** `apps/frontend/src/features/quiz/hooks/useQuestionMutation.ts`
**Current state:** Uses `any` in 6 places (lines 37, 41, 43, 74, 78, 80)
**Changes:**

- Import `InfiniteData` from `@tanstack/react-query`
- Define `QuestionsResponse` type (or import from `useQuestions.ts`)
- Replace `(old: any)` with `(old: InfiniteData<QuestionsResponse> | undefined)`
- Replace `(page: any)` with proper page type
- Replace `(q: any)` with `QuizQuestion`

### #10 — Fix ImportModal payload type

**File:** `apps/frontend/src/features/quiz/components/modals/ImportModal.tsx`
**Current state:** `await bulkCreateAsync(payload as any)` (line 194)
**Changes:**

- Add `BulkQuestionDto` interface to `quiz-api.ts`:
  ```typescript
  export interface BulkQuestionDto {
    subjectName?: string;
    questions: BulkQuestionItemDto[];
  }
  ```
- Add `BulkQuestionItemDto` interface if not exists:
  ```typescript
  export interface BulkQuestionItemDto {
    question: string;
    chapterName: string;
    subjectName?: string;
    correctAnswer?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    level?: string;
    status?: string;
  }
  ```
- Update `bulkCreateAsync` in `useQuestionMutation.ts` to accept `BulkQuestionDto`
- Remove `as any` cast in ImportModal

---

## Round 3 — Pending

### #15 — Fix controller return type

**File:** `apps/backend/src/quiz/quiz.controller.ts`
**Current state:** Line 149 declares:

```typescript
chapterCounts: {
  id: string;
  name: string;
  count: number;
}
[];
```

**Actual service returns:** `{ id: string; name: string; count: number; subjectId: string }[]`
**Changes:**

- Add `subjectId: string` to the return type declaration

### #17 — CSV export as file download

**Files:**

- `apps/backend/src/quiz/quiz.controller.ts` (export endpoint)
- `apps/frontend/src/lib/quiz-api.ts` (`exportQuestionsFromBackend`)

**Current approach:**

1. Backend builds CSV string in memory
2. Returns as JSON: `{ csv: string, filename: string }`
3. Frontend creates Blob from string, triggers download

**New approach:**

1. Backend returns file stream with headers:
   - `Content-Type: text/csv`
   - `Content-Disposition: attachment; filename="questions_export_*.csv"`
2. Frontend uses `window.location.href` or fetch + Blob for download

**Backend changes:**

```typescript
@Get('questions/export')
@Header('Content-Type', 'text/csv')
@Header('Content-Disposition', 'attachment')
async exportQuestions(@Query() query: ExportQueryDto) {
  const { csv, filename } = await this.quizService.exportQuestionsToCSV(filters);
  // Return as stream or use @Res() for direct file response
}
```

**Frontend changes:**

```typescript
// Option A: Direct URL navigation (simplest)
window.location.href = `${API_BASE_URL}/quiz/questions/export?subject=...`;

// Option B: Fetch with blob (supports auth headers)
const response = await api.get('/quiz/questions/export', {
  responseType: 'blob',
  isAdmin: true,
});
const blob = new Blob([response.data], { type: 'text/csv' });
// ... trigger download
```

---

## Skipped

### #16 — Cache total count separately ❌

**Reason:** Stale count risk. With 2000+ questions, admin expects real-time accuracy.
Adding a 30-second TTL is marginal benefit for added complexity.
Skip until actual performance issues are observed.

---

## Execution Checklist

- [x] #2 — Remove dead createMutation from useChapters.ts
- [x] #4 — Remove UUID_REGEX from bulkActionQuestions
- [x] #14 — Remove unused \_subjectId parameter
- [ ] #7 — Remove updateMutation from useChapters.ts
- [ ] #8 — Remove createMutation + updateMutation from useSubjects.ts
- [ ] #6 — Inline handler wrappers in QuestionModal
- [ ] #9 — Fix any types in useQuestionMutation.ts
- [ ] #10 — Fix ImportModal payload type
- [ ] #15 — Fix controller return type
- [ ] #17 — CSV export as file download

---

## Notes

- All changes should pass TypeScript compilation with 0 errors
- ESLint should pass with 0 errors
- Docker container should rebuild and restart successfully after backend changes
- Commit after each round with descriptive messages
