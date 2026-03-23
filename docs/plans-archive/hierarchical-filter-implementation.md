# Implementation Plan: Hierarchical Filter Visibility with Backend Enhancement

## Overview
Implement cascading filter visibility where:
- **Subjects**: Always show all options (root level)
- **Chapters**: Filtered by selected subject
- **Levels**: Filtered by selected subject + chapter

## Architecture

### Data Flow
```
Database → Backend Service → API Response → Frontend Display
     ↑              ↑              ↑              ↑
   Natural    Add subjectId    Cacheable    Hierarchical
   Query       to chapters       (Redis)     Filtering
```

## Changes Required

### Backend Changes
**File:** `apps/backend/src/quiz/quiz.service.ts`

#### 1. Update `getFilterCounts()` Method
**Location:** Lines 218-230

**Current:**
```typescript
chapterCounts: { id: string; name: string; count: number }[];
```

**New:**
```typescript
chapterCounts: { 
  id: string; 
  name: string; 
  count: number; 
  subjectId: string;
  subjectSlug: string;
}[];
```

#### 2. Modify Chapter Count Query
**Add to query:**
- JOIN with subjects table
- Select `subject.id` and `subject.slug`
- Group by `chapter.id`, `chapter.name`, `subject.id`, `subject.slug`

#### 3. Add Caching Layer
**Implementation:**
- Cache key: `filter_counts:{subject}:{status}:{level}:{chapter}:{search}`
- TTL: 300 seconds (5 minutes)
- Invalidate on: question/subject/chapter CRUD operations

### Frontend Type Changes
**File:** `apps/frontend/src/lib/quiz-api.ts`

#### Update `FilterCountsResponse` Interface
```typescript
export interface FilterCountsResponse {
  subjectCounts: { slug: string; count: number }[];
  chapterCounts: { 
    id: string; 
    name: string; 
    count: number; 
    subjectId: string;
    subjectSlug: string;
  }[];
  levelCounts: { level: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  total: number;
}
```

### Frontend Logic Changes
**File:** `apps/frontend/src/app/admin/components/QuizMcqSection.tsx`

#### 1. Update `chapterList` Mapping (Line 336)
```typescript
const chapterList = filterCounts?.chapterCounts.map(c => ({ 
  id: c.id, 
  name: c.name, 
  count: c.count,
  subjectId: c.subjectId,
  subjectSlug: c.subjectSlug
})) || [];
```

#### 2. Add `visibleChapters` useMemo
```typescript
const visibleChapters = useMemo(() => {
  if (filters.subject === 'all') return chapterList;
  
  const selectedSubject = subjectsWithIds.find(s => s.slug === filters.subject);
  if (!selectedSubject) return chapterList;
  
  return chapterList.filter(ch => ch.subjectId === selectedSubject.id);
}, [chapterList, filters.subject, subjectsWithIds]);
```

#### 3. Add `visibleLevelCounts` Calculation
```typescript
const visibleLevelCounts = useMemo(() => {
  // Filter questions by current filters
  const relevantQuestions = questions.filter(q => {
    const matchSubject = filters.subject === 'all' || 
      (q.subject?.slug === filters.subject);
    const matchChapter = filters.chapter === 'all' || 
      (q.chapter?.name === filters.chapter);
    return matchSubject && matchChapter;
  });
  
  // Count levels
  const counts: Record<string, number> = {};
  relevantQuestions.forEach(q => {
    counts[q.level] = (counts[q.level] || 0) + 1;
  });
  
  return counts;
}, [questions, filters.subject, filters.chapter]);
```

#### 4. Add Auto-Reset Logic
```typescript
// When subject changes and selected chapter not in new subject
useEffect(() => {
  if (filters.subject !== 'all' && filters.chapter !== 'all') {
    const selectedSubject = subjectsWithIds.find(s => s.slug === filters.subject);
    const chapterExists = chapterList.find(
      ch => ch.name === filters.chapter && ch.subjectId === selectedSubject?.id
    );
    
    if (!chapterExists) {
      setFilter('chapter', 'all');
    }
  }
}, [filters.subject, filters.chapter, chapterList, subjectsWithIds, setFilter]);
```

#### 5. Update Filter Component Props
```typescript
<ChapterFilter
  chapters={visibleChapters}  // Changed from chapterList
  value={filters.chapter || 'all'}
  onChange={(value) => setFilter('chapter', value)}
/>

<LevelFilter
  counts={visibleLevelCounts}  // Changed from levelCounts
  value={filters.level || 'all'}
  onChange={(value) => setFilter('level', value)}
/>
```

## Testing Checklist

### Backend Tests
- [ ] API returns `subjectId` and `subjectSlug` in chapterCounts
- [ ] Query includes proper JOIN with subjects table
- [ ] Caching works correctly
- [ ] Cache invalidates on CRUD operations

### Frontend Tests
- [ ] Click "All" subject → All chapters visible
- [ ] Click "Animals" subject → Only Animals chapters visible
- [ ] Click "Mammals" chapter → Only Mammals levels visible
- [ ] Select chapter then change subject → Chapter auto-resets to "All"
- [ ] Filter counts display correctly
- [ ] Table data filters correctly

### Integration Tests
- [ ] End-to-end filter flow works
- [ ] Performance acceptable (< 100ms response)
- [ ] No console errors

## Deployment Steps

1. **Stop containers**
   ```bash
   docker stop quiz-backend quiz-frontend
   ```

2. **Apply backend changes**
   - Modify `quiz.service.ts`
   - Add caching configuration

3. **Apply frontend changes**
   - Update TypeScript interfaces
   - Modify component logic

4. **Restart containers**
   ```bash
   docker restart quiz-backend quiz-frontend
   ```

5. **Verify**
   - Check API response structure
   - Test filter functionality
   - Monitor performance

## Rollback Plan

If issues occur:
1. Restore original `quiz.service.ts`
2. Restore original `QuizMcqSection.tsx`
3. Restart containers
4. Clear Redis cache if needed

## Future Enhancements

- **Database Indexing:** Add when > 5,000 questions
  ```sql
  CREATE INDEX idx_chapters_subject_id ON chapters(subject_id);
  CREATE INDEX idx_questions_chapter_id ON questions(chapter_id);
  ```

- **Advanced Caching:** Redis Cluster for horizontal scaling

- **Real-time Updates:** WebSocket for live count updates

- **Analytics:** Track filter usage patterns

---

## Success Criteria

✅ All filter buttons show appropriate options
✅ Hierarchical filtering works (Subject → Chapter → Level)
✅ Auto-reset prevents invalid filter combinations
✅ Performance < 100ms for all operations
✅ No breaking changes to existing functionality

**Status:** Ready for Implementation
**Priority:** High
**Estimated Time:** 2-3 hours
