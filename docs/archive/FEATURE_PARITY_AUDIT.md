# Feature Parity Audit: Quiz MCQ vs Riddle MCQ

**Date:** 2026-04-16
**Auditor:** Feature Parity Audit Tool
**Verification Audit Date:** 2026-04-17
**Verification Status:** ⚠️ INITIAL AUDIT WAS ~70% ACCURATE - VERIFICATION REPORT AVAILABLE

---

## Executive Summary

This document provides a comprehensive side-by-side comparison between the `quiz` and `riddle-mcq` modules across backend and frontend applications.

**⚠️ IMPORTANT:** A second verification audit was conducted by reading actual source files. The initial audit was found to be approximately **70% accurate**. Several items marked as "missing" actually exist, and several critical bugs and new features were discovered that were not in the original audit.

**Verification Report:** `FEATURE_PARITY_AUDIT_VERIFICATION.md` (pending creation)

**Key Finding:** The `riddle-mcq` module is significantly more feature-rich with 12+ additional features that should be backported to `quiz` for feature parity. However, some features marked as missing from riddle-mcq in this document actually exist - see verification report for details.

---

## Module Structure Overview

| Module     | Backend Path                   | Frontend Path                            |
| ---------- | ------------------------------ | ---------------------------------------- |
| Quiz       | `apps/backend/src/quiz/`       | `apps/frontend/src/features/quiz/`       |
| Riddle MCQ | `apps/backend/src/riddle-mcq/` | `apps/frontend/src/features/riddle-mcq/` |

---

# BACKEND ANALYSIS

## Entity Comparison

### Quiz Module Entities

| Entity       | File                          | Columns                                                                                                      |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Subject**  | `entities/subject.entity.ts`  | id, slug (unique), name, emoji, category, isActive, order                                                    |
| **Chapter**  | `entities/chapter.entity.ts`  | id, name, chapterNumber, subjectId (FK)                                                                      |
| **Question** | `entities/question.entity.ts` | id, question, options (jsonb), correctAnswer, correctLetter, level, chapterId (FK), status, order, updatedAt |

### Riddle MCQ Module Entities

| Entity                | File                                 | Columns                                                                                                                                         |
| --------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **RiddleMcqCategory** | `entities/riddle-category.entity.ts` | id, slug (unique), name, emoji, isActive, createdAt, updatedAt                                                                                  |
| **RiddleMcqSubject**  | `entities/riddle-subject.entity.ts`  | id, slug (unique), name, emoji, categoryId (FK, nullable), isActive                                                                             |
| **RiddleMcq**         | `entities/riddle-mcq.entity.ts`      | id, question, options (simple-json), correctLetter, explanation, hint, answer, level, subjectId (FK), status, importOrder, createdAt, updatedAt |

### Entity Comparison Matrix

| Feature                 | Quiz                                                   | Riddle MCQ                                                         | Status                                               |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Subject entity          | ✅                                                     | ✅                                                                 | ✅ Identical                                         |
| Hierarchical structure  | Subject → Chapter → Question                           | Category → Subject → RiddleMcq                                     | ⚠️ Different (quiz has chapter, riddle has category) |
| Question/Riddle content | question, options, correctAnswer, correctLetter, level | question, options, correctLetter, explanation, hint, answer, level | ⚠️ Riddle has additional metadata fields             |
| Order tracking          | order column on Question                               | importOrder on RiddleMcq                                           | ✅ Equivalent                                        |
| Soft delete support     | Via status enum                                        | Via RiddleStatus enum                                              | ✅ Both have PUBLISHED/DRAFT/TRASH                   |
| Timestamps              | updatedAt only                                         | createdAt, updatedAt                                               | ⚠️ Riddle has more complete timestamps               |

---

## Service Comparison

### Quiz Module - Single Service Architecture

| Service         | File              | Key Methods                                                                                                               |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **QuizService** | `quiz.service.ts` | Subject CRUD, Chapter CRUD, Question CRUD, Bulk import, Export CSV, Filter counts, Bulk actions, Status counts by subject |

### Riddle MCQ Module - Multi-Service Architecture

| Service                         | File                                 | Key Methods                                                 |
| ------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| **RiddleMcqQuestionService**    | `riddle-mcq-question.service.ts`     | Riddle CRUD, Find by subject, Random riddles, Mixed riddles |
| **RiddleMcqSubjectService**     | `riddle-mcq-subject.service.ts`      | Subject CRUD, Get subject counts                            |
| **RiddleMcqCategoryService**    | `riddle-mcq-category.service.ts`     | Category CRUD, Get category counts                          |
| **RiddleMcqImportService**      | `riddle-mcq-import.service.ts`       | Bulk create riddles with auto-create categories/subjects    |
| **RiddleMcqBulkService**        | `riddle-mcq-bulk.service.ts`         | Bulk create, Export CSV                                     |
| **RiddleMcqBulkActionsService** | `riddle-mcq-bulk-actions.service.ts` | Bulk status updates, delete, restore                        |
| **RiddleMcqStatsService**       | `riddle-mcq-stats.service.ts`        | Stats overview, Filter counts                               |

