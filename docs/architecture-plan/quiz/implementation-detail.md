# Quiz MCQ Implementation Detail

## 1. Subject Management

### How it works

- Subjects are top-level containers for organizing chapters and questions
- Each subject has a unique slug generated from its name (lowercase, hyphenated)
- Subjects have optional category and emoji for visual identification
- Subjects can be activated or deactivated via isActive boolean
- Subject deletion cascades to delete all its chapters and questions

### CRUD Behaviour

**Create:**

1. Client sends POST to /api/v1/quiz/subjects with name, slug, emoji, category
2. Backend validates input with class-validator
3. Subject record created in database with generated UUID
4. Cache invalidated after save
5. Client receives created subject with all fields

**Read:**

1. Client sends GET to /api/v1/quiz/subjects (public, no auth)
2. Backend returns all subjects ordered by order field, then name
3. hasContent query param filters to subjects with questions only
4. getSubjectBySlug endpoint returns single subject with its chapters loaded

**Update:**

1. Client sends PUT to /api/v1/quiz/subjects/:id with partial fields
2. Backend finds subject by ID, returns 404 if not found
3. Only provided fields are updated (partial update)
4. Cache invalidated after save
5. Client receives updated subject

**Delete:**

1. Client sends DELETE to /api/v1/quiz/subjects/:id (admin only)
2. Backend finds subject with relations (chapters and questions)
3. Transaction starts: deletes all questions in each chapter, then chapters, then subject
4. If any step fails, transaction rolls back
5. Cache cleared after successful commit

### UI Design

- Subject list displayed as row of buttons in FilterPanel
- Each button shows emoji, name, and question count in parentheses
- Clicking subject button filters questions to that subject only
- "All" button shows all subjects combined
- Subject Modal accessible via "+ Add" button in SubjectFilterRow
- Modal has fields: Name (text), Emoji (text), Category (text optional)
- Edit accessible via pencil icon on each subject button
- Delete accessible via trash icon, shows confirmation dialog

---

## 2. Chapter Management

### How it works

- Chapters belong to a single subject (subjectId foreign key)
- Chapter name must be unique within a subject (composite unique constraint)
- Chapters have chapterNumber for ordering within subject
- Chapter deletion cascades to delete all its questions
- Chapters can be viewed all at once or filtered by subject

### CRUD Behaviour

**Create:**

1. Client sends POST to /api/v1/quiz/chapters with name and subjectId
2. Backend verifies subject exists, returns 404 if not
3. Backend checks chapter name doesn't already exist in this subject
4. chapterNumber auto-calculated as count of existing chapters + 1
5. Chapter saved with subject relation
6. Cache invalidated for that subject

**Read:**

1. Client sends GET to /api/v1/quiz/chapters/:subjectId
2. Backend returns all chapters for that subject ordered by id ascending
3. Alternative: FilterPanel shows chapters based on selected subject filter

**Update:**

1. Client sends PATCH to /api/v1/quiz/chapters/:id with name or subjectId
2. Backend finds chapter by ID, returns 404 if not found
3. Only provided fields updated
4. If subjectId changed, cache cleared for both old and new subject

**Delete:**

1. Client sends DELETE to /api/v1/quiz/chapters/:id (admin only)
2. Transaction: deletes all questions linked to chapter, then deletes chapter
3. Cache cleared for the chapter's subjectId

### UI Design

- Chapter row always visible below Subject row in FilterPanel
- When "All" subject selected: shows all chapters from all subjects
- When specific subject selected: shows only that subject's chapters
- Each chapter button shows name and question count
- "All" button in Chapter row resets chapter filter
- "+ Add" button opens ChapterModal with subject pre-selected if subject filter active
- Edit/Delete icons on each chapter button
- ChapterModal has Name field and Subject dropdown (if admin adding globally)

---

## 3. Question Management

### How it works

- Questions belong to a single chapter (chapterId foreign key)
- Questions have level enum: easy, medium, hard, expert, extreme
- Questions have status enum: draft, published, trash
- Options stored as JSONB array or null for extreme questions
- correctLetter stores A/B/C/D or null for extreme
- correctAnswer stores the actual answer text
- Order field preserves import order for sequencing

### CRUD Behaviour

**Create:**

1. Client sends POST to /api/v1/quiz/questions with question text, options, level, chapterId, etc
2. Backend validates required fields (question, chapterId, level)
3. For extreme level: options set to null, correctLetter set to null
4. For other levels: options array required, correctLetter required (A/B/C/D)
5. question saved with order: 0 default
6. Cache invalidated

**Read:**

1. Admin: GET /api/v1/quiz/questions with optional filters (status, subject, level, chapter, search)
2. Uses cursor-based pagination for efficient loading
3. Returns data, total count, nextCursor, hasMore
4. Public: GET /api/v1/quiz/subjects/:slug/questions or GET /api/v1/quiz/questions/:chapterId
5. Public endpoints always filter by PUBLISHED status only

