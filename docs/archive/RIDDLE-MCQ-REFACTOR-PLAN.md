# Riddle MCQ Refactoring Plan

## Overview

Refactor 5 oversized files in the Riddle MCQ feature to follow the 200-LOC guideline.

**Rule:** After EACH priority, run verification checklist. If ANY check fails, STOP and fix before proceeding.

---

## LOC Targets

| File                         | Before | After | Target               |
| ---------------------------- | ------ | ----- | -------------------- |
| `riddle-mcq-bulk.service.ts` | 370    | ~113  | ✅ Priority 1 (DONE) |
| `ImportModal.tsx`            | 487    | ~300  | Priority 2           |
| `RiddleMcqContainer.tsx`     | 354    | ~250  | Priority 3           |
| `riddle-mcq.controller.ts`   | 268    | ~180  | Priority 4           |
| `riddle-mcq.dto.ts`          | 260    | ~120  | Priority 5           |

---

## Priority 1: `riddle-mcq-bulk.service.ts` ✅ COMPLETE

See implementation in codebase. Moved to:

- `utils/slug.util.ts`
- `utils/csv-export.util.ts`
- `services/riddle-mcq-bulk-actions.service.ts`
- `services/riddle-mcq-import.service.ts`

---

## Priority 2: `ImportModal.tsx`

### Current Breakdown (487 LOC)

| Section            | Lines | Action                  |
| ------------------ | ----- | ----------------------- |
| `parseCSVRow`      | 18    | Move to `csv-parser.ts` |
| `downloadTemplate` | 17    | Keep in modal           |
| `parseCsvContent`  | 89    | Move to `csv-parser.ts` |
| `subjectNameToId`  | 15    | Remove (unused)         |
| Interfaces         | 23    | Move to `csv-parser.ts` |
| State + handlers   | ~189  | Keep in modal           |
| JSX Render         | ~151  | Keep in modal           |

### New Files to Create

```
apps/frontend/src/features/riddle-mcq/
├── modals/
│   └── csv-parser.ts     ← ~110 LOC (parser + types)
```

### Implementation Steps

#### Step 1: Create `csv-parser.ts`

```typescript
export interface ParsedRiddle {
  question: string;
  options: string[];
  correctLetter: string;
  level: string;
  subjectName: string;
  categoryName: string;
  hint: string;
  explanation: string;
  answer: string;
  status: string;
}

export interface ImportError {
  row: number;
  message: string;
}

export function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvContent(content: string): {
  riddles: ParsedRiddle[];
  categoryName: string;
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { riddles: [], categoryName: '' };

  let headerLineIdx = 0;
  let dataStartIdx = 1;
  let categoryName = '';

  if (lines[0]?.startsWith('# Category:')) {
    categoryName = lines[0]!
      .replace(/^#\s*Category:\s*/i, '')
      .replace(/,+$/, '')
      .trim();
    headerLineIdx = 1;
    dataStartIdx = 2;
  }

  const headers = parseCSVRow(lines[headerLineIdx]!).map((h) => h.toLowerCase().trim());
  const riddles: ParsedRiddle[] = [];

  for (let i = dataStartIdx; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;

    const values = parseCSVRow(line);
    if (values.length < 2) continue;

    const getValue = (colName: string): string => {
      const idx = headers.indexOf(colName.toLowerCase());
      return idx >= 0 && values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
    };

    const question = getValue('question');
    if (!question) continue;

    const optA = getValue('optiona');
    const optB = getValue('optionb');
    const optC = getValue('optionc');
    const optD = getValue('optiond');

    const answerRaw = getValue('answer');

    let correctLetter = '';
    let answerText = '';

    if (answerRaw) {
      const letterMatch = answerRaw.match(/^([A-D])\.\s*(.*)$/i);
      if (letterMatch) {
        correctLetter = letterMatch[1]!.toUpperCase();
        answerText = letterMatch[2]!.trim();
      } else {
        answerText = answerRaw;
      }
    }

    let options: string[] = [];
    if (optA) options.push(optA);
    if (optB) options.push(optB);
    if (optC) options.push(optC);
    if (optD) options.push(optD);

    if (answerText && correctLetter) {
      const letterIndex = correctLetter.charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < options.length) {
        options[letterIndex] = answerText;
      }
    }

    riddles.push({
      question,
      options,
      correctLetter,
      level: getValue('level') || 'easy',
      subjectName: getValue('subject'),
      categoryName,
      hint: getValue('hint'),
      explanation: getValue('explanation'),
      answer: answerText || '',
      status: getValue('status') || 'draft',
    });
  }

  return { riddles, categoryName };
}
```

