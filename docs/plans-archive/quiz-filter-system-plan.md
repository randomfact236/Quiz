# Quiz Filter System Implementation Plan

## Overview

Clean, scalable filter system for Quiz Management. Single API with database aggregation. URL-centric state management. No local state sync issues.

---

## Architecture

### Data Flow

```
User Action → Filter Component → useQuizFilters Hook → API Call → SQL Query → Display
                                    ↑
                                    └─ URL Params (Read/Write)
```

### URL Structure

```
/admin?section=quiz&subject=animals&chapter=Amphibians&level=expert&status=published&search=blood
```

**Order**: section → subject → chapter → level → status → search (broad → specific hierarchy)

---

## Design Decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | Buttons for all filters | Fast access, visual clarity |
| 2 | "All" as default | Clear starting point, total counts visible |
| 3 | Query params (GET) | RESTful, cacheable |
| 4 | Single API endpoint | Database aggregation, no memory load |
| 5 | URL = single source of truth | No state sync bugs |

---

## Implementation Phases

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
| 4 | `StatusFilter` | Uses existing StatusDashboard | ✅ URL integration done |
| 5 | `SearchInput` | Debounced text input | ✅ Done |
| 6 | `QuizFilterBar` | Integrated inline in QuizMcqSection | ✅ Done (inline) |

### Phase 3: API & Integration ✅ COMPLETE

| # | Task | Output | Status |
|---|------|--------|--------|
| 1 | Create single filter-counts endpoint | SQL GROUP BY aggregation | ✅ Done |
| 2 | Connect hook to API | Dynamic count updates | ✅ Counts passed to buttons |
| 3 | Add debounce | Smooth UX | ✅ Done |
| 4 | Add loading states | Visual feedback | ✅ Partial |
| 5 | URL write on filter change | Browser history support | ✅ Done |
| 6 | URL read on filter change | Sync URL to local state | ✅ Done |

---

## API Design

### Endpoint

```
GET /api/quiz/filter-counts?subject=animals&status=published&level=easy&chapter=ch1&search=test
```

### Response

```json
{
  "subjectCounts": [{ "slug": "animals", "count": 400 }],
  "chapterCounts": [{ "id": "ch1", "name": "Chapter 1", "count": 50 }],
  "levelCounts": [{ "level": "easy", "count": 100 }],
  "statusCounts": [{ "status": "published", "count": 350 }],
  "total": 400
}
```

---

## UI Layout (Current Implementation)

```
Subject: [All] [📚 Animals] [📚 Science] ...
Chapter: [All Chapters] [Amphibians] [Birds] ...
Level: [All Levels] [Easy] [Medium] [Hard] [Expert] [Extreme]
Status: [All] [Published] [Draft] [Trash]
🔍 Search questions...
```

### Filter Order
1. Subject
2. Chapter
3. Level
4. Status
5. Search

---

## Component Structure

```
QuizMcqSection (for ?section=quiz)
├── SubjectFilter ✅
│   └── Horizontal buttons with emoji
├── ChapterFilter ✅
│   └── Horizontal buttons with names
├── LevelFilter ✅
│   └── Horizontal buttons with colors
├── StatusFilter ✅
│   └── Horizontal buttons (All, Published, Draft, Trash)
└── SearchInput ✅
    └── Debounced text input
```

---

## Files Created

| Phase | File | Status |
|-------|------|--------|
| 1 | `useQuizFilters.ts` | ✅ Created |
| 2 | `LevelFilter.tsx` | ✅ Created |
| 2 | `ChapterFilter.tsx` | ✅ Created |
| 2 | `SubjectFilter.tsx` | ✅ Created |
| 2 | `StatusFilter.tsx` | ✅ Created |
| 2 | `SearchInput.tsx` | ✅ Created |
| 2 | `quiz-filters/index.ts` | ✅ Created |
| 1, 3 | `quiz-api.ts` | ✅ Updated |

## Files Modified

| Phase | File | Changes |
|-------|------|---------|
| 1 | `quiz.controller.ts` | Removed dead endpoints, added filter-counts |
| 1 | `quiz.service.ts` | Removed dead methods, added getFilterCounts |
| 2, 3 | `QuizMcqSection.tsx` | Quiz view for all subjects with pill filters |
| 2, 3 | `QuizManagementSection.tsx` | Individual subject quiz management (no filters for all-subjects) |
| 2, 3 | `SubjectFilter.tsx` | Added counts support |
| 2, 3 | `LevelFilter.tsx` | Uses counts prop for badges |
| 2, 3 | `ChapterFilter.tsx` | Uses counts prop for badges |
| 3 | `admin/page.tsx` | Added subjectCounts state, URL sync effect |
| 3 | `useQuizFilters.ts` | URL-based filter state hook |

---

## Pending Tasks

### High Priority Tasks
1. ✅ Refactor QuizMcqSection to follow single API endpoint architecture
2. ✅ Remove contradictory QuizSection code (local state, no API)
3. ✅ Pass filter counts to LevelFilter/ChapterFilter/SubjectFilter/StatusFilter buttons
4. ✅ StatusFilter component created with pill-style UI
5. ✅ Wire up filter-counts API response to filter components

### Low Priority (Optional - Not Started)
1. Extract QuizFilterBar to separate component
2. Add "active filter" indicators

---

## Implementation Approach

### Option A: Clean Slate First (COMPLETED)
- ✅ Remove ALL existing filter code
- ✅ Build fresh from scratch
- Pros: Clean, no legacy baggage

---

## Execution Order (COMPLETED)

1. ✅ Remove ALL existing filter code (backend + frontend)
2. ✅ Create `useQuizFilters` hook
3. ✅ Create filter UI components
4. ✅ Create single API endpoint
5. ✅ Connect all together
6. ✅ Test with large dataset (completed)

---

## Implementation Status

**Completed:** 95%
**Filter architecture fully implemented. Summary page shows "Coming Soon".**

**Architecture:**
- ✅ URL = single source of truth
- ✅ Single API endpoint (filter-counts)
- ✅ useQuizFilters hook
- ✅ Filter components (SubjectFilter, ChapterFilter, LevelFilter, StatusFilter, SearchInput)
- ✅ QuizMcqSection clean implementation
- ✅ Summary page = "Coming Soon" placeholder
- ✅ Old SummarySection removed from page.tsx
- ✅ Debug console.log removed

**Naming Convention:**
- Section `all-subjects` → `quiz`
- Section `dashboard` → `summary`
- Component `QuizMcqSection` for `?section=quiz`

**Last Updated:** 2026-03-21
