Quiz Analysis Report
less than a minute ago

Review
🎯 Quiz System — Full Analysis Report
1. Database Configuration Status
✅ What Is Configured Correctly
Component	Setting	Value	Status
DB Type	PostgreSQL	type: 'postgres'	✅
DB Host	From 
.env
ai-quiz-postgres (Docker)	✅
DB Port	From 
.env
5432	✅
DB Name	From 
.env
aiquiz	✅
DB User/Pass	From 
.env
Validated via getOrThrow	✅
Auto-sync	Dev only	synchronize: !isProduction	✅
SSL	Prod only	rejectUnauthorized: false	✅
Pool Size	Constant	DB_POOL_SIZE (app.constants)	✅
Entity Discovery	Glob	__dirname + '/**/*.entity{.ts,.js}'	✅
Rate Limiting	100 req/min	ThrottlerModule	✅
Redis	From 
.env
ai-quiz-redis:6379	✅ (Cache layer)
API Versioning	URI-based	defaultVersion: '1' → /api/v1/...	✅
API Client versioning	auto-appended	BASE + /v1 in 
api-client.ts
✅
NOTE

The 
.env
 currently uses DB_HOST=ai-quiz-postgres which is the Docker container hostname. When running locally (without Docker), this must be changed to localhost. This is a known deployment environment issue, not a code bug.