#### Step 2: Update `ImportModal.tsx`

- Remove `parseCSVRow` function (moved)
- Remove `parseCsvContent` function (moved)
- Remove `ParsedRiddle`, `ImportError`, `ImportResult` interfaces (moved)
- Remove `subjectNameToId` function (unused)
- Add import: `import { parseCSVRow, parseCsvContent, ParsedRiddle, ImportError } from './csv-parser';`

### Verification Checklist (Priority 2)

- [ ] `cd apps/frontend && npx tsc --noEmit` passes
- [ ] Frontend hot reloads
- [ ] Download template — works
- [ ] Import CSV — preview shows, import succeeds
- [ ] Auto-created categories/subjects appear without refresh
- [ ] Progress bar updates during import
- [ ] Error display works for invalid rows

### Rollback (Priority 2)

```bash
git checkout apps/frontend/src/features/riddle-mcq/modals/ImportModal.tsx apps/frontend/src/features/riddle-mcq/modals/csv-parser.ts
```

---

## Priority 3: `RiddleMcqContainer.tsx`

### Current Breakdown (354 LOC)

| Section              | Lines | Action                             |
| -------------------- | ----- | ---------------------------------- |
| CRUD handlers        | 63    | Move to `useRiddleCrudHandlers.ts` |
| Bulk action handlers | 20    | Move to `useBulkActions.ts`        |
| Debounce             | 12    | Move to `useDebounce.ts`           |
| Interfaces           | 12    | Keep in component                  |
| State + queries      | ~40   | Keep in component                  |
| URL sync effect      | 17    | Keep in component                  |
| JSX Render           | ~100  | Keep in component                  |

### New Files to Create

```
apps/frontend/src/features/riddle-mcq/
├── hooks/
│   ├── useRiddleCrudHandlers.ts   ← ~80 LOC
│   ├── useBulkActions.ts           ← ~50 LOC
│   └── useDebounce.ts            ← ~15 LOC
```

### Implementation Steps

#### Step 1: Create `hooks/useDebounce.ts`

```typescript
import { useCallback, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}
```

#### Step 2: Create `hooks/useRiddleCrudHandlers.ts`

```typescript
import { useCallback } from 'react';
import type { RiddleMcq, RiddleCategory, RiddleSubject } from '@/lib/riddle-mcq-api';
import type { CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';
import { useRiddleMcqCategories, useRiddleMcqSubjects, useRiddleMcqQuestions } from './';

export function useRiddleCrudHandlers(
  setCategoryModal: (state: { open: boolean; item?: RiddleCategory }) => void,
  setSubjectModal: (state: { open: boolean; item?: RiddleSubject }) => void,
  setRiddleModal: (state: { open: boolean; item?: RiddleMcq }) => void
) {
  const categoriesQuery = useRiddleMcqCategories();
  const subjectsQuery = useRiddleMcqSubjects();
  const riddlesQuery = useRiddleMcqQuestions({} as any, 1, 10);

  const handleCategorySubmit = useCallback(
    async (data: any) => {
      await categoriesQuery.createAsync?.(data);
      setCategoryModal({ open: false });
    },
    [categoriesQuery, setCategoryModal]
  );

  const handleSubjectSubmit = useCallback(
    async (data: any) => {
      await subjectsQuery.createAsync?.(data);
      setSubjectModal({ open: false });
    },
    [subjectsQuery, setSubjectModal]
  );

  const handleRiddleSubmit = useCallback(
    async (dto: CreateRiddleMcqDto) => {
      await riddlesQuery.createAsync?.(dto);
      setRiddleModal({ open: false });
    },
    [riddlesQuery, setRiddleModal]
  );

  return { handleCategorySubmit, handleSubjectSubmit, handleRiddleSubmit };
}
```

#### Step 3: Create `hooks/useBulkActions.ts`

```typescript
import { useCallback } from 'react';
import type { BulkActionType } from '@/types/status.types';
import { useRiddleMutations } from './useRiddleMutations';

export function useBulkActions(selectedIds: Set<string>, onClearSelection: () => void) {
  const { bulkAction } = useRiddleMutations();

  const handleBulkAction = useCallback(
    async (action: BulkActionType) => {
      if (selectedIds.size === 0) return;
      await bulkAction({ ids: Array.from(selectedIds), action });
      onClearSelection();
    },
    [selectedIds, bulkAction, onClearSelection]
  );

  return { handleBulkAction };
}
```

#### Step 4: Update `RiddleMcqContainer.tsx`

