# Riddle Quiz Implementation Plan

## System Overview

| Aspect | Riddle | Quiz |
|--------|--------|------|
| **Hierarchy** | Category → Subject → Riddles | Subject → Chapter → Questions |
| **Difficulty** | 4 levels (easy, medium, hard, expert) | 5 levels (easy→extreme) |
| **True/False** | ❌ No | ✅ Yes |
| **Answer Storage** | `correctLetter` + `correctAnswer` | Same |
| **Dynamic** | ✅ Fully dynamic | ✅ Fully dynamic |

---

## Target Structure

### Hierarchy (3 Levels)

| Level | Database Table | Name | Quiz Equivalent |
|-------|---------------|------|-----------------|
| 1 | `riddle_categories` | **Category** | Subject |
| 2 | `riddle_subjects` | **Subject** | Chapter |
| 3 | `quiz_riddles` | **Riddles** | Questions |

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
| 1.1 | Add `categoryId` to `riddle_subjects` (FK) |
| 1.2 | Add unique constraint: `(name, categoryId)` on `riddle_subjects` |
| 1.3 | Drop `riddle_chapters` table (not needed for riddles) |
| 1.4 | Auto-generate slug from name on create |

---

## Part 2: Backend

### Entities

| Entity | Changes |
|--------|---------|
| `riddle-category.entity.ts` | Add `@OneToMany(() => RiddleSubject)` |
| `riddle-subject.entity.ts` | Add `@ManyToOne(() => RiddleCategory)`, remove chapter relationship |
| `quiz-riddle.entity.ts` | Ensure `hint` field exists |

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
interface RiddleCategory {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

interface RiddleSubject {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  emoji?: string;
}

interface Riddle {
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
// Categories
getCategories()
createCategory(data: { name, emoji? })
updateCategory(id: string, data: { name, emoji? })
deleteCategory(id: string)

// Subjects
getSubjects(categoryId?: string)
createSubject(data: { name, categoryId, emoji? })
updateSubject(id: string, data: { name, categoryId, emoji? })
deleteSubject(id: string)

// Riddles
getRiddlesBySubject(subjectId, page?, limit?)
createRiddle(data: RiddleDto)
updateRiddle(id: string, data: RiddleDto)
deleteRiddle(id: string)
```

---

## Part 5: Admin UI

### 5.1 Category Management
- List all categories with emoji
- Create/Edit/Delete modals

### 5.2 Subject Management
- List subjects grouped by category
- Create/Edit with category selector
- Delete with warning

### 5.3 Riddle Management
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
DELETE FROM quiz_riddles;
DELETE FROM riddle_subjects;
DELETE FROM riddle_categories;
DROP TABLE IF EXISTS riddle_chapters;
```

---

## Files to Modify

### Backend (4 files)
- `riddle-category.entity.ts`
- `riddle-subject.entity.ts`
- `riddles.service.ts`
- `riddles.controller.ts`

### Frontend (4 files)
- `admin/types/index.ts`
- `riddles-api.ts`
- `RiddlesSection.tsx`
- `admin/utils/index.ts`

---

## Summary

| Aspect | Status |
|--------|--------|
| Hierarchy | ✅ Category → Subject → Riddles |
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
