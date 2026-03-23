# Quiz Question Management - "All Subjects" Feature Implementation Plan

## Overview

Add ability to view and manage questions from ALL subjects combined in Quiz Question Management section, with full filter support (status, level, chapter, search) via new API endpoints.

## Problem Statement

Currently:
- Quiz Question Management shows questions for ONE subject at a time
- Subject filter row in QuestionManagementSection exists but has issues:
  1. No "All" option to show combined questions
  2. Subject selection from filter row doesn't work (URL not synced)
  3. Question counts not shown next to subjects
- All filtering is 100% server-side (API → database) - correct approach

## Solution

Create new API endpoint for fetching all questions with filters, connect to frontend UI.

---

## Implementation Plan

### Part 1: Backend (NestJS)

#### 1.1 Add New Endpoint in `quiz.controller.ts`
**Location**: `apps/backend/src/quiz/quiz.controller.ts`

Add new endpoint after existing subject questions endpoint (around line 91):

```typescript
@Get('questions/all')
@ApiOperation({ summary: 'Get all questions from all subjects with filters' })
async getAllQuestions(
  @Query('status') status?: string,
  @Query('level') level?: string,
  @Query('chapter') chapter?: string,
  @Query('search') search?: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
): Promise<{ data: Question[]; total: number }> {
  const pagination = { page: page || 1, limit: limit || 10 };
  const filters = { status: status as any, level, chapter, search }; // NO subjectSlug
  return this.quizService.findAllQuestions(pagination, filters);
}
```

#### 1.2 Add Status Counts Endpoint for All Subjects
**Location**: `apps/backend/src/quiz/quiz.controller.ts`

Add endpoint to get overall status counts:

```typescript
@Get('questions/all/status-counts')
@ApiOperation({ summary: 'Get status counts for all questions' })
async getAllQuestionsStatusCounts(): Promise<{ total: number; published: number; draft: number; trash: number }> {
  return this.quizService.getAllQuestionsStatusCounts();
}
```

#### 1.3 Add Service Method in `quiz.service.ts`
**Location**: `apps/backend/src/quiz/quiz.service.ts`

Add new method (around line 222):

```typescript
async getAllQuestionsStatusCounts(): Promise<{ total: number; published: number; draft: number; trash: number }> {
  const [total, published, draft, trash] = await Promise.all([
    this.questionRepo.count(),
    this.questionRepo.count({ where: { status: ContentStatus.PUBLISHED } }),
    this.questionRepo.count({ where: { status: ContentStatus.DRAFT } }),
    this.questionRepo.count({ where: { status: ContentStatus.TRASH } }),
  ]);
  return { total, published, draft, trash };
}
```

---

### Part 2: Frontend (Next.js)

#### 2.1 Add API Function in `quiz-api.ts`
**Location**: `apps/frontend/src/lib/quiz-api.ts`

Add after `getQuestionCountBySubject` (around line 231):

```typescript
export async function getAllQuestions(
  filters: QuestionFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<{ data: QuizQuestion[]; total: number; page: number; limit: number }> {
  let url = `/quiz/questions/all?page=${page}&limit=${limit}`;
  if (filters.status) url += `&status=${filters.status}`;
  if (filters.level) url += `&level=${filters.level}`;
  if (filters.chapter) url += `&chapter=${encodeURIComponent(filters.chapter)}`;
  if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
  
  const response = await api.get<{ data: QuizQuestion[]; total: number }>(url);
  return {
    data: response.data.data,
    total: response.data.total,
    page,
    limit
  };
}

export async function getAllQuestionsStatusCounts(): Promise<SubjectStatusCounts> {
  const response = await api.get<SubjectStatusCounts>('/quiz/questions/all/status-counts');
  return response.data;
}
```

#### 2.2 Fix URL Sync in `page.tsx`
**Location**: `apps/frontend/src/app/admin/page.tsx`, line 444-446

Change:

```typescript
// Handle subject selection from filter
const handleSubjectSelect = (slug: string) => {
  setActiveSection(slug as MenuSection);
  updateURL({ section: slug || 'dashboard' });  // ADD THIS LINE
};
```

#### 2.3 Pass Props to QuestionManagementSection in `page.tsx`
**Location**: `apps/frontend/src/app/admin/page.tsx`, line 1252-1273

Add these props:

```typescript
<QuestionManagementSection
  // ... existing props ...
  questionCounts={questionCounts}
  onGetAllQuestions={handleGetAllQuestions}
  onGetAllQuestionsStatusCounts={handleGetAllQuestionsStatusCounts}
/>
```

#### 2.4 Create Handlers in `page.tsx`
**Add after handleQuestionRefresh (around line 504)**:

```typescript
const handleGetAllQuestions = async (filters: any, page: number, limit: number) => {
  const result = await getAllQuestions(filters, page, limit);
  const mappedQuestions: Question[] = result.data.map(mapQuizQuestionToQuestion);
  return { data: mappedQuestions, total: result.total };
};

const handleGetAllQuestionsStatusCounts = async () => {
  return await getAllQuestionsStatusCounts();
};
```

#### 2.5 Update Props Interface in `QuestionManagementSection.tsx`
**Location**: `apps/frontend/src/app/admin/components/QuestionManagementSection.tsx`, lines 22-68

Add new props:

```typescript
interface QuestionManagementSectionProps {
  // ... existing props ...
  
  /** Question counts per subject */
  questionCounts?: Record<string, number>;
  
  /** Callback to get all questions (for "All" mode) */
  onGetAllQuestions?: (filters: any, page: number, limit: number) => Promise<{ data: Question[]; total: number }>;
  
  /** Callback to get all questions status counts */
  onGetAllQuestionsStatusCounts?: () => Promise<{ total: number; published: number; draft: number; trash: number }>;
}
```