- Add imports for new hooks
- Extract CRUD handlers to `useRiddleCrudHandlers`
- Extract bulk actions to `useBulkActions`
- Extract debounce to `useDebounce`

### Verification Checklist (Priority 3)

- [ ] `cd apps/frontend && npx tsc --noEmit` passes
- [ ] Add riddle — works
- [ ] Edit riddle — works
- [ ] Delete riddle — works
- [ ] Select one/all — works
- [ ] Bulk publish/trash/delete — works
- [ ] URL sync — back/forward navigation preserves filters
- [ ] Pagination — page size change works

### Rollback (Priority 3)

```bash
git checkout apps/frontend/src/features/riddle-mcq/components/RiddleMcqContainer.tsx apps/frontend/src/features/riddle-mcq/hooks/
```

---

## Priority 4: `riddle-mcq.controller.ts`

### Current Breakdown (268 LOC)

| Section                | Lines | Action                |
| ---------------------- | ----- | --------------------- |
| Endpoints              | ~195  | Keep (must stay)      |
| `validateCount()`      | 22    | Move to `validators/` |
| `validateDifficulty()` | 8     | Move to `validators/` |

### New Files to Create

```
apps/backend/src/riddle-mcq/
├── validators/
│   ├── pagination.validator.ts
│   └── difficulty.validator.ts
```

### Implementation Steps

#### Step 1: Create `validators/pagination.validator.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class RiddleMcqPaginationValidator {
  validateCount(count: any, paramName: string = 'count'): number {
    if (count === undefined || count === null || count === '') {
      return 10;
    }
    const parsed = parseInt(count as string, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException(`${paramName} must be between 1 and 100`);
    }
    return parsed;
  }
}
```

#### Step 2: Create `validators/difficulty.validator.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class RiddleMcqDifficultyValidator {
  private readonly validLevels = ['easy', 'medium', 'hard'];

  validateDifficulty(difficulty: any, allowNull: boolean = false): string | null {
    if (!difficulty || difficulty === 'all') {
      return allowNull ? null : 'all';
    }
    if (!this.validLevels.includes(difficulty as string)) {
      throw new BadRequestException(
        `Invalid difficulty: ${difficulty}. Must be easy, medium, or hard`
      );
    }
    return difficulty as string;
  }
}
```

#### Step 3: Update Controller

- Add imports for new validators
- Add to constructor: `private paginationValidator: RiddleMcqPaginationValidator`
- Replace inline `validateCount()` calls with `this.paginationValidator.validateCount()`
- Replace inline `validateDifficulty()` calls with `this.difficultyValidator.validateDifficulty()`

### Verification Checklist (Priority 4)

- [ ] `cd apps/backend && npx tsc --noEmit` passes
- [ ] `docker-compose build backend` succeeds
- [ ] All endpoints accessible in Swagger
- [ ] Create/update/delete riddle — works
- [ ] Bulk import/export — works
- [ ] Bulk actions — works
- [ ] Filter counts — works

### Rollback (Priority 4)

```bash
git checkout apps/backend/src/riddle-mcq/controllers/riddle-mcq.controller.ts apps/backend/src/riddle-mcq/validators/
```

---

## Priority 5: `riddle-mcq.dto.ts`

### Current Breakdown (260 LOC)

| DTO                       | Lines | Action                |
| ------------------------- | ----- | --------------------- |
| `RiddleMcqPaginationDto`  | 15    | Keep                  |
| `CreateRiddleCategoryDto` | 30    | Move to `dto/create/` |
| `UpdateRiddleCategoryDto` | 27    | Move to `dto/update/` |
| `CreateRiddleSubjectDto`  | 38    | Move to `dto/create/` |
| `UpdateRiddleSubjectDto`  | 35    | Move to `dto/update/` |
| `CreateRiddleMcqDto`      | 50    | Move to `dto/create/` |
| `UpdateRiddleMcqDto`      | 53    | Move to `dto/update/` |

### New Structure

```
apps/backend/src/riddle-mcq/dto/
├── riddle-mcq.dto.ts              ← re-exports all
├── riddle-pagination.dto.ts       ← RiddleMcqPaginationDto
├── create/
│   ├── riddle-category.dto.ts     ← CreateRiddleCategoryDto
│   ├── riddle-subject.dto.ts      ← CreateRiddleSubjectDto
│   └── riddle-mcq.dto.ts          ← CreateRiddleMcqDto
└── update/
    ├── riddle-category.dto.ts     ← UpdateRiddleCategoryDto
    ├── riddle-subject.dto.ts      ← UpdateRiddleSubjectDto
    └── riddle-mcq.dto.ts          ← UpdateRiddleMcqDto