### Service Comparison Matrix

| Feature                     | Quiz                               | Riddle MCQ                               | Status              |
| --------------------------- | ---------------------------------- | ---------------------------------------- | ------------------- |
| Single service architecture | ✅                                 | ❌ (multi-service)                       | ❌ Gap              |
| Subject CRUD                | ✅                                 | ✅                                       | ✅ Identical        |
| Chapter/Subject CRUD        | ✅ (Chapter)                       | ✅ (Subject)                             | ⚠️ Different naming |
| Question/Riddle CRUD        | ✅                                 | ✅                                       | ✅ Identical        |
| Bulk import                 | ✅                                 | ✅                                       | ✅ Identical        |
| CSV export                  | ✅                                 | ✅                                       | ✅ Identical        |
| Filter counts               | ✅ (getFilterCounts)               | ✅ (getFilterCounts)                     | ✅ Identical        |
| Bulk actions                | ✅ (via BulkActionService)         | ✅ (own BulkActionsService)              | ✅ Equivalent       |
| Status counts by subject    | ✅ (getStatusCountsBySubject)      | ❌                                       | ❌ Gap              |
| Stats overview              | ❌                                 | ✅ (getStats)                            | ❌ Gap              |
| Random selection            | ✅ (findAllRandomQuestionsByLevel) | ✅ (findRandomRiddles)                   | ✅ Identical        |
| Mixed selection             | ✅ (findAllMixedQuestions)         | ✅ (findMixedRiddles)                    | ✅ Identical        |
| Cursor-based pagination     | ✅ (findAllQuestionsWithCursor)    | ❌                                       | ❌ Gap              |
| Category management         | ❌ (has category field on Subject) | ✅ (dedicated Category entity + service) | ❌ Gap              |
| Hint field                  | ❌                                 | ✅                                       | ❌ Gap              |
| Explanation field           | ❌                                 | ✅                                       | ❌ Gap              |
| Answer field                | ❌ (uses correctAnswer)            | ✅ (separate answer field)               | ❌ Gap              |

---

## Controller Comparison

### Quiz Module

| Controller         | File                 | Endpoints                                                                      |
| ------------------ | -------------------- | ------------------------------------------------------------------------------ |
| **QuizController** | `quiz.controller.ts` | Subjects (5), Chapters (5), Questions (8), Bulk (1), Filter (1) = **20 total** |

### Riddle MCQ Module

| Controller                      | File                                | Endpoints                                                            |
| ------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| **RiddleMcqController**         | `riddle-mcq.controller.ts`          | Riddles CRUD (6), Bulk (1), Export (1), Stats (1), Filter counts (1) |
| **RiddleMcqSubjectController**  | `riddle-mcq-subject.controller.ts`  | Subjects CRUD (4), Get all (2)                                       |
| **RiddleMcqCategoryController** | `riddle-mcq-category.controller.ts` | Categories CRUD (4), Get all (2)                                     |

### Controller Comparison Matrix

| Feature                  | Quiz            | Riddle MCQ                | Status                    |
| ------------------------ | --------------- | ------------------------- | ------------------------- |
| Question/Riddle CRUD     | ✅              | ✅                        | ✅ Identical              |
| Subject CRUD             | ✅              | ✅                        | ✅ Identical              |
| Chapter CRUD             | ✅              | ❌ (Subject handles this) | ⚠️ Different              |
| Category CRUD            | ❌              | ✅                        | ❌ Gap                    |
| Bulk create              | ✅              | ✅                        | ✅ Identical              |
| Bulk action              | ✅              | ✅                        | ✅ Identical              |
| CSV export               | ✅              | ✅                        | ✅ Identical              |
| Stats endpoint           | ❌              | ✅ (/stats/overview)      | ❌ Gap                    |
| Filter counts            | ✅ (admin only) | ✅ (public)               | ⚠️ Riddle more accessible |
| Get questions by subject | ✅              | ✅                        | ✅ Identical              |
| Get mixed questions      | ✅              | ✅                        | ✅ Identical              |
| Get random questions     | ✅              | ✅                        | ✅ Identical              |

---

## DTO Comparison

### Quiz Module

Uses shared DTOs from `apps/backend/src/common/dto/`:

- `base.dto.ts`: CreateQuestionDto, CreateSubjectDto, PaginationDto
- `bulk-question.dto.ts`: BulkQuestionDto, BulkQuestionItemDto

### Riddle MCQ Module

Has dedicated DTOs in `dto/`:

