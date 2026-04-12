# RIDDLE-MCQ SYSTEM DOCUMENTATION

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend API](#backend-api)
5. [Admin Panel](#admin-panel)
6. [User Side](#user-side)
7. [Features Summary](#features-summary)

---

## System Overview

**riddle-mcq** is a riddle-based multiple choice question system where users answer riddle questions in timed or practice modes. The structure follows: **Category → Subject → Riddle MCQ** (no chapter level).

### Key Characteristics

- Riddle-style questions with playful/clever phrasing
- Multiple choice (A/B/C/D) or open-ended (Expert level)
- Two gameplay modes: Timer Challenge & Practice
- Session persistence with resume capability
- Difficulty levels: Easy, Medium, Hard, Expert
- Bulk import/export (CSV/JSON)
- Content status workflow: Draft → Published → Trash

---

## Architecture

```
apps/
├── backend/src/
│   └── riddle-mcq/
│       ├── riddle-mcq.module.ts          # NestJS module
│       ├── riddle-mcq.controller.ts      # API endpoints
│       ├── riddle-mcq.service.ts          # Business logic
│       ├── dto/
│       │   └── riddle-mcq.dto.ts          # Request/Response DTOs
│       └── entities/
│           ├── riddle-category.entity.ts  # Category entity
│           ├── riddle-subject.entity.ts   # Subject entity
│           └── riddle-mcq.entity.ts       # Riddle MCQ entity
│
└── frontend/src/
    ├── app/riddle-mcq/
    │   ├── page.tsx                      # Riddles home (mode selection)
    │   ├── play/page.tsx                  # Main gameplay
    │   ├── practice/page.tsx              # Practice mode selection
    │   ├── challenge/page.tsx              # Timer challenge selection
    │   ├── results/page.tsx               # Results page
    │   ├── components/
    │   │   ├── RiddleCard.tsx            # Riddle display card
    │   │   ├── RiddleReview.tsx           # Answer review
    │   │   └── RiddleStatsBanner.tsx      # Stats display
    │   ├── loading.tsx
    │   └── error.tsx
    ├── app/admin/components/
    │   └── RiddleMcqSection.tsx           # Admin CRUD UI
    └── lib/
        ├── riddle-mcq-api.ts             # API client
        └── riddle-session.ts              # Session management
```

### Tech Stack

- **Backend**: NestJS 10, TypeORM, PostgreSQL
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **State**: Zustand, React Query
- **Auth**: JWT (access + refresh tokens)

---

## Database Schema

### riddle_categories

| Column    | Type      | Constraints        |
| --------- | --------- | ------------------ |
| id        | UUID      | PK, auto-generated |
| slug      | VARCHAR   | UNIQUE, indexed    |
| name      | VARCHAR   | NOT NULL           |
| emoji     | VARCHAR   | NOT NULL           |
| isActive  | BOOLEAN   | DEFAULT true       |
| order     | INTEGER   | DEFAULT 0          |
| createdAt | TIMESTAMP | auto               |
| updatedAt | TIMESTAMP | auto               |

### riddle_subjects

| Column     | Type    | Constraints                         |
| ---------- | ------- | ----------------------------------- |
| id         | UUID    | PK, auto-generated                  |
| slug       | VARCHAR | UNIQUE, indexed                     |
| name       | VARCHAR | NOT NULL                            |
| emoji      | VARCHAR | NOT NULL                            |
| categoryId | UUID    | FK → riddle_categories.id, nullable |
| isActive   | BOOLEAN | DEFAULT true                        |
| order      | INTEGER | DEFAULT 0                           |

**Relation**: Many-to-One with RiddleCategory, One-to-Many with RiddleMcq

### riddle_mcqs

| Column        | Type       | Constraints                         |
| ------------- | ---------- | ----------------------------------- |
| id            | UUID       | PK, auto-generated                  |
| question      | TEXT       | NOT NULL                            |
| options       | JSON       | nullable (null for Expert level)    |
| correctLetter | VARCHAR(1) | nullable (A/B/C/D, null for Expert) |
| explanation   | TEXT       | nullable                            |
| level         | ENUM       | easy/medium/hard/expert, indexed    |
| subjectId     | UUID       | FK → riddle_subjects.id, indexed    |
| status        | ENUM       | published/draft/trash, indexed      |
| updatedAt     | TIMESTAMP  | auto                                |

**Indexes**:

- `idx_riddle_mcqs_subject_level_status` ON (subjectId, level, status)

---

## Backend API

**Base URL**: `/api/riddle-mcq`

### Authentication

- Public endpoints: GET operations (no auth required)
- Protected endpoints: POST, PATCH, DELETE (require JWT + admin role)

---

### Categories

#### GET /riddle-mcq/categories

Get all active riddle categories.

**Response**: `RiddleCategory[]`

#### GET /riddle-mcq/categories/all

Get all categories including inactive. **[Admin]**

**Auth**: JWT + admin role

**Response**: `RiddleCategory[]`

#### GET /riddle-mcq/categories/:id

Get category by ID.

**Response**: `RiddleCategory`

#### POST /riddle-mcq/categories

Create a new category. **[Admin]**

**Auth**: JWT + admin role

**Body**:

```json
{
  "name": "Logic Puzzles",
  "slug": "logic-puzzles",
  "emoji": "🧩",
  "order": 0,
  "isActive": true
}
```

**Response**: `RiddleCategory`

#### PATCH /riddle-mcq/categories/:id

Update a category. **[Admin]**

**Auth**: JWT + admin role

**Body**: Partial `CreateRiddleCategoryDto`

#### DELETE /riddle-mcq/categories/:id

Delete a category. **[Admin]**

**Auth**: JWT + admin role

---

### Subjects

#### GET /riddle-mcq/subjects

Get all active riddle subjects.

**Query Parameters**:

- `hasContent` (boolean): Filter subjects with riddles only

**Response**: `RiddleSubject[]`

#### GET /riddle-mcq/subjects/all

Get all subjects including inactive. **[Admin]**

**Auth**: JWT + admin role

#### GET /riddle-mcq/subjects/:slug

Get subject by slug.

**Response**: `RiddleSubject`

#### POST /riddle-mcq/subjects

Create a new subject. **[Admin]**

**Auth**: JWT + admin role

**Body**:

```json
{
  "name": "Brain Teasers",
  "slug": "brain-teasers",
  "emoji": "🧠",
  "categoryId": "uuid",
  "order": 0,
  "isActive": true
}
```

#### PATCH /riddle-mcq/subjects/:id

Update a subject. **[Admin]**

#### DELETE /riddle-mcq/subjects/:id

Delete a subject and all its riddles. **[Admin]**

---

### Riddle MCQs

#### GET /riddle-mcq/all

Get all riddles with filters. **[Admin]**

**Auth**: JWT + admin role

**Query Parameters**:
| Param | Type | Description |
|---------|--------|--------------------------------|
| subject | string | Filter by subject slug |
| level | string | Filter by level (easy/medium/hard/expert) |
| status | string | Filter by status |
| search | string | Search in question text |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50) |

**Response**: `{ data: RiddleMcq[], total: number }`

#### GET /riddle-mcq/subjects/:subjectId/mcqs

Get riddles by subject ID (public).

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 10)
- `level` (optional)

**Response**: `{ data: RiddleMcq[], total: number }`

#### GET /riddle-mcq/mixed

Get mixed riddles from all subjects.

**Query Parameters**:

- `count` (default: 50, max: 100)

**Response**: `RiddleMcq[]`

#### GET /riddle-mcq/random/:level

Get random riddles by difficulty level.

**Params**: `level` = easy | medium | hard | expert

**Query Parameters**:

- `count` (default: 10, max: 50)

**Response**: `RiddleMcq[]`

#### POST /riddle-mcq/mcqs

Create a new riddle. **[Admin]**

**Auth**: JWT + admin role

**Body**:

```json
{
  "question": "What has keys but no locks?",
  "options": ["A piano", "A keyboard", "A map", "A car"],
  "correctLetter": "A",
  "level": "medium",
  "subjectId": "uuid",
  "explanation": "A piano has musical keys but no locks",
  "status": "draft"
}
```

**Notes**:

- Expert level riddles do NOT require options or correctLetter
- Non-Expert level requires at least 2 options

#### POST /riddle-mcq/mcqs/bulk

Bulk create riddles. **[Admin]**

**Auth**: JWT + admin role

**Body**: `CreateRiddleMcqDto[]`

**Response**: `{ count: number, errors: string[] }`

#### PATCH /riddle-mcq/mcqs/:id

Update a riddle. **[Admin]**

**Auth**: JWT + admin role

#### DELETE /riddle-mcq/mcqs/:id

Delete a riddle. **[Admin]**

**Auth**: JWT + admin role

---

### Bulk Actions

#### POST /riddle-mcq/mcqs/bulk-action

Execute bulk action on riddles. **[Admin]**

**Auth**: JWT + admin role

**Body**:

```json
{
  "ids": ["uuid1", "uuid2"],
  "action": "publish"
}
```

**Actions**: `publish` | `draft` | `trash` | `delete` | `restore`

**Response**:

```json
{
  "success": true,
  "processed": 2,
  "succeeded": 2,
  "failed": 0,
  "message": "Bulk publish completed: 2 succeeded, 0 failed"
}
```

---

### Statistics

#### GET /riddle-mcq/stats/overview

Get riddle statistics.

**Response**:

```json
{
  "totalRiddleMcqs": 150,
  "totalSubjects": 12,
  "mcqsByLevel": {
    "easy": 50,
    "medium": 50,
    "hard": 35,
    "expert": 15
  }
}
```

#### GET /riddle-mcq/filter-counts

Get unified filter counts.

**Query Parameters**:

- `subject` (optional)
- `level` (optional)

**Response**:

```json
{
  "subjectCounts": [{ "id": "uuid", "name": "Brain Teasers", "count": 45 }],
  "levelCounts": [{ "level": "easy", "count": 50 }],
  "total": 150
}
```

---

## Admin Panel

### RiddleMcqSection Component

**Location**: `apps/frontend/src/app/admin/components/RiddleMcqSection.tsx`

**Features**:

1. **Riddle List Display**
   - Paginated table with 10 items per page
   - Shows: question preview, difficulty badge, status, subject, category

2. **Filtering**
   - By Category (clickable chips with counts)
   - By Subject (clickable chips with counts)
   - By Level (All/Easy/Medium/Hard/Expert)
   - By Status (All/Published/Draft/Trash)
   - By Search (full-text search in question)

3. **Sorting**
   - By updated date (default, descending)

4. **CRUD Operations**
   - Add Riddle: Modal form with validation
   - Edit Riddle: Modal form, pre-populated
   - Trash Riddle: Move to trash (or permanent delete if already trashed)
   - Restore Riddle: Restore from trash to draft

5. **Bulk Actions**
   - Select all / Deselect all
   - Bulk publish
   - Bulk draft
   - Bulk trash
   - Bulk delete
   - Visual toolbar appears when items selected

6. **Import/Export**
   - Export as CSV
   - Export as JSON
   - Import from CSV (with preview)
   - Import from JSON (with validation)
   - Auto-creates subjects during import if needed

7. **Category Management**
   - Add/Edit/Delete categories inline
   - Category chips show riddle counts

8. **Subject Management**
   - Add/Edit/Delete subjects inline
   - Subject chips filtered by selected category

### Admin API Usage

| Operation         | Function                             |
| ----------------- | ------------------------------------ |
| Get all riddles   | `getAllRiddles(params, page, limit)` |
| Create riddle     | `createRiddle(dto)`                  |
| Update riddle     | `updateRiddle(id, dto)`              |
| Delete riddle     | `deleteRiddle(id)`                   |
| Bulk action       | `bulkActionRiddles(ids, action)`     |
| Get subjects      | `getSubjects()`                      |
| Create subject    | `createSubject(dto)`                 |
| Update subject    | `updateSubject(id, dto)`             |
| Delete subject    | `deleteSubject(id)`                  |
| Get categories    | `getCategories()`                    |
| Create category   | `createCategory(dto)`                |
| Update category   | `updateCategory(id, dto)`            |
| Delete category   | `deleteCategory(id)`                 |
| Bulk create       | `bulkCreateRiddles(dtos)`            |
| Get filter counts | `getRiddleFilterCounts(params)`      |

---

## User Side

### Pages

#### 1. Riddles Home (`/riddle-mcq`)

**Purpose**: Mode selection and stats display

**Components**:

- Stats banner (total riddles, total subjects)
- Two mode cards:
  - Timer Challenge (⏱️) → `/riddle-mcq/challenge`
  - Practice Mode (♾️) → `/riddle-mcq/practice`

**API**: `getStats()` → `GET /riddle-mcq/stats/overview`

---

#### 2. Challenge Mode Selection (`/riddle-mcq/challenge`)

**Purpose**: Select subject and difficulty for timed challenge

**Features**:

- Subject selection chips
- Difficulty level selection (All/Easy/Medium/Hard/Expert)
- Start Challenge button → navigates to `/riddle-mcq/play?chapterId=&level=&mode=timer`

---

#### 3. Practice Mode Selection (`/riddle-mcq/practice`)

**Purpose**: Select subject and difficulty for untimed practice

**Features**:

- Subject selection chips
- Difficulty level selection
- Start Practice button → navigates to `/riddle-mcq/play?chapterId=&level=&mode=practice`

---

#### 4. Riddle Play (`/riddle-mcq/play`)

**Purpose**: Main gameplay

**URL Params**:
| Param | Values |
|--------------|-------------------------------------|
| chapterId | subject ID or "all" |
| level | "all" or difficulty level |
| mode | "timer" or "practice" |
| chapterName | Display name for subject/chapter |

**Features**:

1. **Riddle Card Display**
   - Question number / total
   - Question text
   - Answer options (A/B/C/D)
   - Visual feedback on selection
   - Score indicator
   - Timer display

2. **Timer Mode**
   - Per-riddle countdown
   - Session timer (sum of all per-riddle times)
   - Pause/Resume functionality
   - Auto-submit when time expires

3. **Practice Mode**
   - Per-riddle visual countdown (60s)
   - No auto-submit
   - Pause/resume available

4. **Navigation**
   - Previous/Next buttons
   - Back to selection (with confirmation if in-progress)

5. **Session Management**
   - Auto-save every 10 seconds
   - Resume session prompt on page load
   - Session persistence via localStorage

6. **Extend Session**
   - Add more riddles during play
   - Deduplication (won't repeat seen riddles)

7. **Submit Confirmation**
   - Shows unanswered count
   - Option to continue or submit

**API Calls**:

- `getMixedRiddles(count)` → `GET /riddle-mcq/mixed`
- `getRandomRiddles(level, count)` → `GET /riddle-mcq/random/:level`
- `getRiddlesBySubject(subjectId, page, limit, level)` → `GET /riddle-mcq/subjects/:subjectId/mcqs`

---

#### 5. Riddle Results (`/riddle-mcq/results`)

**Purpose**: Display score and grade breakdown

**Features**:

- Final score (correct / total)
- Grade calculation (A+ to F)
- Time taken display
- Per-difficulty breakdown
- Share results option
- Play again / Return home buttons

---

### Session Management

**Location**: `apps/frontend/src/lib/riddle-session.ts`

**Session Structure**:

```typescript
interface RiddleSession {
  id: string;
  mode: 'timer' | 'practice';
  chapterId: string;
  chapterName: string;
  level: 'all' | 'easy' | 'medium' | 'hard' | 'expert';
  riddles: Riddle[];
  answers: Record<string, string>; // riddleId → selected answer
  score: number;
  timeTaken: number;
  timeRemaining: number;
  status: 'in-progress' | 'completed';
  startedAt: string;
  completedAt?: string;
  lastSavedAt?: string;
}
```

**Functions**:

- `createRiddleSession()`: Create new session
- `saveRiddleSession()`: Save to localStorage
- `loadRiddleSession()`: Load from localStorage
- `clearRiddleSession()`: Clear session
- `setupNavigationWarning()`: Warn on page exit

---

### Riddle Card Component

**Location**: `apps/frontend/src/app/riddle-mcq/components/RiddleCard.tsx`

**Props**:

```typescript
interface RiddleCardProps {
  riddle: Riddle;
  riddleNumber: number;
  totalRiddles: number;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showFeedback: boolean;
  disabled: boolean;
  score: number;
  maxScore: number;
  timeUp: boolean;
  questionTimeRemaining: number;
  questionTimeLimit: number;
}
```

**Features**:

- Animated entrance/exit
- Answer option buttons (A/B/C/D)
- Visual feedback (correct/incorrect highlighting)
- Timer display
- Score indicator
- Confetti bubbles on correct answer

---

## Features Summary

### Backend Features

| Feature          | Description                                     |
| ---------------- | ----------------------------------------------- |
| Category CRUD    | Full category management with ordering          |
| Subject CRUD     | Subject management linked to categories         |
| Riddle CRUD      | Full riddle management with validation          |
| Bulk Create      | Chunked bulk creation (100 per chunk)           |
| Bulk Actions     | publish/draft/trash/delete/restore multiple     |
| Random Selection | Get random riddles by level                     |
| Mixed Selection  | Get random riddles from all subjects            |
| Filtering        | Filter by subject, level, status, search        |
| Statistics       | Overview stats + filter counts                  |
| Caching          | Redis caching for subjects, MCQs, filter counts |

### Admin Panel Features

| Feature             | Description                                 |
| ------------------- | ------------------------------------------- |
| Riddle List         | Paginated table with all riddles            |
| Filtering           | By category, subject, level, status, search |
| Status Dashboard    | Visual counts by status                     |
| CRUD Modals         | Add/Edit riddle with validation             |
| Bulk Selection      | Checkbox selection for bulk actions         |
| Bulk Actions        | Publish, draft, trash, delete, restore      |
| Import CSV/JSON     | File upload with preview and validation     |
| Export CSV/JSON     | Download filtered riddles                   |
| Category Management | Inline add/edit/delete categories           |
| Subject Management  | Inline add/edit/delete subjects             |
| Pagination          | Page navigation with input                  |

### User Side Features

| Feature              | Description                                |
| -------------------- | ------------------------------------------ |
| Stats Banner         | Display total riddles and subjects         |
| Mode Selection       | Timer Challenge / Practice Mode cards      |
| Subject Selection    | Clickable chips to filter                  |
| Difficulty Selection | All/Easy/Medium/Hard/Expert options        |
| Timer Mode           | Countdown timer, pause/resume, auto-submit |
| Practice Mode        | Visual countdown, unlimited time           |
| Session Resume       | Prompt to resume saved session             |
| Session Auto-save    | Every 10 seconds to localStorage           |
| Session Extend       | Add more riddles during play               |
| Navigation Warning   | Warn on exit during active session         |
| Submit Confirmation  | Show unanswered count before submit        |
| Results Page         | Score, grade, time, per-level breakdown    |
| Riddle Card UI       | Animated card with options and feedback    |

### Difficulty Levels

| Level  | Description                          | Options Required |
| ------ | ------------------------------------ | ---------------- |
| Easy   | Simple riddles                       | Yes              |
| Medium | Moderate difficulty                  | Yes              |
| Hard   | Challenging riddles                  | Yes              |
| Expert | Open-ended (text answer, no options) | No               |

### Status Workflow

```
Draft → Published → Trash
         ↑            ↓
         └──── Restore ┘
```

---

## API Summary

| Method | Endpoint                             | Auth   |
| ------ | ------------------------------------ | ------ |
| GET    | /riddle-mcq/categories               | Public |
| GET    | /riddle-mcq/categories/all           | Admin  |
| GET    | /riddle-mcq/categories/:id           | Public |
| POST   | /riddle-mcq/categories               | Admin  |
| PATCH  | /riddle-mcq/categories/:id           | Admin  |
| DELETE | /riddle-mcq/categories/:id           | Admin  |
| GET    | /riddle-mcq/subjects                 | Public |
| GET    | /riddle-mcq/subjects/all             | Admin  |
| GET    | /riddle-mcq/subjects/:slug           | Public |
| POST   | /riddle-mcq/subjects                 | Admin  |
| PATCH  | /riddle-mcq/subjects/:id             | Admin  |
| DELETE | /riddle-mcq/subjects/:id             | Admin  |
| GET    | /riddle-mcq/all                      | Admin  |
| GET    | /riddle-mcq/subjects/:subjectId/mcqs | Public |
| GET    | /riddle-mcq/mixed                    | Public |
| GET    | /riddle-mcq/random/:level            | Public |
| POST   | /riddle-mcq/mcqs                     | Admin  |
| POST   | /riddle-mcq/mcqs/bulk                | Admin  |
| PATCH  | /riddle-mcq/mcqs/:id                 | Admin  |
| DELETE | /riddle-mcq/mcqs/:id                 | Admin  |
| POST   | /riddle-mcq/mcqs/bulk-action         | Admin  |
| GET    | /riddle-mcq/stats/overview           | Public |
| GET    | /riddle-mcq/filter-counts            | Public |

---

## Notes

1. **Expert Level**: Riddles with `level: 'expert'` are open-ended questions. They do NOT store `options` or `correctLetter` in the database. User answers are matched case-insensitively against the stored answer.

2. **Cache Invalidation**: All write operations (create/update/delete) clear the `riddle-mcq:*` cache pattern.

3. **Slug Generation**: If not provided, slugs are auto-generated from name (lowercase, spaces to hyphens).

4. **Cascade Delete**: Deleting a subject also deletes all its riddles.

5. **Bulk Create Chunking**: Bulk creates process 100 riddles at a time to avoid memory issues.

6. **Session Storage**: Sessions are stored in localStorage with key `riddle-session`.
