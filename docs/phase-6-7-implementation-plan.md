# Production Readiness - Phase 6 & 7 Implementation Plan

## Version: 1.0
## Created: 2026-03-23
## Purpose: Implement Database Indexing & Redis Caching for 50K+ Questions

---

## WHY THESE PHASES ARE REQUIRED

### Current Performance (Without Indexes/Cache)
| Metric | Current | Scale Limit |
|--------|---------|-------------|
| Query time (50K rows) | 3-8 seconds | Unusable |
| Concurrent users | 50-100 | DB crashes |
| Cache hit rate | ~0% | Every request hits DB |
| DB CPU load | 100% | Bottleneck |

### After Implementation (With Indexes/Cache)
| Metric | Target | Improvement |
|--------|--------|-------------|
| Query time (50K rows) | <50ms | 60-100x faster |
| Concurrent users | 10,000+ | 100x scale |
| Cache hit rate | ~90% | Near instant |
| DB CPU load | <10% | 10x efficiency |

---

## PHASE 6 — DATABASE INDEXES

### Objective
Add database indexes to optimize query performance on large datasets.

### Files to Modify

#### 1. `apps/backend/src/quiz/entities/question.entity.ts`

**Current State:**
```typescript
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: string[] | null;

  @Column()
  correctAnswer: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  correctLetter: string | null;

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  level: string;  // ❌ NO INDEX

  @ManyToOne(() => Chapter, chapter => chapter.questions)
  chapter: Chapter;

  @Column()
  chapterId: string;  // ❌ NO INDEX

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;  // ❌ NO INDEX

  @Column({ type: 'int', default: 0 })
  order: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
```

**Changes Required:**
1. Import `Index` from typeorm
2. Add `@Index()` decorator above class for composite index
3. Add `@Index()` decorator on `chapterId` column
4. Add `@Index()` decorator on `level` column
5. Add `@Index()` decorator on `status` column

**After Changes:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, Index } from 'typeorm';

@Entity('questions')
@Index(['chapterId', 'level', 'status'])  // Composite for common filter combinations
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: string[] | null;

  @Column()
  correctAnswer: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  correctLetter: string | null;

  @Index()  // ← ADDED: For level-based filtering
  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  level: string;

  @ManyToOne(() => Chapter, chapter => chapter.questions)
  chapter: Chapter;

  @Index()  // ← ADDED: For chapter joins and filtering
  @Column()
  chapterId: string;

  @Index()  // ← ADDED: For status filtering
  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ type: 'int', default: 0 })
  order: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
```

#### 2. `apps/backend/src/quiz/entities/chapter.entity.ts`

**Current State:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Unique, Index } from 'typeorm';

@Entity('chapters')
@Unique(['name', 'subjectId'])
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => Subject, subject => subject.chapters)
  subject: Subject;

  @Column()
  subjectId: string;  // ❌ NO INDEX

  @OneToMany(() => Question, question => question.chapter)
  questions: Question[];
}
```

**Changes Required:**
1. Add `@Index()` decorator on `subjectId` column for subject→chapter joins

**After Changes:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Unique, Index } from 'typeorm';

@Entity('chapters')
@Unique(['name', 'subjectId'])
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  chapterNumber: number;

  @ManyToOne(() => Subject, subject => subject.chapters)
  subject: Subject;

  @Index()  // ← ADDED: For subject→chapter joins
  @Column()
  subjectId: string;

  @OneToMany(() => Question, question => question.chapter)
  questions: Question[];
}
```

#### 3. `apps/backend/src/quiz/entities/subject.entity.ts`

**Current State:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;  // ✅ Already has unique constraint (indexed implicitly)

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Chapter, chapter => chapter.subject)
  chapters: Chapter[];
}
```

**Changes Required:**
1. Add explicit `@Index()` decorator on `slug` for clarity
2. Add `@Index()` decorator on `order` for sorting