```

### Implementation Steps

#### Step 1: Create `dto/riddle-pagination.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RiddleMcqPaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

#### Step 2: Create `dto/create/riddle-category.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateRiddleCategoryDto {
  @ApiProperty({ example: 'Logic' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'logic' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '🧩' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  order?: number;
}
```

#### Step 3: Create `dto/update/riddle-category.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateRiddleCategoryDto } from './riddle-category.dto';

export class UpdateRiddleCategoryDto extends PartialType(CreateRiddleCategoryDto) {}
```

#### Step 4: Repeat for Subject and Riddle DTOs

Create `dto/create/riddle-subject.dto.ts`, `dto/create/riddle-mcq.dto.ts`, and corresponding update DTOs.

#### Step 5: Update `riddle-mcq.dto.ts` for backward compat

```typescript
export * from './riddle-pagination.dto';
export * from './create/riddle-category.dto';
export * from './create/riddle-subject.dto';
export * from './create/riddle-mcq.dto';
export * from './update/riddle-category.dto';
export * from './update/riddle-subject.dto';
export * from './update/riddle-mcq.dto';
```

### Verification Checklist (Priority 5)

- [ ] `cd apps/backend && npx tsc --noEmit` passes
- [ ] `docker-compose build backend` succeeds
- [ ] All endpoints accept/return correct DTOs
- [ ] Swagger shows correct schemas
- [ ] Create riddle with all fields — works
- [ ] Update riddle with partial fields — works

### Rollback (Priority 5)

```bash
git checkout apps/backend/src/riddle-mcq/dto/
```

---

## Post-Refactor Summary

### LOC Comparison

| File                         | Before    | After    | Reduction |
| ---------------------------- | --------- | -------- | --------- |
| `riddle-mcq-bulk.service.ts` | 370       | ~113     | -257      |
| `ImportModal.tsx`            | 487       | ~300     | -187      |
| `RiddleMcqContainer.tsx`     | 354       | ~250     | -104      |
| `riddle-mcq.controller.ts`   | 268       | ~200     | -68       |
| `riddle-mcq.dto.ts`          | 260       | ~80      | -180      |
| **Total**                    | **1,739** | **~943** | **-796**  |

### Files Created/Deleted

| Action                | Path                                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| **Priority 1 (Done)** |                                                                           |
| Created               | `apps/backend/src/riddle-mcq/utils/slug.util.ts`                          |
| Created               | `apps/backend/src/riddle-mcq/utils/csv-export.util.ts`                    |
| Created               | `apps/backend/src/riddle-mcq/services/riddle-mcq-bulk-actions.service.ts` |
| Created               | `apps/backend/src/riddle-mcq/services/riddle-mcq-import.service.ts`       |
| Refactored            | `apps/backend/src/riddle-mcq/services/riddle-mcq-bulk.service.ts`         |
| **Priority 2**        |                                                                           |
| Created               | `apps/frontend/src/features/riddle-mcq/modals/csv-parser.ts`              |
| Refactored            | `apps/frontend/src/features/riddle-mcq/modals/ImportModal.tsx`            |
| **Priority 3**        |                                                                           |
| Created               | `apps/frontend/src/features/riddle-mcq/hooks/useRiddleCrudHandlers.ts`    |
| Created               | `apps/frontend/src/features/riddle-mcq/hooks/useBulkActions.ts`           |
| Created               | `apps/frontend/src/features/riddle-mcq/hooks/useDebounce.ts`              |
| Refactored            | `apps/frontend/src/features/riddle-mcq/components/RiddleMcqContainer.tsx` |
| **Priority 4**        |                                                                           |
| Created               | `apps/backend/src/riddle-mcq/validators/pagination.validator.ts`          |
| Created               | `apps/backend/src/riddle-mcq/validators/difficulty.validator.ts`          |
| Refactored            | `apps/backend/src/riddle-mcq/controllers/riddle-mcq.controller.ts`        |
| **Priority 5**        |                                                                           |
| Created               | `apps/backend/src/riddle-mcq/dto/riddle-pagination.dto.ts`                |
| Created               | `apps/backend/src/riddle-mcq/dto/create/` (3 files)                       |
| Created               | `apps/backend/src/riddle-mcq/dto/update/` (3 files)                       |
| Refactored            | `apps/backend/src/riddle-mcq/dto/riddle-mcq.dto.ts`                       |

### Commit Strategy

After each priority that passes verification:

```bash
git add .
git commit -m "refactor(riddle-mcq): priority N - <description>"
git push
```
