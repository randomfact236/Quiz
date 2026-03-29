# Complete Quiz MCQ Rebuild Plan

## Philosophy
> **"Audit everything, clean safely, build properly, replace confidently"**

---

## Phase 0: Audit & Document

Before touching ANY code, document everything.

### Questions to Answer:
- What features currently WORK?
- What features are BROKEN?
- What code is DEAD (never called)?
- What code is DUPLICATE?
- What code is UNUSED (imported but never used)?
- What code is HALF-USED (called but incomplete/broken)?

### Create Audit Spreadsheet:

| Feature/Code | Status | Type | Location | Action |
|---|---|---|---|---|
| Each feature | Works/Broken/Dead | Dead/Duplicate/Unused/Half-used | File + line | Keep/Delete/Rewrite/Fix |

### Run Detection Tools:
```bash
npx ts-prune              # unused exports
npx knip                  # dead code
npx jscpd src/            # duplicate code
npx eslint --rule 'no-unused-vars: error'   # unused imports
```

### Decision Rules:
```
Is it ever called?
→ NO  → DELETE
→ YES → Does it work correctly?
         → YES → KEEP
         → NO  → Is it duplicate?
                  → YES → DELETE (keep best version)
                  → NO  → Is it half-used?
                           → YES → REWRITE
                           → NO  → KEEP
```

---

## Phase 1: Safe Cleanup Only

**Delete ONLY dead/legacy code — nothing working gets touched yet.**

### Frontend Safe Deletes:
- `quiz-data-manager.ts` → Dead legacy
- `questions.json` → Dead legacy data
- `api/quiz-data/route.ts` → Dead legacy route
- `parseCSVQuestions()` → Dead duplicate function
- `subjectsMap` state → Dead, replaced by filterCounts
- `getSubjects()` useEffect → Dead, no longer needed
- Remove their imports from `admin/page.tsx`
- Run `npx eslint src/ --fix` → auto-remove unused imports

### Backend Safe Deletes:
- `?status=` param on public endpoints → Security leak, remove
- `subjects:*` cache pattern → Wrong pattern, remove

### Do NOT Touch Yet:
- `quiz.service.ts` → Has bugs but still works
- `quiz.controller.ts` → Has bugs but still works
- `QuizMcqSection.tsx` → Working UI, leave alone

### Golden Rule:
**Commit after every deletion.**

---

## Phase 2: Backend Rewrite

**Rewrite one file at a time. Test and commit after each.**

### Files to Keep Unchanged:
- `entities/` → DB schema is correct
- `dto/` → Input validation is correct
- `quiz.module.ts` → Module structure is correct

### Files to Fully Rewrite:

#### File 1 — `cache.service.ts`
- Replace blocking `KEYS` command → non-blocking `SCAN`
- Test Redis operations after
- Commit

```typescript
async delPattern(pattern: string): Promise<void> {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await this.redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  } while (cursor !== '0');
}
```

#### File 2 — `quiz.controller.ts`
- Remove `?status=` from all public endpoints → always return PUBLISHED only
- Add cursor pagination params
- Fix auth guards
- Clean response types
- Test all endpoints with Postman
- Commit

#### File 3 — `quiz.service.ts`
- Fix cache invalidation → `quiz:*` pattern (not `subjects:*`)
- Replace offset pagination → cursor-based pagination
- Add transactional deletes (cascade safe)
- Add smart targeted cache invalidation (per subject/chapter)
- Fix filter counts query
- Fix bulk actions
- Test all CRUD operations
- Test cache invalidation
- Test cursor pagination
- Commit

### Golden Rules for Backend Rewrite:
- Never rewrite two files simultaneously
- Always test after each file
- Always commit after each file
- If broken → `git revert`, don't panic

---

## Phase 3: Frontend Hooks

**Build new React Query hooks. Old QuizMcqSection still runs untouched.**

### Setup First:
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Create query client configuration and add `QueryClientProvider` to layout.

### Build These Hooks:

