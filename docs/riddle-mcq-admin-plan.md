# Riddle MCQ Admin Plan

## Overview

Rebuild riddle-mcq admin panel following EXACT same TRUE ideal approach as quiz admin panel. Reference: `apps/frontend/src/features/quiz/`

---

## Step 1: Architecture Overview

### 1.1 Key Principles (Same as Quiz)

- **URL-driven state** - filters and pagination in URL params
- **React Query** - all data fetching via hooks
- **Decomposed components** - small, focused files
- **No prop drilling** - context or direct hooks
- **Optimistic updates** - instant UI feedback

### 1.2 Differences from Quiz Admin

| Aspect              | Quiz                         | Riddle MCQ                                  |
| ------------------- | ---------------------------- | ------------------------------------------- |
| Hierarchy           | Subject → Chapter → Question | Category → Subject → Riddle                 |
| Filter by Category  | No                           | Yes                                         |
| Level-based options | No (all 4 options)           | Yes (Easy=2, Medium=3, Hard=4, Expert=text) |
| Additional fields   | -                            | hint, explanation                           |

### 1.3 Target File Structure

```
apps/frontend/src/features/riddle-mcq/
├── RiddleMcqContainer.tsx         (coordinator, ~200 lines)
├── RiddleMcqHeader.tsx               (title + actions)
├── RiddleMcqFilterPanel.tsx          (filters - includes category row)
├── RiddleQuestionManager.tsx       (table + bulk actions)
├── hooks/
│   ├── useRiddleMcqFilters.ts        (URL-driven filters)
│   ├── useRiddleMcqCategories.ts     (categories data)
│   ├── useRiddleMcqSubjects.ts       (subjects data)
│   ├── useRiddleMcqQuestions.ts          (riddles data via React Query)
│   ├── useRiddleMcqFilterCounts.ts  (filter counts)
│   ├── useRiddleMutations.ts     (CRUD operations)
│   └── index.ts
└── modals/
    ├── RiddleMcqCategoryModal.tsx           (NEW - quiz has no category level)
    ├── RiddleMcqSubjectModal.tsx           (similar to quiz chapter modal)
    ├── RiddleMcqModal.tsx            (level-based options)
    └── ImportModal.tsx
```

### 1.4 Routing/Page Wiring

**Location:** `apps/frontend/src/app/admin/page.tsx`

The `RiddleMcqContainer` will replace the existing `RiddleMcqSection` component:

```tsx
// In admin/page.tsx
import { RiddleMcqContainer } from '@/features/riddle-mcq/RiddleMcqContainer';

// Replace:
// <RiddleMcqSection />

// With:
<RiddleMcqContainer />;
```

---

## Step 2: Component Specifications

### 2.1 RiddleMcqContainer.tsx

**Responsibility:** Main coordinator, state management for modals

**Structure (same pattern as QuizMcqContainer):**

```typescript
export function RiddleMcqContainer() {
  // 1. Hooks first (ALL before any conditional returns)
  const { filters, setFilter, resetFilters, page, pageSize, setPage, setPageSize } = useRiddleMcqFilters();
  const categoriesQuery = useRiddleMcqCategories();
  const selectedCategory = categoriesQuery.data?.find(c => c.id === filters.category);
  const subjectsQuery = useRiddleMcqSubjects(selectedCategory?.id);
  const selectedSubject = subjectsQuery.data?.find(s => s.slug === filters.subject);
  const riddlesQuery = useRiddleMcqQuestions(filters, page, pageSize);
  const filterCountsQuery = useRiddleMcqFilterCounts(filters);

  // 2. Modal states
  const [categoryModal, setRiddleMcqCategoryModal] = useState({ open: false, category: undefined });
  const [subjectModal, setRiddleMcqSubjectModal] = useState({ open: false, subject: undefined });
  const [riddleModal, setRiddleMcqModal] = useState({ open: false, riddle: undefined });
  const [importModal, setImportModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, ... });

  // 3. Memo hooks
  const riddles = riddlesQuery.data?.data ?? [];
  const total = riddlesQuery.data?.total ?? 0;

  // 4. Error handling (AFTER all hooks)
  if (categoriesQuery.error) return <ErrorState />;
  if (subjectsQuery.error) return <ErrorState />;
  if (riddlesQuery.error) return <ErrorState />;

  // 5. Render
  return (
    <div className="space-y-6 p-6">
      <RiddleMcqHeader ... />
      <RiddleMcqFilterPanel ... />
      <RiddleQuestionManager ... />
      <RiddleMcqCategoryModal ... />
      <RiddleMcqSubjectModal ... />
      <RiddleMcqModal ... />
      <ImportModal ... />
      <ConfirmDialog ... />
    </div>
  );
}
```

