# Riddle MCQ Backend Plan

## Overview

Rebuild riddle-mcq backend following EXACT same architecture as quiz backend. Only differences are riddle-specific business rules.

---

## Step 1: Entity Changes (No Migration Needed)

Since there is **no existing data**, we use TypeORM's `synchronize` feature. No migration files needed.

### 1.1 Prerequisites

**Check TypeORM Configuration:**

```bash
# In apps/backend/.env, verify:
DB_SYNCHRONIZE=true
```

**Location:** `apps/backend/src/database/database-config.ts:74`

```typescript
const synchronize = process.env.DB_SYNCHRONIZE === 'true';
```

When `DB_SYNCHRONIZE=true`, TypeORM auto-updates DB schema on backend restart.

### 1.2 Current State

**riddle_mcqs table** (current):

```sql
- id: UUID PK
- question: TEXT
- options: JSON (nullable)
- correctLetter: VARCHAR(1) (nullable)
- explanation: TEXT (nullable)
- level: ENUM('easy', 'medium', 'hard', 'expert', 'extreme')  ← REMOVE 'extreme'
- subjectId: UUID FK
- status: ENUM('published', 'draft', 'trash')
- updatedAt: TIMESTAMP
- hint: TEXT  ← ADD THIS FIELD
```

**riddle_categories table** (exists - no changes):

```sql
- id: UUID PK
- slug: VARCHAR UNIQUE
- name: VARCHAR
- emoji: VARCHAR
- isActive: BOOLEAN
- order: INTEGER
```

**riddle_subjects table** (exists - no changes):

```sql
- id: UUID PK
- slug: VARCHAR UNIQUE
- name: VARCHAR
- emoji: VARCHAR
- categoryId: UUID FK (nullable)
- isActive: BOOLEAN
- order: INTEGER
```

### 1.3 Required Entity Changes

**1. Update riddle-mcq.entity.ts:**

- Remove 'extreme' from level enum
- Add `hint` field (nullable TEXT)
- Add `answer` field (nullable TEXT - for expert level)

**2. Restart backend:**

```bash
# TypeORM will auto-sync schema changes
docker-compose up -d --build backend
```

**3. options field rules (enforced at DTO/service level, not DB):**

- Easy → exactly 2 options (stored as JSON array)
- Medium → exactly 3 options
- Hard → exactly 4 options
- Expert → NULL (open-ended text answer)

---

## Step 2: Entity Changes

### 2.1 riddle-mcq.entity.ts

```typescript
// CURRENT (with extreme):
@Index()
@Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
level: string;

@Column({ type: 'text', nullable: true })
hint: string | null;

// NEW:
@Index()
@Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert'] })
level: RiddleMcqLevel;

@Column({ type: 'text', nullable: true })
hint: string | null;

@Column({ type: 'text', nullable: true })
answer: string | null;  // For expert level (open-ended)

export enum RiddleMcqLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}
```

### 2.2 riddle-category.entity.ts

**No changes needed** - keep as-is.

### 2.3 riddle-subject.entity.ts

**No changes needed** - keep as-is.

---

## Step 3: DTO Validation Rules

### 3.1 CreateRiddleMcqDto

```typescript
export class CreateRiddleMcqDto {
  @ApiProperty({ example: 'What has keys but no locks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  // Easy: exactly 2, Medium: exactly 3, Hard: exactly 4
  @ApiPropertyOptional({ example: ['A piano', 'A keyboard', 'A map', 'A car'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  // A/B for Easy, A/B/C for Medium, A/B/C/D for Hard
  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  correctLetter?: string;

  // Expert level: required text answer
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
```

### 3.2 Validation Method (in service)

```typescript
private validateRiddleOptions(dto: CreateRiddleMcqDto): void {
  const { level, options, correctLetter } = dto;

  if (level === RiddleMcqLevel.EXPERT) {
    // Expert: no options, no correctLetter, answer required
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

  // MCQ levels: options and correctLetter required
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
```

### 3.3 UpdateRiddleMcqDto

Same validation rules apply.

---

## Step 4: Controller Endpoints

Follow quiz controller pattern exactly.

### 4.1 Endpoints Summary

````
BASE PATH: /api/riddle-mcq

