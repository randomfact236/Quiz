# Quiz MCQ Feature List

## Currently Implemented Features

### Core CRUD

#### Subject Features
- Subject list via GET /api/v1/quiz/subjects (public, no auth)
- Subject create via POST /api/v1/quiz/subjects (admin only, JWT auth)
- Subject update via PUT /api/v1/quiz/subjects/:id (admin only, JWT auth)
- Subject delete via DELETE /api/v1/quiz/subjects/:id (admin only, JWT auth)
- Subject get by slug via GET /api/v1/quiz/subjects/:slug (public, returns subject with chapters)
- Subject emoji field for display
- Subject isActive boolean for enable/disable
- Subject slug auto-generated from name
- Subject category optional field

#### Chapter Features
- Chapter list via GET /api/v1/quiz/chapters/:subjectId (public, no auth)
- Chapter create via POST /api/v1/quiz/chapters (admin only, JWT auth)
- Chapter update via PATCH /api/v1/quiz/chapters/:id (admin only, JWT auth)
- Chapter delete via DELETE /api/v1/quiz/chapters/:id (admin only, JWT auth)
- Chapter subjectId linking
- Chapter chapterNumber for ordering
- Chapter name unique per subject (composite unique constraint)

#### Question Features
- Question list via GET /api/v1/quiz/questions (admin only, JWT auth, cursor pagination)
- Question create via POST /api/v1/quiz/questions (admin only, JWT auth)
- Question update via PATCH /api/v1/quiz/questions/:id (admin only, JWT auth)
- Question delete via DELETE /api/v1/quiz/questions/:id (admin only, JWT auth)
- Question bulk import via POST /api/v1/quiz/questions/bulk (admin only, JWT auth)
- Question bulk action via POST /api/v1/quiz/bulk-action (admin only, JWT auth)
- Question get by chapter via GET /api/v1/quiz/questions/:chapterId (public, PUBLISHED only)
- Question get by subject via GET /api/v1/quiz/subjects/:slug/questions (public, PUBLISHED only)
- Question mixed random via GET /api/v1/quiz/mixed (public)
- Question random by level via GET /api/v1/quiz/random/:level (public)
- Question level enum: easy, medium, hard, expert, extreme
- Question status enum: draft, published, trash
- Question options JSONB array or null for extreme
- Question correctAnswer text field
- Question correctLetter A/B/C/D or null for extreme
- Question order integer field
- Question updatedAt timestamp

### Filters & Search

- Subject filter via ?subject=slug in URL
- Chapter filter via ?chapter=id in URL
- Level filter via ?level=easy in URL
- Status filter via ?status=published in URL (default: published)
- Search filter via ?search=text in URL
- Filter counts via GET /api/v1/quiz/filter-counts (admin only, returns counts for all filter combinations)
- All filters sync to URL query params
- Filters persist across page navigation
- StatusDashboard shows published, draft, trash counts
- Level filter shows easy, medium, hard, expert, extreme counts
- Subject filter shows question count per subject

### Pagination

- Cursor-based pagination for question list
- Base64 encoded cursor containing date and id
- 20 questions per page default
- nextCursor and hasMore in response
- Infinite scroll loading in admin UI
- Load more trigger at bottom of list

### Import & Export

#### Import Features
- CSV file upload via drag-drop or click
- Bulk question import via POST /api/v1/quiz/questions/bulk
- Auto-create subjects during import (creates if not exists)
- Auto-create chapters during import (creates if not exists)
- New CSV format: # Subject: name header, then columns: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
- Skips ID column (column 0) during parsing
- Skips header row automatically
- Template download button
- Import result preview
- Error reporting per row

#### Export Features
- Backend-based export (fetches ALL matching questions)
- Export via GET /api/v1/quiz/questions/export (admin only, JWT auth)
- Filters apply to export (subject, level, chapter, status)
- CSV format: # Subject: name header, then ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
- Correct Answer is letter (A/B/C/D) for MCQ, full text for extreme
- Uses correctLetter directly from database
- Order preserved from import order (ordered by question.order ASC)
- Filename includes subject name and date

### UI & UX

#### FilterPanel
- Subject filter row with emoji and count
- Level filter row with count per level
- StatusDashboard with published/draft/trash counts
- Chapter filter row always visible (shows all or filtered by subject)
- Search input with debounce (300ms)
- Clear all filters button
- Add subject button (opens modal)
- Add chapter button (opens modal with subject pre-selected)

#### QuestionTable
- Columns: #, Question, Chapter, Options, Ans, Level, Status, Actions
- Row selection via checkbox
- Select all checkbox in header
- Edit button per row (opens QuestionModal)
- Trash button per row (opens confirmation modal)
- Status badges: Published (green), Draft (yellow), Trash (red)
- Open-ended question badge for extreme level
- Empty state message when no questions
- Level badges: Easy (green), Medium (blue), Hard (orange), Expert (purple), Extreme (red)

#### Modals
- SubjectModal: Create/edit subject with name, emoji, category
- ChapterModal: Create/edit chapter with name, subject selector
- QuestionModal: Create/edit question with full form
- ImportModal: File upload, format instructions, template download
- Custom confirmation modal for trash action (styled, not browser confirm)

#### StatusDashboard
- Three buttons: All, Published, Trash
- Count displayed on each button
- Active state highlighting
- Click syncs to URL and reloads questions

### Security

- JWT authentication required for admin endpoints
- RolesGuard with 'admin' role required
- JwtAuthGuard applied to all admin endpoints
- ApiBearerAuth decorator for Swagger
- Public endpoints explicitly marked (getQuestionsBySubjectSlug, getChaptersBySubject, getAllSubjects, getMixedQuestions, getRandomQuestions, getQuestionsByChapter)

### Performance & Caching

- Redis caching via CacheService
- Filter counts cached with TTL (300 seconds)
- Question list cached by filter combination
- Cache invalidation on create/update/delete operations
- Optimistic updates in React Query
- Query cancellation on new requests
- Stale time: 5 minutes for subjects/chapters, 30 seconds for questions

---

## Future Implementation Features

### Basic / High Priority

- [ ] Question search within results
- [ ] Question duplicate detection on import
- [ ] Subject question count in real-time
- [ ] Chapter question count in real-time
- [ ] Bulk question edit (update level/status for multiple)
- [ ] Question restore from trash
- [ ] Empty chapter handling message
- [ ] Empty subject handling message
- [ ] Question preview before import
- [ ] Import validation before upload

### Nice to Have / Medium Priority

- [ ] Question reordering via drag-drop
- [ ] Subject icon/emoji custom selection
- [ ] Question audit trail (who created, when)
- [ ] Question tags/labels
- [ ] Question difficulty auto-calculation
- [ ] Bulk export selected questions only
- [ ] Import skip duplicates option
- [ ] Subject color coding
- [ ] Question hint field
- [ ] Question explanation field

### Enterprise Grade / Optional

- [ ] Question version history
- [ ] Question approval workflow
- [ ] Question sharing between subjects
- [ ] Question analytics (attempts, correct rate)
- [ ] User-specific question banks
- [ ] Question randomization per attempt
- [ ] Time limit per question
- [ ] Question image attachments
- [ ] Multi-language question support
- [ ] Question categories beyond subject/chapter