### 2.2 RiddleMcqHeader.tsx

**Responsibility:** Title, action buttons (Add, Import, Export)

**Props:**

```typescript
interface RiddleMcqHeaderProps {
  totalRiddles: number;
  onAddRiddle: () => void;
  onImport: () => void;
  onExport: () => void;
}
```

**Similar to QuizHeader** but with Add Riddle instead of Add Question.

### 2.3 RiddleMcqFilterPanel.tsx

**Responsibility:** All filter rows - Category, Subject, Level, Status, Search

**Props:**

```typescript
interface RiddleMcqFilterPanelProps {
  filters: ReturnType<typeof useRiddleMcqFilters>['filters'];
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  categories: RiddleCategory[];
  subjects: RiddleSubject[];
  filterCounts?: {
    categoryCounts: { id: string; name: string; count: number }[];
    subjectCounts: { id: string; name: string; count: number }[];
    levelCounts: { level: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    total: number;
  };
  isLoading: boolean;
  onAddCategory: () => void;
  onEditCategory: (c: RiddleCategory) => void;
  onDeleteCategory: (c: RiddleCategory) => void;
  onAddSubject: () => void;
  onEditSubject: (s: RiddleSubject) => void;
  onDeleteSubject: (s: RiddleSubject) => void;
}
```

**Filter Rows:**

1. **Category row** (NEW - quiz has no category filter)
   - "All" button + chips for each category with counts
   - Add/Edit/Delete buttons per category
2. **Subject row** (filtered by selected category)
   - "All" button + chips for each subject with counts
   - Add/Edit/Delete buttons per subject
3. **Level row**
   - All / Easy / Medium / Hard / Expert with counts
4. **Status row** (dashboard style)
   - Total / Published / Draft / Trash counts
5. **Search row**
   - Text input with clear button

### 2.4 RiddleQuestionManager.tsx

**Responsibility:** Table display, pagination, bulk selection

**Props:**

```typescript
interface RiddleQuestionManagerProps {
  riddles: Riddle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (riddle: Riddle) => void;
  statusFilter: string;
}
```

**Similar to QuestionManager in quiz** but:

- Displays Category and Subject columns instead of Chapter
- Shows hint/explanation indicators

### 2.5 RiddleMcqCategoryModal.tsx

**Responsibility:** Create/Edit category

**Props:**

```typescript
interface RiddleMcqCategoryModalProps {
  open: boolean;
  category?: RiddleCategory; // undefined for create
  onClose: () => void;
}
```

**Form Fields:**

- name (required)
- slug (auto-generated, optional)
- emoji (required)
- order (optional, default 0)
- isActive (checkbox, default true)

### 2.6 RiddleMcqSubjectModal.tsx

**Responsibility:** Create/Edit subject

**Props:**

```typescript
interface RiddleMcqSubjectModalProps {
  open: boolean;
  subject?: RiddleSubject; // undefined for create
  categoryId?: string; // pre-selected category
  categories: RiddleCategory[];
  onClose: () => void;
}
```

**Form Fields:**

