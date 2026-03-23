# QuizMcqSection - Comprehensive Analysis Document

## Version: 1.0
## Last Updated: 2026-03-23

---

## TABLE OF CONTENTS
1. [Component Overview](#component-overview)
2. [Features & Functions](#features--functions)
3. [User Interactions & Workflows](#user-interactions--workflows)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Component Hierarchy](#component-hierarchy)
6. [API Endpoints Used](#api-endpoints-used)
7. [State Management](#state-management)
8. [Cascading Filter Logic](#cascading-filter-logic)
9. [Missing/Incomplete Features](#missingincomplete-features)
10. [UI/UX Components](#uiux-components)
11. [Action Handlers Summary](#action-handlers-summary)

---

## COMPONENT OVERVIEW

### Main Component
- **File**: `apps/frontend/src/app/admin/components/QuizMcqSection.tsx`
- **Lines of Code**: 833
- **Purpose**: Enterprise-grade quiz management interface with hierarchical filtering, CRUD operations, bulk actions, and CSV import/export

### Key Characteristics
- URL-based state management (single source of truth)
- Cascading filter system (Subject → Chapter → Level → Status)
- Modal-based CRUD for subjects, chapters, and questions
- Bulk action support with confirmation dialogs
- CSV import with preview/warnings
- CSV export functionality
- Pagination with configurable page size

---

## FEATURES & FUNCTIONS

### 1. FILTER SYSTEM

#### 1.1 Status Dashboard
- **Component**: `StatusDashboard`
- **Features**:
  - 4 status cards: All, Published, Draft, Trash
  - Each card shows: count, percentage, progress bar
  - Animated entrance with staggered delay
  - Color-coded by status (blue/green/yellow/red)
  - Click to filter by status
  - Loading skeleton state
  - Error state with retry button

#### 1.2 Subject Filter
- **Component**: `SubjectFilter`
- **Features**:
  - "All" button with total count
  - Alphabetically sorted subject pills (A-Z)
  - Per-subject question count badge
  - Edit icon (Pencil) per subject
  - Delete icon (Trash2) per subject
  - Add Subject button
  - Blue color scheme
  - Active state highlighting

#### 1.3 Chapter Filter
- **Component**: `ChapterFilter`
- **Features**:
  - Cascades from selected Subject
  - "All" button with total count
  - Alphabetically sorted chapter pills (A-Z)
  - Per-chapter question count badge
  - Edit/Delete icons per chapter
  - Add Chapter button
  - Purple color scheme
  - Only shows chapters belonging to selected subject

#### 1.4 Level Filter
- **Component**: `LevelFilter`
- **Features**:
  - 5 levels: All Levels, Easy, Medium, Hard, Expert, Extreme
  - Per-level question count badge
  - Color-coded by level (green/blue/yellow/orange/red)
  - Single selection mode

#### 1.5 Search Input
- **Component**: `SearchInput`
- **Features**:
  - Debounced search (300ms)
  - Clear button (X)
  - Search icon
  - Searches question text
  - Auto-clears on escape key

#### 1.6 Selected Filters Display
- **Component**: `SelectedFilters`
- **Features**:
  - Shows active filter chips
  - Individual filter removal (X button)
  - "Reset All" link
  - Only shows when filters active

### 2. QUESTION TABLE

#### 2.1 Table Display
- **Component**: `QuestionTable`
- **Columns**:
  - Checkbox (select)
  - # (row number, per-page)
  - Question (with Edit/Delete links)
  - Options (A/B/C/D with correct highlighted)
  - Answer (correct letter + text)
  - Chapter
  - Level (colored badge)
  - Status (dropdown select)

#### 2.2 Bulk Selection
- Select all checkbox in header
- Individual row checkboxes
- Selection count display

#### 2.3 Inline Bulk Actions Bar (inside QuestionTable)
- **Shows when**: `selectedIds.size > 0`
- **Actions**: Publish, Draft, Trash, Delete
- **Implementation**: Uses same `handleBulkAction` function
- **Styling**: Blue background bar below header

#### 2.4 Inline Status Change
- Dropdown to change status directly
- Options: Pub, Draft, Trash
- Auto-saves on change

#### 2.5 Pagination
- Previous/Next buttons
- Page number input (editable)
- Total pages display
- "Showing X to Y of Z" text
- Disabled states for boundaries

#### 2.6 Empty State
- "No questions found" message
- "Try adjusting your filters" hint

### 3. CRUD OPERATIONS

#### 3.1 Subject Modal
- **Component**: `SubjectModal`
- **Fields**:
  - Name (required, text input)
  - Emoji (emoji picker grid, 15 options: 📚🧪🌍🔢📝🎨🎵🏃🍎🌱🔬💻🌐📖🧮)
  - Category (optional text input)
- **Modes**: Add / Edit
- **Auto-slug generation** on save (lowercase, hyphenated)

#### 3.2 Chapter Modal
- **Component**: `ChapterModal`
- **Fields**:
  - Subject (required dropdown)
  - Name (required text input)
- **Modes**: Add / Edit

#### 3.3 Question Modal
- **Component**: `QuestionModal`
- **Fields**:
  - Subject (required dropdown)
  - Chapter (required dropdown, filtered by subject)
  - Level (button group: Easy/Medium/Hard/Expert/Extreme)
  - Status (Draft/Published toggle)
  - Question (textarea)
  - Options (4 text inputs, only for non-extreme)
  - Correct Answer (radio for A/B/C/D)
  - Open-ended answer (textarea for extreme level)
- **Modes**: Add / Edit

#### 3.4 Delete Confirmation
- **Component**: `ConfirmDialog`
- **Features**:
  - Warning icon
  - Item name display
  - Cancel button
  - Delete button (red)
  - Variants: danger/warning/default

### 4. BULK ACTIONS

#### 4.1 Bulk Action Toolbar
- **Component**: `BulkActionToolbar`
- **Features**:
  - Selection count display
  - Context-aware action buttons
  - Confirmation modals for destructive actions
  - Select All / Deselect All toggle
  - Close button
  - Loading states
  - Mobile-responsive (fixed bottom)

#### 4.2 Available Bulk Actions (Context-Aware)
| Action | Label | Variant | Confirmation | Available In |
|--------|-------|---------|--------------|--------------|
| publish | Publish | primary (green) | No | all, draft, trash |
| draft | Move to Draft | secondary (gray) | No | all, published, trash |
| trash | Move to Trash | warning (yellow) | Yes | all, published, draft |
| delete | Delete Permanently | danger (red) | Yes | trash only |
| restore | Restore | primary (green) | No | trash only |

#### 4.3 Confirmation Modal
- Action-specific messaging
- Item count display
- Loading spinner during action
- Cancel/Confirm buttons

### 5. IMPORT/EXPORT

#### 5.1 Import Modal (Inline)
- **States**:
  - File upload (drag & drop zone)
  - Import preview (with warnings)
  - Loading state
  - Success state
  - Error state
- **Features**:
  - CSV format display
  - Preview shows: subject name, question count, warnings
  - Confirm/Cancel buttons
  - Auto-close on success (2.5s delay)

#### 5.2 Export Function
- Exports currently displayed questions
- Filters by selected subject
- CSV format

### 6. PAGE SIZE SELECTOR

- Options: 10, 25, 50 per page
- Dropdown select
- Persists in state
- Triggers data refetch on change

---

## USER INTERACTIONS & WORKFLOWS

### Workflow 1: Add New Question
1. Click "Add Question" button
2. Question modal opens
3. Select Subject → Chapter auto-populates
4. Select Level
5. Enter Question text
6. Enter Options (A, B, C, D) OR open-ended answer (if extreme)
7. Select Correct Answer
8. Click "Add Question"
9. Modal closes
10. Table refreshes with new question

### Workflow 2: Edit Question
1. Click "Edit" link below question row
2. Question modal opens with pre-filled data
3. Modify desired fields
4. Click "Save Changes"
5. Modal closes
6. Table refreshes

### Workflow 3: Delete Question
1. Click "Delete" link below question row
2. Confirmation dialog appears
3. Click "Delete" to confirm
4. Dialog closes
5. Question removed from table

### Workflow 4: Bulk Status Change
1. Check multiple questions via checkboxes
2. Bulk Action Toolbar appears at bottom
3. Click desired action (e.g., "Publish")
4. If confirmation required, modal appears
5. Click "Confirm"
6. Actions execute
7. Selection cleared
8. Table refreshes

### Workflow 5: Filter Questions
1. Click Status card (All/Pub/Draft/Trash)
2. Click Subject pill
3. Click Chapter pill (filtered by subject)
4. Click Level button
5. Enter search term
6. Active filters shown as chips
7. Click X on chip to remove filter
8. Click "Reset All" to clear all

### Workflow 6: Import CSV
1. Click "Import" button
2. Import modal opens
3. Drag/drop or click to upload CSV
4. Preview shows parsed data
5. Review warnings (if any)
6. Click "Confirm Import"
7. Questions added to database
8. Success message
9. Modal auto-closes
10. Table refreshes

### Workflow 7: Export Questions
1. Apply desired filters
2. Click "Export" button
3. CSV file downloads
4. File contains filtered questions

### Workflow 8: Add Subject
1. Click "Add Subject" in Subject filter
2. Subject modal opens
3. Enter Name, select Emoji, enter Category
4. Click "Add Subject"
5. Subject created with auto-generated slug
6. Subject filter refreshes

### Workflow 9: Edit Subject
1. Hover over subject pill
2. Click Pencil icon
3. Subject modal opens with data
4. Modify fields
5. Click "Save Changes"
6. Subject updated

### Workflow 10: Delete Subject
1. Hover over subject pill
2. Click Trash icon
3. Confirmation dialog appears
4. Click "Delete"
5. Subject and related data deleted
6. Filters reset

---

## DATA FLOW ARCHITECTURE

### URL as Single Source of Truth
```
URL: /admin?section=quiz&subject=science&chapter=Biology&level=easy&status=published&search=test
```

### Data Fetching Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                        INITIAL LOAD                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Component Mounts                                                │
│         ↓                                                           │
│  2. useEffect triggers (countParams, dataParams)                     │
│         ↓                                                           │
│  3. Parallel API calls:                                              │
│     ┌─────────────────┐    ┌─────────────────┐                       │
│     │ getFilterCounts│    │ getAllQuestions │                       │
│     │   (countParams)│    │  (dataParams)  │                       │
│     └────────┬────────┘    └────────┬────────┘                     │
│              │                       │                               │
│              ↓                       ↓                               │
│     ┌─────────────────┐    ┌─────────────────┐                       │
│     │  filterCounts   │    │    questions    │                       │
│     │    state        │    │     state       │                       │
│     └────────┬────────┘    └────────┬────────┘                     │
│              │                       │                               │
│              └───────────┬───────────┘                               │
│                          ↓                                           │
│              ┌─────────────────────┐                                 │
│              │   UI Renders        │                                 │
│              │   with Data         │                                 │
│              └─────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Filter → Query Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                      FILTER CHANGE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks filter (e.g., Subject = Science)                       │
│         ↓                                                           │
│  setFilter('subject', 'science') called                             │
│         ↓                                                           │
│  URL updated: ?subject=science                                      │
│         ↓                                                           │
│  useQuizFilters reads new URL params                                │
│         ↓                                                           │
│  countParams regenerated: { subject: 'science' }                    │
│  dataParams regenerated: { subject: 'science', status: 'published'}│
│         ↓                                                           │
│  useEffect dependencies change → re-fetch triggered                  │
│         ↓                                                           │
│  API calls with new params                                          │
│         ↓                                                           │
│  State updated → UI re-renders                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Creation Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    CREATE NEW ITEM                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ADD QUESTION EXAMPLE:                                               │
│                                                                     │
│  User fills QuestionModal form                                      │
│         ↓                                                           │
│  handleSaveQuestion(data) called                                    │
│         ↓                                                           │
│  createQuestion(data) API call                                      │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ POST /api/v1/quiz/questions             │                       │
│  │ Body: {                                 │                       │
│  │   question: "...",                      │                       │
│  │   options: ["A", "B", "C", "D"],       │                       │
│  │   correctAnswer: "B",                   │                       │
│  │   level: "easy",                        │                       │
│  │   chapterId: "uuid",                    │                       │
│  │   status: "draft"                       │                       │
│  │ }                                       │                       │
│  └─────────────────────────────────────────┘                       │
│         ↓                                                           │
│  Backend: validates → saves to DB → returns created question        │
│         ↓                                                           │
│  handleRefresh() called                                             │
│         ↓                                                           │
│  getFilterCounts() + getAllQuestions() refresh                      │
│         ↓                                                           │
│  Modal closes, Table shows new data                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Update Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    UPDATE EXISTING ITEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EDIT QUESTION EXAMPLE:                                              │
│                                                                     │
│  User clicks "Edit" on question row                                 │
│         ↓                                                           │
│  handleEditQuestion(question)                                       │
│         ↓                                                           │
│  questionModalMode = 'edit'                                         │
│  editingQuestion = question data                                    │
│  Modal opens with pre-filled form                                   │
│         ↓                                                           │
│  User modifies and submits                                          │
│         ↓                                                           │
│  handleSaveQuestion(data) called                                    │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ PATCH /api/v1/quiz/questions/:id        │                       │
│  │ Body: {                                 │                       │
│  │   question: "...",                      │                       │
│  │   status: "published",                  │                       │
│  │   ...updated fields                     │                       │
│  │ }                                       │                       │
│  └─────────────────────────────────────────┘                       │
│         ↓                                                           │
│  Backend: validates → updates DB → returns updated question        │
│         ↓                                                           │
│  handleRefresh() → refreshes table data                            │
│         ↓                                                           │
│  Modal closes, Table shows updated data                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Deletion Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    DELETE ITEM                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks "Delete" on item                                       │
│         ↓                                                           │
│  Confirmation dialog appears                                         │
│         ↓                                                           │
│  User confirms deletion                                             │
│         ↓                                                           │
│  handleConfirmDelete() called                                       │
│         ↓                                                           │
│  switch(deleteTarget.type):                                          │
│    case 'question': deleteQuestion(id)                              │
│    case 'chapter':  deleteChapter(id)                               │
│    case 'subject':  deleteSubject(id)                              │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ DELETE /api/v1/quiz/{type}s/:id         │                       │
│  └─────────────────────────────────────────┘                       │
│         ↓                                                           │
│  Backend: cascade deletes related data → returns success            │
│         ↓                                                           │
│  handleRefresh() + onSubjectsChange()                               │
│         ↓                                                           │
│  Dialog closes, Filters update, Table refreshes                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Bulk Action Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    BULK ACTION                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User selects multiple questions (checkboxes)                        │
│         ↓                                                           │
│  selectedIds state updated                                          │
│         ↓                                                           │
│  BulkActionToolbar appears (fixed bottom)                           │
│         ↓                                                           │
│  User clicks action (e.g., "Publish")                                │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ POST /api/v1/quiz/questions/bulk-action │                       │
│  │ Body: {                                 │                       │
│  │   ids: ["uuid1", "uuid2", ...],        │                       │
│  │   action: "publish"                      │                       │
│  │ }                                       │                       │
│  └─────────────────────────────────────────┘                       │
│         ↓                                                           │
│  Backend: validates → batch updates → returns result                 │
│         ↓                                                           │
│  selectedIds cleared                                                │
│  handleRefresh() called                                            │
│         ↓                                                           │
│  Toolbar closes, Table shows updated statuses                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Import CSV Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    CSV IMPORT                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 1: FILE UPLOAD                                                │
│  User uploads CSV file                                              │
│         ↓                                                           │
│  handleFileUpload(file) reads file                                  │
│         ↓                                                           │
│  importQuestionsFromCSV(content, allSubjects)                       │
│         ↓                                                           │
│  Parser validates CSV structure                                      │
│         ↓                                                           │
│  If errors → show error state                                       │
│  If success → show preview                                          │
│         ↓                                                           │
│  STEP 2: PREVIEW                                                    │
│  importPreview state populated:                                       │
│  { subjectName, questionCount, errors, warnings }                    │
│         ↓                                                           │
│  User reviews warnings (if any)                                     │
│         ↓                                                           │
│  STEP 3: CONFIRM                                                    │
│  handleConfirmImport() called                                       │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ importQuestionsFromCSV re-parses         │                       │
│  │ Creates questions in database            │                       │
│  └─────────────────────────────────────────┘                       │
│         ↓                                                           │
│  onSubjectsChange() → parent refreshes subjects list                 │
│  handleRefresh() → refreshes filter counts + questions              │
│         ↓                                                           │
│  Success message, Modal auto-closes (2.5s)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Export CSV Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    CSV EXPORT                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks "Export" button                                        │
│         ↓                                                           │
│  Current filters applied (filters.subject, etc.)                     │
│         ↓                                                           │
│  exportQuestionsToCSV(questions, filters.subject)                    │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ Client-side CSV generation:              │                       │
│  │ - Headers: Subject, Chapter, Question,   │                       │
│  │   Option A, Option B, Option C,         │                       │
│  │   Option D, Correct Answer, Level       │                       │
│  │ - Rows: each question as CSV row        │                       │
│  └─────────────────────────────────────────┘                       │
│         ↓                                                           │
│  Browser downloads file                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Filter State Flow
```
1. User clicks filter → setFilter(key, value)
2. setFilter updates URL via router.push
3. useQuizFilters hook reads URL params
4. Component re-renders with new filters
5. useEffect triggers data fetch
6. API called with new params
7. Data updated in state
8. UI reflects new data
```

### Cascading Logic
```
Subject changes → Chapter filter resets to "all"
Chapter exists in new subject? → Keep selection
Chapter doesn't exist in new subject → Reset to "all"
```

---

## DATA WORKFLOW SUMMARY

### API Request/Response Pattern
| Operation | Method | Endpoint | Response |
|-----------|--------|----------|----------|
| Get Counts | GET | `/quiz/filter-counts` | `{subjectCounts, chapterCounts, levelCounts, statusCounts}` |
| Get Questions | GET | `/quiz/questions?subject=X&status=Y...` | `{data: Question[], total}` |
| Create Subject | POST | `/quiz/subjects` | Created Subject object |
| Update Subject | PUT | `/quiz/subjects/:id` | Updated Subject object |
| Delete Subject | DELETE | `/quiz/subjects/:id` | `{message}` |
| Create Chapter | POST | `/quiz/chapters` | Created Chapter object |
| Update Chapter | PUT | `/quiz/chapters/:id` | Updated Chapter object |
| Delete Chapter | DELETE | `/quiz/chapters/:id` | `{message}` |
| Create Question | POST | `/quiz/questions` | Created Question object |
| Update Question | PATCH | `/quiz/questions/:id` | Updated Question object |
| Delete Question | DELETE | `/quiz/questions/:id` | `{message}` |
| Bulk Action | POST | `/quiz/questions/bulk-action` | `{success, affectedCount}` |

---

## COMPONENT HIERARCHY

```
QuizMcqSection (Main)
├── Action Buttons Row
│   ├── Add Question Button
│   ├── Import Button
│   └── Export Button
├── StatusDashboard
├── Filter Container
│   ├── SubjectFilter
│   ├── ChapterFilter
│   ├── LevelFilter (wrapper with label)
│   ├── SearchInput
│   └── SelectedFilters
├── Page Size Selector
├── QuestionTable
│   ├── Bulk Actions Bar (conditional)
│   ├── Table Header
│   ├── Table Body (question rows)
│   │   └── Edit/Delete links
│   └── Pagination
├── BulkActionToolbar
├── SubjectModal
├── ChapterModal
├── QuestionModal
├── ConfirmDialog
└── Import Modal (inline)
```

---

## API ENDPOINTS USED

### From quiz-api.ts

| Function | Endpoint | Method | Auth |
|----------|----------|--------|------|
| `getFilterCounts` | `/quiz/filter-counts` | GET | No |
| `getAllQuestions` | `/quiz/questions` | GET | Yes |
| `createSubject` | `/quiz/subjects` | POST | Yes |
| `updateSubject` | `/quiz/subjects/:id` | PUT | Yes |
| `deleteSubject` | `/quiz/subjects/:id` | DELETE | Yes |
| `createChapter` | `/quiz/chapters` | POST | Yes |
| `updateChapter` | `/quiz/chapters/:id` | PUT | Yes |
| `deleteChapter` | `/quiz/chapters/:id` | DELETE | Yes |
| `createQuestion` | `/quiz/questions` | POST | Yes |
| `updateQuestion` | `/quiz/questions/:id` | PATCH | Yes |
| `deleteQuestion` | `/quiz/questions/:id` | DELETE | Yes |
| `bulkActionQuestions` | `/quiz/questions/bulk-action` | POST | Yes |
| `exportQuestionsToCSV` | (client-side) | - | - |
| `importQuestionsFromCSV` | (client-side) | - | - |

---

## STATE MANAGEMENT

### Local State Variables

```typescript
// Filter Counts
filterCounts: FilterCountsResponse | null

// Questions Data
questions: QuizQuestion[]
totalQuestions: number
currentPage: number
pageSize: number
isLoading: boolean

// Modal States
subjectModalOpen: boolean
chapterModalOpen: boolean
questionModalOpen: boolean
deleteConfirmOpen: boolean

// Modal Modes & Editing Data
subjectModalMode: 'add' | 'edit'
chapterModalMode: 'add' | 'edit'
questionModalMode: 'add' | 'edit'
editingSubject: {...} | null
editingChapter: {...} | null
editingQuestion: QuizQuestion | null

// Delete State
deleteTarget: { type, id, name } | null

// Bulk Selection
selectedIds: string[]
bulkActionLoading: boolean

// Import State
showImportModal: boolean
importPreview: {...} | null
importLoading: boolean
importError: string
importSuccess: string
lastImportContent: string
```

### URL State (via useQuizFilters)
```typescript
filters: {
  subject: string    // 'all' or slug
  chapter: string    // 'all' or name
  level: string      // 'all' or level name
  status: string     // 'all', 'published', 'draft', 'trash'
  search: string     // search query
}
```

---

## CASCADING FILTER LOGIC

### Hierarchy: Subject → Chapter → Level → Status

### Rules

1. **Subject Counts**: No filters applied (always show totals for all subjects)

2. **Chapter Counts**: Subject filter only
   - When subject changes, chapter counts update to reflect selected subject

3. **Level Counts**: Subject + Chapter filters
   - Shows counts filtered by selected subject AND chapter

4. **Status Counts**: Subject + Chapter + Level filters
   - Shows counts filtered by subject, chapter, AND level

### countParams (for API) - Excludes status
```typescript
{
  subject?: string,
  chapter?: string,
  search?: string
}
```

### dataParams (for Questions API) - Includes status
```typescript
{
  subject?: string,
  chapter?: string,
  level?: string,
  status?: string,
  search?: string
}
```

### Chapter Reset Logic
When subject changes:
1. Check if current chapter belongs to new subject
2. If not → set chapter to 'all'
3. If yes → keep chapter selection

---

## MISSING/INCOMPLETE FEATURES

### 1. Subject Selection Dropdown in QuestionModal
- **Status**: Uses filtered chapters based on subject
- **Issue**: Chapters don't filter when subject changes in modal (uses `subjectId` not `chapterId`)

### 2. Drag-and-Drop Reordering
- **Status**: NOT IMPLEMENTED
- **Planned**: Reorder subjects/chapters within Quiz section
- **Note**: Should NOT affect admin sidebar navigation

### 3. Level Filter in API calls
- **Status**: Partially implemented
- **Issue**: `countParams` excludes level, but `dataParams` includes it

### 4. Status Dashboard for Published/Draft/Trash counts
- **Status**: Uses aggregate from API
- **Issue**: `statusCounts.find(s => s.status === 'all')` may not exist

### 5. Error Handling in Modals
- **Status**: Basic error logging only
- **Issue**: User doesn't see specific error messages from API

### 6. Empty States
- **QuestionTable**: Has empty state
- **SubjectFilter**: Missing "no subjects" empty state
- **ChapterFilter**: Missing "no chapters" empty state

### 7. Validation
- **SubjectModal**: Name required, but no slug validation
- **ChapterModal**: Name and Subject required
- **QuestionModal**: Question and Chapter required, but limited validation

---

## UI/UX COMPONENTS

### Styling
- Tailwind CSS classes
- Dark mode support (partial)
- Responsive design
- Animation: Framer Motion for StatusDashboard and BulkActionToolbar

### Color Scheme
- Status: Blue (All), Green (Published), Yellow (Draft), Red (Trash)
- Subject: Blue
- Chapter: Purple
- Level: Green/Blue/Yellow/Orange/Red
- Actions: Blue primary

### Icons
- Lucide React icons throughout
- Consistent 16px/20px sizing

### Accessibility
- ARIA labels on buttons
- Focus states
- Keyboard navigation (partial)
- Screen reader text

---

## ACTION HANDLERS SUMMARY

### Filter Handlers
| Handler | Purpose |
|---------|---------|
| `setFilter(key, value)` | Updates URL params, triggers refetch |
| `resetFilters()` | Resets all filters to defaults |

### Fetch Handlers
| Handler | Purpose |
|---------|---------|
| `fetchCounts()` | Gets filter counts from API |
| `fetchQuestionsData()` | Gets paginated questions from API |
| `handleRefresh()` | Refreshes both counts and questions |

### Page Handlers
| Handler | Purpose |
|---------|---------|
| `handlePageChange(page)` | Changes current page, scrolls to top |
| `handleFileChange(e)` | Handles file input for import |

### CRUD Handlers
| Handler | Purpose |
|---------|---------|
| `handleAddSubject()` | Opens subject modal in add mode |
| `handleEditSubject(subject)` | Opens subject modal in edit mode |
| `handleDeleteSubject(subject)` | Opens delete confirmation |
| `handleSaveSubject(data)` | Creates or updates subject |
| `handleAddChapter()` | Opens chapter modal in add mode |
| `handleEditChapter(chapter)` | Opens chapter modal in edit mode |
| `handleDeleteChapter(chapter)` | Opens delete confirmation |
| `handleSaveChapter(data)` | Creates or updates chapter |
| `handleAddQuestion()` | Opens question modal in add mode |
| `handleEditQuestion(question)` | Opens question modal in edit mode |
| `handleDeleteQuestion(question)` | Opens delete confirmation |
| `handleSaveQuestion(data)` | Creates or updates question |
| `handleConfirmDelete()` | Executes delete for subject/chapter/question |

### Bulk Action Handlers
| Handler | Purpose |
|---------|---------|
| `handleBulkAction(action)` | Executes bulk action on selected IDs |

### Import/Export Handlers
| Handler | Purpose |
|---------|---------|
| `handleImportClick()` | Opens import modal |
| `handleFileUpload(file)` | Parses and previews CSV |
| `handleConfirmImport()` | Executes actual import |
| `handleExport()` | Downloads questions as CSV |

---

## FILE DEPENDENCIES

### Imports from quiz-api.ts
```typescript
getFilterCounts, 
getAllQuestions, 
createSubject,
createChapter,
createQuestion,
updateSubject,
updateChapter,
updateQuestion,
deleteSubject,
deleteChapter,
deleteQuestion,
exportQuestionsToCSV,
bulkActionQuestions
```

### Imports from quiz-importer.ts
```typescript
importQuestionsFromCSV
```

### Imports from @/components/ui/quiz-filters
```typescript
SubjectFilter,
ChapterFilter,
LevelFilter,
SearchInput,
QuestionTable,
SelectedFilters,
SubjectModal,
ChapterModal,
QuestionModal
```

### Imports from @/components/ui
```typescript
StatusDashboard,
ConfirmDialog,
BulkActionToolbar
```

### Imports from @/lib
```typescript
useQuizFilters (from @/lib/useQuizFilters)
```

---

## VERIFICATION CHECKLIST

### Core Features
- [x] URL-based filtering
- [x] Status dashboard with 4 cards
- [x] Subject filter with CRUD
- [x] Chapter filter with CRUD
- [x] Level filter
- [x] Search input with debounce
- [x] Selected filters display
- [x] Question table with pagination
- [x] Bulk selection
- [x] Bulk actions (publish, draft, trash, delete)
- [x] Question CRUD modals
- [x] Subject CRUD modals
- [x] Chapter CRUD modals
- [x] Delete confirmation
- [x] CSV import with preview
- [x] CSV export
- [x] Page size selector
- [x] Cascading filters
- [x] Loading states
- [x] Error handling

### Not Implemented
- [ ] Drag-and-drop reordering
- [ ] Dark mode support (partial)
- [ ] Empty states for filters
- [ ] Detailed error messages
- [ ] Form validation feedback

---

*Document generated by comprehensive code analysis*
