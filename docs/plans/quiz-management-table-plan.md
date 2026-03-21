# Quiz Management Table - Implementation Plan (UPDATED)

## Overview

Complete quiz management table with filters, CRUD operations, import/export, and bulk actions.

---

## Layout Structure

### Status Row
```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │   ALL    │ │PUBLISHED │ │  DRAFT   │ │  TRASH   │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                              [+ Add Question] [Import CSV] [Export CSV] │
└─────────────────────────────────────────────────────────────┘
```
**Status blocks left, action buttons right**

---

### Combined Filter Container
```
┌─────────────────────────────────────────────────────────────┐
│ Subject: [+ Add Subject]                                     │
│ [All] [📚 Animals ✏️ 🗑️] [📚 Science ✏️ 🗑️] ...           │
│                                                             │
│ Chapter: [+ Add Chapter]                                     │
│ [All] [Mammals ✏️ 🗑️] [Birds ✏️ 🗑️] ...                  │
│                                                             │
│ Level: [All] [Easy] [Medium] [Hard] [Expert] [Extreme]     │
│                                                             │
│ 🔍 Search: [________________________]                        │
│                                                             │
│ Selected: [Animals ×] [Easy ×]     [Reset All Filters]      │
└─────────────────────────────────────────────────────────────┘
```

**All filters in ONE container with Subject/Chapter CRUD icons**

---

### Table Columns (New Order)
```
┌───┬────┬───────────────────────────────────────────────┬───────────────┬───────────┬────────────┬────────────┬─────────┬────────┬──────────────────┐
│ ☑ │ #  │ Question                                      │ Options       │ Answer    │ Subject    │ Chapter   │ Level   │ Status │ ✏️ Edit  🗑️ Delete │
├───┼────┼───────────────────────────────────────────────┼───────────────┼───────────┼────────────┼───────────┼─────────┼────────┼──────────────────┤
│ ☐ │ 1  │ What is the capital of France?               │ A B C D      │ A. Paris  │ Animals    │ Mammals   │ Easy    │ Pub    │                   │
│ ☐ │ 2  │ Explain photosynthesis                        │ Open-ended   │ [text]    │ Science    │ Plants    │ Extreme │ Draft  │                   │
└───┴────┴───────────────────────────────────────────────┴───────────────┴───────────┴────────────┴──────────┴─────────┴────────┴──────────────────┘

Showing 1-10 of 45    [Prev] Page [ 1 ] of 5 [Next]
```

**Columns: Checkbox | # | Question | Options | Answer | Subject | Chapter | Level | Status | Edit/Delete below question**

---

### Bulk Actions Bar
```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Selected (2)    [Publish] [Draft] [Trash] [Delete]       │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Changes from Previous Plan

1. ✅ Action buttons (Add Question, Import, Export) moved to right side
2. ✅ All filters in single container
3. ✅ Subject/Chapter pills have ✏️ edit and 🗑️ delete icons
4. ✅ [+ Add Subject] and [+ Add Chapter] as text buttons
5. ✅ Question numbering per page (1-10 on page 1, 11-20 on page 2)
6. ✅ Actions column removed, Edit/Delete text buttons below question
7. ✅ Bulk select shows "Selected (N)" format
8. ✅ Table columns rearranged: Checkbox | # | Question | Options | Answer | Subject | Chapter | Level | Status

---

## Question Levels

| Level | Type | Options | Answer Format |
|-------|------|---------|---------------|
| easy | Multiple choice | 4 options (A-D) | Letter + Text |
| medium | Multiple choice | 4 options (A-D) | Letter + Text |
| hard | Multiple choice | 4 options (A-D) | Letter + Text |
| expert | Multiple choice | 4 options (A-D) | Letter + Text |
| extreme | Open-ended | None | Full text |

---

## CSV Format

### Export/Import Columns
```
question,option_a,option_b,option_c,option_d,correct_answer,level,chapter,subject,status
```

### Examples
```
# Multiple choice question
"What is the capital of France?","London","Paris","Berlin","Madrid","B","medium","Geography","General Knowledge","published"

