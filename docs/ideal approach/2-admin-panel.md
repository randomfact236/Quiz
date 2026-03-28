# Admin Panel Implementation
## Quiz MCQ Management - Current Implementation

---

## 1. Overview

**Note:** This documents the **actual implementation** in `apps/frontend/src/`.

**Important:** The current implementation uses **useState + useEffect**, NOT React Query.

---

## 2. Actual File Structure

```
apps/frontend/src/
├── app/admin/components/
│   └── QuizMcqSection.tsx        # Main component (863 lines)
├── lib/
│   ├── quiz-api.ts               # API wrappers (351 lines)
│   └── useQuizFilters.ts         # URL filter state
├── components/ui/
│   ├── quiz-filters/
│   │   ├── SubjectFilter.tsx
│   │   ├── ChapterFilter.tsx
│   │   ├── LevelFilter.tsx
│   │   ├── SearchInput.tsx
│   │   ├── SelectedFilters.tsx
│   │   └── QuestionTable.tsx
│   ├── StatusDashboard.tsx
│   ├── BulkActionToolbar.tsx
│   ├── SubjectModal.tsx
│   ├── ChapterModal.tsx
│   ├── QuestionModal.tsx
│   └── ConfirmDialog.tsx
└── app/admin/utils/
    └── quiz-importer.ts           # CSV parsing + import
```

---

## 3. Implemented Features (Exactly as is)

| Feature | Status | Component |
|---------|--------|-----------|
| Subject Filter | ✅ | SubjectFilter.tsx |
| Chapter Filter (cascading) | ✅ | ChapterFilter.tsx |
| Level Filter | ✅ | LevelFilter.tsx |
| Status Filter | ✅ | StatusDashboard.tsx |
| Search Input | ✅ | SearchInput.tsx |
| Question Table | ✅ | QuestionTable.tsx |
| Pagination | ✅ | In QuestionTable + page size |
| Bulk Actions | ✅ | BulkActionToolbar.tsx |
| Add Question | ✅ | QuestionModal.tsx |
| Edit Question | ✅ | QuestionModal.tsx |
| Delete Question | ✅ | ConfirmDialog.tsx |
| Add Subject | ✅ | SubjectModal.tsx |
| Edit Subject | ✅ | SubjectModal.tsx |
| Delete Subject | ✅ | ConfirmDialog.tsx |
| Add Chapter | ✅ | ChapterModal.tsx |
| Edit Chapter | ✅ | ChapterModal.tsx |
| Delete Chapter | ✅ | ConfirmDialog.tsx |
| CSV Import | ✅ | Inline in QuizMcqSection.tsx |
| CSV Export | ✅ | exportQuestionsToCSV in quiz-api.ts |

---

## 4. State Management (Actual - NOT React Query)

```typescript
// QuizMcqSection.tsx - Current pattern (lines 48-52)
const [filterCounts, setFilterCounts] = useState<FilterCountsResponse | null>(null);
const [questions, setQuestions] = useState<QuizQuestion[]>([]);
const [totalQuestions, setTotalQuestions] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [isLoading, setIsLoading] = useState(false);

// Fetch pattern (lines 144-167)
useEffect(() => {
  let cancelled = false;
  
  async function fetchQuestionsData() {
    setIsLoading(true);
    try {
      const result = await getAllQuestions(dataParams, currentPage, QUESTIONS_PAGE_SIZE);
      if (!cancelled) {
        setQuestions(result.data);
        setTotalQuestions(result.total);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }
  
  fetchQuestionsData();
  
  return () => { cancelled = true; };
}, [dataParams, currentPage, pageSize]);
```

---

## 5. Question Levels (Actual)

```typescript
type QuestionLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
```

| Level | Options | Description |
|-------|---------|-------------|
| easy | 2 (A, B) | True/False |
| medium | 2 (A, B) | 2 choice |
| hard | 3 (A, B, C) | 3 choice |
| expert | 4 (A, B, C, D) | 4 choice |
| extreme | 0 | Open answer |

---

## 6. QuizQuestion Type (Actual)

```typescript
// apps/frontend/src/lib/quiz-api.ts lines 30-41
interface QuizQuestion {
  id: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  correctLetter: string | null;
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapterId: string;
  chapter?: { id: string; name: string };
  status?: 'published' | 'draft' | 'trash';
}
```

---

## 7. FilterCountsResponse (Actual)

```typescript
// apps/frontend/src/lib/quiz-api.ts lines 229-235
interface FilterCountsResponse {
  subjects: { id: string; name: string; slug: string; emoji: string; category: string; count: number }[];
  chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}
```

---

## 8. Key API Functions (Actual)

```typescript
// apps/frontend/src/lib/quiz-api.ts

// Get questions with filters
async function getAllQuestions(
  filters: { subject?, status?, level?, chapter?, search? },
  page: number,
  limit: number
): Promise<{ data: QuizQuestion[]; total: number }>

// Get filter counts
async function getFilterCounts(filters: {
  subject?: string;
  status?: string;
  level?: string;
  chapter?: string;
  search?: string;
}): Promise<FilterCountsResponse>

// CRUD operations
async function createSubject(dto: CreateSubjectDto): Promise<QuizSubject>
async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<QuizSubject>
async function deleteSubject(id: string): Promise<void>
async function createChapter(dto: CreateChapterDto): Promise<QuizChapter>
async function updateChapter(id: string, dto: { name?: string; subjectId?: string }): Promise<QuizChapter>
async function deleteChapter(id: string): Promise<void>
async function createQuestion(dto: CreateQuestionDto): Promise<QuizQuestion>
async function updateQuestion(id: string, dto: UpdateQuestionDto): Promise<QuizQuestion>
async function deleteQuestion(id: string): Promise<void>

// Bulk actions
async function bulkActionQuestions(
  ids: string[],
  action: 'publish' | 'draft' | 'trash' | 'delete'
): Promise<{ success: number; failed: number }>

// CSV Export (frontend generates)
function exportQuestionsToCSV(questions: QuizQuestion[], subjectName?: string): void
```

---

## 9. QuizImporter (Actual)

```typescript
// apps/frontend/src/app/admin/utils/quiz-importer.ts

interface ParsedImportData {
  subjectName: string;
  subjectSlug: string;
  rows: any[];
  errors: string[];
  warnings: string[];
}

function parseCSVContent(content: string): ParsedImportData
async function executeImportFromParsed(
  data: ParsedImportData,
  existingSubjects: Subject[]
): Promise<{ success: boolean; questionsImported: number; errors: string[]; warnings: string[] }>
```

---

## 10. Bulk Actions (Actual)

The bulk action toolbar supports:
- **publish** - Set status to published
- **draft** - Set status to draft
- **trash** - Set status to trash
- **delete** - Permanent delete

```typescript
// Note: 'restore' is mapped to 'publish' (line 202 in QuizMcqSection.tsx)
const apiAction = action === 'restore' ? 'publish' : action;
```

---

## 11. NOT Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| React Query | Low | Current useState/useEffect works fine |

---

## 12. Related Documents

- [Master Plan](./0-master-plan.md)
- [Backend Implementation](./1-backend.md)
- [User-Side Implementation](./3-user-side.md)