⚠️ Configuration Concerns
Issue	File	Description
Docker-only DB hostname	
.env
DB_HOST=ai-quiz-postgres fails outside Docker
No DB_LOGGING set in 
.env
.env
DB logging never activates (minor)
Redis has no password	
.env
REDIS_PASSWORD= — empty, insecure for production
2. Database Schema (TypeORM Entities)
⚠️ Failed to render Mermaid diagram: Parse error on line 9
erDiagram
    subjects {
        uuid id PK
        string slug UNIQUE
        string name
        string emoji
        string category
        boolean isActive
        int order
    }
    chapters {
        uuid id PK
        string name
        int chapterNumber
        uuid subjectId FK
    }
    questions {
        uuid id PK
        text question
        simple-array options
        string correctAnswer
        enum level
        uuid chapterId FK
        text explanation
        enum status
        timestamp updatedAt
    }

    subjects ||--o{ chapters : "has many"
    chapters ||--o{ questions : "has many"
Data Flow: Subject → Chapter → Question (3-level hierarchy, all UUIDs)

3. Backend API Endpoints — Quiz Module
All endpoints are at: http://localhost:4000/api/v1/quiz/...

Method	Endpoint	Auth	Description	Frontend Caller
GET	/quiz/subjects	No	All subjects (optional ?hasContent=true)	
getSubjects()
 in 
quiz-api.ts
GET	/quiz/subjects/:slug	No	Subject + its chapters	
getSubjectBySlug()
GET	/quiz/subjects/:slug/questions	No	Questions by subject slug	
getQuestionsBySubject()
POST	/quiz/subjects	Admin	Create subject	Admin panel
PUT	/quiz/subjects/:id	Admin	Update subject	Admin panel
DELETE	/quiz/subjects/:id	Admin	Delete subject	Admin panel
GET	/quiz/chapters/:subjectId	No	Chapters by subject ID	
getChaptersBySubject()
POST	/quiz/chapters	Admin	Create chapter	Admin panel
PUT	/quiz/chapters/:id	Admin	Update chapter	Admin panel
DELETE	/quiz/chapters/:id	Admin	Delete chapter	Admin panel
GET	/quiz/questions	Admin	All questions (paginated, filtered)	Admin panel
GET	/quiz/questions/:chapterId	No	Questions by chapter ID	❌ MISSING frontend call
GET	/quiz/mixed	No	Random mixed questions	❌ Wrong frontend URL
GET	/quiz/random/:level	No	Random questions by level	
getRandomQuestions()
POST	/quiz/questions	Admin	Create question	Admin panel
POST	/quiz/questions/bulk	Admin	Bulk create questions	Admin panel (CSV import)
PATCH	/quiz/questions/:id	Admin	Update question	❌ Frontend uses PUT
DELETE	/quiz/questions/:id	Admin	Delete question	Admin panel
POST	/quiz/bulk-action	Admin	Bulk publish/draft/trash	Admin panel
GET	/quiz/status-counts	Admin	Question counts by status	Admin panel
4. 🚨 Critical Bugs Found
Bug #1 — Wrong Route: 
getQuestionsByChapter()
File: 
apps/frontend/src/lib/quiz-api.ts
 (line 152-153)

diff
- `/quiz/chapters/${chapterId}/questions?page=...`
+ `/quiz/questions/${chapterId}?page=...`
Impact: 🔴 Every quiz play session that loads questions by chapter returns 404. This breaks the core quiz flow: /quiz/play, chapter selection question counts, and mode selection level counts all call this function.

Pages Affected: 
quiz/page.tsx
 (ChapterSelection, ModeSelection), 
quiz/play/page.tsx

Bug #2 — Wrong Route: 
getMixedQuestions()
File: 
apps/frontend/src/lib/quiz-api.ts
 (line 177)

diff
- `/quiz/questions/mixed?count=...`
+ `/quiz/mixed?count=...`
Impact: 🟡 Mixed questions mode returns 404. Affects any page using mixed quiz mode.

Bug #3 — Wrong HTTP Method: 
updateQuestion()
File: 
apps/frontend/src/lib/quiz-api.ts
 (line 200)

diff
- api.put(`/quiz/questions/${id}`, dto)
+ api.patch(`/quiz/questions/${id}`, dto)
Impact: 🟡 Admin question editing returns 404 — backend only has PATCH, not PUT.

Bug #4 — Missing category field in Subject entity
File: 
apps/backend/src/quiz/entities/subject.entity.ts

The 
Subject
 entity has category?: string but quiz 
page.tsx
 groups subjects by academic | professional | entertainment using the category field. If seeds don't populate category on subjects, all subjects fall into no category group and are invisible on the subject selection screen.

Impact: 🟡 No subjects are shown in any category unless seeds include category value.

5. Frontend Quiz Page Flow — Interlinking Map
select chapter
select mode+level
Timer Challenge btn
Practice Mode btn
quiz.status==completed
Play Again
CRUD questions
🏠 / (Home)
📚 /quiz\n(SubjectSelection\nChapterSelection\nModeSelection)
🎮 /quiz/play\n?subject&chapter&level&mode
🏆 /quiz/results\n?session=...
⏱️ /quiz/timer-challenge
📖 /quiz/practice-mode
🔐 /admin\n(QuestionManagementSection)
PostgreSQL
6. Frontend → Backend API Call Map
Backend Routes /api/v1/quiz/
quiz-api.ts
Frontend Pages
❌ 404
❌ 404
❌ 404
❌ PUT→PATCH mismatch
quiz/page.tsx
quiz/play/page.tsx\n(useQuiz hook)
quiz/results/page.tsx
admin/page.tsx
getSubjects()
getSubjectBySlug()
getQuestionsBySubject()
getQuestionsByChapter() ❌BUG
getMixedQuestions() ❌BUG
getRandomQuestions()
getAllQuestions()
createQuestion()
createQuestionsBulk()
updateQuestion() ❌BUG
deleteQuestion()
bulkActionQuestions()
GET /subjects
GET /subjects/:slug
GET /subjects/:slug/questions
GET /questions/:chapterId ← correct
GET /mixed ← correct
GET /random/:level
GET /questions (admin)
POST /questions (admin)
POST /questions/bulk (admin)
PATCH /questions/:id (admin) ← correct
DELETE /questions/:id (admin)
POST /bulk-action (admin)
7. Full Fix Plan — Make Quiz 100% Dynamic
Step 1 — Fix 
quiz-api.ts
 (3 bugs — 1 file)
File: 
apps/frontend/src/lib/quiz-api.ts

diff
// Bug #1: getQuestionsByChapter — wrong URL
-  `/quiz/chapters/${chapterId}/questions?page=${page}&limit=${limit}`
+  `/quiz/questions/${chapterId}?page=${page}&limit=${limit}`
// Bug #2: getMixedQuestions — wrong URL
-  `/quiz/questions/mixed?count=${count}`
+  `/quiz/mixed?count=${count}`
// Bug #3: updateQuestion — PUT → PATCH
-  const response = await api.put<QuizQuestion>(`/quiz/questions/${id}`, dto);
+  const response = await api.patch<QuizQuestion>(`/quiz/questions/${id}`, dto);
Step 2 — Ensure Subject Seeds Have category Field
Every subject seeded into the database must include a category value of either "academic", "professional", or "entertainment". Without this, subjects won't appear in the subject selection UI.

Check/update: 
apps/backend/src/database/auto-seed.service.ts

Step 3 — Fix 
.env
 for Local Development
For running without Docker, change:

diff
- DB_HOST=ai-quiz-postgres
+ DB_HOST=localhost
- REDIS_HOST=ai-quiz-redis
+ REDIS_HOST=localhost
Step 4 — Verify All Quiz Pages Connect Live
Page	API Call Needed	Fix Applied?
/quiz (SubjectSelection)	
getSubjects(hasContent=true)
✅ Already correct
/quiz?subject=X (ChapterSelection)	
getSubjectBySlug()
 + 
getQuestionsByChapter()
✅ / ❌ Bug #1
/quiz?subject=X&chapter=Y (ModeSelection)	
getSubjectBySlug()
 + 
getQuestionsByChapter()
✅ / ❌ Bug #1
/quiz/play?...	
getSubjectBySlug()
 + 
getQuestionsByChapter()
✅ / ❌ Bug #1
/quiz/results?session=...	Local session storage (no API call)	✅
/quiz/timer-challenge	
getMixedQuestions()
 or 
getRandomQuestions()
❌ Bug #2
/quiz/practice-mode	TBD	Check separately
/admin	All admin endpoints	❌ Bug #3 (edit)
8. Summary
Category	Status
Database schema (3 tables)	✅ Correctly defined
Database config (TypeORM)	✅ Reads from env, auto-sync in dev
DB host for local dev	⚠️ Needs change from Docker hostname
API versioning (/api/v1/)	✅ Backend + frontend both use /v1
Backend quiz endpoints (11)	✅ All correctly implemented
Frontend API calls	❌ 3 critical bugs in 
quiz-api.ts
Subject category grouping	⚠️ Depends on seed data having category
Admin CRUD	❌ Edit broken (PUT vs PATCH)
Core quiz play flow	❌ Broken (chapters 404)
CAUTION

The #1 priority fix is Bug #1 in 
quiz-api.ts
. The /quiz/chapters/{id}/questions URL does not exist in the backend — it has always been /quiz/questions/{chapterId}. This single bug breaks chapter question loading on all quiz pages.

