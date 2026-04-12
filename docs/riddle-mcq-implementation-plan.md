# Riddle MCQ Implementation Plan

## Feature-by-Feature Guide

**Stack:** NestJS + TypeORM (Backend) | Next.js + React Query (Frontend)  
**Reference:** `apps/frontend/src/features/quiz/` (completed working admin)  
**Pagination:** Default 10 items/page, URL param `pageSize`  
**Query Keys Prefix:** `riddle-`

---

## Riddle-Specific Rules

| Level  | Options | CorrectLetter | Answer   |
| ------ | ------- | ------------- | -------- |
| Easy   | 2       | A or B        | -        |
| Medium | 3       | A, B, or C    | -        |
| Hard   | 4       | A, B, C, or D | -        |
| Expert | 0       | null          | Required |

**Extra Fields:**

- `hint`: optional, max 500 chars
- `explanation`: optional, max 2000 chars
- `answer`: expert level only, required

**Hierarchy:** Category → Subject → Riddle  
**Cascade Delete:** Category → subjects → riddles | Subject → riddles

---

## Quiz vs Riddle Level Comparison

| Level   | Quiz            | Riddle          |
| ------- | --------------- | --------------- |
| Easy    | 2 (True/False)  | 2 (A/B)         |
| Medium  | 2 (A/B)         | 3 (A/B/C)       |
| Hard    | 3 (A/B/C)       | 4 (A/B/C/D)     |
| Expert  | 4 (A/B/C/D)     | 0 (text answer) |
| Extreme | 0 (text answer) | ❌ Removed      |

---

## Copy Strategy

### Backend (Copy Quiz patterns + Adapt)

| Quiz Concept | Riddle Equivalent |
| ------------ | ----------------- |
| Subject      | Category          |
| Chapter      | Subject           |
| Question     | Riddle            |

### Frontend - Copy & Rename

| Copy From               | Copy To                      | Changes                         |
| ----------------------- | ---------------------------- | ------------------------------- |
| `SubjectModal.tsx`      | `CategoryModal.tsx`          | Remove chapterId, rename fields |
| `ChapterModal.tsx`      | `SubjectModal.tsx`           | Add categoryId, rename fields   |
| `useSubjects.ts`        | `useRiddleCategories.ts`     | Rename query key + function     |
| `useChapters.ts`        | `useRiddleSubjects.ts`       | Rename query key + function     |
| `useQuestions.ts`       | `useRiddleMcqs.ts`           | Rename query key + function     |
| `useSubjectMutation.ts` | useRiddleMutations (part of) | Add category mutations          |
| `FilterPanel.tsx`       | `RiddleFilterPanel.tsx`      | Add category row                |
| `QuizMcqContainer.tsx`  | `RiddleMcqContainer.tsx`     | Update all imports + hooks      |

### Write Fresh (Cannot Copy)

| File                          | Reason                                                    |
| ----------------------------- | --------------------------------------------------------- |
| `RiddleModal.tsx`             | Dynamic options (2/3/4/text) — quiz has fixed 4 options   |
| `RiddleQuestionManager.tsx`   | Shows category column, hint/explanation indicators        |
| Options validation in service | Quiz validates True/False, Riddle validates 2/3/4 options |

---

## Per-File Implementation Process

Follow this exact process for every backend file:

### Step 1: Remove

- Delete the existing riddle file completely

### Step 2: Copy

- Copy the equivalent quiz file
- Rename the file to the riddle equivalent

### Step 3: Edit

- Find/replace all naming (Subject→Category, Chapter→Subject, Question→Riddle)
- Add riddle-specific code from the plan (hint, answer, level validation)
- Remove quiz-specific code that does not apply

### Step 4: Check

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

- Check terminal for errors

### Step 5: Fix

- If errors exist → fix them one by one
- Run tsc --noEmit again after each fix

### Step 6: Re-check

- Run tsc --noEmit again
- If errors still exist → go back to Step 5
- If zero errors → move to next file

### Step 7: Confirm Clean

- ✅ Zero TypeScript errors
- ✅ Zero lint errors
- ✅ Backend starts without crash
- ✅ Only then → move to next file

---

## Per-Feature Verification (Run After Each Feature)

### Step 1: Compile Checks

```bash
# Backend
cd apps/backend && npx tsc --noEmit

# Frontend
cd apps/frontend && npx tsc --noEmit
```

### Step 2: Backend API Checks (Test in Swagger/Postman)

- [ ] Success case returns correct data shape
- [ ] Error case returns correct error message
- [ ] Auth protected endpoints reject without token
- [ ] Public endpoints work without token

### Step 3: Frontend UI Checks (Test in Browser)

- [ ] Modal opens correctly
- [ ] Form pre-fills on edit
- [ ] Form validates required fields
- [ ] Submit calls correct API
- [ ] Success closes modal and refreshes list
- [ ] Error shows error message

### Step 4: Integration Checks (Full Flow)

- [ ] Create from UI → appears in list
- [ ] Edit from UI → updates in list
- [ ] Delete from UI → removed from list
- [ ] Cache invalidates after mutation
- [ ] Query refetches after mutation

### Step 5: Feature-Specific Checks

See per-feature checklist at end of each feature section.

---

## FEATURE 1: Category Management

### Backend

#### 1.1 Entity Check

**File:** `apps/backend/src/riddle-mcq/entities/riddle-category.entity.ts`  
**Status:** MODIFY  
**Changes:** None needed - entity is complete

#### 1.2 DTOs

**File:** `apps/backend/src/riddle-mcq/dto/riddle-mcq.dto.ts`  
**Status:** MODIFY  
**Add these DTOs:**

```typescript
// ADD at top of file
export class CreateRiddleCategoryDto {
  @ApiProperty({ example: 'Logic Puzzles' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'logic-puzzles' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: '🧩' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRiddleCategoryDto extends PartialType(CreateRiddleCategoryDto) {}
```

#### 1.3 Service Methods

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.service.ts`  
**Status:** MODIFY  
**Add cache pattern and methods:**

```typescript
// ADD cache pattern at top of service class
private readonly CACHE_KEYS = {
  CATEGORIES: (active: boolean) => `riddle-mcq:categories:${active ? 'active' : 'all'}`,
  SUBJECTS: (active: boolean) => `riddle-mcq:subjects:${active ? 'active' : 'all'}`,
  MCQS: (subject, level, page, pageSize) => `riddle-mcq:mcqs:${subject || 'all'}:${level || 'all'}:${page}:${pageSize}`,
  FILTER_COUNTS: (category, subject, level) => `riddle-mcq:filter-counts:${category || 'all'}:${subject || 'all'}:${level || 'all'}`,
};

private readonly CACHE_TTL = {
  CATEGORIES: 600,    // 10 minutes
  SUBJECTS: 600,       // 10 minutes
  MCQS: 300,           // 5 minutes
  FILTER_COUNTS: 300,  // 5 minutes
};

// ADD these methods
async findAllCategories(includeInactive: boolean = false): Promise<RiddleCategory[]> {
  const cacheKey = this.CACHE_KEYS.CATEGORIES(includeInactive);
  const cached = await this.cacheService.get<RiddleCategory[]>(cacheKey);
  if (cached) return cached;

  const where = includeInactive ? {} : { isActive: true };
  const categories = await this.riddleCategoryRepo.find({
    where,
    order: { order: 'ASC', name: 'ASC' },
  });

  await this.cacheService.set(cacheKey, categories, this.CACHE_TTL.CATEGORIES);
  return categories;
}

async findCategoryById(id: string): Promise<RiddleCategory> {
  return this.riddleCategoryRepo.findOne({ where: { id } });
}

async createCategory(dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
  const category = this.riddleCategoryRepo.create(dto);
  const saved = await this.riddleCategoryRepo.save(category);
  await this.cacheService.delPattern('riddle-mcq:*');
  return saved;
}

async updateCategory(id: string, dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
  const category = await this.findCategoryById(id);
  Object.assign(category, dto);
  const saved = await this.riddleCategoryRepo.save(category);
  await this.cacheService.delPattern('riddle-mcq:*');
  return saved;
}

async deleteCategory(id: string): Promise<void> {
  // Cascade delete subjects and riddles
  const category = await this.findCategoryById(id);
  if (!category) throw new NotFoundException('Category not found');

  // Delete all subjects under this category (cascade to riddles)
  const subjects = await this.riddleSubjectRepo.find({ where: { categoryId: id } });
  for (const subject of subjects) {
    await this.riddleMcqRepo.delete({ subjectId: subject.id });
  }
  await this.riddleSubjectRepo.delete({ categoryId: id });
  await this.riddleCategoryRepo.delete(id);

  await this.cacheService.delPattern('riddle-mcq:*');
}
```

#### 1.4 Controller Endpoints

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.controller.ts`  
**Status:** MODIFY  
**Add these endpoints:**

```typescript
// ADD in controller class
@Get('categories')
@ApiOperation({ summary: 'Get all active categories (public)' })
async getCategories(): Promise<RiddleCategory[]> {
  return this.riddleMcqService.findAllCategories(false);
}

@Get('categories/all')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get all categories including inactive (admin)' })
async getAllCategories(): Promise<RiddleCategory[]> {
  return this.riddleMcqService.findAllCategories(true);
}

@Get('categories/:id')
@ApiOperation({ summary: 'Get category by ID (public)' })
async getCategoryById(@Param('id') id: string): Promise<RiddleCategory> {
  return this.riddleMcqService.findCategoryById(id);
}

@Post('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Create category (admin)' })
async createCategory(@Body() dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
  return this.riddleMcqService.createCategory(dto);
}

@Patch('categories/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Update category (admin)' })
async updateCategory(
  @Param('id') id: string,
  @Body() dto: UpdateRiddleCategoryDto
): Promise<RiddleCategory> {
  return this.riddleMcqService.updateCategory(id, dto);
}

@Delete('categories/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete category (admin)' })
async deleteCategory(@Param('id') id: string): Promise<{ message: string }> {
  await this.riddleMcqService.deleteCategory(id);
  return { message: 'Category deleted successfully' };
}
```

---

### Frontend

#### 1.5 API Functions

**File:** `apps/frontend/src/lib/riddle-mcq-api.ts`  
**Status:** MODIFY  
**Add these functions:**