- `create/riddle-mcq.dto.ts`: CreateRiddleMcqDto
- `create/riddle-subject.dto.ts`: CreateRiddleSubjectDto
- `create/riddle-category.dto.ts`: CreateRiddleCategoryDto
- `create/bulk-create-riddle.dto.ts`: BulkCreateRiddleDto
- `update/riddle-mcq.dto.ts`: UpdateRiddleMcqDto
- `update/riddle-subject.dto.ts`: UpdateRiddleSubjectDto
- `update/riddle-category.dto.ts`: UpdateRiddleCategoryDto

### DTO Comparison Matrix

| Feature            | Quiz                | Riddle MCQ | Status                   |
| ------------------ | ------------------- | ---------- | ------------------------ |
| Create DTOs        | Shared              | Dedicated  | ⚠️ Riddle more organized |
| Update DTOs        | Via Partial<Create> | Dedicated  | ⚠️ Riddle more organized |
| Bulk create DTO    | ✅                  | ✅         | ✅ Identical             |
| Category DTOs      | ❌                  | ✅         | ❌ Gap                   |
| Pagination DTO     | ✅ (shared)         | ✅ (own)   | ✅ Equivalent            |
| Swagger decorators | ✅                  | ✅         | ✅ Identical             |

---

## Module Configuration

### Quiz Module

```typescript
// quiz.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Subject, Chapter, Question])],
  controllers: [QuizController],
  providers: [QuizService, CacheService, BulkActionService],
  exports: [QuizService],
})
```

### Riddle MCQ Module

```typescript
// riddle-mcq.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([RiddleMcqCategory, RiddleMcqSubject, RiddleMcq]),
    CacheModule,
  ],
  controllers: [RiddleMcqCategoryController, RiddleMcqSubjectController, RiddleMcqController],
  providers: [
    RiddleMcqCategoryService,
    RiddleMcqSubjectService,
    RiddleMcqQuestionService,
    RiddleMcqBulkService,
    RiddleMcqBulkActionsService,
    RiddleMcqImportService,
    RiddleMcqStatsService,
  ],
  exports: [/* all services */],
})
```

### Module Configuration Comparison

| Feature          | Quiz                               | Riddle MCQ                | Status                    |
| ---------------- | ---------------------------------- | ------------------------- | ------------------------- |
| TypeORM entities | ✅                                 | ✅                        | ✅ Identical              |
| Cache module     | ✅ (imports CacheService directly) | ✅ (imports CacheModule)  | ⚠️ Different import style |
| Controller count | 1                                  | 3                         | ⚠️ Riddle more modular    |
| Service count    | 1 (+2 shared)                      | 7                         | ⚠️ Riddle more modular    |
| Full export      | ❌ (exports QuizService only)      | ✅ (exports all services) | ❌ Gap                    |

---

## Caching Implementation

### Quiz Module

```typescript
private readonly CACHE_KEYS = {
  FILTER_COUNTS: (subject, chapter, level, status) => `quiz:filter-counts:${...}`,
  QUESTIONS: (subject, chapter, level, status, page, limit) => `quiz:questions:${...}`,
  QUESTIONS_CURSOR: (...) => `quiz:questions:...:cursor:${...}`,
};

private readonly CACHE_TTL = {
  FILTER_COUNTS: 300,
  QUESTIONS: 600,
};
```

### Riddle MCQ Module

```typescript
private readonly CACHE_KEYS = {
  QUESTIONS: (category, subject, level, status, search, page, limit) => `riddle-mcq:questions:${...}`,
  SUBJECTS: (active) => `riddle-mcq:subjects:${...}`,
  CATEGORIES: (active) => `riddle-mcq:categories:${...}`,
  FILTER_COUNTS: (category, subject, level) => `riddle-mcq:filter-counts:${...}`,
};

private readonly CACHE_TTL = {
  QUESTIONS: 600,
  SUBJECTS: 600,
  CATEGORIES: 600,
  FILTER_COUNTS: 300,
};
```

### Caching Comparison Matrix

| Feature                   | Quiz            | Riddle MCQ      | Status                        |
| ------------------------- | --------------- | --------------- | ----------------------------- |
| Question/Riddle caching   | ✅              | ✅              | ✅ Identical                  |
| Subject caching           | ❌              | ✅              | ❌ Gap                        |
| Category caching          | ❌              | ✅              | ❌ Gap                        |
| Filter counts caching     | ✅              | ✅              | ✅ Identical                  |
| Cursor-based cache keys   | ✅              | ❌              | ⚠️ Quiz has cursor pagination |
| Pattern-based cache clear | ✅ (delPattern) | ✅ (delPattern) | ✅ Identical                  |

---

## Guards & Authorization

Both modules use identical guard configuration:

| Guard               | Quiz | Riddle MCQ | Status       |
| ------------------- | ---- | ---------- | ------------ |
| JwtAuthGuard        | ✅   | ✅         | ✅ Identical |
| RolesGuard          | ✅   | ✅         | ✅ Identical |
| Admin role required | ✅   | ✅         | ✅ Identical |

