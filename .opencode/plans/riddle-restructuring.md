# Plan: Create riddle-mcq Module (Separate from Quiz Architecture)

## Goal
Create a clean `riddle-mcq/` module that mirrors the `quiz/` architecture exactly, with:
- Levels: easy, medium, hard, expert
- Expert = open-ended (correctLetter: null, no options needed)
- NO shared tables or logic with other systems

---

## Current State

### Modules and Tables

| Module | Tables | Status |
|--------|--------|--------|
| `quiz/` | subjects, chapters, questions | Reference architecture |
| `riddles/` | riddles, riddle_categories, riddle_subjects, riddle_chapters, riddle_mcqs | NEEDS CLEAN SPLIT |
| `image-riddles/` | image_riddles, image_riddle_categories | LEAVE AS IS |

### What Needs to Happen

1. **Create riddle-mcq/** - NEW module with MCQ tables
2. **Delete riddles/** - Entire module (classic riddles + old code)
3. **image-riddles/** - Leave unchanged for now

---

## Target Architecture

| Module | Base Path | Tables | Status |
|--------|-----------|--------|--------|
| `quiz/` | `/api/v1/quiz` | subjects, chapters, questions | Unchanged |
| `riddle-mcq/` | `/api/v1/riddle-mcq` | riddle_mcqs, riddle_subjects, riddle_chapters | NEW |
| `image-riddles/` | `/api/v1/image-riddles` | image_riddles, image_riddle_categories | UNCHANGED |
| `riddles/` | — | riddles, riddle_categories | **DELETED** |

---

## Implementation Plan

### Phase 1: Create `riddle-mcq/` Module

**1.1 Create Directory Structure**
```
apps/backend/src/riddle-mcq/
├── riddle-mcq.controller.ts
├── riddle-mcq.service.ts
├── riddle-mcq.module.ts
├── entities/
│   ├── riddle-mcq.entity.ts
│   ├── riddle-subject.entity.ts
│   └── riddle-chapter.entity.ts
└── dto/
    └── riddle-mcq.dto.ts
```

**1.2 Move Entities from `riddles/`**
- `riddle-mcq.entity.ts` → `riddle-mcq/entities/`
- `riddle-subject.entity.ts` → `riddle-mcq/entities/`
- `riddle-chapter.entity.ts` → `riddle-mcq/entities/`

**1.3 Create RiddleMcqController**
**Base path: `/riddle-mcq`**

Endpoints:
```
PUBLIC:
  GET  /riddle-mcq/subjects                    - Get all active subjects
  GET  /riddle-mcq/subjects/:slug            - Get subject by slug
  GET  /riddle-mcq/chapters/active/all       - Get all active chapters
  GET  /riddle-mcq/chapters/:subjectId       - Get chapters by subject
  GET  /riddle-mcq/quiz/:chapterId            - Get MCQs by chapter
  GET  /riddle-mcq/quiz-by-subject/:subjectId - Get MCQs by subject
  GET  /riddle-mcq/mixed                     - Get mixed MCQs
  GET  /riddle-mcq/random/:level             - Get random MCQs by level

ADMIN:
  GET  /riddle-mcq/subjects/all              - Get all subjects
  GET  /riddle-mcq/quiz/all                  - Get all MCQs
  POST /riddle-mcq/subjects                  - Create subject
  PUT  /riddle-mcq/subjects/:id              - Update subject
  DELETE /riddle-mcq/subjects/:id             - Delete subject
  POST /riddle-mcq/chapters                   - Create chapter
  PUT  /riddle-mcq/chapters/:id              - Update chapter
  DELETE /riddle-mcq/chapters/:id            - Delete chapter
  POST /riddle-mcq/quiz                       - Create MCQ
  POST /riddle-mcq/quiz/bulk                  - Bulk create MCQs
  POST /riddle-mcq/quiz/bulk-action          - Bulk action
  PUT  /riddle-mcq/quiz/:id                  - Update MCQ
  DELETE /riddle-mcq/quiz/:id                 - Delete MCQ

STATS:
  GET  /riddle-mcq/stats/overview            - Get statistics

NEW (matching Quiz pattern):
  GET  /riddle-mcq/filter-counts             - Unified filter counts
  GET  /riddle-mcq/subjects/:slug/status-counts - Status counts per subject
```

**1.4 Create RiddleMcqService**
- Mirror QuizService architecture exactly
- Cache prefix: `riddle-mcq:*`
- Implement filter-counts functionality
- Fisher-Yates shuffle for random selection

**1.5 Create DTOs**
```
riddle-mcq.dto.ts:
- RiddleMcqPaginationDto
- RiddleMcqSearchDto
- CreateRiddleMcqSubjectDto
- UpdateRiddleMcqSubjectDto
- CreateRiddleMcqChapterDto
- UpdateRiddleMcqChapterDto
- CreateRiddleMcqDto
- UpdateRiddleMcqDto
```

**1.6 Update app.module.ts**
- Add `RiddleMcqModule` to imports

---

## Phase 2: Delete `riddles/` Module

### 2.1 Delete Entire Module
```
apps/backend/src/riddles/  → DELETE
```

### 2.2 Delete Files
- `riddles.controller.ts`
- `riddles.service.ts`
- `riddles.module.ts`
- All entities in `riddles/entities/`:
  - `riddle.entity.ts` (classic riddles)
  - `riddle-category.entity.ts` (classic)
  - `riddle-mcq.entity.ts` (MOVED in Phase 1)
  - `riddle-subject.entity.ts` (MOVED in Phase 1)
  - `riddle-chapter.entity.ts` (MOVED in Phase 1)

### 2.3 Clean Up common/dto/riddle.dto.ts
- Remove all riddle-related DTOs OR delete file if empty

### 2.4 Update app.module.ts
- Remove RiddlesModule import

---

## Phase 3: Update Frontend

### 3.1 API Updates
- Update `riddles-api.ts` → Use new `/riddle-mcq/` endpoints
- Or create new `riddle-mcq-api.ts`

### 3.2 Component Updates
- Update admin riddle components for new paths

---

## Database Tables

| Module | Tables | Action |
|--------|--------|--------|
| `quiz/` | subjects, chapters, questions | No change |
| `riddle-mcq/` | riddle_mcqs, riddle_subjects, riddle_chapters | No change (existing tables) |
| `riddles/` | riddles, riddle_categories | **DELETE** (or leave unused) |

**Note**: `riddle_mcqs`, `riddle_subjects`, `riddle_chapters` tables already exist - they just move to riddle-mcq module.

---

## Files Summary

### CREATE: 7 files
| File | Purpose |
|------|---------|
| `riddle-mcq.controller.ts` | MCQ endpoints |
| `riddle-mcq.service.ts` | MCQ business logic |
| `riddle-mcq.module.ts` | DI config |
| `riddle-mcq.dto.ts` | MCQ DTOs |
| `riddle-mcq.entity.ts` | Moved from riddles |
| `riddle-subject.entity.ts` | Moved from riddles |
| `riddle-chapter.entity.ts` | Moved from riddles |

### MODIFY: 2 files
| File | Changes |
|------|---------|
| `app.module.ts` | Add RiddleMcqModule, Remove RiddlesModule |

### DELETE: 8+ files
| File | Reason |
|------|--------|
| `riddles.controller.ts` | Being replaced |
| `riddles.service.ts` | Being replaced |
| `riddles.module.ts` | Being replaced |
| `riddles/entities/riddle.entity.ts` | Classic riddles deleted |
| `riddles/entities/riddle-category.entity.ts` | Classic riddles deleted |
| (original riddle-mcq/subject/chapter entities) | Moved to riddle-mcq/ |
| `common/dto/riddle.dto.ts` | Clean up or delete |

---

## API Path Changes

| Before | After |
|--------|-------|
| `/api/v1/riddles/subjects` | `/api/v1/riddle-mcq/subjects` |
| `/api/v1/riddles/quiz/:chapterId` | `/api/v1/riddle-mcq/quiz/:chapterId` |
| `/api/v1/riddles/mixed` | `/api/v1/riddle-mcq/mixed` |
| `/api/v1/riddles/random/:level` | `/api/v1/riddle-mcq/random/:level` |

---

## Final Backend Structure

```
apps/backend/src/
├── quiz/                    (unchanged)
│   └── quiz.controller.ts   → /api/v1/quiz/*
├── riddle-mcq/              (NEW)
│   └── riddle-mcq.controller.ts → /api/v1/riddle-mcq/*
├── image-riddles/          (unchanged - for next phase)
│   └── image-riddles.controller.ts → /api/v1/image-riddles/*
└── riddles/                 (DELETE)
```

---

## Expert Level Implementation

The RiddleMcq entity already supports expert level:

```typescript
// Expert level = open-ended (no options, correctLetter is null)
@Column({ type: 'text', nullable: true })
options: string[] | null;  // null for expert

@Column({ type: 'varchar', length: 1, nullable: true })
correctLetter: string | null;  // null for expert

@Column()
correctAnswer: string;  // text answer for expert
```

---

## Verification Checklist

After implementation:
- [ ] riddle-mcq endpoints work correctly
- [ ] All Quiz patterns matched (filter-counts, status-counts, etc)
- [ ] Frontend updated to new API paths
- [ ] riddles/ module fully removed
- [ ] Swagger docs show correct paths
- [ ] No broken imports or circular dependencies