CATEGORIES:
  GET    /categories                    - Get all active (public)
  GET    /categories/all                - Get all including inactive (admin)
  GET    /categories/:id                - Get by ID (public)
  POST   /categories                    - Create (admin)
  PATCH  /categories/:id               - Update (admin)
  DELETE /categories/:id               - Delete (admin)

SUBJECTS:
  GET    /subjects                      - Get all active (public)
  GET    /subjects/all                  - Get all including inactive (admin)
  GET    /subjects/:slug                - Get by slug (public)
  GET    /subjects/:slug/meta           - Lightweight metadata (public)
  POST   /subjects                      - Create (admin)
  PATCH  /subjects/:id                 - Update (admin)
  DELETE /subjects/:id                 - Delete (admin)

RIDDLE MCQs (Admin - protected):
  GET    /all                           - Paginated list with filters
  POST   /mcqs                         - Create single
  POST   /mcqs/bulk                    - Bulk create
  PATCH  /mcqs/:id                     - Update
  DELETE /mcqs/:id                     - Delete

RIDDLE MCQs (Public - no auth):
  GET    /subjects/:subjectId/mcqs      - Get ALL by subject (no limit)
  GET    /mixed                         - Get ALL mixed (no limit)
  GET    /random/:level                 - Get ALL by level (no limit)

BULK ACTIONS:
  POST   /mcqs/bulk-action             - publish/draft/trash/delete/restore

STATS:
  GET    /stats/overview               - Get statistics
  GET    /filter-counts               - Get filter counts

### 4.2 GET /filter-counts Query Parameters

**Admin only endpoint** (JWT + admin role required)

**Query Parameters:**
| Param    | Type   | Required | Description                          |
|----------|--------|---------|--------------------------------------|
| category | string | No      | Filter by category slug              |
| subject  | string | No      | Filter by subject slug               |
| level    | string | No      | Filter by level (easy/medium/hard/expert) |
| status   | string | No      | Filter by status (published/draft/trash) |
| search   | string | No      | Search in riddle question text       |