```typescript
// ADD after existing functions
export async function getCategories(): Promise<RiddleCategory[]> {
  const response = await api.get<RiddleCategory[]>('/riddle-mcq/categories');
  return response.data;
}

export async function getAllCategories(): Promise<RiddleCategory[]> {
  const response = await api.get<RiddleCategory[]>('/riddle-mcq/categories/all', { isAdmin: true });
  return response.data;
}

export async function createCategory(dto: CreateCategoryDto): Promise<RiddleCategory> {
  const response = await api.post<RiddleCategory>('/riddle-mcq/categories', dto, { isAdmin: true });
  return response.data;
}

export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<RiddleCategory> {
  const response = await api.patch<RiddleCategory>(`/riddle-mcq/categories/${id}`, dto, {
    isAdmin: true,
  });
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/categories/${id}`, { isAdmin: true });
}
```

#### 1.6 TypeScript Types

**File:** `apps/frontend/src/types/riddles.ts`  
**Status:** MODIFY  
**Add these types:**

```typescript
// ADD after RiddleCategory interface
export interface CreateCategoryDto {
  name: string;
  slug?: string;
  emoji: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface RiddleCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}
```

#### 1.7 Hook

**File:** `apps/frontend/src/features/riddle-mcq/hooks/useRiddleCategories.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/lib/riddle-mcq-api';