**Update:**

1. Client sends PATCH to /api/v1/quiz/questions/:id with partial fields
2. Backend finds question by ID, returns 404 if not found
3. Only provided fields updated
4. If level changed to extreme: options and correctLetter set to null
5. If level changed from extreme: options and correctLetter preserved from request

**Delete:**

1. Client sends DELETE to /api/v1/quiz/questions/:id (admin only)
2. Question record deleted from database
3. Cache invalidated

**Bulk Operations:**

- Bulk create via POST /api/v1/quiz/questions/bulk accepts array of questions
- Auto-creates subjects and chapters if they don't exist (by name lookup)
- Bulk action via POST /api/v1/quiz/bulk-action supports publish, draft, trash, delete on multiple questions

### UI Design

- QuestionTable displays questions with columns: #, Question, Chapter, Options, Ans, Level, Status, Actions
- Row number shown, order preserved from import
- Question text truncated in display, full text on hover or edit
- Options shown as bullets, extreme shows "Open-ended question" badge
- Ans column shows correct letter for MCQ, full answer for extreme
- Level shown as colored badge (green=easy, blue=medium, orange=hard, purple=expert, red=extreme)
- Status shown as badge (green=published, yellow=draft, red=trash)
- Edit button opens QuestionModal
- Trash button opens styled confirmation modal
- Checkbox on each row for bulk selection
- Select all checkbox in header

---

## 4. Filter System

### How it works

- Five filter types: subject, chapter, level, status, search
- All filters stored in URL query params
- useQuizFilters hook syncs URL params to React state
- Filters passed to API calls for server-side filtering
- setFilter function updates URL and triggers re-fetch

### URL behaviour

- Subject: ?subject=slug or removed for "All"
- Chapter: ?chapter=id or removed for "All"
- Level: ?level=easy|medium|hard|expert|extreme or removed for "All"
- Status: ?status=published|draft|trash|all, defaults to published
- Search: ?search=text or removed for no search
- Multiple filters combine with AND logic
- Changing subject clears chapter filter (subject change invalidates chapter selection)

### UI Design

- FilterPanel shows all filters in rows: Subject, Level, Status, Chapter
- StatusDashboard with three buttons: All, Published, Trash
- Level filter shows count per level from filterCounts API
- Subject filter shows count per subject
- Chapter filter shows count per chapter (filtered by selected subject)
- Active filter highlighted with indigo background
- Clear All button resets to default state (published status, no other filters)
- Search input at top with debounce (300ms) to avoid excessive API calls

---

## 5. Pagination

### How it works

- URL-driven offset pagination for question list
- Page number stored in URL: `?page=2`
- Page size stored in URL: `?pageSize=20`
- Backend receives page and limit parameters
- Returns slice of questions for that page

### URL behaviour

1. Initial load: `?page=1&pageSize=20`
2. User clicks Next → URL changes to `?page=2`
3. Component re-renders, reads `page=2` from URL
4. React Query fetches with `page=2`
5. Backend returns questions 21-40
6. User refreshes → same page shown (URL preserved)
7. User shares URL → other user sees same page

### Backend Pagination

```
GET /api/v1/quiz/questions?page=2&pageSize=20&status=published&subject=math
```

| Parameter  | Default               | Description              |
| ---------- | --------------------- | ------------------------ |
| `page`     | 1                     | Page number (1-indexed)  |
| `pageSize` | 20                    | Items per page (max 100) |
| `skip`     | `(page-1) * pageSize` | Calculated internally    |

### UI Design

- Pagination controls with page buttons (1, 2, 3, ...)
- Next/Previous buttons
- Page size selector (10, 25, 50)
- Total count and page info display
- Jump to page input (optional)

### Navigation Rules

- Filter change → Reset to page 1
- Page size change → Reset to page 1
- Search change → Reset to page 1
- Subject change → Reset to page 1

---

## 6. Import System

### How it works

1. Client selects CSV file via drag-drop or file picker
2. File read as text, parsed line by line
3. First line may be # Subject: header (extracted as default subject)
4. Second line is column headers (skipped)
5. Data rows parsed from column 1 onwards (ID column 0 skipped)
6. Each row validated: requires question text, level, chapter name
7. Payload sent to POST /api/v1/quiz/questions/bulk
8. Backend auto-creates subject if subjectName provided but not found
9. Backend auto-creates chapter if not found under that subject
10. Questions saved with order = row index (preserves CSV order)
11. Response includes count of created and list of errors per row

### CSV format rules