**Response:**
```typescript
{
  categoryCounts: { id: string; name: string; emoji: string; count: number }[];
  subjectCounts: { id: string; name: string; emoji: string; count: number }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}
````

### 4.3 Cascade Delete Behavior

**Category Delete:**

- Deletes the category
- Cascades to delete ALL subjects under that category
- Cascades to delete ALL riddles under those subjects
- Uses database ON DELETE CASCADE

**Subject Delete:**

- Deletes the subject
- Cascades to delete ALL riddles under that subject
- Uses database ON DELETE CASCADE

### 4.4 Public vs Admin Endpoints

**Public (no auth):**

- GET /categories
- GET /categories/:id
- GET /subjects
- GET /subjects/:slug
- GET /subjects/:slug/meta
- GET /subjects/:subjectId/mcqs
- GET /mixed
- GET /random/:level
- GET /stats/overview
- GET /filter-counts

**Admin (JWT + admin role):**

- GET /categories/all
- POST /categories
- PATCH /categories/:id
- DELETE /categories/:id
- GET /subjects/all
- POST /subjects
- PATCH /subjects/:id
- DELETE /subjects/:id
- GET /all
- POST /mcqs
- POST /mcqs/bulk
- PATCH /mcqs/:id
- DELETE /mcqs/:id
- POST /mcqs/bulk-action

---

## Step 5: Service Methods

Follow quiz service pattern exactly.

### 5.1 Categories

| Method                                        | Description                                               |
| --------------------------------------------- | --------------------------------------------------------- |
| `findAllCategories(includeInactive: boolean)` | Get all categories                                        |
| `findCategoryById(id: string)`                | Get by ID                                                 |
| `createCategory(dto)`                         | Create category                                           |
| `updateCategory(id, dto)`                     | Update category                                           |
| `deleteCategory(id)`                          | Delete category + cascade delete all subjects and riddles |

### 5.2 Subjects

| Method                                             | Description                                 |
| -------------------------------------------------- | ------------------------------------------- |
| `findAllSubjects(includeInactive, hasContentOnly)` | Get subjects                                |
| `findSubjectBySlug(slug)`                          | Get by slug                                 |
| `findSubjectMeta(slug)`                            | Lightweight {name, emoji, slug}             |
| `createSubject(dto)`                               | Create subject                              |
| `updateSubject(id, dto)`                           | Update subject                              |
| `deleteSubject(id)`                                | Delete subject + cascade delete all riddles |

### 5.3 Riddle MCQs

| Method                                                   | Description                          |
| -------------------------------------------------------- | ------------------------------------ |
| `findRiddleMcqsBySubject(subjectId, pagination, level?)` | Get by subject (paginated for admin) |
| `findAllRiddleMcqsAdmin(filters, pagination)`            | Admin: all with filters              |
| `findMixedRiddleMcqs()`                                  | Get ALL mixed (public play)          |
| `findRandomRiddleMcqs(level)`                            | Get ALL by level (public play)       |
| `createRiddleMcq(dto)`                                   | Create with validation               |
| `createRiddleMcqsBulk(dtos)`                             | Chunked bulk create (100/chunk)      |
| `updateRiddleMcq(id, dto)`                               | Update with validation               |
| `deleteRiddleMcq(id)`                                    | Delete                               |

### 5.4 Bulk Actions

| Method                              | Description                        |
| ----------------------------------- | ---------------------------------- |
| `bulkActionRiddleMcqs(ids, action)` | publish/draft/trash/delete/restore |

### 5.5 Stats

| Method                     | Description          |
| -------------------------- | -------------------- |
| `getStats()`               | Overview counts      |
| `getFilterCounts(filters)` | Subject/level counts |

---

## Step 6: Caching Strategy

Follow quiz caching pattern exactly.

### 6.1 Cache Keys

```typescript
private readonly CACHE_KEYS = {
  CATEGORIES: (active: boolean) => `riddle-mcq:categories:${active ? 'active' : 'all'}`,
  SUBJECTS: (active: boolean) => `riddle-mcq:subjects:${active ? 'active' : 'all'}`,
  MCQS: (subject, level, page, pageSize) => `riddle-mcq:mcqs:${subject || 'all'}:${level || 'all'}:${page}:${pageSize}`,
  FILTER_COUNTS: (subject, level) => `riddle-mcq:filter-counts:${subject || 'all'}:${level || 'all'}`,
};
```

### 6.2 Cache TTL

```typescript
private readonly CACHE_TTL = {
  CATEGORIES: 600,    // 10 minutes
  SUBJECTS: 600,      // 10 minutes
  MCQS: 300,          // 5 minutes
  FILTER_COUNTS: 300, // 5 minutes
};
```

### 6.3 Invalidation

On any write operation (create/update/delete):

```typescript
await this.cacheService.delPattern('riddle-mcq:*');
```

---

## Step 7: Service Implementation Notes

### 7.1 findMixedRiddleMcqs (NO LIMIT - public play)

```typescript
async findMixedRiddleMcqs(): Promise<RiddleMcq[]> {
  // NO LIMIT - return ALL published riddles for play
  return this.riddleMcqRepo.find({
    where: { status: RiddleStatus.PUBLISHED },
    relations: ['subject'],
    order: { updatedAt: 'DESC' },
  });
}
```

### 7.2 findRandomRiddleMcqs (NO LIMIT - public play)

```typescript
async findRandomRiddleMcqs(level: string): Promise<RiddleMcq[]> {
  // NO LIMIT - return ALL for this level
  return this.riddleMcqRepo.find({
    where: { level: level as RiddleMcqLevel, status: RiddleStatus.PUBLISHED },
    relations: ['subject'],
  });
}
```

### 7.3 findRiddleMcqsBySubject (NO LIMIT - public play)

```typescript
async findRiddleMcqsBySubject(
  subjectId: string,
  level?: string,
): Promise<{ data: RiddleMcq[]; total: number }> {
  // NO PAGINATION for public - return ALL
  let query = this.riddleMcqRepo
    .createQueryBuilder('riddle')
    .leftJoinAndSelect('riddle.subject', 'subject')
    .where('subjectId = :subjectId', { subjectId })
    .andWhere('subject.isActive = :isActive', { isActive: true })
    .andWhere('riddle.status = :status', { status: RiddleStatus.PUBLISHED });

  if (level) {
    query = query.andWhere('riddle.level = :level', { level });
  }

  const data = await query.orderBy('riddle.updatedAt', 'DESC').getMany();
  return { data, total: data.length };
}
```

### 7.4 Admin list (PAGINATED)

```typescript
async findAllRiddleMcqsAdmin(
  filters = {},
  pagination = { page: 1, pageSize: 10 }
): Promise<{ data: RiddleMcq[]; total: number }> {
  // PAGINATED for admin panel
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 10;

  // ... query with filters ...

  const [data, total] = await query
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .orderBy('riddle.updatedAt', 'DESC')
    .getManyAndCount();

  return { data, total };
}
```

---

## Step 8: File Structure

```
apps/backend/src/riddle-mcq/
├── riddle-mcq.module.ts        (existing - no changes needed)
├── riddle-mcq.controller.ts    (REWRITE - follow quiz pattern)
├── riddle-mcq.service.ts       (REWRITE - follow quiz pattern + validation)
├── dto/
│   └── riddle-mcq.dto.ts       (REWRITE - add validation rules)
└── entities/
    ├── riddle-mcq.entity.ts    (MODIFY - remove extreme, add hint, add answer)
    ├── riddle-category.entity.ts (no changes)
    └── riddle-subject.entity.ts  (no changes)