export function useRiddleCategories() {
  return useQuery({
    queryKey: ['riddle-categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### 1.8 CategoryModal Component

**File:** `apps/frontend/src/features/riddle-mcq/modals/CategoryModal.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { RiddleCategory, CreateCategoryDto } from '@/types/riddles';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  emoji: z.string().min(1, 'Emoji is required'),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

interface CategoryModalProps {
  open: boolean;
  category?: RiddleCategory;
  onClose: () => void;
  onSubmit: (dto: CreateCategoryDto) => void;
}

export function CategoryModal({ open, category, onClose, onSubmit }: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryDto>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      emoji: '',
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(category || { name: '', emoji: '', order: 0, isActive: true });
    }
  }, [open, category, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{category ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Emoji</label>
            <input
              {...register('emoji')}
              placeholder="🧩"
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.emoji && <p className="text-sm text-red-500">{errors.emoji.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Order</label>
            <input
              type="number"
              {...register('order', { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} id="isActive" />
            <label htmlFor="isActive" className="text-sm font-medium">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 1.9 Test Checklist - Category

- [ ] GET /riddle-mcq/categories returns active categories only (public)
- [ ] GET /riddle-mcq/categories/all requires admin auth
- [ ] POST /riddle-mcq/categories creates new category
- [ ] PATCH /riddle-mcq/categories/:id updates category
- [ ] DELETE /riddle-mcq/categories/:id deletes category
- [ ] Deleting category cascades to delete all subjects
- [ ] Deleting category cascades to delete all riddles under those subjects
- [ ] CategoryModal opens for create
- [ ] CategoryModal opens for edit with pre-filled data
- [ ] Category form validates required fields
- [ ] useRiddleCategories hook fetches and caches data

#### 1.10 Verification Steps - Category

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (Swagger/Postman)**

- [ ] GET /riddle-mcq/categories → returns array of categories
- [ ] GET /riddle-mcq/categories/all → 401 without token, data with token
- [ ] POST /riddle-mcq/categories → creates category, returns created object
- [ ] PATCH /riddle-mcq/categories/:id → updates category
- [ ] DELETE /riddle-mcq/categories/:id → deletes category

**Step 3: Frontend UI (Browser DevTools)**

- [ ] Filter panel shows category chips
- [ ] Click "+ Add" → CategoryModal opens
- [ ] Fill form, submit → modal closes, category appears
- [ ] Click category chip → URL updates, count filters

**Step 4: Integration**

- [ ] Create category from UI → appears in filter chips
- [ ] Edit category → changes reflect immediately
- [ ] Delete category → removed from chips, subjects also deleted

**Step 5: Feature-Specific**

- [ ] Create category with emoji "🧩" → shows in filter panel
- [ ] Create category with order=1 → appears before order=0
- [ ] Deactivate category → disappears from public endpoint

---

## FEATURE 2: Subject Management

### Backend

#### 2.1 Entity Check

**File:** `apps/backend/src/riddle-mcq/entities/riddle-subject.entity.ts`  
**Status:** MODIFY  
**Changes:** None needed - entity is complete

#### 2.2 DTOs

**File:** `apps/backend/src/riddle-mcq/dto/riddle-mcq.dto.ts`  
**Status:** MODIFY  
**Add these DTOs:**

```typescript
// ADD after Category DTOs
export class CreateRiddleSubjectDto {
  @ApiProperty({ example: 'Brain Teasers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'brain-teasers' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: '🧠' })
  @IsString()
  @IsNotEmpty()
  emoji: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRiddleSubjectDto extends PartialType(CreateRiddleSubjectDto) {}
```

#### 2.3 Service Methods

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.service.ts`  
**Status:** MODIFY  
**Add these methods:**

```typescript
// ADD after category methods
async findAllSubjects(includeInactive: boolean = false, hasContentOnly: boolean = false): Promise<RiddleSubject[]> {
  // NOTE: When hasContentOnly=true, skip cache and query fresh
  // (async filter on cached array doesn't work - returns Promises not results)
  if (!hasContentOnly) {
    const cacheKey = this.CACHE_KEYS.SUBJECTS(includeInactive);
    const cached = await this.cacheService.get<RiddleSubject[]>(cacheKey);
    if (cached) return cached;
  }

  const where = includeInactive ? {} : { isActive: true };
  let subjects = await this.riddleSubjectRepo.find({
    where,
    relations: ['category'],
    order: { order: 'ASC', name: 'ASC' },
  });

  // Filter to subjects with content if requested
  if (hasContentOnly) {
    const subjectsWithContent: RiddleSubject[] = [];
    for (const subject of subjects) {
      const count = await this.riddleMcqRepo.count({ where: { subjectId: subject.id } });
      if (count > 0) {
        subjectsWithContent.push(subject);
      }
    }
    subjects = subjectsWithContent;
  }

  if (!hasContentOnly) {
    await this.cacheService.set(this.CACHE_KEYS.SUBJECTS(includeInactive), subjects, this.CACHE_TTL.SUBJECTS);
  }
  return subjects;
}

async findSubjectBySlug(slug: string): Promise<RiddleSubject> {
  return this.riddleSubjectRepo.findOne({
    where: { slug },
    relations: ['category'],
  });
}

async findSubjectMeta(slug: string): Promise<{ name: string; emoji: string; slug: string }> {
  const subject = await this.findSubjectBySlug(slug);
  return { name: subject.name, emoji: subject.emoji, slug: subject.slug };
}

async createSubject(dto: CreateRiddleSubjectDto): Promise<RiddleSubject> {
  const subject = this.riddleSubjectRepo.create(dto);
  const saved = await this.riddleSubjectRepo.save(subject);
  await this.cacheService.delPattern('riddle-mcq:*');
  return saved;
}

async updateSubject(id: string, dto: UpdateRiddleSubjectDto): Promise<RiddleSubject> {
  const subject = await this.riddleSubjectRepo.findOne({ where: { id } });
  if (!subject) throw new NotFoundException('Subject not found');
  Object.assign(subject, dto);
  const saved = await this.riddleSubjectRepo.save(subject);
  await this.cacheService.delPattern('riddle-mcq:*');
  return saved;
}

async deleteSubject(id: string): Promise<void> {
  // Cascade delete riddles
  await this.riddleMcqRepo.delete({ subjectId: id });
  await this.riddleSubjectRepo.delete(id);
  await this.cacheService.delPattern('riddle-mcq:*');
}
```

#### 2.4 Controller Endpoints

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.controller.ts`  
**Status:** MODIFY  
**Add these endpoints:**

```typescript
// ADD after category endpoints
@Get('subjects')
@ApiOperation({ summary: 'Get all active subjects (public)' })
async getSubjects(
  @Query('hasContent') hasContent?: string
): Promise<RiddleSubject[]> {
  return this.riddleMcqService.findAllSubjects(false, hasContent === 'true');
}

@Get('subjects/all')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get all subjects including inactive (admin)' })
async getAllSubjects(): Promise<RiddleSubject[]> {
  return this.riddleMcqService.findAllSubjects(true);
}

@Get('subjects/:slug')
@ApiOperation({ summary: 'Get subject by slug (public)' })
async getSubjectBySlug(@Param('slug') slug: string): Promise<RiddleSubject> {
  return this.riddleMcqService.findSubjectBySlug(slug);
}

@Get('subjects/:slug/meta')
@ApiOperation({ summary: 'Get subject metadata (public)' })
async getSubjectMeta(@Param('slug') slug: string) {
  return this.riddleMcqService.findSubjectMeta(slug);
}

@Post('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Create subject (admin)' })
async createSubject(@Body() dto: CreateRiddleSubjectDto): Promise<RiddleSubject> {
  return this.riddleMcqService.createSubject(dto);
}

@Patch('subjects/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Update subject (admin)' })
async updateSubject(
  @Param('id') id: string,
  @Body() dto: UpdateRiddleSubjectDto
): Promise<RiddleSubject> {
  return this.riddleMcqService.updateSubject(id, dto);
}

@Delete('subjects/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete subject (admin)' })
async deleteSubject(@Param('id') id: string): Promise<{ message: string }> {
  await this.riddleMcqService.deleteSubject(id);
  return { message: 'Subject deleted successfully' };
}
```

---

### Frontend

#### 2.5 API Functions

**File:** `apps/frontend/src/lib/riddle-mcq-api.ts`  
**Status:** MODIFY  
**Add these functions:**

```typescript
// ADD after category functions
export async function getSubjects(hasContent?: boolean): Promise<RiddleSubject[]> {
  const url = hasContent ? '/riddle-mcq/subjects?hasContent=true' : '/riddle-mcq/subjects';
  const response = await api.get<RiddleSubject[]>(url);
  return response.data;
}

export async function createSubject(dto: CreateSubjectDto): Promise<RiddleSubject> {
  const response = await api.post<RiddleSubject>('/riddle-mcq/subjects', dto, { isAdmin: true });
  return response.data;
}

export async function updateSubject(id: string, dto: UpdateSubjectDto): Promise<RiddleSubject> {
  const response = await api.patch<RiddleSubject>(`/riddle-mcq/subjects/${id}`, dto, {
    isAdmin: true,
  });
  return response.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/riddle-mcq/subjects/${id}`, { isAdmin: true });
}
```

#### 2.6 TypeScript Types

**File:** `apps/frontend/src/types/riddles.ts`  
**Status:** MODIFY  
**Add these types:**

```typescript
// ADD after Category types
export interface CreateSubjectDto {
  name: string;
  slug?: string;
  emoji: string;
  categoryId?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateSubjectDto extends Partial<CreateSubjectDto> {}

export interface RiddleSubject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  categoryId: string | null;
  category?: { id: string; name: string; emoji: string; slug: string };
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}
```

#### 2.7 Hook

**File:** `apps/frontend/src/features/riddle-mcq/hooks/useRiddleSubjects.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getSubjects } from '@/lib/riddle-mcq-api';

export function useRiddleSubjects(categoryId?: string) {
  return useQuery({
    queryKey: ['riddle-subjects', categoryId],
    queryFn: () => getSubjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### 2.8 SubjectModal Component

**File:** `apps/frontend/src/features/riddle-mcq/modals/SubjectModal.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { RiddleSubject, CreateSubjectDto, RiddleCategory } from '@/types/riddles';

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  emoji: z.string().min(1, 'Emoji is required'),
  categoryId: z.string().optional(),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

interface SubjectModalProps {
  open: boolean;
  subject?: RiddleSubject;
  categoryId?: string;
  categories: RiddleCategory[];
  onClose: () => void;
  onSubmit: (dto: CreateSubjectDto) => void;
}

export function SubjectModal({ open, subject, categoryId, categories, onClose, onSubmit }: SubjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubjectDto>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      emoji: '',
      categoryId: categoryId || '',
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(subject || { name: '', emoji: '', categoryId: categoryId || '', order: 0, isActive: true });
    }
  }, [open, subject, categoryId, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{subject ? 'Edit Subject' : 'Add Subject'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Emoji</label>
            <input
              {...register('emoji')}
              placeholder="🧠"
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.emoji && <p className="text-sm text-red-500">{errors.emoji.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              {...register('categoryId')}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Order</label>
            <input
              type="number"
              {...register('order', { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} id="isActive" />
            <label htmlFor="isActive" className="text-sm font-medium">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : subject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 2.9 Test Checklist - Subject

- [ ] GET /riddle-mcq/subjects returns active subjects only (public)
- [ ] GET /riddle-mcq/subjects/all requires admin auth
- [ ] GET /riddle-mcq/subjects/:slug returns subject
- [ ] GET /riddle-mcq/subjects/:slug/meta returns lightweight {name, emoji, slug}
- [ ] POST /riddle-mcq/subjects creates new subject
- [ ] PATCH /riddle-mcq/subjects/:id updates subject
- [ ] DELETE /riddle-mcq/subjects/:id deletes subject
- [ ] Deleting subject cascades to delete all riddles
- [ ] SubjectModal opens for create
- [ ] SubjectModal opens for edit with pre-filled data
- [ ] Subject form validates required fields
- [ ] Subject shows category relationship

#### 2.10 Verification Steps - Subject

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (Swagger/Postman)**

- [ ] GET /riddle-mcq/subjects → returns array of subjects
- [ ] GET /riddle-mcq/subjects/:slug → returns subject with category
- [ ] GET /riddle-mcq/subjects/:slug/meta → returns {name, emoji, slug}
- [ ] POST /riddle-mcq/subjects → creates subject with categoryId
- [ ] DELETE /riddle-mcq/subjects/:id → deletes subject + riddles

**Step 3: Frontend UI (Browser DevTools)**

- [ ] Subject chips show under category filter
- [ ] Click "+ Add" → SubjectModal opens with category pre-selected
- [ ] Select category → subject linked correctly
- [ ] Subject shows emoji in chip

**Step 4: Integration**

- [ ] Create subject from UI → appears in subject chips
- [ ] Assign subject to category → shows under that category
- [ ] Delete subject → riddles also deleted

**Step 5: Feature-Specific**

- [ ] Subject appears under correct category in filter panel
- [ ] hasContentOnly=true filters subjects with riddles
- [ ] Slug auto-generated from name

---

## FEATURE 3: Riddle CRUD

### Backend

#### 3.1 Entity Update

**File:** `apps/backend/src/riddle-mcq/entities/riddle-mcq.entity.ts`  
**Status:** MODIFY  
**Changes:**

```typescript
// CHANGE level enum - remove 'extreme'
export enum RiddleMcqLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

// CHANGE level column
@Index()
@Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert'] })
level: RiddleMcqLevel;

// ADD these columns
@Column({ type: 'text', nullable: true })
hint: string | null;

@Column({ type: 'text', nullable: true })
answer: string | null;  // For expert level
```

#### 3.2 DTOs

**File:** `apps/backend/src/riddle-mcq/dto/riddle-mcq.dto.ts`  
**Status:** MODIFY  
**Replace riddle DTOs with:**

```typescript
// ADD riddle DTOs
export class CreateRiddleMcqDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ example: ['A piano', 'A keyboard'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  @ApiPropertyOptional({ example: 'A piano' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiProperty({ enum: RiddleMcqLevel })
  @IsEnum(RiddleMcqLevel)
  level: RiddleMcqLevel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateRiddleMcqDto extends PartialType(CreateRiddleMcqDto) {}
```

#### 3.3 Service Methods

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.service.ts`  
**Status:** MODIFY  
**Add validation method and riddle CRUD methods:**

```typescript
// ADD private validation method
private validateRiddleOptions(dto: CreateRiddleMcqDto): void {
  const { level, options, correctLetter } = dto;

  if (level === RiddleMcqLevel.EXPERT) {
    if (options && options.length > 0) {
      throw new BadRequestException('Expert level riddles should not have options');
    }
    if (correctLetter) {
      throw new BadRequestException('Expert level riddles should not have correctLetter');
    }
    if (!dto.answer || dto.answer.trim() === '') {
      throw new BadRequestException('Expert level riddles require an answer');
    }
    return;
  }

  const requiredOptions = { easy: 2, medium: 3, hard: 4 }[level];
  const validLetters = {
    easy: ['A', 'B'],
    medium: ['A', 'B', 'C'],
    hard: ['A', 'B', 'C', 'D'],
  }[level];

  if (!options || options.length < requiredOptions) {
    throw new BadRequestException(
      `${level} level requires exactly ${requiredOptions} options`
    );
  }

  if (!correctLetter || !validLetters.includes(correctLetter)) {
    throw new BadRequestException(
      `${level} level correctLetter must be one of: ${validLetters.join(', ')}`
    );
  }
}

// ADD riddle CRUD methods
async findAllRiddleMcqsAdmin(
  filters = {},
  pagination = { page: 1, pageSize: 10 }
): Promise<{ data: RiddleMcq[]; total: number; totalPages: number }> {
  const { category, subject, level, status, search } = filters;
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 10;

  let query = this.riddleMcqRepo
    .createQueryBuilder('riddle')
    .leftJoinAndSelect('riddle.subject', 'subject')
    .leftJoinAndSelect('subject.category', 'category');

  if (subject && subject !== 'all') {
    query = query.andWhere('subject.slug = :subject', { subject });
  }
  if (level && level !== 'all') {
    query = query.andWhere('riddle.level = :level', { level });
  }
  if (status && status !== 'all') {
    query = query.andWhere('riddle.status = :status', { status });
  }
  if (search) {
    query = query.andWhere('riddle.question ILIKE :search', { search: `%${search}%` });
  }

  const [data, total] = await query
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .orderBy('riddle.updatedAt', 'DESC')
    .getManyAndCount();

  return { data, total, totalPages: Math.ceil(total / pageSize) };
}

async findRiddleMcqsBySubject(
  subjectId: string,
  level?: string
): Promise<{ data: RiddleMcq[]; total: number }> {
  let query = this.riddleMcqRepo
    .createQueryBuilder('riddle')
    .leftJoinAndSelect('riddle.subject', 'subject')
    .where('subjectId = :subjectId', { subjectId })
    .andWhere('riddle.status = :status', { status: ContentStatus.PUBLISHED });

  if (level) {
    query = query.andWhere('riddle.level = :level', { level });
  }

  const data = await query.orderBy('riddle.updatedAt', 'DESC').getMany();
  return { data, total: data.length };
}

async findMixedRiddleMcqs(): Promise<RiddleMcq[]> {
  return this.riddleMcqRepo.find({
    where: { status: ContentStatus.PUBLISHED },
    relations: ['subject'],
    order: { updatedAt: 'DESC' },
  });
}

async findRandomRiddleMcqs(level: string): Promise<RiddleMcq[]> {
  return this.riddleMcqRepo.find({
    where: { level: level as RiddleMcqLevel, status: ContentStatus.PUBLISHED },
    relations: ['subject'],
  });
}

async createRiddleMcq(dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
  this.validateRiddleOptions(dto);
  const riddle = this.riddleMcqRepo.create(dto);
  const saved = await this.riddleMcqRepo.save(riddle);
  await this.cacheService.delPattern('riddle-mcq:*');
  return saved;
}

async createRiddleMcqsBulk(dtos: CreateRiddleMcqDto[]): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  const CHUNK_SIZE = 100;

  for (let i = 0; i < dtos.length; i += CHUNK_SIZE) {
    const chunk = dtos.slice(i, i + CHUNK_SIZE);
    for (const dto of chunk) {
      try {
        this.validateRiddleOptions(dto);
        const riddle = this.riddleMcqRepo.create(dto);
        await this.riddleMcqRepo.save(riddle);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
  }

  await this.cacheService.delPattern('riddle-mcq:*');
  return { count: dtos.length - errors.length, errors };
}

async updateRiddleMcq(id: string, dto: UpdateRiddleMcqDto): Promise<RiddleMcq> {
  const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
  if (!riddle) throw new NotFoundException('Riddle not found');
  Object.assign(riddle, dto);
  const saved = await this.riddleMcqRepo.save(riddle);
  await this.cacheService.delPattern('riddle-mcq:*');
  return saved;
}

async deleteRiddleMcq(id: string): Promise<void> {
  await this.riddleMcqRepo.delete(id);
  await this.cacheService.delPattern('riddle-mcq:*');
}
```

#### 3.4 Controller Endpoints

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.controller.ts`  
**Status:** MODIFY  
**Add these endpoints:**

```typescript
// ADD riddle endpoints
@Get('all')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get all riddles with filters (admin)' })
async getAllRiddles(@Query() query: any): Promise<{ data: RiddleMcq[]; total: number; totalPages: number }> {
  const filters = {
    category: query.category,
    subject: query.subject,
    level: query.level,
    status: query.status,
    search: query.search,
  };
  const pagination = { page: parseInt(query.page) || 1, pageSize: parseInt(query.pageSize) || 10 };
  return this.riddleMcqService.findAllRiddleMcqsAdmin(filters, pagination);
}

@Get('subjects/:subjectId/mcqs')
@ApiOperation({ summary: 'Get riddles by subject (public)' })
async getRiddlesBySubject(
  @Param('subjectId') subjectId: string,
  @Query('level') level?: string
): Promise<{ data: RiddleMcq[]; total: number }> {
  return this.riddleMcqService.findRiddleMcqsBySubject(subjectId, level);
}

@Get('mixed')
@ApiOperation({ summary: 'Get mixed riddles (public)' })
async getMixedRiddles(): Promise<RiddleMcq[]> {
  return this.riddleMcqService.findMixedRiddleMcqs();
}

@Get('random/:level')
@ApiOperation({ summary: 'Get random riddles by level (public)' })
async getRandomRiddles(@Param('level') level: string): Promise<RiddleMcq[]> {
  return this.riddleMcqService.findRandomRiddleMcqs(level);
}

@Post('mcqs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Create riddle (admin)' })
async createRiddle(@Body() dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
  return this.riddleMcqService.createRiddleMcq(dto);
}

@Post('mcqs/bulk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Bulk create riddles (admin)' })
async createRiddlesBulk(@Body() dtos: CreateRiddleMcqDto[]): Promise<{ count: number; errors: string[] }> {
  return this.riddleMcqService.createRiddleMcqsBulk(dtos);
}

@Patch('mcqs/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Update riddle (admin)' })
async updateRiddle(
  @Param('id') id: string,
  @Body() dto: UpdateRiddleMcqDto
): Promise<RiddleMcq> {
  return this.riddleMcqService.updateRiddleMcq(id, dto);
}

@Delete('mcqs/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete riddle (admin)' })
async deleteRiddle(@Param('id') id: string): Promise<{ message: string }> {
  await this.riddleMcqService.deleteRiddleMcq(id);
  return { message: 'Riddle deleted successfully' };
}
```

---

### Frontend

#### 3.5 Riddle Types

**File:** `apps/frontend/src/types/riddles.ts`  
**Status:** MODIFY  
**Update Riddle interface:**

```typescript
// UPDATE existing Riddle interface
export interface Riddle {
  id: string;
  question: string;
  options: string[] | null;
  correctLetter: string | null;
  answer?: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId: string;
  subject?: RiddleSubject;
  hint?: string;
  explanation?: string;
  status: 'published' | 'draft' | 'trash';
}

export interface CreateRiddleDto {
  question: string;
  options?: string[];
  correctLetter?: string;
  answer?: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  subjectId: string;
  hint?: string;
  explanation?: string;
  status?: 'published' | 'draft' | 'trash';
}

export interface UpdateRiddleDto extends Partial<CreateRiddleDto> {}
```

#### 3.6 Riddle Hooks

**File:** `apps/frontend/src/features/riddle-mcq/hooks/useRiddleMcqs.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllRiddles } from '@/lib/riddle-mcq-api';
import type { GetRiddlesParams } from '@/types/riddles';

export function useRiddleMcqs(filters: GetRiddlesParams, page: number, pageSize: number = 10) {
  return useQuery({
    queryKey: ['riddle-mcqs', filters, page, pageSize],
    queryFn: () => getAllRiddles(filters, page, pageSize),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });
}
```

#### 3.7 RiddleModal Component

**File:** `apps/frontend/src/features/riddle-mcq/modals/RiddleModal.tsx`  
**Status:** WRITE-FRESH  
**Create this file - KEY DIFFERENCE: dynamic options based on level:**

```typescript
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Riddle, CreateRiddleDto, RiddleSubject, RiddleCategory } from '@/types/riddles';

const LEVEL_OPTIONS = {
  easy: { optionCount: 2, validLetters: ['A', 'B'] },
  medium: { optionCount: 3, validLetters: ['A', 'B', 'C'] },
  hard: { optionCount: 4, validLetters: ['A', 'B', 'C', 'D'] },
  expert: { optionCount: 0, validLetters: [] },
};

const riddleSchema = z.object({
  question: z.string().min(1).max(1000),
  level: z.enum(['easy', 'medium', 'hard', 'expert']),
  subjectId: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctLetter: z.string().optional(),
  answer: z.string().optional(),
  hint: z.string().max(500).optional(),
  explanation: z.string().max(2000).optional(),
  status: z.enum(['draft', 'published', 'trash']).optional(),
}).refine((data) => {
  if (data.level === 'expert') {
    return !!data.answer && data.answer.trim().length > 0;
  }
  const required = LEVEL_OPTIONS[data.level]?.optionCount || 0;
  return (data.options?.length || 0) >= required;
}, {
  message: 'Invalid options for level',
});

interface RiddleModalProps {
  open: boolean;
  riddle?: Riddle;
  subjects: RiddleSubject[];
  categories: RiddleCategory[];
  onClose: () => void;
  onSubmit: (dto: CreateRiddleDto) => void;
}

export function RiddleModal({ open, riddle, subjects, categories, onClose, onSubmit }: RiddleModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRiddleDto>({
    resolver: zodResolver(riddleSchema),
    defaultValues: {
      question: '',
      level: 'easy',
      subjectId: '',
      options: ['', ''],
      correctLetter: 'A',
      hint: '',
      explanation: '',
      status: 'draft',
    },
  });

  const currentLevel = watch('level');

  useEffect(() => {
    if (open) {
      if (riddle) {
        reset({
          question: riddle.question,
          level: riddle.level,
          subjectId: riddle.subjectId,
          options: riddle.options || ['', ''],
          correctLetter: riddle.correctLetter || 'A',
          answer: riddle.answer || '',
          hint: riddle.hint || '',
          explanation: riddle.explanation || '',
          status: riddle.status,
        });
      } else {
        reset({
          question: '',
          level: 'easy',
          subjectId: '',
          options: ['', ''],
          correctLetter: 'A',
          hint: '',
          explanation: '',
          status: 'draft',
        });
      }
    }
  }, [open, riddle, reset]);

  const handleLevelChange = (newLevel: string) => {
    setValue('level', newLevel as CreateRiddleDto['level']);
    if (newLevel === 'expert') {
      setValue('options', []);
      setValue('correctLetter', undefined);
    } else {
      const optionCount = LEVEL_OPTIONS[newLevel]?.optionCount || 2;
      const currentOptions = getValues('options') || [];
      setValue('options', currentOptions.slice(0, optionCount));
      const letter = getValues('correctLetter');
      const validLetters = LEVEL_OPTIONS[newLevel]?.validLetters || ['A', 'B'];
      if (letter && !validLetters.includes(letter)) {
        setValue('correctLetter', validLetters[0]);
      }
    }
  };

  if (!open) return null;

  const isExpert = currentLevel === 'expert';
  const optionCount = LEVEL_OPTIONS[currentLevel]?.optionCount || 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{riddle ? 'Edit Riddle' : 'Add Riddle'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="mb-1 block text-sm font-medium">Subject</label>
            <select
              {...register('subjectId')}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
            {errors.subjectId && <p className="text-sm text-red-500">{errors.subjectId.message}</p>}
          </div>

          {/* Level */}
          <div>
            <label className="mb-1 block text-sm font-medium">Level</label>
            <select
              value={currentLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="easy">🌱 Easy (2 options)</option>
              <option value="medium">🌿 Medium (3 options)</option>
              <option value="hard">🌲 Hard (4 options)</option>
              <option value="expert">🔥 Expert (text answer)</option>
            </select>
          </div>

          {/* Question */}
          <div>
            <label className="mb-1 block text-sm font-medium">Question</label>
            <textarea
              {...register('question')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.question && <p className="text-sm text-red-500">{errors.question.message}</p>}
          </div>

          {/* Options (not for expert) */}
          {!isExpert && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Options</label>
              {Array.from({ length: optionCount }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    {...register(`options.${i}`)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-lg border border-gray-300 p-2"
                  />
                </div>
              ))}
              {errors.options && <p className="text-sm text-red-500">{errors.options.message as string}</p>}
            </div>
          )}

          {/* Correct Letter (not for expert) */}
          {!isExpert && (
            <div>
              <label className="mb-1 block text-sm font-medium">Correct Answer</label>
              <select
                {...register('correctLetter')}
                className="w-full rounded-lg border border-gray-300 p-2"
              >
                {LEVEL_OPTIONS[currentLevel]?.validLetters.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Answer (expert only) */}
          {isExpert && (
            <div>
              <label className="mb-1 block text-sm font-medium">Answer (required)</label>
              <input
                {...register('answer')}
                placeholder="Type the correct answer"
                className="w-full rounded-lg border border-gray-300 p-2"
              />
              {errors.answer && <p className="text-sm text-red-500">{errors.answer.message}</p>}
            </div>
          )}

          {/* Hint */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Hint <span className="text-gray-400">(optional, max 500)</span>
            </label>
            <input
              {...register('hint')}
              placeholder="Show hint before answering"
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.hint && <p className="text-sm text-red-500">{errors.hint.message}</p>}
          </div>

          {/* Explanation */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Explanation <span className="text-gray-400">(optional, max 2000)</span>
            </label>
            <textarea
              {...register('explanation')}
              rows={2}
              placeholder="Shown in results review"
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.explanation && <p className="text-sm text-red-500">{errors.explanation.message}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="trash">Trash</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : riddle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 3.8 Test Checklist - Riddle CRUD

- [ ] Easy riddle requires exactly 2 options, correctLetter A or B
- [ ] Medium riddle requires exactly 3 options, correctLetter A, B, or C
- [ ] Hard riddle requires exactly 4 options, correctLetter A, B, C, or D
- [ ] Expert riddle has no options, no correctLetter, requires answer
- [ ] hint field saves (max 500 chars)
- [ ] explanation field saves (max 2000 chars)
- [ ] RiddleModal shows correct options for each level
- [ ] RiddleModal switches to text answer for expert level
- [ ] Level change handler resets options correctly
- [ ] POST /riddle-mcq/mcqs creates riddle
- [ ] PATCH /riddle-mcq/mcqs/:id updates riddle
- [ ] DELETE /riddle-mcq/mcqs/:id deletes riddle

#### 3.9 Verification Steps - Riddle CRUD

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (Swagger/Postman)**

- [ ] POST with Easy (2 options, correctLetter=B) → 201 Created
- [ ] POST with Medium (3 options, correctLetter=C) → 201 Created
- [ ] POST with Hard (4 options, correctLetter=D) → 201 Created
- [ ] POST with Expert (answer="piano") → 201 Created
- [ ] POST Easy with 4 options → 400 Bad Request
- [ ] POST Medium with correctLetter=D → 400 Bad Request
- [ ] POST Expert with options → 400 Bad Request
- [ ] POST Expert without answer → 400 Bad Request
- [ ] hint and explanation saved correctly

**Step 3: Frontend UI (Browser DevTools)**

- [ ] Select Easy → shows 2 option inputs (A, B), correctLetter dropdown
- [ ] Select Medium → shows 3 option inputs (A, B, C), correctLetter dropdown
- [ ] Select Hard → shows 4 option inputs (A, B, C, D), correctLetter dropdown
- [ ] Select Expert → shows single text input for answer, no options
- [ ] Switch from Easy to Medium → resets to 3 options, clears invalid correctLetter
- [ ] Switch to Expert → hides options, shows answer input
- [ ] hint field (max 500 chars) works
- [ ] explanation field (max 2000 chars) works

**Step 4: Integration**

- [ ] Create riddle from UI → appears in table
- [ ] Edit riddle → changes reflect
- [ ] Switch level on edit → options reset correctly

**Step 5: Feature-Specific**

- [ ] Easy riddle with hint → hint badge shows in table
- [ ] Expert riddle shows "text" badge instead of options count
- [ ] level enum does NOT include "extreme"

---

## FEATURE 4: Filters + Filter Counts

### Backend

#### 4.1 Filter Counts Endpoint

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.controller.ts`  
**Status:** MODIFY  
**Add this endpoint:**

```typescript
@Get('filter-counts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get filter counts (admin)' })
@ApiQuery({ name: 'category', required: false })
@ApiQuery({ name: 'subject', required: false })
@ApiQuery({ name: 'level', required: false })
@ApiQuery({ name: 'status', required: false })
@ApiQuery({ name: 'search', required: false })
async getFilterCounts(
  @Query('category') category?: string,
  @Query('subject') subject?: string,
  @Query('level') level?: string,
  @Query('status') status?: string,
  @Query('search') search?: string
) {
  return this.riddleMcqService.getFilterCounts({ category, subject, level, status, search });
}
```

#### 4.2 Filter Counts Service Method

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.service.ts`  
**Status:** MODIFY  
**Add this method:**

```typescript
async getFilterCounts(filters = {}): Promise<{
  categoryCounts: { id: string; name: string; emoji: string; count: number }[];
  subjectCounts: { id: string; name: string; emoji: string; count: number }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}> {
  const { category, subject, level, status, search } = filters;

  // Build base query
  let baseQuery = this.riddleMcqRepo.createQueryBuilder('riddle')
    .leftJoinAndSelect('riddle.subject', 'subject')
    .leftJoinAndSelect('subject.category', 'category');

  if (subject && subject !== 'all') {
    baseQuery = baseQuery.andWhere('subject.slug = :subject', { subject });
  }
  if (level && level !== 'all') {
    baseQuery = baseQuery.andWhere('riddle.level = :level', { level });
  }
  if (status && status !== 'all') {
    baseQuery = baseQuery.andWhere('riddle.status = :status', { status });
  }
  if (search) {
    baseQuery = baseQuery.andWhere('riddle.question ILIKE :search', { search: `%${search}%` });
  }

  // Category counts
  const categoryCounts = await this.riddleCategoryRepo
    .createQueryBuilder('cat')
    .leftJoin('riddle_subjects', 'sub', 'sub.categoryId = cat.id')
    .leftJoin('riddle_mcqs', 'r', 'r.subjectId = sub.id')
    .select('cat.id', 'id')
    .addSelect('cat.name', 'name')
    .addSelect('cat.emoji', 'emoji')
    .addSelect('COUNT(DISTINCT r.id)', 'count')
    .groupBy('cat.id')
    .getRawMany();

  // Subject counts
  const subjectCounts = await this.riddleSubjectRepo
    .createQueryBuilder('sub')
    .leftJoin('riddle_mcqs', 'r', 'r.subjectId = sub.id')
    .select('sub.id', 'id')
    .addSelect('sub.name', 'name')
    .addSelect('sub.emoji', 'emoji')
    .addSelect('COUNT(r.id)', 'count')
    .groupBy('sub.id')
    .getRawMany();

  // Level counts
  const levelCounts = await this.riddleMcqRepo
    .createQueryBuilder('riddle')
    .select('riddle.level', 'level')
    .addSelect('COUNT(*)', 'count')
    .groupBy('riddle.level')
    .getRawMany();

  // Status counts
  const statusCounts = await this.riddleMcqRepo
    .createQueryBuilder('riddle')
    .select('riddle.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .groupBy('riddle.status')
    .getRawMany();

  // Total
  const total = await this.riddleMcqRepo.count();

  return {
    categoryCounts,
    subjectCounts,
    levelCounts,
    statusCounts,
    total,
  };
}
```

---

### Frontend

#### 4.3 useRiddleFilters Hook

**File:** `apps/frontend/src/features/riddle-mcq/hooks/useRiddleFilters.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export function useRiddleFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = {
    category: searchParams.get('category') || 'all',
    subject: searchParams.get('subject') || 'all',
    level: searchParams.get('level') || 'all',
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
  };

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filter changes (except page)
    if (key !== 'page' && key !== 'pageSize') {
      params.set('page', '1');
    }
    // Reset subject when category changes
    if (key === 'category') {
      params.set('subject', 'all');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    router.push('?', { scroll: false });
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const setPageSize = (s: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', String(s));
    params.set('page', '1');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return { filters, setFilter, resetFilters, page, pageSize, setPage, setPageSize };
}
```

#### 4.4 useRiddleFilterCounts Hook

**File:** `apps/frontend/src/features/riddle-mcq/hooks/useRiddleFilterCounts.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { getRiddleFilterCounts } from '@/lib/riddle-mcq-api';
import type { GetRiddlesParams } from '@/types/riddles';

export function useRiddleFilterCounts(filters: GetRiddlesParams) {
  return useQuery({
    queryKey: ['riddle-filter-counts', filters],
    queryFn: () => getRiddleFilterCounts(filters),
    staleTime: 60 * 1000,
  });
}
```

#### 4.5 Filter Panel Component

**File:** `apps/frontend/src/features/riddle-mcq/RiddleFilterPanel.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { Search, X } from 'lucide-react';
import type { RiddleCategory, RiddleSubject } from '@/types/riddles';

interface FilterPanelProps {
  filters: {
    category: string;
    subject: string;
    level: string;
    status: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  categories: RiddleCategory[];
  subjects: RiddleSubject[];
  filterCounts?: {
    categoryCounts: { id: string; name: string; emoji: string; count: number }[];
    subjectCounts: { id: string; name: string; emoji: string; count: number }[];
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

export function RiddleFilterPanel({
  filters,
  onFilterChange,
  onReset,
  categories,
  subjects,
  filterCounts,
  isLoading,
  onAddCategory,
  onAddSubject,
}: FilterPanelProps) {
  const levels = ['all', 'easy', 'medium', 'hard', 'expert'];
  const statuses = ['all', 'published', 'draft', 'trash'];

  return (
    <div className="space-y-4 rounded-xl bg-white p-4 shadow">
      {/* Category Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Category:</span>
        <button
          onClick={() => onFilterChange('category', 'all')}
          className={`rounded-full px-3 py-1 text-sm ${
            filters.category === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const count = filterCounts?.categoryCounts?.find((c) => c.id === cat.id)?.count || 0;
          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange('category', cat.slug)}
              className={`rounded-full px-3 py-1 text-sm ${
                filters.category === cat.slug ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.emoji} {cat.name} ({count})
            </button>
          );
        })}
        <button onClick={onAddCategory} className="rounded-full px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50">
          + Add
        </button>
      </div>

      {/* Subject Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Subject:</span>
        <button
          onClick={() => onFilterChange('subject', 'all')}
          className={`rounded-full px-3 py-1 text-sm ${
            filters.subject === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All
        </button>
        {subjects.map((sub) => {
          const count = filterCounts?.subjectCounts?.find((s) => s.id === sub.id)?.count || 0;
          return (
            <button
              key={sub.id}
              onClick={() => onFilterChange('subject', sub.slug)}
              className={`rounded-full px-3 py-1 text-sm ${
                filters.subject === sub.slug ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {sub.emoji} {sub.name} ({count})
            </button>
          );
        })}
        <button onClick={onAddSubject} className="rounded-full px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50">
          + Add
        </button>
      </div>

      {/* Level Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Level:</span>
        {levels.map((level) => {
          const count = filterCounts?.levelCounts?.find((l) => l.level === level)?.count || 0;
          const label = level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1);
          return (
            <button
              key={level}
              onClick={() => onFilterChange('level', level)}
              className={`rounded-full px-3 py-1 text-sm ${
                filters.level === level ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Status Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        {statuses.map((status) => {
          const count = filterCounts?.statusCounts?.find((s) => s.status === status)?.count || 0;
          const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1);
          return (
            <button
              key={status}
              onClick={() => onFilterChange('status', status)}
              className={`rounded-full px-3 py-1 text-sm ${
                filters.status === status ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search riddles..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4"
          />
        </div>
        {filters.search && (
          <button
            onClick={() => onFilterChange('search', '')}
            className="rounded-lg border border-gray-300 px-3 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 px-4 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Total Count */}
      <div className="border-t pt-2 text-sm text-gray-500">
        Total: {filterCounts?.total || 0} riddles
      </div>
    </div>
  );
}
```

#### 4.6 Test Checklist - Filters

- [ ] Category filter changes updates subject to 'all'
- [ ] Level filter shows correct counts
- [ ] Status filter shows correct counts
- [ ] Search filters riddles in real-time
- [ ] Reset clears all filters
- [ ] URL updates on filter change
- [ ] Page resets to 1 on filter change
- [ ] GET /riddle-mcq/filter-counts returns all counts
- [ ] useRiddleFilterCounts hook fetches and caches counts

#### 4.7 Verification Steps - Filters

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (Swagger/Postman)**

- [ ] GET /riddle-mcq/filter-counts → returns all count objects
- [ ] GET /riddle-mcq/filter-counts?category=X → filtered counts
- [ ] GET /riddle-mcq/filter-counts?level=easy → easy counts
- [ ] GET /riddle-mcq/filter-counts?status=published → published counts

**Step 3: Frontend UI (Browser DevTools)**

- [ ] Filter panel shows 5 rows: Category, Subject, Level, Status, Search
- [ ] Click category chip → subject resets to "All"
- [ ] URL shows ?category=slug in address bar
- [ ] Search input typing → debounced filter
- [ ] Click "Reset" → clears all URL params

**Step 4: Integration**

- [ ] Filter by category → riddles list updates
- [ ] Filter by level → counts update in real-time
- [ ] Change category → subject filter resets to "All"

**Step 5: Feature-Specific**

- [ ] Status dashboard shows Total/Published/Draft/Trash counts
- [ ] Copy URL with filters → paste in new tab → same filters applied
- [ ] Page size selector changes items per page

---

> **NOTE:** `useRiddleMutations` (defined in Feature 5) contains ALL mutations for all features: Category, Subject, Riddle CRUD, Bulk Actions, and Import. Features 1-4 reference it - mutations are NOT created per feature.

## FEATURE 5: Bulk Actions

### Backend

#### 5.1 Bulk Action Endpoint

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.controller.ts`  
**Status:** MODIFY  
**Add this endpoint:**

```typescript
@Post('mcqs/bulk-action')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Bulk action on riddles (admin)' })
async bulkAction(
  @Body() body: { ids: string[]; action: 'publish' | 'draft' | 'trash' | 'delete' | 'restore' }
): Promise<{ success: boolean; processed: number; succeeded: number; failed: number; message: string }> {
  const { ids, action } = body;
  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      if (action === 'delete') {
        await this.riddleMcqService.deleteRiddleMcq(id);
      } else {
        const status = action === 'restore' ? ContentStatus.DRAFT : ContentStatus[action.toUpperCase()];
        await this.riddleMcqService.updateRiddleMcq(id, { status });
      }
      succeeded++;
    } catch {
      failed++;
    }
  }

  await this.cacheService.delPattern('riddle-mcq:*');

  return {
    success: failed === 0,
    processed: ids.length,
    succeeded,
    failed,
    message: `Bulk ${action} completed: ${succeeded} succeeded, ${failed} failed`,
  };
}
```

---

### Frontend

#### 5.2 Bulk Action API

**File:** `apps/frontend/src/lib/riddle-mcq-api.ts`  
**Status:** MODIFY  
**Add this function:**

```typescript
export async function bulkActionRiddles(
  ids: string[],
  action: 'delete' | 'trash' | 'publish' | 'draft' | 'restore'
): Promise<{
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  message: string;
}> {
  const response = await api.post(
    '/riddle-mcq/mcqs/bulk-action',
    { ids, action },
    { isAdmin: true }
  );
  return response.data;
}
```

#### 5.3 Bulk Actions in useRiddleMutations

**File:** `apps/frontend/src/features/riddle-mcq/hooks/useRiddleMutations.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubject,
  updateSubject,
  deleteSubject,
  createRiddle,
  updateRiddle,
  deleteRiddle,
  bulkActionRiddles,
  bulkCreateRiddles,
} from '@/lib/riddle-mcq-api';
import type { CreateCategoryDto, CreateSubjectDto, CreateRiddleDto } from '@/types/riddles';

export function useRiddleMutations() {
  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: (dto: CreateCategoryDto) => createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateCategoryDto> }) =>
      updateCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: (dto: CreateSubjectDto) => createSubject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSubjectDto> }) =>
      updateSubject(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcqs'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const createRiddleMutation = useMutation({
    mutationFn: (dto: CreateRiddleDto) => createRiddle(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcqs'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const updateRiddleMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateRiddleDto> }) =>
      updateRiddle(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcqs'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const deleteRiddleMutation = useMutation({
    mutationFn: (id: string) => deleteRiddle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcqs'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: 'delete' | 'trash' | 'publish' | 'draft' | 'restore';
    }) => bulkActionRiddles(ids, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcqs'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (dtos: CreateRiddleDto[]) => bulkCreateRiddles(dtos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcqs'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-filter-counts'] });
    },
  });

  return {
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    createSubject: createSubjectMutation.mutateAsync,
    updateSubject: updateSubjectMutation.mutateAsync,
    deleteSubject: deleteSubjectMutation.mutateAsync,
    createRiddle: createRiddleMutation.mutateAsync,
    updateRiddle: updateRiddleMutation.mutateAsync,
    deleteRiddle: deleteRiddleMutation.mutateAsync,
    bulkAction: bulkActionMutation.mutateAsync,
    bulkCreate: bulkCreateMutation.mutateAsync,
  };
}
```

#### 5.4 Question Manager Component

**File:** `apps/frontend/src/features/riddle-mcq/RiddleQuestionManager.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useState } from 'react';
import { Trash2, Loader2, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Riddle } from '@/types/riddles';

interface QuestionManagerProps {
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
  onDelete: (riddle: Riddle) => void;
  onBulkAction: (ids: string[], action: string) => void;
  statusFilter: string;
}

const PAGE_SIZES = [10, 25, 50];

export function RiddleQuestionManager({
  riddles,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  isFetching,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onBulkAction,
  statusFilter,
}: QuestionManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === riddles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(riddles.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      onBulkAction(Array.from(selectedIds), 'delete');
      setSelectedIds(new Set());
    }
  };

  const handleBulkStatus = (action: string) => {
    if (selectedIds.size > 0) {
      onBulkAction(Array.from(selectedIds), action);
      setSelectedIds(new Set());
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const windowSize = 5;
    if (totalPages <= windowSize) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start < windowSize - 1) {
      start = Math.max(1, end - windowSize + 1);
    }
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    if (end < totalPages) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="rounded-xl bg-white shadow">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 border-b p-4 bg-indigo-50">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => handleBulkStatus('publish')}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
          >
            Publish
          </button>
          <button
            onClick={() => handleBulkStatus('draft')}
            className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
          >
            Draft
          </button>
          <button
            onClick={() => handleBulkStatus('trash')}
            className="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
          >
            Trash
          </button>
          <button
            onClick={handleBulkDelete}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedIds.size === riddles.length && riddles.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">#</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Question</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Level</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Subject</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                </td>
              </tr>
            ) : riddles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No riddles found
                </td>
              </tr>
            ) : (
              riddles.map((riddle, index) => (
                <tr key={riddle.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(riddle.id)}
                      onChange={() => toggleSelectOne(riddle.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="p-4">
                    <p className="max-w-md truncate text-sm">{riddle.question}</p>
                    {riddle.hint && (
                      <span className="text-xs text-amber-600">💡 Hint available</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        riddle.level === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : riddle.level === 'medium'
                          ? 'bg-blue-100 text-blue-700'
                          : riddle.level === 'hard'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {riddle.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        riddle.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : riddle.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {riddle.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{riddle.subject?.name || '-'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => onEdit(riddle)}
                      className="mr-2 text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(riddle)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-gray-300 p-1"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronFirst className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`rounded px-2 py-1 text-sm ${
                  page === p ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLast className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 5.5 Test Checklist - Bulk Actions

- [ ] Select all checkbox selects all riddles on page
- [ ] Individual checkbox toggles selection
- [ ] Bulk publish changes status to published
- [ ] Bulk draft changes status to draft
- [ ] Bulk trash changes status to trash
- [ ] Bulk delete removes riddles
- [ ] Selection clears after bulk action
- [ ] POST /riddle-mcq/mcqs/bulk-action works
- [ ] Selection persists across pages

#### 5.6 Verification Steps - Bulk Actions

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (Swagger/Postman)**

- [ ] POST /riddle-mcq/mcqs/bulk-action {ids:[], action:"publish"} → success
- [ ] POST with invalid action → 400 Bad Request
- [ ] POST with non-existent ids → succeeds with failed count

**Step 3: Frontend UI (Browser DevTools)**

- [ ] Checkbox in table header → selects all on current page
- [ ] Bulk action bar appears when items selected
- [ ] Click "Publish" → selected items marked published, bar disappears
- [ ] Click "Delete" → confirm dialog, then delete

**Step 4: Integration**

- [ ] Bulk publish → status badges update immediately
- [ ] Bulk delete → rows removed from table
- [ ] Select some, navigate page, return → selection preserved

**Step 5: Feature-Specific**

- [ ] "Select all" only selects current page, not all pages
- [ ] Bulk action toolbar shows count: "5 selected"
- [ ] Delete action shows confirmation before deleting

---

## FEATURE 6: Import/Export

### Backend

#### 6.1 Export Endpoint

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.controller.ts`  
**Status:** MODIFY  
**Add this endpoint:**

```typescript
@Get('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Export riddles as CSV (admin)' })
async exportRiddles(@Query() query: any): Promise<{ csv: string; filename: string }> {
  const filters = {
    category: query.category,
    subject: query.subject,
    level: query.level,
    status: query.status,
    search: query.search,
  };
  return this.riddleMcqService.exportRiddlesToCSV(filters);
}
```

#### 6.2 Export Service Method

**File:** `apps/backend/src/riddle-mcq/riddle-mcq.service.ts`  
**Status:** MODIFY  
**Add this method:**

```typescript
async exportRiddlesToCSV(filters = {}): Promise<{ csv: string; filename: string }> {
  const { category, subject, level, status, search } = filters;

  let query = this.riddleMcqRepo
    .createQueryBuilder('riddle')
    .leftJoinAndSelect('riddle.subject', 'subject')
    .leftJoinAndSelect('subject.category', 'category');

  if (subject && subject !== 'all') {
    query = query.andWhere('subject.slug = :subject', { subject });
  }
  if (level && level !== 'all') {
    query = query.andWhere('riddle.level = :level', { level });
  }
  if (status && status !== 'all') {
    query = query.andWhere('riddle.status = :status', { status });
  }
  if (search) {
    query = query.andWhere('riddle.question ILIKE :search', { search: `%${search}%` });
  }

  const riddles = await query.orderBy('riddle.updatedAt', 'DESC').getMany();

  const headers = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctLetter', 'answer', 'level', 'subject', 'category', 'hint', 'explanation', 'status'];
  const rows = riddles.map((r) => [
    `"${(r.question || '').replace(/"/g, '""')}"`,
    `"${(r.options?.[0] || '').replace(/"/g, '""')}"`,
    `"${(r.options?.[1] || '').replace(/"/g, '""')}"`,
    `"${(r.options?.[2] || '').replace(/"/g, '""')}"`,
    `"${(r.options?.[3] || '').replace(/"/g, '""')}"`,
    r.correctLetter || '',
    `"${(r.answer || '').replace(/"/g, '""')}"`,
    r.level,
    r.subject?.name || '',
    r.subject?.category?.name || '',
    `"${(r.hint || '').replace(/"/g, '""')}"`,
    `"${(r.explanation || '').replace(/"/g, '""')}"`,
    r.status,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const filename = `riddle-mcqs-${new Date().toISOString().split('T')[0]}.csv`;

  return { csv, filename };
}
```

---

### Frontend

#### 6.3 Import/Export API

**File:** `apps/frontend/src/lib/riddle-mcq-api.ts`  
**Status:** MODIFY  
**Add these functions:**

```typescript
export async function exportRiddlesToCSV(filters: GetRiddlesParams): Promise<void> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.subject) params.set('subject', filters.subject);
  if (filters.level) params.set('level', filters.level);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const response = await api.get<{ csv: string; filename: string }>(
    `/riddle-mcq/export?${params.toString()}`,
    { isAdmin: true }
  );

  const blob = new Blob([response.data.csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = response.data.filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function bulkCreateRiddles(
  dtos: CreateRiddleDto[]
): Promise<{ count: number; errors: string[] }> {
  const response = await api.post('/riddle-mcq/mcqs/bulk', { questions: dtos }, { isAdmin: true });
  return response.data;
}
```

#### 6.4 ImportModal Component

**File:** `apps/frontend/src/features/riddle-mcq/modals/ImportModal.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, X, FileText } from 'lucide-react';
import { bulkCreateRiddles } from '@/lib/riddle-mcq-api';
import type { CreateRiddleDto } from '@/types/riddles';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportFormat = 'csv' | 'json';

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImportFormat>('csv');
  const [preview, setPreview] = useState<CreateRiddleDto[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (format === 'csv') {
          parseCSV(content);
        } else {
          parseJSON(content);
        }
      } catch {
        setErrors(['Failed to parse file']);
      }
    };
    reader.readAsText(selectedFile);
  }, [format]);

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter((l) => l.trim());
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const riddles: CreateRiddleDto[] = [];
    const parseErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const riddle = rowToRiddle(headers, values);
        riddles.push(riddle);
      } catch (e) {
        parseErrors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    setPreview(riddles.slice(0, 5));
    setErrors(parseErrors);
  };

  const parseJSON = (content: string) => {
    const data = JSON.parse(content);
    const riddles: CreateRiddleDto[] = [];
    const parseErrors: string[] = [];

    for (let i = 0; i < data.riddles.length; i++) {
      try {
        const r = data.riddles[i];
        riddles.push({
          question: r.question,
          options: r.options || undefined,
          correctLetter: r.correctLetter || undefined,
          answer: r.answer || undefined,
          level: r.level,
          subjectId: '', // Need to map by name
          hint: r.hint || undefined,
          explanation: r.explanation || undefined,
          status: r.status || 'draft',
        });
      } catch (e) {
        parseErrors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    setPreview(riddles.slice(0, 5));
    setErrors(parseErrors);
  };

  const rowToRiddle = (headers: string[], values: string[]): CreateRiddleDto => {
    const get = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? values[idx] : '';
    };

    const options: string[] = [];
    const optA = get('optiona');
    const optB = get('optionb');
    const optC = get('optionc');
    const optD = get('optiond');
    if (optA) options.push(optA);
    if (optB) options.push(optB);
    if (optC) options.push(optC);
    if (optD) options.push(optD);

    const level = get('level') || 'medium';

    return {
      question: get('question'),
      options: options.length > 0 ? options : undefined,
      correctLetter: get('correctletter') || undefined,
      answer: get('answer') || undefined,
      level: level as CreateRiddleDto['level'],
      subjectId: '', // Need to map by name
      hint: get('hint') || undefined,
      explanation: get('explanation') || undefined,
      status: (get('status') as CreateRiddleDto['status']) || 'draft',
    };
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setIsImporting(true);
    setProgress(0);

    try {
      const CHUNK_SIZE = 100;
      const allRiddles: CreateRiddleDto[] = [];

      // Re-parse full file
      if (file) {
        const reader = new FileReader();
        const content = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });

        if (format === 'csv') {
          const lines = content.split('\n').filter((l) => l.trim());
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            allRiddles.push(rowToRiddle(headers, values));
          }
        }
      }

      // Import in chunks
      const errors: string[] = [];
      for (let i = 0; i < allRiddles.length; i += CHUNK_SIZE) {
        const chunk = allRiddles.slice(i, i + CHUNK_SIZE);
        const result = await bulkCreateRiddles(chunk);
        errors.push(...result.errors);
        setProgress(Math.min(((i + CHUNK_SIZE) / allRiddles.length) * 100, 100));
      }

      setErrors(errors);
      if (errors.length === 0) {
        onSuccess();
        onClose();
      }
    } catch {
      setErrors(['Import failed']);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'question,optionA,optionB,optionC,optionD,correctLetter,answer,level,subject,hint,explanation,status\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'riddle-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Import Riddles</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-4 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
            />
            CSV
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
            />
            JSON
          </label>
          <button
            onClick={downloadTemplate}
            className="ml-auto flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <Download className="h-4 w-4" />
            Download Template
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm text-gray-500">
              {file ? file.name : 'Click to select file'}
            </span>
            <input type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium">Preview (first 5 rows)</h3>
            <div className="max-h-40 overflow-auto rounded border bg-gray-50 p-2">
              {preview.map((r, i) => (
                <div key={i} className="mb-2 text-sm">
                  <p className="font-medium">Q: {r.question.substring(0, 50)}...</p>
                  <p className="text-gray-500">Level: {r.level}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {isImporting && (
          <div className="mb-4">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-indigo-600"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Importing... {Math.round(progress)}%</p>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 rounded bg-red-50 p-2">
            <p className="text-sm text-red-600">{errors.length} errors</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || isImporting}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : `Import ${preview.length} riddles`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 6.5 Test Checklist - Import/Export

- [ ] CSV template downloads correctly
- [ ] JSON template downloads correctly
- [ ] CSV file parses correctly
- [ ] JSON file parses correctly
- [ ] Preview shows first 5 rows
- [ ] Import progress bar updates
- [ ] Errors display after import
- [ ] GET /riddle-mcq/export downloads CSV
- [ ] POST /riddle-mcq/mcqs/bulk creates riddles

#### 6.6 Verification Steps - Import/Export

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (Swagger/Postman)**

- [ ] GET /riddle-mcq/export → downloads CSV file
- [ ] CSV has correct headers: question,optionA,optionB,...
- [ ] POST /riddle-mcq/mcqs/bulk {questions:[]} → creates riddles

**Step 3: Frontend UI (Browser DevTools)**

- [ ] Click "Download Template" → CSV downloads
- [ ] Upload CSV → preview shows parsed rows
- [ ] Click "Import" → progress bar shows
- [ ] Import with errors → error count shown

**Step 4: Integration**

- [ ] Import 10 riddles → table shows 10 new rows
- [ ] Export filtered results → only filtered riddles in CSV
- [ ] Import with wrong format → error message

**Step 5: Feature-Specific**

- [ ] CSV export includes: question, options, correctLetter, answer, level, hint, explanation, status
- [ ] JSON import/export works with {version, riddles: []} format
- [ ] Import with auto-subject creation works

---

## FEATURE 7: Container + Wiring

### Frontend

#### 7.1 RiddleHeader Component

**File:** `apps/frontend/src/features/riddle-mcq/RiddleHeader.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { Plus, Upload, Download } from 'lucide-react';

interface RiddleHeaderProps {
  totalRiddles: number;
  onAddRiddle: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function RiddleHeader({ totalRiddles, onAddRiddle, onImport, onExport }: RiddleHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Riddle MCQ</h1>
        <p className="text-gray-500">{totalRiddles} total riddles</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onImport}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" />
          Import
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button
          onClick={onAddRiddle}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Riddle
        </button>
      </div>
    </div>
  );
}
```

#### 7.2 Main Container

**File:** `apps/frontend/src/features/riddle-mcq/RiddleMcqContainer.tsx`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
'use client';

import { useState } from 'react';
import { RiddleHeader } from './RiddleHeader';
import { RiddleFilterPanel } from './RiddleFilterPanel';
import { RiddleQuestionManager } from './RiddleQuestionManager';
import { CategoryModal } from './modals/CategoryModal';
import { SubjectModal } from './modals/SubjectModal';
import { RiddleModal } from './modals/RiddleModal';
import { ImportModal } from './modals/ImportModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRiddleFilters } from './hooks/useRiddleFilters';
import { useRiddleCategories } from './hooks/useRiddleCategories';
import { useRiddleSubjects } from './hooks/useRiddleSubjects';
import { useRiddleMcqs } from './hooks/useRiddleMcqs';
import { useRiddleFilterCounts } from './hooks/useRiddleFilterCounts';
import { useRiddleMutations } from './hooks/useRiddleMutations';
import { exportRiddlesToCSV } from '@/lib/riddle-mcq-api';
import type { Riddle, RiddleCategory, RiddleSubject, CreateCategoryDto, CreateSubjectDto, CreateRiddleDto } from '@/types/riddles';

export function RiddleMcqContainer() {
  const { filters, setFilter, resetFilters, page, pageSize, setPage, setPageSize } = useRiddleFilters();
  const categoriesQuery = useRiddleCategories();
  const selectedCategory = categoriesQuery.data?.find((c) => c.slug === filters.category);
  const subjectsQuery = useRiddleSubjects(selectedCategory?.id);
  const riddlesQuery = useRiddleMcqs(filters, page, pageSize);
  const filterCountsQuery = useRiddleFilterCounts(filters);
  const mutations = useRiddleMutations();

  // Modal states
  const [categoryModal, setCategoryModal] = useState({ open: false, category: undefined as RiddleCategory | undefined });
  const [subjectModal, setSubjectModal] = useState({ open: false, subject: undefined as RiddleSubject | undefined, categoryId: undefined as string | undefined });
  const [riddleModal, setRiddleModal] = useState({ open: false, riddle: undefined as Riddle | undefined });
  const [importModal, setImportModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  const categories = categoriesQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const riddles = riddlesQuery.data?.data || [];
  const total = riddlesQuery.data?.total || 0;
  const totalPages = riddlesQuery.data?.totalPages || 1;

  const handleDeleteCategory = (category: RiddleCategory) => {
    setConfirm({
      open: true,
      title: 'Delete Category',
      message: `Delete "${category.name}"? This will also delete all subjects and riddles.`,
      onConfirm: async () => {
        await mutations.deleteCategory(category.id);
        setConfirm((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleDeleteSubject = (subject: RiddleSubject) => {
    setConfirm({
      open: true,
      title: 'Delete Subject',
      message: `Delete "${subject.name}"? This will also delete all riddles.`,
      onConfirm: async () => {
        await mutations.deleteSubject(subject.id);
        setConfirm((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleDeleteRiddle = (riddle: Riddle) => {
    setConfirm({
      open: true,
      title: 'Delete Riddle',
      message: `Delete this riddle?`,
      onConfirm: async () => {
        await mutations.deleteRiddle(riddle.id);
        setConfirm((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleBulkAction = async (ids: string[], action: string) => {
    await mutations.bulkAction({ ids, action: action as any });
  };

  return (
    <div className="space-y-6 p-6">
      <RiddleHeader
        totalRiddles={total}
        onAddRiddle={() => setRiddleModal({ open: true, riddle: undefined })}
        onImport={() => setImportModal(true)}
        onExport={() => exportRiddlesToCSV(filters)}
      />

      <RiddleFilterPanel
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        categories={categories}
        subjects={subjects}
        filterCounts={filterCountsQuery.data}
        isLoading={categoriesQuery.isLoading}
        onAddCategory={() => setCategoryModal({ open: true, category: undefined })}
        onEditCategory={(c) => setCategoryModal({ open: true, category: c })}
        onDeleteCategory={handleDeleteCategory}
        onAddSubject={() => setSubjectModal({ open: true, subject: undefined, categoryId: selectedCategory?.id })}
        onEditSubject={(s) => setSubjectModal({ open: true, subject: s, categoryId: s.categoryId })}
        onDeleteSubject={handleDeleteSubject}
      />

      <RiddleQuestionManager
        riddles={riddles}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        isLoading={riddlesQuery.isLoading}
        isFetching={riddlesQuery.isFetching}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEdit={(r) => setRiddleModal({ open: true, riddle: r })}
        onDelete={handleDeleteRiddle}
        onBulkAction={handleBulkAction}
        statusFilter={filters.status}
      />

      <CategoryModal
        open={categoryModal.open}
        category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, category: undefined })}
        onSubmit={async (dto: CreateCategoryDto) => {
          if (categoryModal.category) {
            await mutations.updateCategory({ id: categoryModal.category.id, dto });
          } else {
            await mutations.createCategory(dto);
          }
          setCategoryModal({ open: false, category: undefined });
        }}
      />

      <SubjectModal
        open={subjectModal.open}
        subject={subjectModal.subject}
        categoryId={subjectModal.categoryId}
        categories={categories}
        onClose={() => setSubjectModal({ open: false, subject: undefined, categoryId: undefined })}
        onSubmit={async (dto: CreateSubjectDto) => {
          if (subjectModal.subject) {
            await mutations.updateSubject({ id: subjectModal.subject.id, dto });
          } else {
            await mutations.createSubject(dto);
          }
          setSubjectModal({ open: false, subject: undefined, categoryId: undefined });
        }}
      />

      <RiddleModal
        open={riddleModal.open}
        riddle={riddleModal.riddle}
        subjects={subjects}
        categories={categories}
        onClose={() => setRiddleModal({ open: false, riddle: undefined })}
        onSubmit={async (dto: CreateRiddleDto) => {
          if (riddleModal.riddle) {
            await mutations.updateRiddle({ id: riddleModal.riddle.id, dto });
          } else {
            await mutations.createRiddle(dto);
          }
          setRiddleModal({ open: false, riddle: undefined });
        }}
      />

      <ImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onSuccess={() => {
          riddlesQuery.refetch();
          filterCountsQuery.refetch();
        }}
      />

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm((p) => ({ ...p, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
```

#### 7.3 Hooks Index

**File:** `apps/frontend/src/features/riddle-mcq/hooks/index.ts`  
**Status:** WRITE-FRESH  
**Create this file:**

```typescript
export { useRiddleFilters } from './useRiddleFilters';
export { useRiddleCategories } from './useRiddleCategories';
export { useRiddleSubjects } from './useRiddleSubjects';
export { useRiddleMcqs } from './useRiddleMcqs';
export { useRiddleFilterCounts } from './useRiddleFilterCounts';
export { useRiddleMutations } from './useRiddleMutations';
```

#### 7.4 Wire in Admin Page

**File:** `apps/frontend/src/app/admin/page.tsx`  
**Status:** MODIFY  
**Find where RiddleMcqSection is used and replace:**

```tsx
// REPLACE this import and component
import { RiddleMcqContainer } from '@/features/riddle-mcq/RiddleMcqContainer';

// REMOVE: <RiddleMcqSection />
// ADD: <RiddleMcqContainer />
```

#### 7.5 Test Checklist - Container

- [ ] Container renders without errors
- [ ] Header shows total count
- [ ] Filters panel shows all filter rows
- [ ] Question manager displays riddles table
- [ ] Category modal opens for create
- [ ] Category modal opens for edit
- [ ] Subject modal opens for create
- [ ] Subject modal opens for edit
- [ ] Riddle modal opens for create
- [ ] Riddle modal opens for edit
- [ ] Import modal opens
- [ ] Confirm dialog works for deletes
- [ ] URL params control filters
- [ ] Pagination works
- [ ] All mutations invalidate queries correctly

#### 7.6 Verification Steps - Container (Final Integration)

**Step 1: Compile**

```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

**Step 2: Backend API (All Endpoints)**

- [ ] All category endpoints work
- [ ] All subject endpoints work
- [ ] All riddle endpoints work
- [ ] Bulk action works
- [ ] Import/export works
- [ ] Filter counts work

**Step 3: Frontend UI (Full Page Test)**

- [ ] Page loads at /admin without errors
- [ ] All 7 features work from single container
- [ ] No console errors (check DevTools)
- [ ] Loading states show during fetch
- [ ] Error states handled gracefully

**Step 4: Integration (End-to-End)**

- [ ] Create category → create subject → create riddle → appears in list
- [ ] Edit riddle → update reflects immediately
- [ ] Delete riddle → removed from list
- [ ] Filter by category → only that category's riddles
- [ ] Bulk select + publish → status changes
- [ ] Import CSV → riddles appear
- [ ] Export CSV → downloads with correct data

**Step 5: Final Checks**

- [ ] Old RiddleMcqSection fully removed from admin/page.tsx
- [ ] No duplicate imports
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] URL sharing works (copy URL with filters → paste → same state)
- [ ] Refresh page → state preserved (URL-driven)

---

## Implementation Summary

### File Actions

| File                        | Action      |
| --------------------------- | ----------- |
| `riddle-mcq.entity.ts`      | MODIFY      |
| `riddle-mcq.service.ts`     | MODIFY      |
| `riddle-mcq.controller.ts`  | MODIFY      |
| `riddle-mcq.dto.ts`         | MODIFY      |
| `riddle-mcq-api.ts`         | MODIFY      |
| `riddles.ts` (types)        | MODIFY      |
| `useRiddleFilters.ts`       | WRITE-FRESH |
| `useRiddleCategories.ts`    | WRITE-FRESH |
| `useRiddleSubjects.ts`      | WRITE-FRESH |
| `useRiddleMcqs.ts`          | WRITE-FRESH |
| `useRiddleFilterCounts.ts`  | WRITE-FRESH |
| `useRiddleMutations.ts`     | WRITE-FRESH |
| `hooks/index.ts`            | WRITE-FRESH |
| `RiddleHeader.tsx`          | WRITE-FRESH |
| `RiddleFilterPanel.tsx`     | WRITE-FRESH |
| `RiddleQuestionManager.tsx` | WRITE-FRESH |
| `CategoryModal.tsx`         | WRITE-FRESH |
| `SubjectModal.tsx`          | WRITE-FRESH |
| `RiddleModal.tsx`           | WRITE-FRESH |
| `ImportModal.tsx`           | WRITE-FRESH |
| `RiddleMcqContainer.tsx`    | WRITE-FRESH |
| `admin/page.tsx`            | MODIFY      |

### Order

1. Category (FEATURE 1)
2. Subject (FEATURE 2)
3. Riddle CRUD (FEATURE 3)
4. Filters + Filter Counts (FEATURE 4)
5. Bulk Actions (FEATURE 5)
6. Import/Export (FEATURE 6)
7. Container + Wiring (FEATURE 7)

Each feature is independently testable end-to-end before moving to the next.
