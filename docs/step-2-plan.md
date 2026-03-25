# STEP 2: Remove Chapter Layer from Backend

## Target Structure
```
Category → Subject → MCQ (no chapter)
```

## Changes to Make

### 2a. riddle-mcq.entity.ts
- [ ] Remove chapterId column
- [ ] Remove chapter ManyToOne relationship
- [ ] Add subjectId column directly
- [ ] Keep indexes

### 2b. riddle-subject.entity.ts  
- [ ] Remove chapters relationship
- [ ] Add direct mcqs relationship

### 2c. Delete Files
- [ ] Delete entities/riddle-chapter.entity.ts
- [ ] Delete entities/riddle-chapter-slug-history.entity.ts

### 2d. riddle-mcq.dto.ts
- [ ] Remove CreateRiddleMcqChapterDto
- [ ] Remove UpdateRiddleMcqChapterDto
- [ ] Remove chapterId from CreateRiddleMcqDto
- [ ] Remove chapterId from UpdateRiddleMcqDto
- [ ] Add subjectId to CreateRiddleMcqDto
- [ ] Add subjectId to UpdateRiddleMcqDto

### 2e. riddle-mcq.service.ts
- [ ] Remove chapterRepo injection
- [ ] Remove all chapter methods (findAllActiveChapters, findChaptersBySubject, createChapter, updateChapter, deleteChapter)
- [ ] Update findAllRiddleMcqsAdmin() to accept: subject, level, status, search, page, limit
- [ ] Update getFilterCounts() to accept: subject, level params
- [ ] Update findRiddleMcqsBySubject() to use subjectId directly
- [ ] Remove findRiddleMcqsByChapter() method
- [ ] Remove chapter joins from all queries
- [ ] Update bulk creation to use subjectId directly
- [ ] Update getStats() to remove chapter count

### 2f. riddle-mcq.controller.ts
- [ ] Remove RiddleChapter import
- [ ] Remove all chapter endpoints (chapters/*)
- [ ] Update /all endpoint to accept filter params
- [ ] Update /filter-counts endpoint to accept params

### 2g. riddle-mcq.module.ts
- [ ] Remove RiddleChapter import
- [ ] Remove RiddleChapterSlugHistory import
- [ ] Remove RiddleChapter from TypeOrmModule.forFeature
- [ ] Remove RiddleChapterSlugHistory from TypeOrmModule.forFeature

## Verification
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] 0 errors before proceeding to Step 3