#### `useQuizFilters.ts` — URL-based filter state
```typescript
export function useQuizFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = {
    subject: searchParams.get('subject') || undefined,
    chapter: searchParams.get('chapter') || undefined,
    level: searchParams.get('level') || undefined,
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const setFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === 'subject') params.delete('chapter');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  return { filters, setFilter };
}
```

#### `useSubjects.ts` — Optimistic updates
```typescript
export function useSubjects() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['subjects'],
    queryFn: () => quizApi.getSubjects(),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: quizApi.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['filter-counts'] });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
  };
}
```

#### `useChapters.ts` — Optimistic updates
```typescript
export function useChapters(subjectId: string | null) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => subjectId ? quizApi.getChapters(subjectId) : [],
    enabled: !!subjectId,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations with cache invalidation...
  
  return { data: query.data ?? [], isLoading: query.isLoading, ... };
}
```

#### `useQuestions.ts` — Cursor pagination
```typescript
export function useQuestions(filters: QuizFilters) {
  return useInfiniteQuery({
    queryKey: ['questions', filters],
    queryFn: ({ pageParam }) => quizApi.getQuestions(filters, pageParam, 20),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
  });
}
```

#### `useFilterCounts.ts` — Cached counts
```typescript
export function useFilterCounts(filters: QuizFilters) {
  return useQuery({
    queryKey: ['filter-counts', filters],
    queryFn: () => quizApi.getFilterCounts(filters),
    staleTime: 30 * 1000,
  });
}
```

#### Mutation Hooks:
- `useSubjectMutation` — Create/update/delete with rollback
- `useChapterMutation` — Create/update/delete with rollback
- `useQuestionMutation` — Create/update/delete/bulk with cache invalidation

### Cache Invalidation Rules:
- Subject CRUD → invalidate `subjects`, `chapters`, `questions`, `filter-counts`
- Chapter CRUD → invalidate `chapters`, `questions`, `filter-counts`
- Question CRUD → invalidate `questions`, `filter-counts`

### Golden Rule:
**Old QuizMcqSection must still work during this entire phase.**

---

## Phase 4: Frontend Components

**Build new components alongside old ones. Old QuizMcqSection still runs.**

### Component Structure:
```
QuizMcqContainer (coordinator, ~180 lines)
├── QuizHeader (presentational, ~120 lines)
├── FilterPanel (all filters combined, ~200 lines)
│   ├── StatusDashboard
│   ├── SubjectFilter
│   ├── ChapterFilter
│   ├── LevelFilter
│   ├── SearchInput
│   └── SelectedFilters
├── QuestionManager (table + bulk actions, ~220 lines)
│   ├── QuestionTable
│   └── BulkActionToolbar
└── modals/
    ├── SubjectModal (~180 lines)
    ├── ChapterModal (~180 lines)
    ├── QuestionModal (~200 lines)
    └── ImportModal (~150 lines)
```

### Component Responsibilities:

#### `QuizMcqContainer` — Data coordinator only
```typescript
export function QuizMcqContainer() {
  const { filters, setFilter } = useQuizFilters();
  const subjectsQuery = useSubjects();
  const chaptersQuery = useChapters(filters.subject);
  const questionsQuery = useQuestions(filters);
  const filterCountsQuery = useFilterCounts(filters);
  
  const questions = questionsQuery.data?.pages.flatMap(p => p.data) ?? [];
  
  return (
    <div>
      <QuizHeader totalQuestions={total} onAddQuestion={...} />
      <FilterPanel filters={filters} subjects={subjectsQuery.data} ... />
      <QuestionManager questions={questions} ... />
      {/* Modals */}
    </div>
  );
}
```

#### `QuizHeader` — Presentational only
No data fetching. Receives props only.

#### `FilterPanel` — Receives filter data as props
Local UI state only. No data fetching.

#### `QuestionManager` — Handles selection state locally
Infinite scroll integration. Local state for selectedIds.

### Key Architecture Principles:
- React Query cache is the ONLY source of truth
- NO `useEffect` sync bridges between React Query and `useState`
- NO god components (max 220 lines per file)
- UI reads directly from React Query cache
- Only UI state (modal open/close, selectedIds) lives in `useState`

