# Naming Inconsistency Audit: Quiz vs Riddle-MCQ

**Date:** 2026-04-17
**Purpose:** Identify all inconsistent naming patterns between quiz and riddle-mcq modules

---

## Summary

| Category            | Status          |
| ------------------- | --------------- |
| Backend Folders     | ❌ Inconsistent |
| Backend Modules     | ❌ Inconsistent |
| Backend Services    | ❌ Inconsistent |
| Backend Controllers | ❌ Inconsistent |
| Backend Entities    | ❌ Inconsistent |
| Backend Table Names | ❌ Inconsistent |
| Backend DTOs        | ❌ Inconsistent |
| Frontend Folders    | ❌ Inconsistent |
| Frontend API Files  | ❌ Inconsistent |
| Frontend Hooks      | ❌ Inconsistent |
| Frontend Components | ⚠️ Partial      |
| Frontend Types      | ✅ Consistent   |
| Frontend Functions  | ❌ Inconsistent |
| Enums               | ❌ Inconsistent |

**Overall: 12/14 categories are inconsistent**

---

## BACKEND NAMING

### Folder Names

| Location            | Current Name  | Inconsistent? | Suggested Name | Notes                             |
| ------------------- | ------------- | ------------- | -------------- | --------------------------------- |
| `apps/backend/src/` | `quiz/`       | ❌            | `quiz-mcq/`    | Riddle uses `riddle-mcq/` pattern |
| `apps/backend/src/` | `riddle-mcq/` | ✅            | -              | Reference pattern                 |

### Module Names

| Location                          | Current Name      | Inconsistent? | Suggested Name  | Notes                                |
| --------------------------------- | ----------------- | ------------- | --------------- | ------------------------------------ |
| `quiz/quiz.module.ts`             | `QuizModule`      | ❌            | `QuizMcqModule` | Should match RiddleMcqModule pattern |
| `riddle-mcq/riddle-mcq.module.ts` | `RiddleMcqModule` | ✅            | -               | Reference pattern                    |

### Service Names

| Location               | Current Name                  | Inconsistent? | Suggested Name   | Notes                                    |
| ---------------------- | ----------------------------- | ------------- | ---------------- | ---------------------------------------- |
| `quiz/quiz.service.ts` | `QuizService`                 | ❌            | `QuizMcqService` | Should match RiddleMcqXxxService pattern |
| `riddle-mcq/services/` | `RiddleMcqQuestionService`    | ✅            | -                | Reference pattern                        |
| `riddle-mcq/services/` | `RiddleMcqSubjectService`     | ✅            | -                | Reference pattern                        |
| `riddle-mcq/services/` | `RiddleMcqCategoryService`    | ✅            | -                | Reference pattern                        |
| `riddle-mcq/services/` | `RiddleMcqBulkService`        | ✅            | -                | Reference pattern                        |
| `riddle-mcq/services/` | `RiddleMcqBulkActionsService` | ✅            | -                | Reference pattern                        |
| `riddle-mcq/services/` | `RiddleMcqImportService`      | ✅            | -                | Reference pattern                        |
| `riddle-mcq/services/` | `RiddleMcqStatsService`       | ✅            | -                | Reference pattern                        |

### Controller Names

| Location                  | Current Name                  | Inconsistent? | Suggested Name      | Notes                                       |
| ------------------------- | ----------------------------- | ------------- | ------------------- | ------------------------------------------- |
| `quiz/quiz.controller.ts` | `QuizController`              | ❌            | `QuizMcqController` | Should match RiddleMcqXxxController pattern |
| `riddle-mcq/controllers/` | `RiddleMcqController`         | ✅            | -                   | Reference pattern                           |
| `riddle-mcq/controllers/` | `RiddleMcqSubjectController`  | ✅            | -                   | Reference pattern                           |
| `riddle-mcq/controllers/` | `RiddleMcqCategoryController` | ✅            | -                   | Reference pattern                           |

### Entity Names

| Location                           | Current Name        | Inconsistent? | Suggested Name | Notes                                 |
| ---------------------------------- | ------------------- | ------------- | -------------- | ------------------------------------- |
| `quiz/entities/subject.entity.ts`  | `Subject`           | ❌            | `QuizSubject`  | Should match RiddleMcqSubject pattern |
| `quiz/entities/question.entity.ts` | `Question`          | ❌            | `QuizQuestion` | Should match RiddleMcq pattern        |
| `quiz/entities/chapter.entity.ts`  | `Chapter`           | ❌            | `QuizChapter`  | Should match RiddleMcq pattern        |
| `riddle-mcq/entities/`             | `RiddleMcq`         | ✅            | -              | Reference pattern                     |
| `riddle-mcq/entities/`             | `RiddleMcqSubject`  | ✅            | -              | Reference pattern                     |
| `riddle-mcq/entities/`             | `RiddleMcqCategory` | ✅            | -              | Reference pattern                     |