- name (required)
- slug (auto-generated, optional)
- emoji (required)
- categoryId (select from categories)
- order (optional, default 0)
- isActive (checkbox, default true)

### 2.7 RiddleMcqModal.tsx (KEY DIFFERENCE)

**Responsibility:** Create/Edit riddle with dynamic options based on level

**Props:**

```typescript
interface RiddleMcqModalProps {
  open: boolean;
  riddle?: Riddle; // undefined for create
  subjects: RiddleSubject[];
  categories: RiddleCategory[];
  onClose: () => void;
}
```

**Form Fields:**

1. **Subject selector** (required)
   - Dropdown of subjects

2. **Level selector** (required)
   - Easy / Medium / Hard / Expert

3. **Dynamic Options** (based on level):

   ```
   Easy (2 options):
   - optionA (required)
   - optionB (required)
   - correctLetter: A or B only

   Medium (3 options):
   - optionA (required)
   - optionB (required)
   - optionC (required)
   - correctLetter: A, B, or C only

   Hard (4 options):
   - optionA (required)
   - optionB (required)
   - optionC (required)
   - optionD (required)
   - correctLetter: A, B, C, or D

   Expert (open-ended):
   - answer (text input, required)
   - NO options fields
   - NO correctLetter
   ```

4. **Question** (required, textarea)
   - Max 1000 chars

5. **Hint** (optional)
   - Max 500 chars
   - Shown before answering during play

6. **Explanation** (optional)
   - Max 2000 chars
   - Shown in results review

7. **Status** (select)
   - Draft / Published / Trash

**Level change handler:**

```typescript
const handleLevelChange = (newLevel: string) => {
  setValue('level', newLevel);
  // Reset options when level changes
  if (newLevel === 'expert') {
    setValue('options', []);
    setValue('correctLetter', null);
  } else {
    const optionCount = { easy: 2, medium: 3, hard: 4 }[newLevel];
    const currentOptions = getValues('options') || [];
    // Keep only first N options
    setValue('options', currentOptions.slice(0, optionCount));
    // Reset correctLetter if not valid for new level
    const letter = getValues('correctLetter');
    const validLetters = { easy: ['A', 'B'], medium: ['A', 'B', 'C'], hard: ['A', 'B', 'C', 'D'] };
    if (letter && !validLetters[newLevel]?.includes(letter)) {
      setValue('correctLetter', null);
    }
  }
};
```

### 2.8 ImportModal.tsx

**Responsibility:** Import riddles from CSV/JSON files

**Props:**

```typescript
interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}
```

**Features:**

1. **File Upload**
   - Drag & drop zone
   - File picker button
   - Accepts: `.csv`, `.json`
   - Max file size: 5MB

2. **Format Selection**
   - CSV format (default)
   - JSON format

3. **Template Download**
   - Download CSV template button
   - Download JSON template button

4. **Preview Table**
   - Show first 5 rows of parsed data
   - Display: question, level, options count, status
   - Validation status per row (✓ or ✗)

5. **Import Progress**
   - Progress bar during import
   - Show count: "Importing 45 of 120..."
   - Cancel button

6. **Error Handling**
   - Show errors after import completes
   - Option to download error log
   - "Import X succeeded, Y failed"

**CSV Format:**

```
question,optionA,optionB,optionC,optionD,correctLetter,answer,level,subject,category,hint,explanation,status
```

**JSON Format:**

```json
{
  "version": 1,
  "riddles": [
    {
      "question": "What has keys but no locks?",
      "options": ["A piano", "A keyboard"],
      "correctLetter": "A",
      "level": "easy",
      "subject": "Brain Teasers",
      "category": "Logic Puzzles",
      "hint": "Think musical",
      "explanation": "A piano has musical keys",
      "status": "published"
    }
  ]
}
```

**Validation Rules:**