---

# FRONTEND ANALYSIS

## File Structure

### Quiz Module Frontend

| Category       | Files                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Components** | QuizMcqContainer, QuizHeader, FilterPanel, QuestionTable, QuestionManager, SubjectFilterRow, ChapterFilterRow                        |
| **Modals**     | SubjectModal, ChapterModal, QuestionModal, ImportModal, OptionsEditor, SubjectChapterFields, CSVPreview                              |
| **Hooks**      | useQuizFilters, useSubjects, useChapters, useQuestions, useFilterCounts, useSubjectMutation, useChapterMutation, useQuestionMutation |
| **API**        | /lib/quiz-api.ts (single file)                                                                                                       |

### Riddle MCQ Module Frontend

| Category       | Files                                                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Components** | RiddleMcqContainer, RiddleMcqHeader, RiddleMcqFilterPanel, RiddleTable, RiddleTableRow, FilterControls, SearchInput, ActiveFiltersBadge, CategoryFilterRow, RiddleMcqSubjectFilterRow, useRiddleMcqModals |
| **Modals**     | RiddleMcqModal, RiddleMcqCategoryModal, RiddleMcqSubjectModal, RiddleQuestionForm, ImportModal, RiddleMetaFields, RiddleAnswerFields, csv-parser, useRiddleFormReset                                      |
| **Hooks**      | useRiddleMcqFilters, useRiddleMcqSubjects, useRiddleMcqCategories, useRiddleMcqQuestions, useRiddleMcqFilterCounts, useRiddleMutations, useBulkActions, useDebounce                                       |
| **API**        | /lib/riddle-mcq-api.ts (single file), /types/riddles.ts                                                                                                                                                   |

---

## Component Comparison

### Container Components

| Feature          | Quiz                      | Riddle MCQ            | Status                             |
| ---------------- | ------------------------- | --------------------- | ---------------------------------- |
| Main container   | QuizMcqContainer          | RiddleMcqContainer    | ✅ Equivalent                      |
| Header component | QuizHeader                | RiddleMcqHeader       | ✅ Equivalent                      |
| Filter panel     | FilterPanel               | RiddleMcqFilterPanel  | ⚠️ Riddle has more filter features |
| Table component  | QuestionTable             | RiddleTable           | ✅ Equivalent                      |
| Row component    | Inline in QuestionTable   | RiddleTableRow        | ⚠️ Riddle is more modular          |
| Pagination       | Inline in QuestionManager | Inline in RiddleTable | ✅ Equivalent                      |

### Component Feature Matrix

| Feature                     | Quiz                     | Riddle MCQ                                    | Status                           |
| --------------------------- | ------------------------ | --------------------------------------------- | -------------------------------- |
| Status dashboard            | ✅ (via StatusDashboard) | ✅ (via StatusDashboard)                      | ✅ Identical                     |
| Subject/Category filter row | SubjectFilterRow         | CategoryFilterRow + RiddleMcqSubjectFilterRow | ⚠️ Riddle has combined component |
| Chapter filter row          | ChapterFilterRow         | ❌ (uses subject filter)                      | ⚠️ Different structure           |
| Search input                | Inline in FilterPanel    | SearchInput component                         | ⚠️ Riddle more modular           |
| Active filters badge        | Inline in FilterPanel    | ActiveFiltersBadge component                  | ⚠️ Riddle more modular           |
| Filter controls             | Inline in FilterPanel    | FilterControls component                      | ⚠️ Riddle more modular           |

---

## Hook Comparison

### Quiz Module Hooks

| Hook                | Purpose                           |
| ------------------- | --------------------------------- |
| useQuizFilters      | URL-based filter state management |
| useSubjects         | Subject list + delete mutation    |
| useChapters         | Chapter list + delete mutation    |
| useQuestions        | Question list with filters        |
| useFilterCounts     | Filter counts aggregation         |
| useSubjectMutation  | Subject create/update/delete      |
| useChapterMutation  | Chapter create/update/delete      |
| useQuestionMutation | Question create/update/bulk       |

### Riddle MCQ Module Hooks

| Hook                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| useRiddleMcqFilters      | URL-based filter state management                    |
| useRiddleMcqCategories   | Category list with CRUD                              |
| useRiddleMcqSubjects     | Subject list with CRUD                               |
| useRiddleMcqQuestions    | Riddle list with CRUD                                |
| useRiddleMcqFilterCounts | Filter counts aggregation                            |
| useRiddleMutations       | All entity mutations (categories, subjects, riddles) |
| useBulkActions           | Bulk action handler                                  |
| useDebounce              | Debounce utility hook                                |

### Hook Comparison Matrix