# Open-ended question (extreme level)
"Explain the process of photosynthesis","","","","","Light energy is converted...","extreme","Biology","Science","draft"
```

### Rules
- `correct_answer`: For multiple choice - A, B, C, or D. For extreme - full text answer
- `level`: easy, medium, hard, expert, extreme
- `status`: published, draft (trash not allowed in import)
- `option_a/b/c/d`: Required for non-extreme, empty for extreme

---

## Features Implementation

### Phase 1: UI Structure

#### 1.1 Status Row Component
- **File**: `StatusFilter.tsx`
- Add action buttons above the 4 blocks
- Buttons: [+ Add Question], [Import CSV], [Export CSV]

#### 1.2 Filter Rows
- **Subject Row**: Pill buttons (A-Z) + [+ Add Subject] button
- **Chapter Row**: Pill buttons (A-Z) + [+ Add Chapter] button
- **Level Row**: Colored pills (All, Easy, Medium, Hard, Expert, Extreme)
- **Selected Filters Row**: Active filter chips with × buttons
- **Reset Button**: "Reset All Filters" when filters active

#### 1.3 Search Row
- Text input with search icon
- Placeholder: "Search questions..."

---

### Phase 2: Modals

#### 2.1 SubjectModal
```typescript
interface SubjectModalProps {
  mode: 'add' | 'edit';
  subject?: { id: string; name: string; emoji: string; category: string; slug: string };
  onSave: (data: { name: string; emoji: string; category: string }) => void;
  onClose: () => void;
}
```
**Fields**:
- Name (text input)
- Emoji (emoji picker or text input)
- Category (text input)
- Slug (auto-generated, hidden)

#### 2.2 ChapterModal
```typescript
interface ChapterModalProps {
  mode: 'add' | 'edit';
  chapter?: { id: string; name: string; subjectId: string };
  subjects: { id: string; name: string }[];
  onSave: (data: { name: string; subjectId: string }) => void;
  onClose: () => void;
}
```
**Fields**:
- Name (text input)
- Subject (dropdown select)

#### 2.3 QuestionModal
```typescript
interface QuestionModalProps {
  mode: 'add' | 'edit';
  question?: QuizQuestion;
  subjects: { slug: string; name: string }[];
  chapters: { id: string; name: string }[];
  onSave: (data: CreateQuestionDto | UpdateQuestionDto) => void;
  onClose: () => void;
}
```
**Fields (multiple choice - non-extreme levels)**:
- Question text (textarea)
- Option A, B, C, D (text inputs)
- Correct Answer (A/B/C/D radio or dropdown)
- Level (dropdown)
- Chapter (dropdown)
- Subject (dropdown)

**Fields (open-ended - extreme level)**:
- Question text (textarea)
- Correct Answer (single text input)
- Level (extreme selected)
- Chapter (dropdown)
- Subject (dropdown)

#### 2.4 ConfirmDialog
```typescript
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

### Phase 3: Table Enhancements

#### 3.1 Answer Column
- Format: "A. Answer text"
- For extreme: Full answer text (no letter)

#### 3.2 Options Column
- Display: "A B C D" or "A, B, C, D"
- Correct option highlighted with green background
- For extreme: Show "Open-ended" text

#### 3.3 Expandable Row (Optional - REMOVED)
- Not implementing expandable rows

#### 3.4 Date Columns (REMOVED)
- Not implementing date columns

---

### Phase 4: Pagination

```typescript
// Format: "Showing X-Y of Z    [Prev] Page [ input ] of N [Next]"
```

- Input field for page number (enterable)
- Previous / Next buttons
- 10 questions per page

---

### Phase 5: Bulk Actions

#### 5.1 Bulk Actions Bar
- Appears when at least one checkbox is selected
- Shows: "☐ X selected" + action buttons
- Actions: Publish, Draft, Trash, Delete

#### 5.2 Select All
- Checkbox in table header
- Selects all visible questions

---

### Phase 6: Import/Export

#### 6.1 Export CSV
```typescript
async function exportQuestionsToCSV(questions: QuizQuestion[]): Promise<void>
```
- Downloads CSV file
- Filename: `questions_export_YYYY-MM-DD.csv`

#### 6.2 Import CSV
```typescript
async function importQuestionsFromCSV(file: File): Promise<{ success: number; errors: string[] }>
```
- Parse CSV
- Validate each row
- Create questions in batch
- Return success count and error list

---

## API Endpoints

### Subjects
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /quiz/subjects | Create subject |
| PATCH | /quiz/subjects/:id | Update subject |
| DELETE | /quiz/subjects/:id | Delete subject |

### Chapters
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /quiz/chapters | Create chapter |
| PATCH | /quiz/chapters/:id | Update chapter |
| DELETE | /quiz/chapters/:id | Delete chapter |

### Questions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /quiz/questions | Create question |
| PATCH | /quiz/questions/:id | Update question |
| DELETE | /quiz/questions/:id | Delete question |
| POST | /quiz/questions/bulk | Bulk import |
| POST | /quiz/bulk-action | Bulk publish/draft/trash/delete |

