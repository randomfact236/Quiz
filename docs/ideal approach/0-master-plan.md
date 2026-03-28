# Master Plan
## Quiz Management System - Ideal Approach

---

## 1. Overview

**Goal:** Document the current implementation exactly as it exists, not as what we think should exist.

**Scope:**
- Backend: NestJS with TypeORM, PostgreSQL, Redis cache, JWT auth
- Frontend Admin: React with useState/useEffect (NOT React Query)
- Frontend User: Separate route structure (challenge, practice, quiz play)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────┐   │
│  │   ADMIN PANEL       │    │   USER-FACING PAGES     │   │
│  │                     │    │                         │   │
│  │  QuizMcqSection    │    │  /challenge            │   │
│  │  (863 lines)        │    │  /practice             │   │
│  │                     │    │  /quiz/[slug]           │   │
│  │  - useState/useEffect                     │   │
│  │  - CSV Import/Export│    │  (Separate codebase)    │   │
│  │  - Bulk Actions     │    │                         │   │
│  └──────────┬──────────┘    └───────────┬─────────────┘   │
│             │                          │                   │
│             ▼                          ▼                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    API LAYER                          │   │
│  │  quiz-api.ts - REST API wrappers                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                       │
├─────────────────────────────────────────────────────────────┤
│  Controllers → Services → Repositories → PostgreSQL         │
│  + Redis Cache (CacheService)                              │
│  + JWT Authentication (JwtAuthGuard, RolesGuard)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Implementation

### 3.1 File Structure
```
apps/backend/src/quiz/
├── quiz.controller.ts    # REST endpoints
├── quiz.service.ts      # Business logic with transactions
├── quiz.module.ts       # Module definition
└── entities/
    ├── question.entity.ts
    ├── subject.entity.ts
    └── chapter.entity.ts
```

### 3.2 Key Features (Currently Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| CRUD Subject | ✅ | POST/GET/PUT/DELETE with auth |
| CRUD Chapter | ✅ | POST/GET/PATCH/DELETE with auth |
| CRUD Question | ✅ | POST/GET/PATCH/DELETE with auth |
| Bulk Actions | ✅ | publish, draft, trash, delete |
| Filter Counts | ✅ | Unified endpoint for all filters |
| Pagination | ✅ | page, limit params |
| CSV Export | ✅ | Frontend generates CSV |
| CSV Import | ✅ | Bulk create with chunking |
| Redis Cache | ✅ | Filter counts + questions cached |
| JWT Auth | ✅ | Admin-only endpoints protected |
| Transactional Delete | ✅ | Subject delete uses QueryRunner transaction |
| Public Quiz API | ✅ | Always returns PUBLISHED only |

### 3.3 Public vs Admin Endpoints

**Public Endpoints (No Auth):**
- `GET /quiz/subjects` - List subjects
- `GET /quiz/subjects/:slug` - Get subject with chapters
- `GET /quiz/subjects/:slug/questions` - Always PUBLISHED only
- `GET /quiz/questions/:chapterId` - Always PUBLISHED only
- `GET /quiz/mixed` - Random published questions
- `GET /quiz/random/:level` - Random by level, PUBLISHED only

**Admin Endpoints (JWT Required):**
- All POST/PUT/PATCH/DELETE operations
- `GET /quiz/questions` - All statuses
- `GET /quiz/filter-counts`

### 3.4 Transactional Delete (Already Implemented)

```typescript
// quiz.service.ts lines 110-142
async deleteSubject(id: string): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (subject.chapters && subject.chapters.length > 0) {
      for (const chapter of subject.chapters) {
        await queryRunner.manager.delete(Question, { chapterId: chapter.id });
      }
      await queryRunner.manager.delete(Chapter, { subjectId: id });
    }
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

---

## 4. Frontend Admin Panel Implementation

### 4.1 File Structure
```
apps/frontend/src/
├── app/admin/components/
│   └── QuizMcqSection.tsx    # Main component (863 lines)
├── lib/
│   ├── quiz-api.ts            # API wrappers
│   └── useQuizFilters.ts      # URL filter state
├── components/ui/
│   ├── quiz-filters/
│   │   ├── SubjectFilter.tsx
│   │   ├── ChapterFilter.tsx
│   │   ├── LevelFilter.tsx
│   │   ├── SearchInput.tsx
│   │   ├── SelectedFilters.tsx
│   │   └── QuestionTable.tsx
│   ├── StatusDashboard.tsx
│   ├── BulkActionToolbar.tsx
│   ├── SubjectModal.tsx
│   ├── ChapterModal.tsx
│   ├── QuestionModal.tsx
│   └── ConfirmDialog.tsx
└── app/admin/utils/
    └── quiz-importer.ts      # CSV parsing + import