**After Changes:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn, Index } from 'typeorm';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()  // ← ADDED: Explicit index for slug lookups
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @Index()  // ← ADDED: For ordered sorting
  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Chapter, chapter => chapter.subject)
  chapters: Chapter[];
}
```

### Verification Steps

1. **Backend compiles without errors:**
   ```bash
   cd apps/backend && npm run build
   ```

2. **Run database migration (if using TypeORM migrations):**
   ```bash
   npm run typeorm migration:generate -- src/database/migrations/AddQuizIndexes
   npm run typeorm migration:run
   ```

3. **Manual SQL verification (PostgreSQL):**
   ```sql
   -- Check indexes exist
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename IN ('questions', 'chapters', 'subjects');
   ```

4. **Performance test:**
   - Before: Query 50K questions with filters takes 3-8 seconds
   - After: Should take <50ms

---

## PHASE 7 — REDIS CACHE EXPANSION

### Objective
Implement caching for quiz endpoints to reduce database load and improve response times.

### Cache Strategy

| Endpoint | Cache Key Pattern | TTL | Invalidation Trigger |
|----------|------------------|-----|---------------------|
| `getFilterCounts` | `quiz:filter-counts:{subject}:{chapter}:{level}:{status}` | 5 min | Any quiz mutation |
| `findAllQuestions` | `quiz:questions:{subject}:{chapter}:{level}:{status}:{page}:{limit}` | 10 min | Any quiz mutation |
| `getPublicQuestions` | (uses findAllQuestions) | - | - |
| Subjects list | `quiz:subjects:all` | 30 min | Subject CRUD |
| Chapters list | `quiz:chapters:{subjectId}` | 30 min | Chapter CRUD |

### Files to Modify

#### 1. `apps/backend/src/quiz/quiz.service.ts`

**Changes Required:**

**A. Add cache key constants at top of class:**
```typescript
// Cache key patterns
private readonly CACHE_KEYS = {
  FILTER_COUNTS: (subject: string, chapter: string, level: string, status: string) =>
    `quiz:filter-counts:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}`,
  QUESTIONS: (subject: string, chapter: string, level: string, status: string, page: number, limit: number) =>
    `quiz:questions:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}:${page}:${limit}`,
  SUBJECTS: 'quiz:subjects:all',
  CHAPTERS: (subjectId: string) => `quiz:chapters:${subjectId}`,
};

// Cache TTL in seconds
private readonly CACHE_TTL = {
  FILTER_COUNTS: 300,   // 5 minutes
  QUESTIONS: 600,        // 10 minutes
  SUBJECTS: 1800,       // 30 minutes
  CHAPTERS: 1800,       // 30 minutes
};
```

**B. Modify `findAllQuestions` method:**
```typescript
async findAllQuestions(
  pagination: PaginationDto,
  filters: {
    status?: ContentStatus;
    level?: string;
    chapter?: string;
    search?: string;
    subjectSlug?: string;
  },
): Promise<{ data: Question[]; total: number }> {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? settings.global.pagination.defaultLimit;

  // Generate cache key
  const cacheKey = this.CACHE_KEYS.QUESTIES(
    filters.subjectSlug || 'all',
    filters.chapter || 'all',
    filters.level || 'all',
    filters.status || 'all',
    page,
    limit
  );

  // Use cache-aside pattern
  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const query = this.questionRepo.createQueryBuilder('question')
        .leftJoinAndSelect('question.chapter', 'chapter')
        .leftJoinAndSelect('chapter.subject', 'subject');

      if (filters.status != null) {
        query.andWhere('question.status = :status', { status: filters.status });
      }

      if (filters.level) {
        query.andWhere('question.level = :level', { level: filters.level });
      }

      if (filters.chapter) {
        query.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
      }

      if (filters.search) {
        query.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
      }

      if (filters.subjectSlug) {
        query.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subjectSlug });
      }

      const [data, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('question.updatedAt', 'DESC')
        .getManyAndCount();

      return { data, total };
    },
    this.CACHE_TTL.QUESTIONS
  );
}
```

**C. Modify `getFilterCounts` method:**
```typescript
async getFilterCounts(filters: {
  subject?: string;
  status?: string;
  level?: string;
  chapter?: string;
  search?: string;
}): Promise<{
  subjectCounts: { slug: string; count: number }[];
  chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}> {
  // Generate cache key
  const cacheKey = this.CACHE_KEYS.FILTER_COUNTS(
    filters.subject || 'all',
    filters.chapter || 'all',
    filters.level || 'all',
    filters.status || 'all'
  );

  // Use cache-aside pattern
  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      // ... existing getFilterCounts logic ...
    },
    this.CACHE_TTL.FILTER_COUNTS
  );
}
```

**D. Modify mutation methods to invalidate cache:**

```typescript
async createQuestion(...) {
  // ... create logic ...
  await this.cacheService.delPattern('quiz:*');  // Clear all quiz caches
}