| Feature                 | Quiz                       | Riddle MCQ                  | Status                |
| ----------------------- | -------------------------- | --------------------------- | --------------------- |
| Filter state management | ✅ useQuizFilters          | ✅ useRiddleMcqFilters      | ✅ Equivalent         |
| Category hooks          | ❌                         | ✅ useRiddleMcqCategories   | ❌ Gap                |
| Subject hooks           | ✅ useSubjects             | ✅ useRiddleMcqSubjects     | ✅ Equivalent         |
| Chapter hooks           | ✅ useChapters             | ❌ (combined with subject)  | ⚠️ Different          |
| Question hooks          | ✅ useQuestions            | ✅ useRiddleMcqQuestions    | ✅ Equivalent         |
| Filter counts           | ✅ useFilterCounts         | ✅ useRiddleMcqFilterCounts | ✅ Equivalent         |
| Mutation hooks          | Separate hooks per entity  | Single unified hook         | ⚠️ Different patterns |
| Bulk actions hook       | ❌ (inline in component)   | ✅ useBulkActions           | ❌ Gap                |
| Debounce hook           | ❌ (inline implementation) | ✅ useDebounce              | ❌ Gap                |

---

## API Layer Comparison

### Quiz Module API (`/lib/quiz-api.ts`)

| Category      | Functions                                                                                                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Subjects**  | getSubjects, getSubjectMeta, getSubjectBySlug, createSubject, updateSubject, deleteSubject                                                                                                                                                                                                          |
| **Chapters**  | getAllChapters, getChaptersBySubject, createChapter, deleteChapter, updateChapter                                                                                                                                                                                                                   |
| **Questions** | getQuestionsByChapter, getRandomQuestions, getMixedQuestions, getQuestionsBySubject, getQuestionCountBySubject, getStatusCountsBySubject, getFilterCounts, getAllQuestions, createQuestion, createQuestionsBulk, createQuestionsBulkFromImport, updateQuestion, deleteQuestion, bulkActionQuestions |
| **Export**    | exportQuestionsFromBackend                                                                                                                                                                                                                                                                          |

### Riddle MCQ Module API (`/lib/riddle-mcq-api.ts`)

| Category       | Functions                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Categories** | getCategories, getCategoriesAdmin, createCategory, updateCategory, deleteCategory                                                                     |
| **Subjects**   | getSubjects, getSubjectBySlug, getAllSubjectsAdmin, createSubject, updateSubject, deleteSubject                                                       |
| **Riddles**    | getRiddlesBySubject, getRandomRiddles, getMixedRiddles, getAllRiddles, bulkActionRiddles, createRiddle, bulkCreateRiddles, updateRiddle, deleteRiddle |
| **Export**     | exportRiddlesToCSV                                                                                                                                    |
| **Stats**      | getRiddleFilterCounts, getStats                                                                                                                       |

### API Comparison Matrix

| Feature              | Quiz         | Riddle MCQ   | Status              |
| -------------------- | ------------ | ------------ | ------------------- |
| Subject API          | ✅           | ✅           | ✅ Identical        |
| Category API         | ❌           | ✅           | ❌ Gap              |
| Chapter/Subject API  | ✅ (Chapter) | ✅ (Subject) | ⚠️ Different naming |
| Question/Riddle CRUD | ✅           | ✅           | ✅ Identical        |
| Bulk operations      | ✅           | ✅           | ✅ Identical        |
| Random fetch         | ✅           | ✅           | ✅ Identical        |
| Mixed fetch          | ✅           | ✅           | ✅ Identical        |
| Filter counts        | ✅           | ✅           | ✅ Identical        |
| Stats endpoint       | ❌           | ✅           | ❌ Gap              |
| CSV export           | ✅           | ✅           | ✅ Identical        |

---

## Types Comparison

### Quiz Module Types

Inline in `/lib/quiz-api.ts`:

- QuizSubject, QuizChapter, QuizQuestion
- CreateSubjectDto, UpdateSubjectDto
- CreateChapterDto, CreateQuestionDto, UpdateQuestionDto
- BulkQuestionDto, BulkQuestionItemDto
- FilterCountsResponse, StatusCountResponse

### Riddle MCQ Module Types

Separate files:

- `/lib/riddle-mcq-api.ts`: API types (CreateCategoryDto, CreateSubjectDto, etc.)
- `/types/riddles.ts`: Entity types + game types + utility functions

### Types Comparison Matrix

| Feature              | Quiz                                | Riddle MCQ                 | Status                     |
| -------------------- | ----------------------------------- | -------------------------- | -------------------------- |
| Type organization    | Inline with API                     | Separate files             | ⚠️ Riddle better organized |
| Subject type         | ✅                                  | ✅                         | ✅ Identical               |
| Question/Riddle type | ✅                                  | ✅                         | ✅ Equivalent              |
| Category type        | ❌                                  | ✅                         | ❌ Gap                     |
| Difficulty levels    | easy, medium, hard, expert, extreme | easy, medium, hard, expert | ⚠️ Quiz has extreme        |
| Game session types   | ❌                                  | ✅                         | ❌ Gap                     |
| Adapter functions    | ❌                                  | ✅                         | ❌ Gap                     |