### Table Names (in @Entity decorators)

| Location               | Current Table       | Inconsistent? | Suggested Table  | Notes                            |
| ---------------------- | ------------------- | ------------- | ---------------- | -------------------------------- |
| `quiz/entities/`       | `subjects`          | ❌            | `quiz_subjects`  | Should match riddle_mcqs pattern |
| `quiz/entities/`       | `questions`         | ❌            | `quiz_questions` | Should match riddle_mcqs pattern |
| `quiz/entities/`       | `chapters`          | ❌            | `quiz_chapters`  | Should match riddle_mcqs pattern |
| `riddle-mcq/entities/` | `riddle_mcqs`       | ✅            | -                | Reference pattern                |
| `riddle-mcq/entities/` | `riddle_subjects`   | ✅            | -                | Reference pattern                |
| `riddle-mcq/entities/` | `riddle_categories` | ✅            | -                | Reference pattern                |

### DTO Names

| Location                 | Current Name              | Inconsistent? | Suggested Name          | Notes                 |
| ------------------------ | ------------------------- | ------------- | ----------------------- | --------------------- |
| `common/dto/base.dto.ts` | `CreateSubjectDto`        | ❌            | `CreateQuizSubjectDto`  | Shared - used by quiz |
| `common/dto/base.dto.ts` | `UpdateSubjectDto`        | ❌            | `UpdateQuizSubjectDto`  | Shared - used by quiz |
| `common/dto/base.dto.ts` | `CreateQuestionDto`       | ❌            | `CreateQuizQuestionDto` | Shared - used by quiz |
| `common/dto/base.dto.ts` | `UpdateQuestionDto`       | ❌            | `UpdateQuizQuestionDto` | Shared - used by quiz |
| `common/dto/base.dto.ts` | `CreateChapterDto`        | ❌            | `CreateQuizChapterDto`  | Shared - used by quiz |
| `riddle-mcq/dto/`        | `CreateRiddleMcqDto`      | ✅            | -                       | Reference pattern     |
| `riddle-mcq/dto/`        | `CreateRiddleSubjectDto`  | ✅            | -                       | Reference pattern     |
| `riddle-mcq/dto/`        | `CreateRiddleCategoryDto` | ✅            | -                       | Reference pattern     |
| `riddle-mcq/dto/`        | `UpdateRiddleMcqDto`      | ✅            | -                       | Reference pattern     |
| `riddle-mcq/dto/`        | `UpdateRiddleSubjectDto`  | ✅            | -                       | Reference pattern     |
| `riddle-mcq/dto/`        | `UpdateRiddleCategoryDto` | ✅            | -                       | Reference pattern     |

---

## FRONTEND NAMING

### Folder Names

| Location                      | Current Name  | Inconsistent? | Suggested Name | Notes                           |
| ----------------------------- | ------------- | ------------- | -------------- | ------------------------------- |
| `apps/frontend/src/features/` | `quiz/`       | ❌            | `quiz-mcq/`    | Should match riddle-mcq pattern |
| `apps/frontend/src/features/` | `riddle-mcq/` | ✅            | -              | Reference pattern               |

### API File Names

| Location                 | Current Name        | Inconsistent? | Suggested Name    | Notes                                  |
| ------------------------ | ------------------- | ------------- | ----------------- | -------------------------------------- |
| `apps/frontend/src/lib/` | `quiz-api.ts`       | ❌            | `quiz-mcq-api.ts` | Should match riddle-mcq-api.ts pattern |
| `apps/frontend/src/lib/` | `riddle-mcq-api.ts` | ✅            | -                 | Reference pattern                      |

### Hook Names