- Level determines option count:
  - Easy: exactly 2 options, correctLetter A or B
  - Medium: exactly 3 options, correctLetter A, B, or C
  - Hard: exactly 4 options, correctLetter A, B, C, or D
  - Expert: no options, correctLetter null, answer required
- Subject is required (auto-create if not exists)
- Category is optional (auto-create if not exists)

---

## Step 3: Hook Specifications

### 3.1 useRiddleMcqFilters.ts

**Responsibility:** URL-driven filter state

**Same pattern as useQuizFilters:**

```typescript
export function useRiddleMcqFilters() {
  const searchParams = useSearchParams();

  // URL keys:
  // - category (category slug or 'all')
  // - subject (subject slug or 'all')
  // - level (easy/medium/hard/expert or 'all')
  // - status (published/draft/trash or 'all')
  // - search (search query string)
  // - page (page number, default 1)
   // - pageSize (items per page, default 10)

  const filters = {
    category: searchParams.get('category') || 'all',
    subject: searchParams.get('subject') || 'all',
    level: searchParams.get('level') || 'all',
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
  };

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const setFilter = (key: string, value: string) => { ... };
  const resetFilters = () => { ... };
  const setPage = (p: number) => { ... };
  const setPageSize = (s: number) => { ... };

  return { filters, setFilter, resetFilters, page, pageSize, setPage, setPageSize };
}
```

### 3.2 useRiddleMcqCategories.ts

**Responsibility:** Fetch categories

