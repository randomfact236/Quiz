# Riddle Code Cleanup Plan

## Status: 📋 PENDING

---

## Issues Summary

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 High | 5 | Wrong routing links, type casting |
| 🟡 Medium | 5 | `any` types, duplicate code, empty catch |
| 🟢 Low | 5 | Dead code, useless effects |
| ⚠️ Type | 2 | Type inconsistencies |

**Total: 17 issues across 10+ files**

---

## Issues Detail

### 🔴 High Severity (5)

#### Issue 1: Wrong back links in practice page
**File:** `src/app/riddle-mcq/practice/page.tsx`
**Lines:** 171, 198
```typescript
// WRONG:
href="/riddles"
// SHOULD BE:
href="/riddle-mcq"
```

#### Issue 2: Wrong back links in challenge page
**File:** `src/app/riddle-mcq/challenge/page.tsx`
**Lines:** 172, 199
```typescript
// WRONG:
href="/riddles"
// SHOULD BE:
href="/riddle-mcq"
```

#### Issue 3: Wrong back link in error page
**File:** `src/app/riddle-mcq/error.tsx`
**Line:** 30
```typescript
// WRONG:
href="/riddles"
// SHOULD BE:
href="/riddle-mcq"
```

#### Issue 4: Wrong routing in MobileFooter
**File:** `src/components/MobileFooter.tsx`
**Line:** 237
```typescript
// WRONG:
href="/riddles/play?chapterId=${chapter.id}&mode=practice"
// SHOULD BE:
href="/riddle-mcq/play?subjectId=${chapter.id}&mode=practice"
```

#### Issue 5: Type casting issue in MobileFooter
**File:** `src/components/MobileFooter.tsx`
**Lines:** 51, 72
```typescript
// CURRENT (WRONG):
const [riddleChapters, setRiddleChapters] = useState<RiddleChapter[]>([]);
// ...
setRiddleChapters(data as any); // data is RiddleSubject[], not RiddleChapter[]

// SHOULD BE:
const [riddleSubjects, setRiddleSubjects] = useState<RiddleSubject[]>([]);
setRiddleSubjects(data);
```

---

### 🟡 Medium Severity (5)

#### Issue 6: Excessive `any` types in play page
**File:** `src/app/riddle-mcq/play/page.tsx`
**Lines:** 149, 154, 369, 372, 377
```typescript
adaptRiddleMcq(r as any)
response.data.map((r: any) => adaptRiddleMcq(r as any))
```

#### Issue 7: Excessive `any` types in admin section
**File:** `src/app/admin/components/RiddleMcqSection.tsx`
**Lines:** 123, 124, 136, 137, 165, 430, 605, 625, 642, 776, 797, 804, 815, 850, 896, 922, 983, 991, 1009, 1033, 1047, 1059, 1067, 1089, 1110
```typescript
useState<any[]>([])
useState<any | null>(null)
catch (err: any)
bulkCreateRiddles([...dtos].reverse() as any)
```

#### Issue 8: Near-identical practice/challenge pages
**Files:** 
- `src/app/riddle-mcq/practice/page.tsx` (365 lines)
- `src/app/riddle-mcq/challenge/page.tsx` (366 lines)

**⚠️ NOTE:** Intentionally kept separate per user request. Skip unless decision changes.

#### Issue 9: Empty catch blocks
**File:** `src/app/riddle-mcq/play/page.tsx`
**Lines:** 126-135, 174-177
```typescript
// Silently swallows errors:
} catch (err) {
  
}
```

#### Issue 10: Duplicate `isAnswerCorrect` logic
**Files:**
- `src/app/riddle-mcq/play/page.tsx` (lines 321-332)
- `src/app/riddle-mcq/results/page.tsx` (lines 47-58)

**Solution:** Extract to `src/lib/riddle-utils.ts`

---

### 🟢 Low Severity (5)

#### Issue 11: Dead code - loadRiddleHistory alias
**File:** `src/lib/riddle-session.ts`
**Line:** 164
```typescript
export const loadRiddleHistory = getRiddleHistory; // Never used
```

#### Issue 12: Dead code - addToRiddleHistory
**File:** `src/lib/riddle-session.ts`
**Lines:** 135-155
```typescript
export function addToRiddleHistory(...) // Never called anywhere
```

#### Issue 13: Dead code - clearRiddleHistory
**File:** `src/lib/riddle-session.ts`
**Lines:** 169-171
```typescript
export function clearRiddleHistory(...) // Never called anywhere
```

#### Issue 14: Useless useEffect
**File:** `src/lib/useRiddleMcqFilters.ts`
**Lines:** 105-109
```typescript
useEffect(() => {
  if (!isInitialized.current) {
    isInitialized.current = true; // Set but never read
  }
}, []);
```

#### Issue 15: Unused function - buildCountsParams
**File:** `src/lib/useRiddleMcqFilters.ts`
**Line:** 66
```typescript
function buildCountsParams(...) // Defined but never used
```

---

### ⚠️ Type Inconsistencies (2)

#### Issue 16: Optional vs Required chapterName
**File:** `src/types/riddles.ts`
- `RiddleHistoryEntry.chapterName` (line 172) - optional `?`
- `RiddleSession.chapterName` (line 131) - required

#### Issue 17: RiddleChapter type vs actual API structure
**Files:** `src/types/riddles.ts`, `src/lib/riddle-mcq-api.ts`
- `RiddleChapter` type exists but riddle-mcq uses Category → Subject → MCQ structure

---

## Order of Execution

### Phase 1: Quick Wins (Low Risk)
1. **Issues 1-4**: Fix wrong routing links
2. **Issues 11-15**: Remove dead code

### Phase 2: Type Safety
3. **Issue 5**: Fix type casting in MobileFooter
4. **Issues 6-7**: Replace `any` types
5. **Issues 16-17**: Fix type inconsistencies

### Phase 3: Code Quality
6. **Issue 9**: Add proper error handling
7. **Issue 10**: Extract `isAnswerCorrect` to shared utility
8. **Issue 8**: Skip (intentionally kept separate)

---

## Files to Modify

### Direct Changes
- `src/app/riddle-mcq/practice/page.tsx`
- `src/app/riddle-mcq/challenge/page.tsx`
- `src/app/riddle-mcq/error.tsx`
- `src/app/riddle-mcq/results/page.tsx`
- `src/app/riddle-mcq/play/page.tsx`
- `src/components/MobileFooter.tsx`
- `src/lib/riddle-session.ts`
- `src/lib/useRiddleMcqFilters.ts`
- `src/types/riddles.ts`
- `src/app/admin/components/RiddleMcqSection.tsx`

### New Files to Create
- `src/lib/riddle-utils.ts` - for shared `isAnswerCorrect` function

---

## Estimated Lines

| Type | Count |
|------|-------|
| Lines to remove | ~150 |
| Lines to add | ~50 |
| **Net reduction** | ~100 lines |

---

## Related Documentation

- Quiz cleanup plan: `docs/clean-quiz-plan.md`
