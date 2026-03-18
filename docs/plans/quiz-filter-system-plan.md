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
/admin/quiz?subject=animals&status=published&level=easy&chapter=chapter-1&search=blood
```

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

### Phase 1: Foundation

| # | Task | Output |
|---|------|--------|
| 1 | Remove dead backend code | Clean service, controller, API |
| 2 | Remove dead frontend code | Clean old filter components |
| 3 | Create `useQuizFilters` hook | URL read/write, no local state |

---

### Phase 2: UI Components

| # | Component | Description |
|---|-----------|-------------|
| 1 | `SubjectFilter` | Horizontal buttons with counts |
| 2 | `ChapterFilter` | Horizontal buttons with counts |
| 3 | `LevelFilter` | Horizontal buttons with counts |
| 4 | `StatusFilter` | Horizontal buttons with counts |
| 5 | `SearchInput` | Text input with debounce |
| 6 | `QuizFilterBar` | Container for all filters |

---

### Phase 3: API & Integration

| # | Task | Output |
|---|------|--------|
| 1 | Create single filter-counts endpoint | SQL GROUP BY aggregation |
| 2 | Connect hook to API | Dynamic count updates |
| 3 | Add debounce | Smooth UX |
| 4 | Add loading states | Visual feedback |
| 5 | URL write on filter change | Browser history support |

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
  "chapterCounts": [{ "id": "ch1", "count": 50 }],
  "levelCounts": [{ "level": "easy", "count": 100 }],
  "statusCounts": [{ "status": "published", "count": 350 }],
  "total": 400
}
```

---

## Component Structure

```
QuizFilterBar
├── SubjectFilter
│   ├── All (count)
│   ├── Animals (count)
│   └── ...
├── ChapterFilter
│   ├── All Chapters (count)
│   ├── Chapter 1 (count)
│   └── ...
├── LevelFilter
│   ├── All Levels (count)
│   ├── easy (count)
│   ├── medium (count)
│   └── ...
├── StatusFilter
│   ├── All (count)
│   ├── Published (count)
│   ├── Draft (count)
│   └── Trash (count)
└── SearchInput
    └── [___________]
```

---

## Files to Modify

| Phase | File | Changes |
|-------|------|---------|
| 1 | `quiz.service.ts` | Remove dead methods, fix aggregation |
| 1 | `quiz.controller.ts` | Remove dead endpoints |
| 1 | `quiz-api.ts` | Remove dead functions |
| 1 | `useQuizFilters.ts` | New hook |
| 2 | `QuizFilterBar.tsx` | New component |
| 2 | `SubjectFilter.tsx` | New component |
| 2 | `ChapterFilter.tsx` | New component |
| 2 | `LevelFilter.tsx` | New component |
| 2 | `StatusFilter.tsx` | New component |
| 2 | `SearchInput.tsx` | New component |
| 3 | `QuizManagementSection.tsx` | Integrate new filter bar |

---

## Implementation Approach

### Option A: Clean Slate First (SELECTED)
- Remove ALL existing filter code
- Build fresh from scratch
- Pros: Clean, no legacy baggage

---

## Execution Order

1. Remove ALL existing filter code (backend + frontend)
2. Create `useQuizFilters` hook
3. Create filter UI components
4. Create single API endpoint
5. Connect all together
6. Test with large dataset

---

## Last Updated

2026-03-18