```

---

## Step 9: Implementation Order

1. **Update entity** - riddle-mcq.entity.ts (remove extreme, add hint, add answer)
2. **Set DB_SYNCHRONIZE=true** in backend .env
3. **Restart backend** - TypeORM auto-syncs schema
4. **Update DTOs** - add validation rules for options per level
5. **Rewrite service** - add validation method, update all methods
6. **Rewrite controller** - follow quiz controller pattern exactly
7. **Test** - verify all endpoints

---

## Step 10: Testing Checklist

### Database

- [ ] DB_SYNCHRONIZE=true is set
- [ ] Backend restarts without errors
- [ ] TypeORM auto-creates/updates schema
- [ ] hint field exists and is nullable
- [ ] answer field exists and is nullable (for expert level)
- [ ] extreme value no longer in level enum

### Categories

- [ ] GET /categories returns active only
- [ ] GET /categories/all requires admin
- [ ] CRUD operations work
- [ ] Deleting category cascades to delete all subjects
- [ ] Deleting category cascades to delete all riddles under those subjects

### Subjects

- [ ] GET /subjects returns active only
- [ ] GET /subjects/:slug/meta returns lightweight
- [ ] CRUD operations work
- [ ] Deleting subject cascades to delete all riddles

### Filter Counts

- [ ] GET /filter-counts requires admin auth
- [ ] GET /filter-counts accepts category param
- [ ] GET /filter-counts accepts subject param
- [ ] GET /filter-counts accepts level param
- [ ] GET /filter-counts accepts status param
- [ ] GET /filter-counts accepts search param
- [ ] GET /filter-counts returns categoryCounts
- [ ] GET /filter-counts returns subjectCounts
- [ ] GET /filter-counts returns levelCounts
- [ ] GET /filter-counts returns statusCounts
- [ ] GET /filter-counts returns total

### Riddle MCQs

- [ ] Easy riddle requires exactly 2 options, correctLetter A or B
- [ ] Medium riddle requires exactly 3 options, correctLetter A, B, or C
- [ ] Hard riddle requires exactly 4 options, correctLetter A, B, C, or D
- [ ] Expert riddle has no options, no correctLetter, requires answer
- [ ] hint field (optional, max 500 chars)
- [ ] explanation field (optional, max 2000 chars)

### Public Endpoints (no auth)

- [ ] GET /subjects/:subjectId/mcqs returns ALL (no limit)
- [ ] GET /mixed returns ALL (no limit)
- [ ] GET /random/:level returns ALL (no limit)

### Admin Endpoints (auth required)

- [ ] GET /all is paginated
- [ ] Bulk create works (100 per chunk)
- [ ] Bulk actions work (publish/draft/trash/delete/restore)

### Caching

- [ ] Cache is set on read
- [ ] Cache is invalidated on write
- [ ] Cache keys follow pattern riddle-mcq:\*

### Stats

- [ ] GET /stats/overview returns counts by level
- [ ] GET /filter-counts returns subject/level counts