---

# FEATURE PARITY MATRIX

## Backend Summary

| Category        | Feature                      |  Quiz   |    Riddle MCQ     |
| --------------- | ---------------------------- | :-----: | :---------------: |
| **Entities**    | Subject                      |   ✅    |        ✅         |
|                 | Chapter/Subject              |   ✅    |        ✅         |
|                 | Question/Riddle              |   ✅    |        ✅         |
|                 | Category                     |   ❌    |        ✅         |
|                 | Hint field                   |   ❌    |        ✅         |
|                 | Explanation field            |   ❌    |        ✅         |
|                 | Answer field                 |   ❌    |        ✅         |
|                 | Timestamps (created+updated) |   ❌    |        ✅         |
| **Services**    | Subject CRUD                 |   ✅    |        ✅         |
|                 | Chapter CRUD                 |   ✅    | ❌ (uses Subject) |
|                 | Question CRUD                |   ✅    |        ✅         |
|                 | Category CRUD                |   ❌    |        ✅         |
|                 | Bulk import                  |   ✅    |        ✅         |
|                 | CSV export                   |   ✅    |        ✅         |
|                 | Filter counts                |   ✅    |        ✅         |
|                 | Bulk actions                 |   ✅    |        ✅         |
|                 | Stats endpoint               |   ❌    |        ✅         |
|                 | Cursor pagination            |   ✅    |        ❌         |
| **Controllers** | Subject endpoints            |   ✅    |        ✅         |
|                 | Chapter endpoints            |   ✅    |        ❌         |
|                 | Question endpoints           |   ✅    |        ✅         |
|                 | Category endpoints           |   ❌    |        ✅         |
|                 | Stats endpoints              |   ❌    |        ✅         |
| **DTOs**        | Create DTOs                  | Shared  |     Dedicated     |
|                 | Update DTOs                  | Partial |     Dedicated     |
|                 | Category DTOs                |   ❌    |        ✅         |
| **Caching**     | Question caching             |   ✅    |        ✅         |
|                 | Subject caching              |   ❌    |        ✅         |
|                 | Category caching             |   ❌    |        ✅         |
| **Guards**      | JwtAuthGuard                 |   ✅    |        ✅         |
|                 | RolesGuard                   |   ✅    |        ✅         |

## Frontend Summary

| Category       | Feature            |  Quiz  |   Riddle MCQ   |
| -------------- | ------------------ | :----: | :------------: |
| **Components** | Container          |   ✅   |       ✅       |
|                | Header             |   ✅   |       ✅       |
|                | Filter panel       |   ✅   |       ✅       |
|                | Table              |   ✅   |       ✅       |
|                | Row component      | Inline |   Dedicated    |
|                | Pagination         | Inline |     Inline     |
| **Hooks**      | Filter state       |   ✅   |       ✅       |
|                | Category hooks     |   ❌   |       ✅       |
|                | Subject hooks      |   ✅   |       ✅       |
|                | Question hooks     |   ✅   |       ✅       |
|                | Filter counts      |   ✅   |       ✅       |
|                | Bulk actions       | Inline |   Dedicated    |
|                | Debounce           | Inline |   Dedicated    |
| **API**        | Subject API        |   ✅   |       ✅       |
|                | Category API       |   ❌   |       ✅       |
|                | Question API       |   ✅   |       ✅       |
|                | Stats API          |   ❌   |       ✅       |
|                | Export             |   ✅   |       ✅       |
| **Types**      | Type organization  | Inline | Separate files |
|                | Category types     |   ❌   |       ✅       |
|                | Game session types |   ❌   |       ✅       |
|                | Adapter functions  |   ❌   |       ✅       |

---

# GAP ANALYSIS

## Critical Gaps (Missing from Quiz)

### Backend Gaps

1. **Category Entity & CRUD** (`riddle-mcq/entities/riddle-category.entity.ts`, `riddle-mcq/services/riddle-mcq-category.service.ts`, `riddle-mcq/controllers/riddle-mcq-category.controller.ts`)
   - Quiz has a simple `category` string field on Subject
   - Riddle has dedicated Category entity with full CRUD
   - **Impact:** Cannot organize quiz subjects into categories

2. **Category Service** (`riddle-mcq/services/riddle-mcq-category.service.ts:1`)
   - Missing in quiz module
   - **Impact:** No category-level operations

3. **Stats Service** (`riddle-mcq/services/riddle-mcq-stats.service.ts:1`)
   - Provides overview statistics endpoint
   - **Impact:** No unified stats for quiz

4. **Subject Caching** (`riddle-mcq/services/riddle-mcq-subject.service.ts:13-18`)
   - Caches subject list
   - **Impact:** Quiz has no subject caching

