# FINAL PLAN: Riddle MCQ Module

## Objective
Create a clean `riddle-mcq/` module that mirrors the `quiz/` architecture exactly.

---

## Riddle MCQ System Design

### Levels
| Level | Format | Options | correctLetter |
|-------|--------|---------|---------------|
| Easy | MCQ | A, B, C, D | "A" |
| Medium | MCQ | A, B, C, D | "B" |
| Hard | MCQ | A, B, C, D | "C" |
| Expert | Open-ended | **None** | **null** |

### Database Schema (Already Exists)
```sql
riddle_mcqs       -- Main MCQ table
riddle_subjects   -- Subject/chapter hierarchy
riddle_chapters   -- Chapters within subjects
```

---

## Pre-Implementation Checks

### Entity Relationships
The MCQ entities (`RiddleSubject`, `RiddleChapter`, `RiddleMcq`) currently reference `RiddleCategory` via `categoryId`. Since we're deleting classic riddles:

| Entity | Current Reference | Action |
|--------|-------------------|--------|
| `RiddleSubject` | `categoryId` → `RiddleCategory` | **Remove** this relationship |
| `RiddleMcq` | `subjectId`, `chapterId` | Keep as-is |

### Verify Database Tables
- [ ] `riddle_mcqs` table has all needed columns
- [ ] `riddle_subjects` table - verify `categoryId` column (to be removed)
- [ ] `riddle_chapters` table structure
- [ ] Indexes are in place

---

## Implementation Phases

### Phase 1: Create riddle-mcq Module

**Directory:** `apps/backend/src/riddle-mcq/`

**Files to CREATE:**
```
riddle-mcq/
├── riddle-mcq.controller.ts   -- All endpoints
├── riddle-mcq.service.ts      -- Business logic
├── riddle-mcq.module.ts       -- Module config
├── entities/
│   ├── riddle-mcq.entity.ts         -- Move from riddles/
│   ├── riddle-subject.entity.ts     -- Move from riddles/ (REMOVE categoryId)
│   └── riddle-chapter.entity.ts     -- Move from riddles/
└── dto/
    └── riddle-mcq.dto.ts            -- All DTOs
```

### Phase 2: Move Entities and Clean Up

**2.1 Move from riddles/entities/:**
- `riddle-mcq.entity.ts` → `riddle-mcq/entities/`
- `riddle-subject.entity.ts` → `riddle-mcq/entities/` (**REMOVE categoryId relationship**)
- `riddle-chapter.entity.ts` → `riddle-mcq/entities/`

**2.2 Clean RiddleSubject Entity:**
Remove these lines when moving:
```typescript
// REMOVE THESE:
@Column({ nullable: true })
categoryId: string;

@ManyToOne(() => RiddleCategory, (category) => category.subjects, { nullable: true })
@JoinColumn({ name: 'categoryId' })
category: RiddleCategory;
```

### Phase 3: Create RiddleMcqController

**Base path:** `/riddle-mcq`

**API Tag:** `@ApiTags('Riddle MCQ')`

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddle-mcq/subjects` | Get all active subjects |
| GET | `/riddle-mcq/subjects/:slug` | Get subject by slug |
| GET | `/riddle-mcq/chapters/active/all` | Get all active chapters |
| GET | `/riddle-mcq/chapters/:subjectId` | Get chapters by subject |
| GET | `/riddle-mcq/quiz/:chapterId` | Get MCQs by chapter |
| GET | `/riddle-mcq/quiz-by-subject/:subjectId` | Get MCQs by subject |
| GET | `/riddle-mcq/mixed` | Get mixed MCQs |
| GET | `/riddle-mcq/random/:level` | Get random MCQs by level |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddle-mcq/subjects/all` | Get all subjects |
| GET | `/riddle-mcq/quiz/all` | Get all MCQs |
| POST | `/riddle-mcq/subjects` | Create subject |
| PUT | `/riddle-mcq/subjects/:id` | Update subject |
| DELETE | `/riddle-mcq/subjects/:id` | Delete subject |
| POST | `/riddle-mcq/chapters` | Create chapter |
| PUT | `/riddle-mcq/chapters/:id` | Update chapter |
| DELETE | `/riddle-mcq/chapters/:id` | Delete chapter |
| POST | `/riddle-mcq/quiz` | Create MCQ |
| POST | `/riddle-mcq/quiz/bulk` | Bulk create MCQs |
| POST | `/riddle-mcq/quiz/bulk-action` | Bulk action |
| PUT | `/riddle-mcq/quiz/:id` | Update MCQ |
| DELETE | `/riddle-mcq/quiz/:id` | Delete MCQ |

### Stats Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddle-mcq/stats/overview` | Get statistics |
| GET | `/riddle-mcq/filter-counts` | Unified filter counts |
| GET | `/riddle-mcq/subjects/:slug/status-counts` | Status counts per subject |

---

### Phase 4: Create RiddleMcqService

**Mirror QuizService architecture:**
- Cache prefix: `riddle-mcq:*`
- Implement filter-counts functionality
- Implement Fisher-Yates shuffle for random selection
- Use QueryRunner for cascade deletes