| Location                     | Current Name               | Inconsistent? | Suggested Name               | Notes                            |
| ---------------------------- | -------------------------- | ------------- | ---------------------------- | -------------------------------- |
| `features/quiz/hooks/`       | `useQuizFilters`           | ⚠️            | `useQuizMcqFilters`          | Has Quiz prefix but inconsistent |
| `features/quiz/hooks/`       | `useSubjects`              | ❌            | `useQuizMcqSubjects`         | Missing QuizMcq prefix           |
| `features/quiz/hooks/`       | `useChapters`              | ❌            | `useQuizMcqChapters`         | Missing QuizMcq prefix           |
| `features/quiz/hooks/`       | `useQuestions`             | ❌            | `useQuizMcqQuestions`        | Missing QuizMcq prefix           |
| `features/quiz/hooks/`       | `useFilterCounts`          | ❌            | `useQuizMcqFilterCounts`     | Missing QuizMcq prefix           |
| `features/quiz/hooks/`       | `useSubjectMutation`       | ❌            | `useQuizMcqSubjectMutation`  | Missing QuizMcq prefix           |
| `features/quiz/hooks/`       | `useChapterMutation`       | ❌            | `useQuizMcqChapterMutation`  | Missing QuizMcq prefix           |
| `features/quiz/hooks/`       | `useQuestionMutation`      | ❌            | `useQuizMcqQuestionMutation` | Missing QuizMcq prefix           |
| `features/riddle-mcq/hooks/` | `useRiddleMcqFilters`      | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useRiddleMcqSubjects`     | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useRiddleMcqQuestions`    | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useRiddleMcqFilterCounts` | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useRiddleMcqCategories`   | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useRiddleMutations`       | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useBulkActions`           | ✅            | -                            | Reference pattern                |
| `features/riddle-mcq/hooks/` | `useDebounce`              | ✅            | -                            | Reference pattern                |

### Component Names