- Line 1 (optional): # Subject: {subject_name}
- Line 2: Header row - must contain: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
- Lines 3+: Data rows
  - Column 0: ID (ignored, for readability only)
  - Column 1: Question text (required)
  - Column 2: Option A (empty for extreme)
  - Column 3: Option B (empty for extreme)
  - Column 4: Option C (empty if not used)
  - Column 5: Option D (empty if not used)
  - Column 6: Correct Answer (letter A-D for MCQ, full text for extreme)
  - Column 7: Level (easy/medium/hard/expert/extreme)
  - Column 8: Chapter name (required, creates if not exists)

### UI Design

- ImportModal accessible via "Import CSV" button in QuizHeader
- Drag-and-drop zone with visual feedback when file hovers
- File icon and name shown after file selected
- "Download Template" button provides sample CSV with correct format
- Format instructions shown below drop zone
- Import button disabled until file selected
- Loading state during import with spinner
- Result shown: success count or error list per row
- Modal closes after successful import

---

## 7. Export System

### How it works

1. Client clicks Export button in QuizHeader
2. Frontend calls GET /api/v1/quiz/questions/export with current filters
3. Backend queries all questions matching filters (no pagination limit)
4. Questions ordered by order field ASC (preserves import order)
5. CSV generated server-side with # Subject: header
6. Response contains csv string and filename
7. Frontend creates Blob and triggers download

### CSV format rules

- Line 1: # Subject: {subject_name} or # Subject: All
- Line 2: Header - ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
- Lines 3+: One row per question
  - ID: Row number (1, 2, 3...)
  - Question: Question text (quoted if contains comma)
  - Option A-D: Empty for extreme, option text otherwise (quoted if needed)
  - Correct Answer: Letter for MCQ, full text for extreme
  - Level: easy/medium/hard/expert/extreme
  - Chapter: Chapter name

### UI Design

- Export button in QuizHeader (next to Import button)
- No options or configuration - exports current filter view
- Filter status applies (exports only matching questions)
- Browser download starts automatically
- Filename format: questions*export*{subject}\_{date}.csv

---

## 8. Cache System

### How it works

- Redis-based caching via CacheService
- Cache keys include filter combination for specificity
- FILTER_COUNTS key: quiz:filter-counts:{subject}:{chapter}:{level}:{status}
- QUESTIONS key: quiz:questions:{subject}:{chapter}:{level}:{status}:{page}:{limit}
- QUESTIONS_CURSOR key: quiz:questions:{subject}:{chapter}:{level}:{status}:cursor:{cursor}:{limit}
- TTL: 300 seconds for filter counts, 600 seconds for questions

### Invalidation rules

- Any create/update/delete on subject clears quiz:\* patterns
- Any create/update/delete on chapter clears quiz:\* patterns
- Any create/update/delete on question clears quiz:\* patterns
- Bulk operations also trigger cache clear
- clearQuizCaches method deletes all quiz:\* keys via pattern matching

---

## 9. Security

### Public endpoints

- GET /api/v1/quiz/subjects - List all subjects
- GET /api/v1/quiz/subjects/:slug - Get subject with chapters
- GET /api/v1/quiz/subjects/:slug/questions - Get published questions for subject
- GET /api/v1/quiz/chapters/:subjectId - Get chapters for subject
- GET /api/v1/quiz/questions/:chapterId - Get published questions for chapter
- GET /api/v1/quiz/mixed - Get mixed random published questions
- GET /api/v1/quiz/random/:level - Get random published questions by level

### Admin endpoints

All other endpoints require:

- Valid JWT token in Authorization header (Bearer scheme)
- User must have 'admin' role

### Auth guards

- JwtAuthGuard: Verifies JWT token validity
- RolesGuard: Checks user has required role
- Both applied via @UseGuards decorator on each admin endpoint
- @ApiBearerAuth decorator for Swagger documentation

---

## Data Flow Summary

### Question Fetch Flow (Admin)

1. URL change triggers useQuizFilters
2. useQuestions hook called with new filters
3. React Query fetches from GET /api/v1/quiz/questions?filters
4. Backend applies filters in query builder
5. Results cached with key including filter combination
6. Response includes data, total, nextCursor, hasMore
7. useInfiniteQuery manages pages and cursor

### Question Fetch Flow (Public)

1. Frontend calls getQuestionsBySubjectSlug with slug and filters
2. Backend automatically filters by PUBLISHED status
3. Results not cached (public content changes frequently)
4. Returns data and total count only (no pagination)

### Import Flow

1. Client uploads CSV file
2. Frontend parses and validates rows
3. Payload sent to POST /api/v1/quiz/questions/bulk
4. Backend creates subject if needed (by name)
5. Backend creates chapter if needed (by name under subject)
6. Questions saved with row index as order
7. Cache cleared
8. Response returns count and any errors

### Filter Counts Flow

1. FilterPanel renders with current filters
2. useFilterCounts called with filters
3. Backend calculates counts for subjects, chapters, levels, statuses
4. Results cached for 300 seconds
5. UI updates count badges on filter buttons