---

## File Structure

```
apps/frontend/src/
├── app/admin/
│   ├── components/
│   │   ├── QuizMcqSection.tsx          # Main quiz section
│   │   └── components/
│   │       ├── SubjectModal.tsx        # Add/Edit subject
│   │       ├── ChapterModal.tsx        # Add/Edit chapter
│   │       ├── QuestionModal.tsx        # Add/Edit question
│   │       ├── ConfirmDialog.tsx        # Delete confirmation
│   │       └── index.ts
│   └── types/
│       └── index.ts                    # Type definitions
├── components/ui/
│   ├── quiz-filters/
│   │   ├── StatusFilter.tsx            # Updated with action buttons
│   │   ├── SubjectFilter.tsx           # With + Add button
│   │   ├── ChapterFilter.tsx           # With + Add button
│   │   ├── LevelFilter.tsx
│   │   ├── SelectedFilters.tsx         # NEW: Active filter chips
│   │   ├── SearchInput.tsx
│   │   ├── QuestionTable.tsx            # Updated columns
│   │   └── index.ts
│   └── ui/
│       └── Modal.tsx                   # Base modal component
└── lib/
    ├── quiz-api.ts                     # Updated with new endpoints
    └── utils/
        ├── csv.ts                      # CSV parse/stringify
        └── slug.ts                     # Slug generator
```

---

## Implementation Order

1. **Update StatusFilter.tsx** - Add action buttons above blocks
2. **Create SelectedFilters.tsx** - Active filter chips display
3. **Update SubjectFilter.tsx** - Add + button, sort A-Z
4. **Update ChapterFilter.tsx** - Add + button, sort A-Z
5. **Create Modal base component** - Reusable modal
6. **Create ConfirmDialog.tsx** - Delete confirmation
7. **Create SubjectModal.tsx** - Add/Edit subject
8. **Create ChapterModal.tsx** - Add/Edit chapter
9. **Create QuestionModal.tsx** - Add/Edit question
10. **Update QuestionTable.tsx** - Answer/Options columns, pagination
11. **Update quiz-api.ts** - New API functions
12. **Backend: Add missing endpoints** - Subject/Chapter CRUD
13. **Implement Export CSV** - Download questions
14. **Implement Import CSV** - Parse and import
15. **Implement Bulk Actions** - Publish/Draft/Trash/Delete
16. **Integrate all components** - QuizMcqSection assembly

---

## Status: ✅ COMPLETE

**Created**: 2026-03-21
**Last Updated**: 2026-03-21

## Implementation Progress

### Phase 1: UI Structure ✅
- [x] StatusFilter - Add action buttons above blocks
- [x] SelectedFilters - Active filter chips display
- [x] SubjectFilter - + Add button, sort A-Z
- [x] ChapterFilter - + Add button, sort A-Z

### Phase 2: Modals ✅
- [x] Modal base component
- [x] ConfirmDialog
- [x] SubjectModal
- [x] ChapterModal
- [x] QuestionModal

### Phase 3: Table Enhancements ✅
- [x] Answer column: "A. Answer Text" format
- [x] Options column: Show all 4 with correct highlighted
- [x] Pagination with enterable page number
- [x] Bulk actions bar

### Phase 4: API ✅
- [x] quiz-api.ts updated with CRUD functions
- [x] CSV export/import functions

### Phase 5: Integration ✅
- [x] QuizMcqSection integration

## Files Created
- `components/ui/Modal.tsx` - Base modal component
- `components/ui/ConfirmDialog.tsx` - Delete confirmation dialog
- `components/ui/quiz-filters/SelectedFilters.tsx` - Active filter chips
- `components/ui/quiz-filters/SubjectModal.tsx` - Add/Edit subject
- `components/ui/quiz-filters/ChapterModal.tsx` - Add/Edit chapter
- `components/ui/quiz-filters/QuestionModal.tsx` - Add/Edit question

## Files Modified
- `components/ui/quiz-filters/StatusFilter.tsx` - Added action buttons
- `components/ui/quiz-filters/SubjectFilter.tsx` - Added + button, A-Z sort
- `components/ui/quiz-filters/ChapterFilter.tsx` - Added + button, A-Z sort
- `components/ui/quiz-filters/QuestionTable.tsx` - New columns, pagination, bulk actions
- `lib/quiz-api.ts` - Added updateChapter, CSV export/import
- `app/admin/components/QuizMcqSection.tsx` - Full integration
