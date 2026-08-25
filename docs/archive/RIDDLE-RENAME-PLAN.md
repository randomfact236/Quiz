# Riddle MCQ Entity Rename Plan

## Overview

Rename `RiddleSubject` → `RiddleMcqSubject` and `RiddleCategory` → `RiddleMcqCategory` across the riddle-mcq module.

**No migrations needed** — table names are preserved via `@Entity('riddle_subjects')` and `@Entity('riddle_categories')`.

## Scope

**Backend (riddle-mcq module only):**

- `entities/riddle-subject.entity.ts` → class rename + import
- `entities/riddle-category.entity.ts` → class rename + import
- `entities/riddle-mcq.entity.ts` → relation type references
- `riddle-mcq.module.ts` → entity imports + TypeOrmModule
- `services/riddle-mcq-subject.service.ts` → all type refs
- `services/riddle-mcq-category.service.ts` → all type refs
- `services/riddle-mcq-question.service.ts` → all type refs
- `services/riddle-mcq-import.service.ts` → all type refs
- `controllers/riddle-mcq-subject.controller.ts` → all type refs
- `controllers/riddle-mcq-category.controller.ts` → all type refs

**Frontend (riddle-mcq feature only):**

- `types/riddles.ts` → interface rename + nested refs
- `lib/riddle-mcq-api.ts` → type refs
- `features/riddle-mcq/hooks/useRiddleMcqModals.ts` → type refs
- `components/RiddleSubjectFilterRow.tsx` → FILE RENAME + component rename
- `components/index.ts` → re-export rename
- `components/FilterControls.tsx` → import rename

**DO NOT touch:**

- `apps/backend/src/common/` — quiz/dad-jokes DTOs, different domain
- `image-riddles` module — separate module
- Any file outside riddle-mcq feature folder

---

## Steps

### Backend

**Step 1:** `entities/riddle-subject.entity.ts`

- Line 11: `RiddleCategory` → `RiddleMcqCategory`
- Line 15: `RiddleSubject` → `RiddleMcqSubject`
- Line 33: `RiddleCategory` → `RiddleMcqCategory`
- Line 35: `RiddleCategory | null` → `RiddleMcqCategory | null`
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 2:** `entities/riddle-category.entity.ts`

- Line 11: `RiddleSubject` → `RiddleMcqSubject`
- Line 14: `RiddleCategory` → `RiddleMcqCategory`
- Line 37: `RiddleSubject` → `RiddleMcqSubject`
- Line 38: `RiddleSubject[]` → `RiddleMcqSubject[]`
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 3:** `entities/riddle-mcq.entity.ts`

- Line 13: `RiddleSubject` → `RiddleMcqSubject`
- Line 55: `RiddleSubject` → `RiddleMcqSubject`
- Line 57: `RiddleSubject` → `RiddleMcqSubject`
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 4:** `riddle-mcq.module.ts`

- Line 6: `RiddleCategory` → `RiddleMcqCategory`
- Line 8: `RiddleSubject` → `RiddleMcqSubject`
- Line 25: both entity refs in TypeOrmModule.forFeature
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 5:** `services/riddle-mcq-subject.service.ts`

- Replace all `RiddleSubject` → `RiddleMcqSubject` (7 refs)
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 6:** `services/riddle-mcq-category.service.ts`

- Replace all `RiddleCategory` → `RiddleMcqCategory` (9 refs)
- Replace all `RiddleSubject` → `RiddleMcqSubject` (2 refs)
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 7:** `services/riddle-mcq-question.service.ts`

- Replace all `RiddleSubject` → `RiddleMcqSubject` (3 refs)
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 8:** `services/riddle-mcq-import.service.ts`

- Replace all `RiddleCategory` → `RiddleMcqCategory` (5 refs)
- Replace all `RiddleSubject` → `RiddleMcqSubject` (3 refs)
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 9:** `controllers/riddle-mcq-subject.controller.ts`

- Replace all `RiddleSubject` → `RiddleMcqSubject` (7 refs)
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 10:** `controllers/riddle-mcq-category.controller.ts`

- Replace all `RiddleCategory` → `RiddleMcqCategory` (7 refs)
- Verify: `cd apps/backend && npx tsc --noEmit`

**Step 11:** `docker-compose build backend 2>&1 | tail -5`

### Frontend

**Step 12:** `types/riddles.ts`

- Rename interface `RiddleSubject` → `RiddleMcqSubject` (line 26)
- Rename interface `RiddleCategory` → `RiddleMcqCategory` (line 14)
- Line 19: `subjects?: RiddleSubject[]` → `subjects?: RiddleMcqSubject[]`
- Line 48, 64: `RiddleSubject` → `RiddleMcqSubject`
- Verify: `cd apps/frontend && npx tsc --noEmit`

**Step 13:** `lib/riddle-mcq-api.ts`

- Line 12: `RiddleSubject` → `RiddleMcqSubject`
- Line 14: `RiddleSubject` → `RiddleMcqSubject`
- Line 29: `RiddleCategory` → `RiddleMcqCategory`
- Replace all `RiddleSubject` → `RiddleMcqSubject` (7 refs in type usages)
- Replace all `RiddleCategory` → `RiddleMcqCategory` (8 refs in type usages)
- Verify: `cd apps/frontend && npx tsc --noEmit`

**Step 14:** `hooks/useRiddleMcqModals.ts`

- Replace all `RiddleSubject` → `RiddleMcqSubject` (3 refs)
- Replace all `RiddleCategory` → `RiddleMcqCategory` (3 refs)
- Verify: `cd apps/frontend && npx tsc --noEmit`

**Step 15:** `components/RiddleSubjectFilterRow.tsx`

- Rename FILE: `RiddleSubjectFilterRow.tsx` → `RiddleMcqSubjectFilterRow.tsx`
- Lines 5, 14, 21, 66: `RiddleSubjectFilterRow` → `RiddleMcqSubjectFilterRow`
- Verify: `cd apps/frontend && npx tsc --noEmit`

**Step 16:** `components/index.ts`

- `RiddleSubjectFilterRow` → `RiddleMcqSubjectFilterRow`
- `./RiddleSubjectFilterRow` → `./RiddleMcqSubjectFilterRow`
- Verify: `cd apps/frontend && npx tsc --noEmit`

**Step 17:** `components/FilterControls.tsx`

- Import: `RiddleSubjectFilterRow` → `RiddleMcqSubjectFilterRow`
- Import path: `./RiddleSubjectFilterRow` → `./RiddleMcqSubjectFilterRow`
- Usage: `RiddleSubjectFilterRow` → `RiddleMcqSubjectFilterRow`
- Verify: `cd apps/frontend && npx tsc --noEmit`

### Final

- `cd apps/frontend && npx tsc --noEmit` — zero errors
- `docker-compose build backend` — passes
- Manual: load riddle-mcq admin, subjects/categories load correctly

### Rollback

```bash
git checkout \
  apps/backend/src/riddle-mcq/ \
  apps/frontend/src/features/riddle-mcq/ \
  apps/frontend/src/lib/riddle-mcq-api.ts \
  apps/frontend/src/types/riddles.ts
```

### Commit

```bash
git add .
git commit -m "refactor(riddle-mcq): rename RiddleSubject→RiddleMcqSubject, RiddleCategory→RiddleMcqCategory

- Update 10 backend files (entities, services, controllers, module)
- Update 4 frontend files (types, api, hooks, components)
- Rename RiddleSubjectFilterRow → RiddleMcqSubjectFilterRow
- Table names preserved via @Entity — no migration needed"
git push
```