```

### 4.2 Current Features (Exactly as Implemented)

| Feature | Status | Location |
|---------|--------|----------|
| Subject Filter | ✅ | SubjectFilter.tsx |
| Chapter Filter | ✅ | ChapterFilter.tsx (cascading) |
| Level Filter | ✅ | LevelFilter.tsx |
| Status Filter | ✅ | StatusDashboard.tsx |
| Search Input | ✅ | SearchInput.tsx |
| Question Table | ✅ | QuestionTable.tsx |
| Bulk Actions | ✅ | BulkActionToolbar.tsx |
| Pagination | ✅ | In QuestionTable + page size selector |
| Add Question | ✅ | QuestionModal.tsx |
| Edit Question | ✅ | QuestionModal.tsx |
| Delete Question | ✅ | ConfirmDialog.tsx |
| Add Subject | ✅ | SubjectModal.tsx |
| Edit Subject | ✅ | SubjectModal.tsx |
| Delete Subject | ✅ | ConfirmDialog.tsx |
| Add Chapter | ✅ | ChapterModal.tsx |
| Edit Chapter | ✅ | ChapterModal.tsx |
| Delete Chapter | ✅ | ConfirmDialog.tsx |
| CSV Import | ✅ | quiz-importer.ts + inline modal |
| CSV Export | ✅ | exportQuestionsToCSV in quiz-api.ts |

### 4.3 State Management

**Current Approach:** useState + useEffect (NOT React Query)

```typescript
// QuizMcqSection.tsx - Current pattern
const [questions, setQuestions] = useState<QuizQuestion[]>([]);
const [filterCounts, setFilterCounts] = useState<FilterCountsResponse | null>(null);

useEffect(() => {
  async function fetchQuestionsData() {
    const result = await getAllQuestions(dataParams, currentPage, pageSize);
    setQuestions(result.data);
    setTotalQuestions(result.total);
  }
  fetchQuestionsData();
}, [dataParams, currentPage, pageSize]);
```

### 4.4 Filter System

```typescript
// useQuizFilters.ts - URL-based filter state
interface QuizFilters {
  subject?: string;
  chapter?: string;
  level?: string;
  status?: string;
  search?: string;
}
```

---

## 5. API Types (Current)

### 5.1 QuizQuestion (Frontend)
```typescript
interface QuizQuestion {
  id: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  correctLetter: string | null;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapterId: string;
  chapter?: { id: string; name: string };
  status?: 'published' | 'draft' | 'trash';
}
```

### 5.2 Levels
- `easy` - True/False (2 options)
- `medium` - 2 options
- `hard` - 3 options  
- `expert` - 4 options
- `extreme` - Open answer (no options)

---

## 6. User-Sacing Pages (Separate)

User-facing quiz pages are **NOT** part of the admin panel. They are completely separate:

```
apps/frontend/src/app/
├── challenge/page.tsx      # Timed challenge mode
├── practice/page.tsx       # Untimed practice mode
└── quiz/[slug]/page.tsx  # Subject-specific quiz
```

### 6.1 Current User Features (Separate)

| Feature | Status | Notes |
|---------|--------|-------|
| Quiz Timer | ✅ | QuizTimer.tsx |
| Quiz Navigation | ✅ | QuizNavigation.tsx |
| Quiz State | ✅ | useQuiz hook |
| Quiz Storage | ✅ | Local storage |
| Quiz Results | ✅ | Results display |

---

## 7. Documentation Structure

| File | Contents |
|------|----------|
| `0-master-plan.md` | This file - architecture overview |
| `1-backend.md` | Backend implementation details |
| `2-admin-panel.md` | Admin panel implementation details |
| `3-user-side.md` | User-facing pages (separate) |

---

## 8. Potential Enhancements (NOT Currently Implemented)

These are **NOT** bugs - they are potential future enhancements:

| Item | Description | Priority |
|------|-------------|----------|
| React Query | Replace useState/useEffect | Low - current approach works |
| Rate limiting | NestJS throttler for public endpoints | Low |

**Note:** The backend already has transactional integrity for subject deletion. This was NOT a gap.

---

## 9. Related Documents

- [Backend Implementation](./1-backend.md)
- [Admin Panel Implementation](./2-admin-panel.md)
- [User-Side Implementation](./3-user-side.md)