| Location                           | Current Name                | Inconsistent? | Suggested Name                | Notes                                  |
| ---------------------------------- | --------------------------- | ------------- | ----------------------------- | -------------------------------------- |
| `features/quiz/components/`        | `QuizMcqContainer`          | ⚠️            | -                             | Has Mcq suffix (unusual)               |
| `features/quiz/components/`        | `QuizHeader`                | ❌            | `QuizMcqHeader`               | Should match RiddleMcqHeader           |
| `features/quiz/components/`        | `FilterPanel`               | ❌            | `QuizMcqFilterPanel`          | Should match RiddleMcqFilterPanel      |
| `features/quiz/components/`        | `QuestionTable`             | ❌            | `QuizMcqTable`                | Should match RiddleTable pattern       |
| `features/quiz/components/`        | `QuestionManager`           | ❌            | `QuizMcqManager`              | Should match pattern                   |
| `features/quiz/components/`        | `SubjectFilterRow`          | ❌            | `QuizMcqSubjectFilterRow`     | Should match RiddleMcqSubjectFilterRow |
| `features/quiz/components/`        | `ChapterFilterRow`          | ❌            | `QuizMcqChapterFilterRow`     | Should match pattern                   |
| `features/quiz/components/modals/` | `SubjectModal`              | ❌            | `QuizMcqSubjectModal`         | Should match RiddleMcqSubjectModal     |
| `features/quiz/components/modals/` | `ChapterModal`              | ❌            | `QuizMcqChapterModal`         | Should match pattern                   |
| `features/quiz/components/modals/` | `QuestionModal`             | ❌            | `QuizMcqModal`                | Should match RiddleMcqModal            |
| `features/quiz/components/modals/` | `ImportModal`               | ❌            | `QuizMcqImportModal`          | Should match RiddleMcqImportModal      |
| `features/quiz/components/modals/` | `CSVPreview`                | ❌            | `QuizMcqCSVPreview`           | Should match pattern                   |
| `features/quiz/components/modals/` | `OptionsEditor`             | ❌            | `QuizMcqOptionsEditor`        | Should match pattern                   |
| `features/quiz/components/modals/` | `SubjectChapterFields`      | ❌            | `QuizMcqSubjectChapterFields` | Should match pattern                   |
| `features/riddle-mcq/components/`  | `RiddleMcqContainer`        | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/components/`  | `RiddleMcqHeader`           | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/components/`  | `RiddleMcqFilterPanel`      | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/components/`  | `RiddleTable`               | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/components/`  | `RiddleTableRow`            | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/components/`  | `RiddleMcqSubjectFilterRow` | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/components/`  | `CategoryFilterRow`         | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/modals/`      | `RiddleMcqModal`            | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/modals/`      | `RiddleMcqSubjectModal`     | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/modals/`      | `RiddleMcqCategoryModal`    | ✅            | -                             | Reference pattern                      |
| `features/riddle-mcq/modals/`      | `ImportModal`               | ⚠️            | -                             | Could be RiddleMcqImportModal          |

### Type Names

| Location                | Current Name             | Inconsistent? | Suggested Name          | Notes               |
| ----------------------- | ------------------------ | ------------- | ----------------------- | ------------------- |
| `lib/quiz-api.ts`       | `QuizSubject`            | ✅            | -                       | Has Quiz prefix     |
| `lib/quiz-api.ts`       | `QuizChapter`            | ✅            | -                       | Has Quiz prefix     |
| `lib/quiz-api.ts`       | `QuizQuestion`           | ✅            | -                       | Has Quiz prefix     |
| `lib/quiz-api.ts`       | `CreateSubjectDto`       | ⚠️            | `CreateQuizSubjectDto`  | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `CreateQuestionDto`      | ⚠️            | `CreateQuizQuestionDto` | Missing Quiz prefix |
| `lib/riddle-mcq-api.ts` | `RiddleMcq`              | ✅            | -                       | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `RiddleMcqCategory`      | ✅            | -                       | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `RiddleMcqSubject`       | ✅            | -                       | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `CreateRiddleMcqDto`     | ✅            | -                       | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `CreateRiddleSubjectDto` | ✅            | -                       | Reference pattern   |
| `types/riddles.ts`      | `RiddleMcq`              | ✅            | -                       | Reference pattern   |
| `types/riddles.ts`      | `RiddleSession`          | ✅            | -                       | Reference pattern   |
| `types/riddles.ts`      | `RiddleResult`           | ✅            | -                       | Reference pattern   |

### Function Names in API

| Location                | Current Name                 | Inconsistent? | Suggested Name              | Notes               |
| ----------------------- | ---------------------------- | ------------- | --------------------------- | ------------------- |
| `lib/quiz-api.ts`       | `getSubjects`                | ❌            | `getQuizSubjects`           | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getSubjectMeta`             | ❌            | `getQuizSubjectMeta`        | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getSubjectBySlug`           | ❌            | `getQuizSubjectBySlug`      | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `createSubject`              | ❌            | `createQuizSubject`         | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `updateSubject`              | ❌            | `updateQuizSubject`         | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `deleteSubject`              | ❌            | `deleteQuizSubject`         | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getAllChapters`             | ❌            | `getQuizChapters`           | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getChaptersBySubject`       | ❌            | `getQuizChaptersBySubject`  | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `createChapter`              | ❌            | `createQuizChapter`         | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `deleteChapter`              | ❌            | `deleteQuizChapter`         | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `updateChapter`              | ❌            | `updateQuizChapter`         | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getQuestionsByChapter`      | ❌            | `getQuizQuestionsByChapter` | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getRandomQuestions`         | ❌            | `getQuizRandomQuestions`    | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getMixedQuestions`          | ❌            | `getQuizMixedQuestions`     | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getQuestionsBySubject`      | ❌            | `getQuizQuestionsBySubject` | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `getAllQuestions`            | ❌            | `getQuizQuestions`          | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `createQuestion`             | ❌            | `createQuizQuestion`        | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `createQuestionsBulk`        | ❌            | `createQuizQuestionsBulk`   | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `updateQuestion`             | ❌            | `updateQuizQuestion`        | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `deleteQuestion`             | ❌            | `deleteQuizQuestion`        | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `bulkActionQuestions`        | ❌            | `bulkActionQuizQuestions`   | Missing Quiz prefix |
| `lib/quiz-api.ts`       | `exportQuestionsFromBackend` | ❌            | `exportQuizQuestions`       | Missing Quiz prefix |
| `lib/riddle-mcq-api.ts` | `getRiddlesBySubject`        | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `getRandomRiddles`           | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `getMixedRiddles`            | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `getAllRiddles`              | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `createRiddle`               | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `bulkCreateRiddles`          | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `updateRiddle`               | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `deleteRiddle`               | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `bulkActionRiddles`          | ✅            | -                           | Reference pattern   |
| `lib/riddle-mcq-api.ts` | `exportRiddlesToCSV`         | ✅            | -                           | Reference pattern   |

---

## ENUM NAMING

### Level Enums

| Location                                 | Current Name       | Values                                             | Inconsistent? | Suggested Name | Notes                |
| ---------------------------------------- | ------------------ | -------------------------------------------------- | ------------- | -------------- | -------------------- |
| `common/dto/base.dto.ts`                 | `QuestionLevel`    | easy, medium, hard, expert, **extreme**            | ❌            | `QuizLevel`    | Missing Quiz prefix  |
| `common/enums/riddle-mcq-level.enum.ts`  | `RiddleMcqLevel`   | easy, medium, hard, expert, ❌ **MISSING extreme** | ⚠️            | -              | Bug: missing extreme |
| `common/enums/riddle-difficulty.enum.ts` | `RiddleDifficulty` | easy, medium, hard                                 | ✅            | -              | Classic riddles only |

**BUG FOUND:** `RiddleMcqLevel` enum is missing `extreme` value, but Quiz `QuestionLevel` has it.

---

## OTHER INCONSISTENCIES

### Status Enums

| Location                              | Current Name    | Inconsistent? | Notes                            |
| ------------------------------------- | --------------- | ------------- | -------------------------------- |
| `common/enums/content-status.enum.ts` | `ContentStatus` | ⚠️            | Shared enum used by both modules |

### Level Type in Frontend vs Backend

| Location                                | Type Definition                                         | Inconsistent? | Issue             |
| --------------------------------------- | ------------------------------------------------------- | ------------- | ----------------- |
| `lib/quiz-api.ts`                       | `'easy' \| 'medium' \| 'hard' \| 'expert' \| 'extreme'` | ❌            | Hardcoded strings |
| `lib/riddle-mcq-api.ts`                 | `'easy' \| 'medium' \| 'hard' \| 'expert'`              | ⚠️            | Missing 'extreme' |
| `common/enums/quiz-level.enum.ts`       | N/A (file doesn't exist)                                | ❌            | Missing file      |
| `common/enums/riddle-mcq-level.enum.ts` | `RiddleMcqLevel` enum                                   | ⚠️            | Missing 'extreme' |

---

## COMPLETE RENAMING SUGGESTIONS

### High Priority (Breaking Changes Required)

| Category               | Current                             | Suggested                                          | Files to Update                    |
| ---------------------- | ----------------------------------- | -------------------------------------------------- | ---------------------------------- |
| **Backend Folder**     | `apps/backend/src/quiz/`            | `apps/backend/src/quiz-mcq/`                       | Folder rename, all imports         |
| **Backend Module**     | `QuizModule`                        | `QuizMcqModule`                                    | quiz.module.ts, app.module.ts      |
| **Backend Service**    | `QuizService`                       | `QuizMcqService`                                   | quiz.service.ts, quiz.module.ts    |
| **Backend Controller** | `QuizController`                    | `QuizMcqController`                                | quiz.controller.ts, quiz.module.ts |
| **Frontend Folder**    | `apps/frontend/src/features/quiz/`  | `apps/frontend/src/features/quiz-mcq/`             | Folder rename, all imports         |
| **Frontend API**       | `quiz-api.ts`                       | `quiz-mcq-api.ts`                                  | File rename, all imports           |
| **Table Names**        | `subjects`, `questions`, `chapters` | `quiz_subjects`, `quiz_questions`, `quiz_chapters` | Entity decorators, migrations      |

### Medium Priority

| Category            | Current                          | Suggested                                    | Files to Update                                  |
| ------------------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| **Entity Names**    | `Subject`, `Question`, `Chapter` | `QuizSubject`, `QuizQuestion`, `QuizChapter` | Entity files, all imports                        |
| **DTO Names**       | `CreateSubjectDto`, etc.         | `CreateQuizSubjectDto`, etc.                 | base.dto.ts, quiz.service.ts, quiz.controller.ts |
| **Hook Names**      | `useSubjects`, etc.              | `useQuizMcqSubjects`, etc.                   | features/quiz/hooks/\*.ts                        |
| **Component Names** | `QuizHeader`, etc.               | `QuizMcqHeader`, etc.                        | features/quiz/components/\*.tsx                  |
| **Function Names**  | `getSubjects`, etc.              | `getQuizSubjects`, etc.                      | quiz-api.ts                                      |

### Low Priority

| Category        | Current         | Suggested                       | Files to Update          |
| --------------- | --------------- | ------------------------------- | ------------------------ |
| **Enum Name**   | `QuestionLevel` | `QuizLevel`                     | base.dto.ts              |
| **Enum Values** | N/A             | Add `extreme` to RiddleMcqLevel | riddle-mcq-level.enum.ts |

---

## CROSS-REFERENCE TABLE

### Backend Quiz (Current) → Recommended (QuizMcq)

| Current             | Recommended             | Type       |
| ------------------- | ----------------------- | ---------- |
| `quiz/`             | `quiz-mcq/`             | Folder     |
| `QuizModule`        | `QuizMcqModule`         | Module     |
| `QuizService`       | `QuizMcqService`        | Service    |
| `QuizController`    | `QuizMcqController`     | Controller |
| `Subject`           | `QuizSubject`           | Entity     |
| `Question`          | `QuizQuestion`          | Entity     |
| `Chapter`           | `QuizChapter`           | Entity     |
| `subjects`          | `quiz_subjects`         | Table      |
| `questions`         | `quiz_questions`        | Table      |
| `chapters`          | `quiz_chapters`         | Table      |
| `CreateSubjectDto`  | `CreateQuizSubjectDto`  | DTO        |
| `CreateQuestionDto` | `CreateQuizQuestionDto` | DTO        |
| `QuestionLevel`     | `QuizLevel`             | Enum       |

### Backend Riddle (Current) → Reference (Already Consistent)

| Current                    | Status | Notes             |
| -------------------------- | ------ | ----------------- |
| `riddle-mcq/`              | ✅     | Reference pattern |
| `RiddleMcqModule`          | ✅     | Reference pattern |
| `RiddleMcqQuestionService` | ✅     | Reference pattern |
| `RiddleMcqController`      | ✅     | Reference pattern |
| `RiddleMcq`                | ✅     | Reference pattern |
| `riddle_mcqs`              | ✅     | Reference pattern |
| `CreateRiddleMcqDto`       | ✅     | Reference pattern |

---

## FILES AFFECTED BY EACH RENAMING STRATEGY

### Strategy A: Rename Quiz → QuizMcq (Recommended)

**Backend Files to Rename:**

1. `apps/backend/src/quiz/` → `apps/backend/src/quiz-mcq/`
2. `quiz.module.ts` → `quiz-mcq.module.ts` (class: `QuizModule` → `QuizMcqModule`)
3. `quiz.service.ts` → `quiz-mcq.service.ts` (class: `QuizService` → `QuizMcqService`)
4. `quiz.controller.ts` → `quiz-mcq.controller.ts` (class: `QuizController` → `QuizMcqController`)
5. `entities/subject.entity.ts` (class: `Subject` → `QuizSubject`)
6. `entities/question.entity.ts` (class: `Question` → `QuizQuestion`)
7. `entities/chapter.entity.ts` (class: `Chapter` → `QuizChapter`)
8. `@Entity('subjects')` → `@Entity('quiz_subjects')`
9. `@Entity('questions')` → `@Entity('quiz_questions')`
10. `@Entity('chapters')` → `@Entity('quiz_chapters')`

**Frontend Files to Rename:**

1. `apps/frontend/src/features/quiz/` → `apps/frontend/src/features/quiz-mcq/`
2. `lib/quiz-api.ts` → `lib/quiz-mcq-api.ts`
3. All hooks: `useSubjects` → `useQuizMcqSubjects`, etc.
4. All components: `QuizHeader` → `QuizMcqHeader`, etc.

**Shared Files to Update:**

1. `common/dto/base.dto.ts` - `QuestionLevel` → `QuizLevel`, add `Quiz` prefix to DTOs
2. `common/enums/` - Create `quiz-level.enum.ts` or rename existing
3. `app.module.ts` - Import path changes

### Strategy B: Rename RiddleMcq → QuizMcq

This would mean renaming `riddle-mcq/` → `quiz-mcq/` everywhere, which is a larger change since Riddle is more mature.

---

## RECOMMENDATIONS

1. **Fix Critical Bugs First**
   - Add `extreme` to `RiddleMcqLevel` enum
   - Add `Quiz` prefix to `QuestionLevel` enum (rename to `QuizLevel`)

2. **Choose Renaming Strategy**
   - Strategy A (Rename Quiz → QuizMcq): Less disruptive, keeps Riddle as reference
   - Strategy B (Rename Riddle → QuizMcq): More work but cleaner result

3. **Create Shared Enum File**
   - `common/enums/quiz-level.enum.ts` with all levels including 'extreme'
   - Deprecate `QuestionLevel` in favor of `QuizLevel`

4. **Standardize DTO Naming**
   - Frontend API DTOs should match backend DTO names
   - Consider moving quiz DTOs to `quiz/dto/` instead of `common/dto/`

5. **Update Import Paths**
   - After folder renames, update all import paths
   - Use path aliases to minimize future renaming impact

---

_Last updated: 2026-04-17_