5. **Hint & Explanation Fields** (`riddle-mcq/entities/riddle-mcq.entity.ts:38-45`)
   - Riddle has hint and explanation
   - **Impact:** Cannot provide hints/explanations for quiz questions

6. **CreatedAt Timestamp** (`riddle-mcq/entities/riddle-mcq.entity.ts:71`)
   - Riddle has createdAt, Quiz only has updatedAt
   - **Impact:** Cannot track creation time

### Frontend Gaps

1. **Category Management UI** (`riddle-mcq/components/CategoryFilterRow.tsx`, `modals/RiddleMcqCategoryModal.tsx`)
   - No category management in quiz
   - **Impact:** Cannot manage categories from UI

2. **useBulkActions Hook** (`riddle-mcq/hooks/useBulkActions.ts:1`)
   - Standalone bulk actions hook
   - **Impact:** Quiz handles bulk actions inline

3. **useDebounce Hook** (`riddle-mcq/hooks/useDebounce.ts:1`)
   - Standalone debounce utility
   - **Impact:** Quiz has inline debounce

4. **Separate Type Files** (`types/riddles.ts`)
   - Riddle has organized type definitions
   - **Impact:** Quiz types are inline with API

---

# PRIORITIZED IMPLEMENTATION LIST

## Phase 1: Critical (Should implement first)

| Priority | Gap                    | Files to Create/Modify                                                                                                          | Effort |
| -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1        | Category entity & CRUD | `entities/category.entity.ts`, `services/quiz-category.service.ts`, `controllers/quiz-category.controller.ts`, `quiz.module.ts` | High   |
| 2        | Category DTOs          | `dto/create/quiz-category.dto.ts`, `dto/update/quiz-category.dto.ts`                                                            | Medium |
| 3        | Category API endpoints | Add to `quiz.controller.ts` or new controller                                                                                   | Medium |
| 4        | Category caching       | Add cache keys to `quiz.service.ts`                                                                                             | Low    |

## Phase 2: Important (Should implement next)

| Priority | Gap                           | Files to Create/Modify                                         | Effort |
| -------- | ----------------------------- | -------------------------------------------------------------- | ------ |
| 5        | Hint & Explanation fields     | Add to `entities/question.entity.ts`, update DTOs and services | Medium |
| 6        | Category hooks                | `hooks/useQuizCategories.ts`                                   | Medium |
| 7        | Category filter row component | `components/CategoryFilterRow.tsx`                             | Low    |
| 8        | Category modal component      | `modals/QuizCategoryModal.tsx`                                 | Medium |

## Phase 3: Nice to Have (Standardization)

| Priority | Gap                 | Files to Create/Modify                | Effort |
| -------- | ------------------- | ------------------------------------- | ------ |
| 9        | useDebounce hook    | `hooks/useDebounce.ts`                | Low    |
| 10       | Separate type file  | `types/quiz.ts`                       | Low    |
| 11       | Stats endpoint      | Add `getStats()` to `quiz.service.ts` | Low    |
| 12       | CreatedAt timestamp | Add to `entities/question.entity.ts`  | Low    |

---

# RECOMMENDATIONS

## 1. Architectural Standardization

**Recommendation:** Adopt riddle-mcq's multi-service architecture for quiz module.

**Rationale:** The multi-service architecture in riddle-mcq provides better separation of concerns and makes the module more maintainable as it grows.

**Implementation:**

```
quiz/
├── services/
│   ├── quiz-question.service.ts
│   ├── quiz-subject.service.ts
│   ├── quiz-chapter.service.ts
│   └── quiz-stats.service.ts
├── controllers/
│   ├── quiz.controller.ts
│   ├── quiz-subject.controller.ts
│   └── quiz-chapter.controller.ts
```

## 2. Add Category Support

**Recommendation:** Add Category entity and management to quiz module to match riddle-mcq's structure.

**Rationale:** Categories provide logical grouping of subjects, which is useful for:

- Organizing large content libraries
- Filtering at a higher level than subject
- Better content management

## 3. Unified Mutation Hook

**Recommendation:** Create a unified `useQuizMutations` hook similar to riddle's `useRiddleMutations`.

**Rationale:** Reduces code duplication and provides consistent mutation interface.

## 4. Type Organization

**Recommendation:** Move quiz types to a dedicated `types/quiz.ts` file.

**Rationale:** Better organization and makes types reusable across the application.

## 5. Add Hint & Explanation Fields

**Recommendation:** Add hint and explanation fields to quiz Question entity.

**Rationale:** These fields enhance the learning experience by providing:

- Hints for difficult questions
- Explanations for correct answers

---

# FILES REFERENCE

## Quiz Module (Backend)