```typescript
export function useRiddleMcqCategories() {
  return useQuery({
    queryKey: ['riddle-categories'],
    queryFn: () => getCategories(), // from riddle-mcq-api
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3.3 useRiddleMcqSubjects.ts

**Responsibility:** Fetch subjects (optionally filtered by category)

```typescript
export function useRiddleMcqSubjects(categoryId?: string) {
  return useQuery({
    queryKey: ['riddle-subjects', categoryId],
    queryFn: () => getSubjects(), // from riddle-mcq-api
    // Note: filtering by category is done client-side for now
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3.4 useRiddleMcqQuestions.ts

**Responsibility:** Fetch riddles with filters (React Query)

```typescript
export function useRiddleMcqQuestions(filters: RiddleFilters, page: number, pageSize: number = 10) {
  return useQuery({
    queryKey: ['riddle-mcqs', filters, page, pageSize],
    queryFn: () => getAllRiddles(filters, page, pageSize),
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // for smooth pagination
  });
}
```

### 3.5 useRiddleMutations.ts

**Responsibility:** All CRUD mutations

```typescript
export function useRiddleMutations() {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: (dto) => createCategory(dto),
    onSuccess: () => queryClient.invalidateQueries(['riddle-categories']),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, dto }) => updateCategory(id, dto),
    onSuccess: () => queryClient.invalidateQueries(['riddle-categories']),
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries(['riddle-categories', 'riddle-subjects']),
  });

  // Same for subjects and riddles...

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    createSubject,
    updateSubject,
    deleteSubject,
    createRiddle,
    updateRiddle,
    deleteRiddle,
    bulkAction,
    // Import/Export
    importRiddles: (dtos) => bulkCreateRiddles(dtos),
    exportRiddles: (filters) => exportRiddlesToCSV(filters),
  };
}
```

### 3.6 useRiddleMcqFilterCounts.ts

```typescript
export function useRiddleMcqFilterCounts(filters: RiddleFilters) {
  return useQuery({
    queryKey: ['riddle-filter-counts', filters],
    queryFn: () => getRiddleFilterCounts(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}
```

---

## Step 4: API Integration

### 4.1 New API Functions (add to riddle-mcq-api.ts)

```typescript
// Categories
export async function getCategories(): Promise<RiddleCategory[]> { ... }
export async function createCategory(dto: CreateCategoryDto): Promise<RiddleCategory> { ... }
export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<RiddleCategory> { ... }
export async function deleteCategory(id: string): Promise<void> { ... }

// Subjects
export async function getSubjects(): Promise<RiddleSubject[]> { ... }
export async function createSubject(dto: CreateSubjectDto): Promise<RiddleSubject> { ... }
export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<RiddleSubject> { ... }
export async function deleteSubject(id: string): Promise<void> { ... }

// Riddles
export async function getAllRiddles(
  filters: GetRiddlesParams,
  page: number,
  pageSize: number = 10
): Promise<{ data: Riddle[]; total: number; totalPages: number }> { ... }

export async function getRiddlesBySubject(
  subjectId: string,
  level?: string
): Promise<{ data: Riddle[]; total: number }> { ... } // For play page

export async function createRiddle(dto: CreateRiddleDto): Promise<Riddle> { ... }
export async function updateRiddle(id: string, dto: UpdateRiddleDto): Promise<Riddle> { ... }
export async function deleteRiddle(id: string): Promise<void> { ... }
export async function bulkActionRiddles(ids: string[], action: BulkActionType): Promise<BulkActionResult> { ... }
export async function bulkCreateRiddles(dtos: CreateRiddleDto[]): Promise<{ count: number; errors: string[] }> { ... }

// Stats
export async function getRiddleFilterCounts(filters: GetFilterCountsParams): Promise<FilterCounts> { ... }

// Export
export async function exportRiddlesToCSV(filters: GetRiddlesParams): Promise<void> { ... }
```

### 4.2 TypeScript Types (add to riddles.ts)

```typescript
export interface RiddleCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  isActive: boolean;
  order: number;
}

export interface RiddleSubject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  categoryId: string | null;
  isActive: boolean;
  order: number;
}

export interface Riddle {
  id: string;
  question: string;
  options: string[] | null; // null for expert
  correctLetter: string | null; // null for expert
  answer?: string; // for expert level
  level: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId: string;
  subject?: RiddleSubject;
  hint?: string;
  explanation?: string;
  status: 'published' | 'draft' | 'trash';
}

export interface GetRiddlesParams {
  category?: string;
  subject?: string;
  level?: string;
  status?: string;
  search?: string;
}
```

---

## Step 5: URL Param Structure

```
/admin?                             # Default
  category=all                      # Filter by category slug
  &subject=science                  # Filter by subject slug
  &level=easy                       # Filter by level
  &status=published                 # Filter by status
  &search=brain                     # Search in question
  &page=2                          # Page 2
  &pageSize=10                     # 10 items per page (default)
```

**Important:** When category changes, reset subject filter to 'all'.

---

## Step 6: RiddleMcqModal Level-Based Options Logic

### 6.1 Level → Options Mapping

```typescript
const LEVEL_OPTIONS: Record<string, { optionCount: number; validLetters: string[] }> = {
  easy: { optionCount: 2, validLetters: ['A', 'B'] },
  medium: { optionCount: 3, validLetters: ['A', 'B', 'C'] },
  hard: { optionCount: 4, validLetters: ['A', 'B', 'C', 'D'] },
  expert: { optionCount: 0, validLetters: [] },
};
```

### 6.2 React Hook Form Integration

```typescript
const {
  register,
  handleSubmit,
  watch,
  setValue,
  getValues,
  reset,
  formState: { errors },
} = useForm({
  defaultValues: {
    level: 'easy',
    options: ['', ''],
    correctLetter: 'A',
    // ...
  },
});

const currentLevel = watch('level');

// Register options dynamically based on level
const optionCount = LEVEL_OPTIONS[currentLevel]?.optionCount || 0;

// For expert level, show text input for answer instead
```

### 6.3 Validation Schema (Zod)

```typescript
const riddleSchema = z
  .object({
    question: z.string().min(1).max(1000),
    level: z.enum(['easy', 'medium', 'hard', 'expert']),
    subjectId: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctLetter: z.string().optional(),
    answer: z.string().optional(),
    hint: z.string().max(500).optional(),
    explanation: z.string().max(2000).optional(),
    status: z.enum(['draft', 'published', 'trash']).optional(),
  })
  .refine(
    (data) => {
      if (data.level === 'expert') {
        return !!data.answer && data.answer.trim().length > 0;
      }
      const required = LEVEL_OPTIONS[data.level]?.optionCount || 0;
      return (data.options?.length || 0) >= required;
    },
    {
      message: `Invalid options for level`,
    }
  );
```

---

## Step 7: Import/Export

### 7.1 CSV Export

Include columns:

```
question,optionA,optionB,optionC,optionD,correctLetter,answer,level,subject,category,hint,explanation,status
```

### 7.2 CSV Import

Parse with validation:

- Detect level from option count (2=A/B, 3=A/B/C, 4=A/B/C/D, no options=expert)
- Auto-detect correctLetter from answer text if not provided
- Auto-create subjects if not exist
- Return preview with error/warning counts

### 7.3 JSON Import/Export

```typescript
interface RiddleExport {
  version: 1;
  exportedAt: string;
  riddles: {
    question: string;
    options: string[] | null;
    correctLetter: string | null;
    answer?: string;
    level: string;
    subject: string;
    category?: string;
    hint?: string;
    explanation?: string;
    status: string;
  }[];
}
```

---

## Step 8: Implementation Order

1. **Create hooks** - useRiddleMcqFilters, useRiddleMcqCategories, useRiddleMcqSubjects, useRiddleMcqQuestions, useRiddleMcqFilterCounts, useRiddleMutations
2. **Create modals** - RiddleMcqCategoryModal, RiddleMcqSubjectModal, RiddleMcqModal, ImportModal
3. **Create components** - RiddleMcqHeader, RiddleMcqFilterPanel, RiddleQuestionManager
4. **Create container** - RiddleMcqContainer
5. **Wire up in admin page** - Replace current RiddleMcqSection
6. **Test** - All CRUD operations, filters, pagination, import/export

---

## Step 9: Testing Checklist

### Container & Hooks

- [ ] useRiddleMcqFilters reads/writes URL params correctly
- [ ] All React Query hooks fetch and cache data
- [ ] Mutations invalidate correct query keys

### Category Management

- [ ] Create category modal opens/closes
- [ ] Category form validates required fields
- [ ] Create works and appears in list
- [ ] Edit works and updates list
- [ ] Delete works with confirmation
- [ ] Category filter shows correct counts

### Subject Management

- [ ] Create subject modal opens/closes
- [ ] Subject filtered by selected category
- [ ] Subject form validates required fields
- [ ] CRUD operations work
- [ ] Subject filter shows correct counts

### Riddle CRUD

- [ ] Easy level shows 2 options, validates A/B
- [ ] Medium level shows 3 options, validates A/B/C
- [ ] Hard level shows 4 options, validates A/B/C/D
- [ ] Expert level shows text answer, no options
- [ ] Hint field saves (max 500)
- [ ] Explanation field saves (max 2000)
- [ ] Status workflow works (draft→published→trash)

### Filtering & Pagination

- [ ] Category filter works
- [ ] Subject filter works
- [ ] Level filter works
- [ ] Status filter works
- [ ] Search works
- [ ] URL updates on filter change
- [ ] Page navigation works
- [ ] Page size change works

### Bulk Actions

- [ ] Select all works
- [ ] Deselect all works
- [ ] Bulk publish works
- [ ] Bulk draft works
- [ ] Bulk trash works
- [ ] Bulk delete works

### Import/Export

- [ ] CSV export downloads file
- [ ] JSON export downloads file
- [ ] CSV import shows preview
- [ ] JSON import shows preview
- [ ] Import creates riddles
- [ ] Import errors shown

### Visual Checkpoints

- [ ] Loading states show spinners
- [ ] Error states show retry buttons
- [ ] Empty states show helpful messages
- [ ] Filter counts update in real-time
- [ ] Status dashboard accurate
