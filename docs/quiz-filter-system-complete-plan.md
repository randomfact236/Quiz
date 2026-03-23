# Quiz Filter System - Complete Implementation Plan

## Version: 2.0 (Consolidated)
## Last Updated: 2026-03-23
## Replaces: quiz-filter-system-plan.md, hierarchical-filter-implementation.md, filter-system-issues-tracker.md, filter-system-fixes-applied.md, quiz-management-table-plan.md

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [URL Structure](#url-structure)
4. [Design Decisions](#design-decisions)
5. [Data Flow](#data-flow)
6. [API Design](#api-design)
7. [UI Layout](#ui-layout)
8. [Component Structure](#component-structure)
9. [Cascading Filter Logic](#cascading-filter-logic)
10. [Fixes Applied](#fixes-applied)
11. [Issues Tracker (Historical)](#issues-tracker-historical)
12. [Implementation Phases](#implementation-phases)
13. [Files Reference](#files-reference)
14. [Pending Enhancements](#pending-enhancements)

---

## OVERVIEW

A clean, scalable filter system for Quiz Management with:
- Single API endpoint with database aggregation
- URL-centric state management (single source of truth)
- No local state sync issues
- Hierarchical cascading filters (Subject → Chapter → Level → Status)
- Full CRUD operations for subjects, chapters, and questions
- CSV import/export functionality
- Bulk actions with confirmation dialogs

---

## ARCHITECTURE

### Data Flow

```
User Action → Filter Component → useQuizFilters Hook → API Call → SQL Query → Display
                                      ↑
                                      └─ URL Params (Read/Write)
```

### URL as Single Source of Truth

```
/admin?section=quiz&subject=animals&chapter=Amphibians&level=expert&status=published&search=blood
```

**Order**: section → subject → chapter → level → status → search (broad → specific hierarchy)

---

## DESIGN DECISIONS

| # | Decision | Reason |
|---|----------|--------|
| 1 | Buttons for all filters | Fast access, visual clarity |
| 2 | "All" as default | Clear starting point, total counts visible |
| 3 | Query params (GET) | RESTful, cacheable |
| 4 | Single API endpoint | Database aggregation, no memory load |
| 5 | URL = single source of truth | No state sync bugs |
| 6 | Separate countParams from dataParams | Counts show totals, data shows filtered |

---

## DATA FLOW

### Backend Service → API Response → Frontend Display

```
Database → Backend Service → API Response → Frontend Display
     ↑              ↑              ↑              ↑
   Natural    Add subjectId    Cacheable    Hierarchical
   Query       to chapters       (Redis)     Filtering
```

### Count vs Data Parameters

Two separate parameter objects prevent status filtering on counts:

```typescript
// countParams: Excludes status (shows ALL counts for status blocks)
const countParams = {
  subject: filters.subject,
  chapter: filters.chapter,
  level: filters.level,
  search: filters.search
};

// dataParams: Includes ALL filters (for table data)
const dataParams = {
  subject: filters.subject,
  chapter: filters.chapter,
  level: filters.level,
  status: filters.status,
  search: filters.search
};
```

---

## API DESIGN

### Endpoint

```
GET /api/quiz/filter-counts?subject=animals&status=published&level=easy&chapter=ch1&search=test
```

### Response Structure

```json
{
  "subjectCounts": [
    { "slug": "animals", "count": 400 }
  ],
  "chapterCounts": [
    { "id": "ch1", "name": "Chapter 1", "count": 50, "subjectId": "sub1", "subjectSlug": "animals" }
  ],
  "levelCounts": [
    { "level": "easy", "count": 100 }
  ],
  "statusCounts": [
    { "status": "published", "count": 350 }
  ],
  "total": 400
}
```

### TypeScript Interface

```typescript
export interface FilterCountsResponse {
  subjectCounts: { slug: string; count: number }[];
  chapterCounts: { 
    id: string; 
    name: string; 
    count: number; 
    subjectId: string;
    subjectSlug: string;
  }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}
```

---

## UI LAYOUT

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

### Status Row

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │   ALL    │ │PUBLISHED │ │  DRAFT   │ │  TRASH   │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                              [+ Add Question] [Import CSV] [Export CSV] │
└─────────────────────────────────────────────────────────────┘
```

### Table Columns

```
┌───┬────┬───────────────────────────────────────────────┬───────────────┬───────────┬────────────┬────────────┬─────────┬────────┬──────────────────┐
│ ☑ │ #  │ Question                                      │ Options       │ Answer    │ Subject    │ Chapter   │ Level   │ Status │ ✏️ Edit  🗑️ Delete │
├───┼────┼───────────────────────────────────────────────┼───────────────┼───────────┼────────────┼───────────┼─────────┼────────┼──────────────────┤
│ ☐ │ 1  │ What is the capital of France?               │ A B C D      │ A. Paris  │ Animals    │ Mammals   │ Easy    │ Pub    │                   │
│ ☐ │ 2  │ Explain photosynthesis                        │ Open-ended   │ [text]    │ Science    │ Plants    │ Extreme │ Draft  │                   │
└───┴────┴───────────────────────────────────────────────┴───────────────┴───────────┴────────────┴──────────┴─────────┴────────┴──────────────────┘

Showing 1-10 of 45    [Prev] Page [ 1 ] of 5 [Next]
```

### Bulk Actions Bar

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Selected (2)    [Publish] [Draft] [Trash] [Delete]       │
└─────────────────────────────────────────────────────────────┘
```

---

## COMPONENT STRUCTURE

```
QuizMcqSection (Main Component)
├── Action Buttons Row
│   ├── [+ Add Question]
│   ├── [Import CSV]
│   └── [Export CSV]
├── StatusDashboard
│   ├── All (count, percentage, progress bar)
│   ├── Published (count, percentage, progress bar)
│   ├── Draft (count, percentage, progress bar)
│   └── Trash (count, percentage, progress bar)
├── Combined Filter Container
│   ├── SubjectFilter
│   │   ├── [All] pill with total count
│   │   ├── [📚 SubjectName ✏️ 🗑️] pills per subject
│   │   └── [+ Add Subject] button
│   ├── ChapterFilter
│   │   ├── [All] pill with total count
│   │   ├── [ChapterName ✏️ 🗑️] pills per chapter
│   │   └── [+ Add Chapter] button
│   ├── LevelFilter
│   │   └── [All] [Easy] [Medium] [Hard] [Expert] [Extreme]
│   ├── SearchInput (debounced 300ms)
│   └── SelectedFilters (active filter chips)
├── Page Size Selector (10/25/50)
├── QuestionTable
│   ├── Bulk Actions Bar (conditional)
│   ├── Table Header
│   ├── Table Body (question rows)
│   │   ├── Checkbox
│   │   ├── # (per-page number)
│   │   ├── Question (with Edit/Delete links)
│   │   ├── Options (A/B/C/D highlighted)
│   │   ├── Answer (correct letter + text)
│   │   ├── Chapter
│   │   ├── Level (colored badge)
│   │   └── Status (dropdown select)
│   └── Pagination (Prev/Next/Page Input)
├── BulkActionToolbar
│   ├── Selection count
│   ├── Action buttons (Publish/Draft/Trash/Delete/Restore)
│   ├── Select All/Deselect All
│   └── Confirmation Modal
├── SubjectModal (Add/Edit)
├── ChapterModal (Add/Edit)
├── QuestionModal (Add/Edit)
├── ConfirmDialog (Delete confirmation)
└── Import Modal (CSV import with preview)
```

---

## CASCADING FILTER LOGIC

### Hierarchy Rules

| Filter | Shows | Filtered By |
|--------|-------|-------------|
| Subject | All subjects with counts | None (root level) |
| Chapter | Chapters | Selected subject |
| Level | All 5 levels | Selected subject + chapter |
| Status | All 4 statuses | Selected subject + chapter + level |

### Parent-Only Cascading Rule

```typescript
// Subject counts: No filters applied (always show totals for ALL subjects)
// Chapter counts: Subject filter only
// Level counts: Subject + Chapter filters
// Status counts: Subject + Chapter + Level filters
```

### Visible Chapters Logic

```typescript
const visibleChapters = useMemo(() => {
  if (filters.subject === 'all') return chapterList;
  
  const selectedSubject = subjectsWithIds.find(s => s.slug === filters.subject);
  if (!selectedSubject) return chapterList;
  
  return chapterList.filter(ch => ch.subjectId === selectedSubject.id);
}, [chapterList, filters.subject, subjectsWithIds]);
```

### Chapter Auto-Reset on Subject Change

```typescript
// When subject changes and selected chapter not in new subject
useEffect(() => {
  if (filters.subject !== 'all' && filters.chapter !== 'all') {
    const selectedSubject = subjectsWithIds.find(s => s.slug === filters.subject);
    const chapterExists = chapterList.find(
      ch => ch.name === filters.chapter && ch.subjectId === selectedSubject?.id
    );
    
    if (!chapterExists) {
      setFilter('chapter', 'all');
    }
  }
}, [filters.subject, filters.chapter, chapterList, subjectsWithIds, setFilter]);
```

---

## FIXES APPLIED

### 1. Separate Count vs Data Parameters (CRITICAL)

**Problem**: Using same params for counts and data caused counts to be filtered by status

**Solution**: Created two separate parameter objects:
- `countParams`: Excludes status filter (shows ALL counts)
- `dataParams`: Includes ALL filters (for table data)

### 2. Chapter Counts Missing subjectId

**Problem**: ChapterFilter not receiving subjectId for cascading

**Solution**: Updated chapterCounts to include subjectId and subjectSlug:
```typescript
chapterCounts: { 
  id: string; 
  name: string; 
  count: number; 
  subjectId: string;      // ✅ Added
  subjectSlug: string;    // ✅ Added
}[]
```

### 3. Cascading Filters (Subject → Chapter)

**Problem**: All chapters shown regardless of selected subject

**Solution**: Added visibleChapters with filtering logic

### 4. Subject Counts Based on API Data

**Problem**: subjectsWithIds merging props with API data caused inconsistencies

**Solution**: Build subjects list directly from API counts:
```typescript
const subjectsWithIds = useMemo(() => {
  return subjectCounts.map(sc => {
    const subject = allSubjects.find(s => s.slug === sc.slug);
    return { 
      id: subject?.id || '',
      slug: sc.slug, 
      name: subject?.name || sc.slug, 
      emoji: subject?.emoji || '📚', 
      category: subject?.category || 'academic',
      count: sc.count 
    };
  });
}, [subjectCounts, allSubjects]);
```

### 5. CRUD Refresh Issues

**Problem**: Created subjects/chapters not appearing instantly

**Solution**: 
- Call `handleRefresh()` after CRUD operations
- Call `onSubjectsChange()` to refresh parent state

---

## ISSUES TRACKER (HISTORICAL)

### Issues Found During Development (NOW FIXED)

| # | Issue | Status |
|---|-------|--------|
| 1 | Subject counts disappear when selected | ✅ Fixed |
| 2 | Chapter counts not showing | ✅ Fixed |
| 3 | Level counts disappear when selected | ✅ Fixed |
| 4 | Status counts show 0 for unselected | ✅ Fixed |
| 5 | Chapter creation fails | ✅ Fixed |
| 6 | CRUD not refreshing instantly | ✅ Fixed |
| 7 | Cascading not working (Subject → Chapter) | ✅ Fixed |
| 8 | Table filtering by status | ✅ Working |

### Debug Checklist (For Future Reference)

#### Phase 1: Data Flow Verification
- [ ] Verify API returns correct counts for each filter type
- [ ] Check if frontend receiving and storing counts correctly
- [ ] Verify countParams vs dataParams separation

#### Phase 2: Component State Debug
- [ ] Check SubjectFilter props (counts being passed?)
- [ ] Check ChapterFilter props (counts being passed?)
- [ ] Check LevelFilter props (counts being passed?)

#### Phase 3: CRUD Operations Debug
- [ ] Test subject creation API call
- [ ] Test chapter creation API call
- [ ] Verify onRefreshSubjects callback

#### Phase 4: Cascading Logic Debug
- [ ] Verify visibleChapters useMemo logic
- [ ] Check visibleLevelCounts calculation
- [ ] Review filterParams vs countParams usage

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation ✅ COMPLETE

| # | Task | Output | Status |
|---|------|--------|--------|
| 1 | Remove dead backend code | Clean service, controller, API | ✅ Done |
| 2 | Remove dead frontend code | Clean old filter components | ✅ Done |
| 3 | Create `useQuizFilters` hook | URL read/write, no local state | ✅ Done |

### Phase 2: UI Components ✅ COMPLETE

| # | Component | Description | Status |
|---|-----------|-------------|--------|
| 1 | `SubjectFilter` | Horizontal buttons with emoji and counts | ✅ Done |
| 2 | `ChapterFilter` | Horizontal buttons with chapter names and counts | ✅ Done |
| 3 | `LevelFilter` | Horizontal buttons with level colors and counts | ✅ Done |
| 4 | `StatusDashboard` | 4 blocks with progress bars | ✅ Done |
| 5 | `SearchInput` | Debounced text input | ✅ Done |
| 6 | `QuizMcqSection` | Integrated inline | ✅ Done |

### Phase 3: API & Integration ✅ COMPLETE

| # | Task | Output | Status |
|---|------|--------|--------|
| 1 | Create single filter-counts endpoint | SQL GROUP BY aggregation | ✅ Done |
| 2 | Connect hook to API | Dynamic count updates | ✅ Done |
| 3 | Add debounce | Smooth UX | ✅ Done |
| 4 | URL write on filter change | Browser history support | ✅ Done |
| 5 | URL read on filter change | Sync URL to local state | ✅ Done |

### Phase 4: CRUD Operations ✅ COMPLETE

| # | Feature | Status |
|---|---------|--------|
| 1 | Subject CRUD (Add/Edit/Delete) | ✅ Done |
| 2 | Chapter CRUD (Add/Edit/Delete) | ✅ Done |
| 3 | Question CRUD (Add/Edit/Delete) | ✅ Done |
| 4 | Confirmation dialogs | ✅ Done |

### Phase 5: Import/Export ✅ COMPLETE

| # | Feature | Status |
|---|---------|--------|
| 1 | CSV Export | ✅ Done |
| 2 | CSV Import with preview | ✅ Done |
| 3 | Import warnings | ✅ Done |

### Phase 6: Production Scale ⏳ PENDING

See `phase-6-7-implementation-plan.md` for:
- Database Indexing
- Redis Caching

---

## FILES REFERENCE

### Frontend Components

| File | Purpose |
|------|---------|
| `QuizMcqSection.tsx` | Main quiz management component |
| `SubjectFilter.tsx` | Subject pill buttons with CRUD |
| `ChapterFilter.tsx` | Chapter pill buttons with CRUD |
| `LevelFilter.tsx` | Level colored buttons |
| `SearchInput.tsx` | Debounced search |
| `SelectedFilters.tsx` | Active filter chips |
| `QuestionTable.tsx` | Table with pagination |
| `StatusDashboard.tsx` | 4-block status display |
| `BulkActionToolbar.tsx` | Bulk action buttons |
| `SubjectModal.tsx` | Add/Edit subject |
| `ChapterModal.tsx` | Add/Edit chapter |
| `QuestionModal.tsx` | Add/Edit question |
| `ConfirmDialog.tsx` | Delete confirmation |
| `useQuizFilters.ts` | URL-based filter state |

### Backend Files

| File | Purpose |
|------|---------|
| `quiz.service.ts` | Business logic + getFilterCounts |
| `quiz.controller.ts` | API endpoints |
| `question.entity.ts` | Question database model |
| `chapter.entity.ts` | Chapter database model |
| `subject.entity.ts` | Subject database model |

---

## PENDING ENHANCEMENTS

### High Priority
1. **Database Indexing** - For 50K+ questions
2. **Redis Caching** - filter-counts endpoint
3. **Chapter Slug/UUID** - Rename-proof routing

### Medium Priority
1. Drag-and-drop reordering (subjects/chapters)
2. Form validation feedback
3. Detailed error messages in modals

### Low Priority
1. Extract QuizFilterBar to separate component
2. Add "active filter" indicators
3. Real-time count updates (WebSocket)

---

## QUESTION LEVELS

| Level | Type | Options | Answer Format |
|-------|------|---------|---------------|
| easy | Multiple choice | 4 options (A-D) | Letter + Text |
| medium | Multiple choice | 4 options (A-D) | Letter + Text |
| hard | Multiple choice | 4 options (A-D) | Letter + Text |
| expert | Multiple choice | 4 options (A-D) | Letter + Text |
| extreme | Open-ended | None | Full text |

---

## CSV FORMAT

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

*Consolidated from multiple plan files on 2026-03-23*