### Build Order:
1. `QuizHeader` — simplest, purely presentational
2. `FilterPanel` — receives props, no data fetching
3. `SubjectModal`, `ChapterModal` — simple forms
4. `QuestionModal`, `ImportModal` — complex forms
5. `QuestionManager` — table + infinite scroll
6. `QuizMcqContainer` — wire everything together last

---

## Phase 5: Switch & Delete Old Code

**Only do this after all new components are verified working.**

### Steps:
1. Switch import in `page.tsx` from old `QuizMcqSection` to new `QuizMcqContainer`
2. Verify all features work exactly as before visually
3. Verify all CRUD operations work
4. Verify filters, pagination, bulk actions work
5. Delete old `QuizMcqSection.tsx` only after 100% verified
6. Run `npx eslint src/ --fix` again to clean any leftover unused imports

---

## Phase 6: Full Testing

**Test in this exact order:**

1. **Unit tests** — each hook in isolation
2. **Integration tests** — API calls return correct data
3. **Visual tests** — UI looks identical to before
4. **Flow tests** — create/edit/delete all work end to end
5. **Pagination tests** — cursor pagination loads correctly
6. **Bulk action tests** — select/delete/status change work
7. **Filter tests** — all filter combinations work, URL updates correctly
8. **Performance tests** — faster than before, fewer API calls
9. **Cache tests** — optimistic updates show instantly, rollback on error works
10. **Security tests** — public endpoints never return draft/trash questions

---

## Golden Rules (Never Break These)

```
Dead code        → DELETE immediately, no hesitation
Duplicate code   → KEEP best version, DELETE rest
Unused imports   → AUTO-FIX with ESLint --fix
Half-used code   → REWRITE properly, then commit

NEVER:
→ Delete working code before replacement is ready
→ Rewrite two files at the same time
→ Skip testing after each phase
→ Work directly on main branch
→ Comment out dead code instead of deleting it
→ Keep duplicates "just in case"
→ Use useEffect to sync React Query data into useState
→ Create components over 220 lines
```

---

## Success Metrics

| Metric | Before | After |
|---|---|---|
| Largest file | 863 lines | ~220 lines |
| God components | 1 | 0 |
| Dead files | 3+ | 0 |
| Duplicate functions | 2+ | 0 |
| Sources of truth | 2 (useState + API) | 1 (React Query) |
| API calls per Subject CRUD | 2 | 1 |
| API calls per Question CRUD | 2 | 2 (necessary) |
| Redis blocking risk | High | None |
| Cache invalidation | Wrong pattern | Correct pattern |
| Public endpoint security | Leaks drafts | Always published only |
| Scalability | Limited (offset) | Unlimited (cursor) |

---

## Critical Backend Issues to Fix

### Issue 1: Redis Blocking (KEYS Command)
**Problem:** Current `cache.service.ts` uses `KEYS` command which blocks Redis.

**Fix:**
```typescript
// BEFORE (blocking):
async clearCache() {
  const keys = await this.redis.keys('quiz:*'); // BLOCKS!
  await this.redis.del(...keys);
}

// AFTER (non-blocking):
async delPattern(pattern: string): Promise<void> {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await this.redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  } while (cursor !== '0');
}
```

### Issue 2: Wrong Cache Invalidation
**Problem:** Invalidates `subjects:*` instead of `quiz:*`.

**Fix:**
```typescript
// BEFORE (wrong):
await this.cache.delPattern('subjects:*');

// AFTER (correct):
await this.cache.delPattern('quiz:*');
```

### Issue 3: No Cursor Pagination
**Problem:** Uses offset pagination which gets slow at scale.

**Fix:**
```typescript
// Add cursor-based pagination to quiz.service.ts
async findQuestionsWithCursor(filters, cursor?: string, limit: number = 20) {
  const query = this.questionRepo.createQueryBuilder('q')
    .orderBy('q.createdAt', 'DESC')
    .take(limit + 1);

  if (cursor) {
    const decoded = Buffer.from(cursor, 'base64').toString('ascii');
    const [date, id] = decoded.split('::');
    query.andWhere('(q.createdAt < :date OR (q.createdAt = :date AND q.id < :id))', 
      { date, id });
  }

  const questions = await query.getMany();
  const hasMore = questions.length > limit;
  const data = hasMore ? questions.slice(0, limit) : questions;
  
  const nextCursor = hasMore 
    ? Buffer.from(`${data[data.length-1].createdAt}::${data[data.length-1].id}`).toString('base64')
    : undefined;

  return { data, nextCursor, hasMore, total: await this.getTotalCount(filters) };
}
```