### Phase 5: Create DTOs

**File:** `riddle-mcq/dto/riddle-mcq.dto.ts`

```typescript
// Pagination & Search
- RiddleMcqPaginationDto
- RiddleMcqSearchDto

// Subject DTOs
- CreateRiddleMcqSubjectDto
- UpdateRiddleMcqSubjectDto

// Chapter DTOs
- CreateRiddleMcqChapterDto
- UpdateRiddleMcqChapterDto

// MCQ DTOs
- CreateRiddleMcqDto
- UpdateRiddleMcqDto
```

---

### Phase 6: Update app.module.ts

- Add `RiddleMcqModule` import
- Remove `RiddlesModule` import

---

### Phase 7: Delete riddles Module

**DELETE:** `apps/backend/src/riddles/`

Includes:
- `riddles.controller.ts`
- `riddles.service.ts`
- `riddles.module.ts`
- All files in `riddles/entities/`:
  - `riddle.entity.ts` (classic riddles - DELETE)
  - `riddle-category.entity.ts` (classic - DELETE)
  - `riddle-mcq.entity.ts` (MOVE to riddle-mcq/)
  - `riddle-subject.entity.ts` (MOVE to riddle-mcq/)
  - `riddle-chapter.entity.ts` (MOVE to riddle-mcq/)

---

### Phase 8: Frontend Updates

**8.1 Rename API file:**
- `apps/frontend/src/lib/riddles-api.ts` → `riddle-mcq-api.ts`

**8.2 Update API paths:**
```typescript
// Before
const BASE_URL = '/api/v1/riddles';

// After
const BASE_URL = '/api/v1/riddle-mcq';
```

**8.3 Update components:**
- Update all imports from `riddles-api` to `riddle-mcq-api`
- Update riddle admin components

---

## File Summary

### CREATE: 7 files
| File | Description |
|------|-------------|
| `riddle-mcq.controller.ts` | All riddle-mcq endpoints |
| `riddle-mcq.service.ts` | Business logic |
| `riddle-mcq.module.ts` | Module configuration |
| `riddle-mcq.dto.ts` | All DTOs |
| `riddle-mcq.entity.ts` | Move from riddles/ |
| `riddle-subject.entity.ts` | Move from riddles/ (cleaned) |
| `riddle-chapter.entity.ts` | Move from riddles/ |

### MODIFY: 3 files
| File | Changes |
|------|---------|
| `app.module.ts` | Add RiddleMcqModule, Remove RiddlesModule |
| `riddle-subject.entity.ts` | Remove categoryId relationship |
| `apps/frontend/src/lib/riddles-api.ts` | Rename + update paths |

### DELETE: 8+ files
| File | Reason |
|------|--------|
| `riddles/` (entire module) | Being replaced |
| `riddles/entities/riddle.entity.ts` | Classic riddles not needed |
| `riddles/entities/riddle-category.entity.ts` | Classic not needed |
| `riddles/entities/riddle-mcq.entity.ts` | Moved |
| `riddles/entities/riddle-subject.entity.ts` | Moved |
| `riddles/entities/riddle-chapter.entity.ts` | Moved |

---

## Backend Structure After Changes

```
apps/backend/src/
├── quiz/                    ✓ Unchanged
│   └── quiz.controller.ts   → /api/v1/quiz/*
├── riddle-mcq/              ✗ NEW
│   └── riddle-mcq.controller.ts → /api/v1/riddle-mcq/*
├── image-riddles/           ✓ Unchanged (next phase)
│   └── image-riddles.controller.ts → /api/v1/image-riddles/*
└── riddles/                 ✗ DELETE
```

---

## Redis Cache Keys After Changes

| Module | Cache Prefix |
|--------|-------------|
| `quiz/` | `quiz:*` |
| `riddle-mcq/` | `riddle-mcq:*` |
| `image-riddles/` | `image-riddles:*` |

---

## What Stays the Same

| Item | Status |
|------|--------|
| Database tables | No changes needed |
| `image-riddles/` module | Unchanged |
| `quiz/` module | Unchanged |

---

## What Changes

| Before | After |
|--------|-------|
| `/api/v1/riddles/...` | `/api/v1/riddle-mcq/...` |
| Mixed riddles module | Separate riddle-mcq module |
| Classic riddles | DELETED |
| Cache `riddles:*` | Cache `riddle-mcq:*` |
| Frontend `riddles-api.ts` | Frontend `riddle-mcq-api.ts` |

---

## Verification Checklist

After implementation:
- [ ] riddle-mcq endpoints work correctly
- [ ] All levels work (easy, medium, hard, expert)
- [ ] Expert open-ended works (no options)
- [ ] Admin CRUD works
- [ ] Bulk operations work
- [ ] Frontend integration works
- [ ] riddles/ module fully removed
- [ ] Swagger docs show correct paths
- [ ] No broken imports or circular dependencies
- [ ] Redis cache keys updated
- [ ] categoryId relationship removed from RiddleSubject