| File                          | Lines | Purpose              |
| ----------------------------- | ----- | -------------------- |
| `quiz.service.ts`             | 1096  | Main business logic  |
| `quiz.controller.ts`          | 394   | API endpoints        |
| `quiz.module.ts`              | 20    | Module configuration |
| `entities/question.entity.ts` | 49    | Question entity      |
| `entities/subject.entity.ts`  | 32    | Subject entity       |
| `entities/chapter.entity.ts`  | 27    | Chapter entity       |
| `dto/export-query.dto.ts`     | -     | Export DTO           |

## Riddle MCQ Module (Backend)

| File                                            | Lines | Purpose               |
| ----------------------------------------------- | ----- | --------------------- |
| `riddle-mcq.module.ts`                          | 49    | Module configuration  |
| `entities/riddle-mcq.entity.ts`                 | 76    | Riddle entity         |
| `entities/riddle-subject.entity.ts`             | 42    | Subject entity        |
| `entities/riddle-category.entity.ts`            | 39    | Category entity       |
| `services/riddle-mcq-question.service.ts`       | 331   | Question CRUD         |
| `services/riddle-mcq-subject.service.ts`        | 229   | Subject CRUD          |
| `services/riddle-mcq-category.service.ts`       | 194   | Category CRUD         |
| `services/riddle-mcq-import.service.ts`         | 177   | Bulk import           |
| `services/riddle-mcq-bulk.service.ts`           | 84    | Bulk operations       |
| `services/riddle-mcq-bulk-actions.service.ts`   | 106   | Bulk actions          |
| `services/riddle-mcq-stats.service.ts`          | 198   | Statistics            |
| `controllers/riddle-mcq.controller.ts`          | 203   | Main controller       |
| `controllers/riddle-mcq-subject.controller.ts`  | 81    | Subject controller    |
| `controllers/riddle-mcq-category.controller.ts` | 80    | Category controller   |
| `dto/create/riddle-mcq.dto.ts`                  | 55    | Create DTOs           |
| `dto/create/riddle-subject.dto.ts`              | 42    | Subject DTOs          |
| `dto/create/riddle-category.dto.ts`             | 34    | Category DTOs         |
| `dto/update/riddle-mcq.dto.ts`                  | 58    | Update DTOs           |
| `dto/update/riddle-subject.dto.ts`              | 39    | Subject update DTOs   |
| `dto/update/riddle-category.dto.ts`             | 31    | Category update DTOs  |
| `validators/difficulty.validator.ts`            | 13    | Level validation      |
| `validators/pagination.validator.ts`            | 21    | Pagination validation |
| `utils/csv-export.util.ts`                      | -     | CSV utilities         |
| `utils/slug.util.ts`                            | -     | Slug utilities        |

## Quiz Module (Frontend)

| File                              | Lines | Purpose             |
| --------------------------------- | ----- | ------------------- |
| `components/QuizMcqContainer.tsx` | 266   | Main container      |
| `components/QuizHeader.tsx`       | 44    | Header              |
| `components/FilterPanel.tsx`      | 297   | Filter panel        |
| `components/QuestionTable.tsx`    | 215   | Question table      |
| `components/QuestionManager.tsx`  | 332   | Question management |
| `hooks/index.ts`                  | 8     | Hooks export        |
| `hooks/useQuizFilters.ts`         | 110   | Filter state        |
| `hooks/useSubjects.ts`            | 60    | Subject hooks       |
| `hooks/useChapters.ts`            | 66    | Chapter hooks       |
| `hooks/useQuestions.ts`           | 48    | Question hooks      |
| `hooks/useFilterCounts.ts`        | 28    | Filter counts       |
| `lib/quiz-api.ts`                 | 442   | API layer           |

## Riddle MCQ Module (Frontend)

| File                                  | Lines | Purpose          |
| ------------------------------------- | ----- | ---------------- |
| `components/RiddleMcqContainer.tsx`   | 334   | Main container   |
| `components/RiddleMcqHeader.tsx`      | 40    | Header           |
| `components/RiddleMcqFilterPanel.tsx` | 132   | Filter panel     |
| `components/RiddleTable.tsx`          | 201   | Riddle table     |
| `components/RiddleTableRow.tsx`       | -     | Table row        |
| `components/FilterControls.tsx`       | -     | Filter controls  |
| `components/SearchInput.tsx`          | -     | Search input     |
| `components/ActiveFiltersBadge.tsx`   | -     | Active filters   |
| `hooks/index.ts`                      | 4     | Hooks export     |
| `hooks/useRiddleMcqFilters.ts`        | 61    | Filter state     |
| `hooks/useRiddleMcqQuestions.ts`      | 85    | Question hooks   |
| `hooks/useRiddleMutations.ts`         | 126   | All mutations    |
| `hooks/useBulkActions.ts`             | 20    | Bulk actions     |
| `hooks/useDebounce.ts`                | -     | Debounce utility |
| `lib/riddle-mcq-api.ts`               | 452   | API layer        |
| `types/riddles.ts`                    | 320   | Type definitions |

---

_Document generated by Feature Parity Audit Tool_
_For internal use only_