### Issue 4: No Transactional Deletes
**Problem:** Cascade delete not wrapped in transaction.

**Fix:**
```typescript
async deleteSubject(id: string): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const chapters = await queryRunner.manager.find(Chapter, { where: { subjectId: id } });
    for (const chapter of chapters) {
      await queryRunner.manager.delete(Question, { chapterId: chapter.id });
    }
    await queryRunner.manager.delete(Chapter, { subjectId: id });
    await queryRunner.manager.delete(Subject, { id });
    
    await queryRunner.commitTransaction();
    await this.clearQuizCaches();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

### Issue 5: Security Leak in Public Endpoints
**Problem:** Public endpoints accept `?status=` parameter.

**Fix:**
```typescript
// In quiz.controller.ts - public endpoints:
@Get('subjects/:slug/questions')
async getPublicQuestions(@Param('slug') slug: string) {
  // Always filter by PUBLISHED only - ignore any status param
  return this.quizService.findAllQuestions({ 
    subjectSlug: slug, 
    status: ContentStatus.PUBLISHED // Force published only
  });
}
```

---

## Implementation Checklist

### Phase 0: Audit
- [ ] Run `npx ts-prune`
- [ ] Run `npx knip`
- [ ] Run `npx jscpd src/`
- [ ] Create audit spreadsheet
- [ ] Document every feature status

### Phase 1: Safe Cleanup
- [ ] Delete `quiz-data-manager.ts`
- [ ] Delete `questions.json`
- [ ] Delete `api/quiz-data/route.ts`
- [ ] Remove unused imports
- [ ] Fix public endpoint security
- [ ] Commit after each deletion

### Phase 2: Backend Rewrite
- [ ] Rewrite `cache.service.ts` (KEYS → SCAN)
- [ ] Test Redis operations
- [ ] Rewrite `quiz.controller.ts` (cursor params, auth)
- [ ] Test all endpoints
- [ ] Rewrite `quiz.service.ts` (cursor pagination, transactions)
- [ ] Test all CRUD operations

### Phase 3: Frontend Hooks
- [ ] Install React Query
- [ ] Create `useQuizFilters`
- [ ] Create `useSubjects`
- [ ] Create `useChapters`
- [ ] Create `useQuestions`
- [ ] Create `useFilterCounts`
- [ ] Create mutation hooks
- [ ] Verify old QuizMcqSection still works

### Phase 4: Frontend Components
- [ ] Build `QuizHeader`
- [ ] Build `FilterPanel`
- [ ] Build modals (Subject, Chapter, Question, Import)
- [ ] Build `QuestionManager`
- [ ] Build `QuizMcqContainer`
- [ ] Wire everything together

### Phase 5: Switch & Delete
- [ ] Switch to new container
- [ ] Verify all features work
- [ ] Delete old QuizMcqSection.tsx
- [ ] Clean up unused imports

### Phase 6: Testing
- [ ] Unit tests (all hooks)
- [ ] Integration tests (API)
- [ ] Visual tests (UI identical)
- [ ] Flow tests (end-to-end)
- [ ] Performance tests
- [ ] Security tests

---

## Related Documents

- Keep this as the single source of truth
- Reference `true-ideal-approach-plan.md` for detailed React Query patterns

---

## Final Notes

**This plan gives you:**
- ✅ True ideal architecture (single source of truth)
- ✅ Component decomposition (no god components)
- ✅ Scalable backend (cursor pagination, SCAN instead of KEYS)
- ✅ Secure public endpoints (no status leaks)
- ✅ Preserved user experience (identical UI)
- ✅ Safe implementation (phase by phase, test after each)

**Ready to start Phase 0 audit.**
