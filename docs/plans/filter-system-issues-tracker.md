# Quiz Filter System - Known Issues Tracker

## Status: ACTIVE ISSUES REQUIRING DEBUG

---

## 1. COUNT DISPLAY ISSUES

### 1.1 Subject Filter Counts
**Status**: ❌ BROKEN
**Issue**: Subject counts display initially, but disappear when subject is clicked
**Expected**: Count should remain visible (e.g., "Animals (5)") even when selected
**Actual**: Count disappears, only shows "Animals"
**Impact**: Users can't see count of selected subject

### 1.2 Chapter Filter Counts
**Status**: ❌ BROKEN
**Issue**: Chapter counts not showing at all
**Expected**: Chapter pills should show counts (e.g., "Mammals (5)")
**Actual**: No counts visible on chapter pills
**Additional Issue**: No filter auto-selected by default
**Impact**: Can't see question distribution across chapters

### 1.3 Level Filter Counts
**Status**: ❌ BROKEN
**Issue**: When clicking individual level, other level counts disappear
**Expected**: All levels always visible with counts (contextual to subject+chapter)
**Actual**: Only selected level shows, others hidden or show 0
**Example**: Click "Easy" → only Easy visible, Medium/Hard/etc hidden
**Impact**: Can't see distribution of other levels

### 1.4 Status/Stat Section Counts
**Status**: ❌ BROKEN
**Issues**:
1. Status counts not showing correctly
2. When selecting status (e.g., "Trash"), other statuses show 0
3. Status counts not filtering based on subject/chapter/level selection
**Expected**: 
- All 4 statuses always visible (All, Published, Draft, Trash)
- Counts contextual to current filters (subject+chapter+level)
- Example: Animals + Mammals selected → Status shows counts for only Mammals
**Actual**: 
- Shows 0 for non-selected statuses
- Not filtering by active filters

---

## 2. CRUD OPERATION ISSUES

### 2.1 Subject Creation
**Status**: ❌ BROKEN
**Issues**:
1. Created subject not appearing instantly (requires page refresh)
2. Filter counts not updating after subject creation
**Expected**: New subject appears immediately in filter with count
**Actual**: Subject invisible until manual refresh

### 2.2 Chapter Creation
**Status**: ❌ CRITICAL - BROKEN
**Issue**: Chapter not being created at all
**Expected**: Chapter created and visible instantly
**Actual**: Chapter creation fails or doesn't persist
**Impact**: Can't add new chapters

### 2.3 Delete Operations
**Status**: ❌ BROKEN
**Issues**:
1. Deleted subjects not disappearing instantly
2. Deleted chapters not disappearing instantly
**Expected**: Immediate removal from UI after delete confirmation
**Actual**: Item remains visible until page refresh

---

## 3. FILTER SYSTEM ISSUES

### 3.1 Cascading Behavior
**Status**: ❌ BROKEN
**Issues**:
1. Selecting subject doesn't limit chapter options (shows all chapters)
2. Selecting chapter doesn't limit level counts (shows global counts)
3. "All" counts not showing proper totals
**Expected**:
- Subject "Animals" selected → Only Animals chapters visible
- Chapter "Mammals" selected → Level counts show only Mammals distribution
**Actual**: No cascading - shows all options regardless of parent selection

### 3.2 Count Context Issues
**Status**: ❌ BROKEN
**Issues**:
1. Level counts showing global counts instead of filtered by subject+chapter
2. Status counts showing global instead of filtered by all active filters
**Example Current**:
- Subject: Animals selected
- Level counts: Shows ALL questions (10) instead of Animals questions (5)
**Expected**:
- Level counts should be contextual to selected filters

### 3.3 Table Filtering
**Status**: ✅ WORKING
**Note**: User confirmed "Table is showing filtering" - data table filters correctly

---

## DEBUG CHECKLIST

### Phase 1: Data Flow Verification
- [ ] Verify API returns correct counts for each filter type
- [ ] Check if frontend receiving and storing counts correctly
- [ ] Verify countParams vs dataParams separation

### Phase 2: Component State Debug
- [ ] Check SubjectFilter props (counts being passed?)
- [ ] Check ChapterFilter props (counts being passed?)
- [ ] Check LevelFilter props (counts being passed?)
- [ ] Check StatusFilter props (counts being passed?)

### Phase 3: CRUD Operations Debug
- [ ] Test subject creation API call
- [ ] Test chapter creation API call
- [ ] Verify onRefreshSubjects callback
- [ ] Check delete operations

### Phase 4: Cascading Logic Debug
- [ ] Verify visibleChapters useMemo logic
- [ ] Check visibleLevelCounts calculation
- [ ] Review filterParams vs countParams usage
- [ ] Debug status count calculation

---

## PRIORITY ORDER

1. **CRITICAL**: Chapter creation not working
2. **HIGH**: Counts not displaying correctly (subjects, chapters, levels, status)
3. **HIGH**: Cascading filters not working
4. **MEDIUM**: CRUD instant refresh issues

---

## NOTES

- Backend API appears to be working (getFilterCounts returning data)
- Table filtering works correctly
- Issues appear to be in frontend state management and component props
- Need to verify useMemo dependencies and calculation logic

---

Last Updated: 2026-03-22
Status: ACTIVE DEBUG REQUIRED
