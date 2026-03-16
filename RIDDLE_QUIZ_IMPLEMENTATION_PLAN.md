# Riddle MCQ Implementation Plan

## System Overview

| Aspect | Riddle | Quiz |
|--------|--------|------|
| **Hierarchy** | Category → Subject → Riddle MCQs | Subject → Chapter → Questions |
| **True/False** | ❌ No | ✅ Yes |
| **Answer Storage** | `correctLetter` + `correctAnswer` | Same |
| **Dynamic** | ✅ Fully dynamic (Riddle MCQ) | ✅ Fully dynamic |

---

## Target Structure

### Hierarchy (3 Levels)

| Level | Database Table | Name | Quiz Equivalent |
|-------|---------------|------|-----------------|
| 1 | `riddle_mcq_categories` | **Category** | Subject |
| 2 | `riddle_mcq_subjects` | **Subject** | Chapter |
| 3 | `quiz_riddle_mcqs` | **Riddle MCQs** | Questions |

### Difficulty (4 Levels - NO true/false)

| Level | Options | Expert Handling |
|-------|---------|-----------------|
| easy | 2 options | - |
| medium | 3 options | - |
| hard | 4 options | - |
| expert | **open-ended** | Text input, no options |

---

## Part 1: Database

| Step | Action |
|------|--------|
| 1.1 | Add `categoryId` to `riddle_mcq_subjects` (FK) |
| 1.2 | Add unique constraint: `(name, categoryId)` on `riddle_mcq_subjects` |
| 1.3 | Drop `riddle_chapters` table (not needed for Riddle MCQ) |
| 1.4 | Auto-generate slug from name on create |

---

## Part 2: Backend

### Entities

| Entity | Changes |
|--------|---------|
| `riddle-mcq-category.entity.ts` | Add `@OneToMany(() => RiddleMcqSubject)` |
| `riddle-mcq-subject.entity.ts` | Add `@ManyToOne(() => RiddleMcqCategory)`, remove chapter relationship |
| `riddle-mcq.entity.ts` | Ensure `hint` field exists |

### Service

| Feature | Implementation |
|---------|---------------|
| Category CRUD | Create, Read, Update, Delete categories |
| Subject CRUD | Create, Read, Update, Delete subjects (linked to category) |
| Slug Auto-generation | Generate slug from name on create |
| Level Validation | easy=2 options, medium=3, hard=4, expert=0 (open-ended) |

---

## Part 3: Frontend Types

```typescript
interface RiddleMcqCategory {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

interface RiddleMcqSubject {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  emoji?: string;
}

interface RiddleMcq {
  id: string;
  question: string;
  options: string[];
  correctLetter: string | null;  // A/B/C/D or null for expert
  correctAnswer: string;          // Display text
  level: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId: string;
  hint?: string;        // Optional
  explanation?: string; // Optional
  status: 'published' | 'draft' | 'trash';
}
```

---

## Part 4: Frontend API

```typescript
// Riddle MCQ Categories
getRiddleMcqCategories()
createRiddleMcqCategory(data: { name, emoji? })
updateRiddleMcqCategory(id: string, data: { name, emoji? })
deleteRiddleMcqCategory(id: string)

// Riddle MCQ Subjects
getRiddleMcqSubjects(categoryId?: string)
createRiddleMcqSubject(data: { name, categoryId, emoji? })
updateRiddleMcqSubject(id: string, data: { name, categoryId, emoji? })
deleteRiddleMcqSubject(id: string)

// Riddle MCQs
getRiddleMcqsBySubject(subjectId, page?, limit?)
createRiddleMcq(data: RiddleMcqDto)
updateRiddleMcq(id: string, data: RiddleMcqDto)
deleteRiddleMcq(id: string)
```

---

## Part 5: Admin UI

### 5.1 Riddle MCQ Category Management
- List all categories with emoji
- Create/Edit/Delete modals

### 5.2 Riddle MCQ Subject Management
- List subjects grouped by category
- Create/Edit with category selector
- Delete with warning

### 5.3 Riddle MCQ Management
- Filters: Category, Subject, Level, Search
- Create/Edit form with:
  - Question textarea
  - Options (dynamic based on level)
  - Correct answer selector/input
  - Level dropdown
  - **Hint field** (💡 button → slide-down reveal)

### 5.4 Hint UI Specification

**Add/Edit Form:**
```
[Question Textarea]
        ↓
[💡 Hint] ← Click to toggle
        ↓
[Hint Textarea - optional]
```

**List View:**
```
Question: What has keys?
Options: A) Piano  B) Keyboard
--------------------------------------------------
💡 Hint ← Show only if hint exists
        ↓
Hint: Think musical instrument
```

---

## Part 6: Import/Export

### CSV Format
```
Category, Subject, Question, Option A, Option B, Option C, Option D, Correct Answer, Level, Hint, Explanation
```

### Import Rules

| Column | Required | Validation |
|--------|----------|------------|
| Category | Yes | Find or create |
| Subject | Yes | Find or create under Category |
| Question | Yes | - |
| Options | Conditional* | easy=2, medium=3, hard=4 |
| Correct Answer | Yes | A/B/C/D or text (expert) |
| Level | Yes | easy/medium/hard/expert |
| **Hint** | **No** | **Optional - map if exists, skip if not, no error** |
| **Explanation** | **No** | **Optional - map if exists, skip if not, no error** |

### Export
- Always include Hint and Explanation columns
- Empty string if no value

---

## Part 7: Data Cleanup (One-time)

```sql
DELETE FROM quiz_riddle_mcqs;
DELETE FROM riddle_mcq_subjects;
DELETE FROM riddle_mcq_categories;
DROP TABLE IF EXISTS riddle_chapters;
```

---

## Files to Modify

### Backend (4 files)
- `riddle-mcq-category.entity.ts` (rename from riddle-category.entity.ts)
- `riddle-mcq-subject.entity.ts` (rename from riddle-subject.entity.ts)
- `riddle-mcqs.service.ts` (rename from riddles.service.ts)
- `riddle-mcqs.controller.ts` (rename from riddles.controller.ts)

### Frontend (4 files)
- `admin/types/index.ts` (update types to RiddleMcq*)
- `riddle-mcqs-api.ts` (rename from riddles-api.ts)
- `RiddleMcqSection.tsx` (rename from RiddlesSection.tsx)
- `admin/utils/index.ts`

---

## Summary

| Aspect | Status |
|--------|--------|
| Rename existing | ✅ riddle → riddle-mcq (files, types, routes) |
| Hierarchy | ✅ Category → Subject → Riddle MCQs |
| Difficulty | ✅ 4 levels (no true/false) |
| Answer Storage | ✅ Keep correctLetter + correctAnswer |
| Hint System | ✅ Optional import, 💡 slide-reveal UI |
| Dynamic CRUD | ✅ Fully dynamic |
| Import/Export | ✅ CSV with optional Hint/Explanation |

---

## Implementation Status

| Phase | Status |
|-------|--------|
| Database | Pending |
| Backend | Pending |
| Frontend API | Pending |
| Admin UI | Pending |
| Import/Export | Pending |
| Data Cleanup | Pending |

---

*Last Updated: 2026-03-15*