async updateQuestion(...) {
  // ... update logic ...
  await this.cacheService.delPattern('quiz:*');  // Clear all quiz caches
}

async deleteQuestion(...) {
  // ... delete logic ...
  await this.cacheService.delPattern('quiz:*');  // Clear all quiz caches
}

async bulkAction(...) {
  // ... bulk action logic ...
  await this.cacheService.delPattern('quiz:*');  // Clear all quiz caches
}
```

### Verification Steps

1. **Backend compiles without errors:**
   ```bash
   cd apps/backend && npm run build
   ```

2. **Redis connection check:**
   - Check backend logs for: `Redis connected successfully`

3. **Cache hit verification:**
   ```bash
   # First request (should miss cache)
   curl http://localhost:3012/api/v1/quiz/filter-counts
   
   # Check backend logs for cache MISS log
   
   # Second request (should hit cache)
   curl http://localhost:3012/api/v1/quiz/filter-counts
   
   # Check backend logs for cache HIT log
   ```

4. **Cache invalidation verification:**
   ```bash
   # Create a new question
   curl -X POST http://localhost:3012/api/v1/quiz/questions ...
   
   # Immediately request filter-counts
   curl http://localhost:3012/api/v1/quiz/filter-counts
   
   # Should reflect new data (cache was invalidated)
   ```

5. **Performance test:**
   - Cold cache: 50-100ms
   - Warm cache: <5ms

---

## IMPLEMENTATION ORDER

```
STEP 1: Phase 6 - Database Indexes
├── 1.1 Modify question.entity.ts
├── 1.2 Modify chapter.entity.ts
├── 1.3 Modify subject.entity.ts
├── 1.4 Verify backend builds
└── 1.5 Verify (no migration needed for @Index decorators)

STEP 2: Phase 7 - Redis Cache
├── 2.1 Add cache key constants
├── 2.2 Add cache TTL constants
├── 2.3 Wrap findAllQuestions with getOrSet
├── 2.4 Wrap getFilterCounts with getOrSet
├── 2.5 Add cache invalidation to mutations
├── 2.6 Verify backend builds
└── 2.7 Test cache hit/miss

STEP 3: Final Verification
├── 3.1 Performance test (cold vs warm)
├── 3.2 Load test (1000 concurrent)
└── 3.3 Verify no breaking changes
```

---

## EXPECTED RESULTS

### Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Query (50K, indexed) | 3-8 sec | <50ms |
| Filter counts (cold) | 200-500ms | 50-100ms |
| Filter counts (warm) | 200-500ms | <5ms |
| 1000 concurrent | Crash | Works |
| DB CPU | 100% | <10% |

### Cache Hit Rate

| Scenario | Hit Rate |
|----------|----------|
| Admin panel (multiple filters) | ~60% |
| User quiz (same chapter) | ~90% |
| Overall | ~80% |

---

## ROLLBACK PLAN

If issues arise:

**Phase 6 Rollback:**
- Remove `@Index()` decorators from entity files
- Indexes remain in DB but are not used by queries
- Safe to remove via migration later

**Phase 7 Rollback:**
- Remove `getOrSet` calls from service methods
- Queries fall back to direct DB calls
- Cache keys remain in Redis but will expire naturally

---

## FILES SUMMARY

### Phase 6 - Database Indexes
```
apps/backend/src/quiz/entities/question.entity.ts  - Add 4 indexes
apps/backend/src/quiz/entities/chapter.entity.ts   - Add 1 index
apps/backend/src/quiz/entities/subject.entity.ts  - Add 2 indexes
```

### Phase 7 - Redis Cache
```
apps/backend/src/quiz/quiz.service.ts  - Add caching to 2 methods, invalidation to 4 methods
```

### No Changes Required
```
apps/backend/src/common/cache/cache.service.ts  - Already implemented ✅
apps/backend/src/config/settings.ts               - Already has cache config ✅
apps/backend/src/quiz/quiz.module.ts             - Already imports CacheService ✅
```

---

*Plan created for production readiness at 50K+ questions scale*