#### 2.6 Add "All" State and Logic in `QuestionManagementSection.tsx`
**Add after line 125 (filter states)**:

```typescript
const [showAllSubjects, setShowAllSubjects] = useState(false);
```

**Add state for "All" mode data**:

```typescript
const [allModeQuestions, setAllModeQuestions] = useState<Question[]>([]);
const [allModePagination, setAllModePagination] = useState({ page: 1, limit: 10, total: 0 });
const [allModeStatusCounts, setAllModeStatusCounts] = useState<{ total: number; published: number; draft: number; trash: number } | undefined>();
```

**Add effect to fetch "All" mode data when activated**:

```typescript
useEffect(() => {
  if (showAllSubjects && onGetAllQuestions) {
    const fetchAllQuestions = async () => {
      const filters = { status: statusFilter, level: filterLevel, chapter: filterChapter, search: searchTerm };
      const result = await onGetAllQuestions(filters, currentPage, questionsPerPage);
      setAllModeQuestions(result.data);
      setAllModePagination(prev => ({ ...prev, total: result.total }));
    };
    fetchAllQuestions();
  }
}, [showAllSubjects, currentPage, questionsPerPage, statusFilter, filterLevel, filterChapter, searchTerm]);
```

**Also fetch status counts for "All" mode**:

```typescript
useEffect(() => {
  if (showAllSubjects && onGetAllQuestionsStatusCounts) {
    onGetAllQuestionsStatusCounts().then(setAllModeStatusCounts);
  }
}, [showAllSubjects, onGetAllQuestionsStatusCounts]);
```

#### 2.7 Add "All" Button to Subject Filter Row
**Location**: `apps/frontend/src/app/admin/components/QuestionManagementSection.tsx`, lines 986-1033

**Replace subject filter row with**:

```typescript
{/* Subject Filters Row */}
<div className="flex flex-wrap items-center gap-2">
  <span className="text-sm font-medium text-gray-600 mr-2">Subject:</span>
  
  {/* ALL button */}
  <button
    onClick={() => setShowAllSubjects(true)}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      showAllSubjects
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    All ({Object.values(questionCounts || {}).reduce((a, b) => a + b, 0)})
  </button>
  
  {allSubjects.map((s) => (
    <div key={s.slug} className="flex items-center gap-0.5">
      <button
        onClick={() => { setShowAllSubjects(false); onSubjectSelect(s.slug); }}
        className={`px-3 py-1.5 rounded-l-lg text-sm font-medium transition-colors ${
          !showAllSubjects && subject.slug === s.slug
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <span role="img" aria-hidden="true">{s.emoji}</span> {s.name} ({questionCounts?.[s.slug] || 0})
      </button>
      {/* Edit/Delete buttons... */}
    </div>
  ))}
</div>
```

#### 2.8 Update Display Logic
**Around where questions are used (search for `questions` usage)**:

Change to use `showAllSubjects` to determine which questions to display:

```typescript
const displayQuestions = showAllSubjects ? allModeQuestions : questions;
const displayPagination = showAllSubjects ? allModePagination : (pagination || { page: 1, limit: 10, total: 0 });
const displayStatusCounts = showAllSubjects ? allModeStatusCounts : statusCounts;
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `apps/backend/src/quiz/quiz.controller.ts` | Add 2 new endpoints |
| `apps/backend/src/quiz/quiz.service.ts` | Add 1 new service method |
| `apps/frontend/src/lib/quiz-api.ts` | Add 2 new API functions |
| `apps/frontend/src/app/admin/page.tsx` | Fix URL sync, pass props, add handlers |
| `apps/frontend/src/app/admin/components/QuestionManagementSection.tsx` | Add "All" state, button, counts display, filter logic |

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Subject Filter Row                                      │    │
│  │  [All (100)] [📚 Math (25)] [📚 Science (30)] ...      │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                          │
│                         ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  QuestionManagementSection                               │    │
│  │  - showAllSubjects = true/false                         │    │
│  │  - Calls onGetAllQuestions or onSubjectSelect           │    │
│  └──────────────────────┬──────────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  ALL MODE     │  │  SINGLE SUBJ  │  │   SIDEBAR     │
│  (new API)    │  │  (existing)    │  │   (existing)  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │     page.tsx            │
            │  handleSubjectSelect    │
            │  updateURL({ section }) │
            └───────────┬─────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │      URL Update         │
            │  ?section=math          │
            └───────────┬─────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │   ActiveSection State   │
            │   Gets Updated          │
            └─────────────────────────┘
```

---

## Implementation Order

1. **Backend First**:
   - Add service method in quiz.service.ts
   - Add endpoints in quiz.controller.ts

2. **Frontend API Layer**:
   - Add functions in quiz-api.ts

3. **Frontend page.tsx**:
   - Fix URL sync in handleSubjectSelect
   - Add handlers for "All" mode
   - Pass new props to QuestionManagementSection

4. **Frontend QuestionManagementSection**:
   - Add new props to interface
   - Add "All" state variables
   - Add "All" button to filter row
   - Update display logic
   - Connect filters to API calls

5. **Test**:
   - Test "All" button shows all questions
   - Test filters work in "All" mode
   - Test subject selection from filter row works
   - Test question counts display correctly

---

## Notes

- All filtering remains server-side (100% database level) - no hybrid approach
- The existing `findAllQuestions` service method already supports filtering without subjectSlug
- QuestionManagementSection already has all filter UI (status, level, chapter, search) - just need to connect to new API when "All" is selected
