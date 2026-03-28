# Backend Implementation
## Quiz Management System - NestJS Backend

---

## 1. Overview

**Note:** This documents the **actual implementation** in `apps/backend/src/quiz/`.

---

## 2. Actual File Structure

```
apps/backend/src/quiz/
├── quiz.controller.ts    # REST endpoints (326 lines)
├── quiz.service.ts      # Business logic (778 lines)
├── quiz.module.ts       # Module definition
└── entities/
    ├── question.entity.ts
    ├── subject.entity.ts
    └── chapter.entity.ts
```

---

## 3. Implemented Features

| Feature | Status | Location |
|---------|--------|----------|
| CRUD Subject | ✅ | quiz.service.ts |
| CRUD Chapter | ✅ | quiz.service.ts |
| CRUD Question | ✅ | quiz.service.ts |
| Bulk Actions | ✅ | BulkActionService |
| Filter Counts | ✅ | getFilterCounts() |
| Pagination | ✅ | All list endpoints |
| Redis Cache | ✅ | CacheService |
| JWT Auth | ✅ | JwtAuthGuard, RolesGuard |
| Transactional Delete | ✅ | deleteSubject() with QueryRunner |
| Public Quiz API | ✅ | Always PUBLISHED only |

---

## 4. ContentStatus Enum (Actual)

```typescript
// apps/backend/src/common/enums/content-status.enum.ts
export enum ContentStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  TRASH = 'trash',
}
```

---

## 5. Question Levels (Actual)

```typescript
type QuestionLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
```

| Level | Options | Type |
|-------|---------|------|
| easy | 2 (A, B) | True/False |
| medium | 2 (A, B) | 2 choice |
| hard | 3 (A, B, C) | 3 choice |
| expert | 4 (A, B, C, D) | 4 choice |
| extreme | 0 | Open answer |

---

## 6. API Endpoints (Actual)

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /quiz/subjects | List all subjects |
| GET | /quiz/subjects/:slug | Get subject with chapters |
| GET | /quiz/subjects/:slug/questions | Get published questions for subject |
| GET | /quiz/questions/:chapterId | Get published questions for chapter |
| GET | /quiz/mixed | Get random published questions |
| GET | /quiz/random/:level | Get random published by level |

### Admin Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /quiz/questions | Get all questions (all statuses) |
| GET | /quiz/filter-counts | Get filter counts |
| POST | /quiz/subjects | Create subject |
| PUT | /quiz/subjects/:id | Update subject |
| DELETE | /quiz/subjects/:id | Delete subject (transactional) |
| POST | /quiz/chapters | Create chapter |
| PATCH | /quiz/chapters/:id | Update chapter |
| DELETE | /quiz/chapters/:id | Delete chapter |
| POST | /quiz/questions | Create question |
| POST | /quiz/questions/bulk | Bulk create questions |
| PATCH | /quiz/questions/:id | Update question |
| DELETE | /quiz/questions/:id | Delete question |
| POST | /quiz/bulk-action | Bulk action (publish/draft/trash/delete) |
| GET | /quiz/subjects/:slug/status-counts | Get status counts for subject |

---

## 7. Key Implementation Details

### 7.1 Transactional Subject Delete

```typescript
// quiz.service.ts lines 110-142
async deleteSubject(id: string): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (subject.chapters && subject.chapters.length > 0) {
      for (const chapter of subject.chapters) {
        await queryRunner.manager.delete(Question, { chapterId: chapter.id });
      }
      await queryRunner.manager.delete(Chapter, { subjectId: id });
    }
    await queryRunner.manager.delete(Subject, { id });
    await queryRunner.commitTransaction();
    await this.clearQuizCaches();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

### 7.2 Public Quiz Endpoints Always Return PUBLISHED

```typescript
// quiz.controller.ts lines 97-98
// PUBLIC ENDPOINT: Always filter by PUBLISHED status - drafts are admin only
const filters = { status: ContentStatus.PUBLISHED, level, chapter, search, subjectSlug: slug };
return this.quizService.findAllQuestions(pagination, filters);
```

### 7.3 Bulk Actions

```typescript
// Uses BulkActionService for publish, draft, trash, delete operations
async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult>
```

### 7.4 Filter Counts (Unified Endpoint)

```typescript
// Returns: subjects, chapterCounts, levelCounts, statusCounts, total
// All counts respect current filter context (cascading)
async getFilterCounts(filters: { subject?, chapter?, level?, status?, search? })
```

### 7.5 Redis Cache Keys

```typescript
private readonly CACHE_KEYS = {
  FILTER_COUNTS: (subject, chapter, level, status) =>
    `quiz:filter-counts:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}`,
  QUESTIONS: (subject, chapter, level, status, page, limit) =>
    `quiz:questions:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}:${page}:${limit}`,
};

private readonly CACHE_TTL = {
  FILTER_COUNTS: 300,  // 5 minutes
  QUESTIONS: 600,       // 10 minutes
};
```

---

## 8. Question Entity (Actual)

```typescript
// apps/backend/src/quiz/entities/question.entity.ts
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  question: string;

  @Column('simple-json', { nullable: true })
  options: string[];

  @Column()
  correctAnswer: string;

  @Column({ nullable: true })
  correctLetter: string;

  @Column({ type: 'simple-enum', enum: ['easy', 'medium', 'hard', 'expert', 'extreme'] })
  level: string;

  @Column({ nullable: true })
  chapterId: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.questions)
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter;

  @Column({ type: 'simple-enum', enum: ['published', 'draft', 'trash'], default: 'draft' })
  status: string;
}
```

---

## 9. CreateQuestionDto (Actual)

```typescript
// apps/backend/src/common/dto/base.dto.ts
export class CreateQuestionDto {
  @IsString()
  question: string;

  @IsString()
  correctAnswer: string;

  @IsString()
  @IsOptional()
  correctLetter?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsEnum(['easy', 'medium', 'hard', 'expert', 'extreme'])
  level: string;

  @IsUUID()
  chapterId: string;

  @IsEnum(['published', 'draft'])
  @IsOptional()
  status?: string;
}
```

---

## 10. NOT Implemented (Future Considerations)

| Feature | Priority | Notes |
|---------|----------|-------|
| Explanation field | Medium | Needed for practice mode |
| Image support | Low | imageUrl field |
| Rate limiting | Low | NestJS throttler |

---

## 11. Related Documents

- [Master Plan](./0-master-plan.md)
- [Admin Panel Implementation](./2-admin-panel.md)
- [User-Side Implementation](./3-user-side.md)
