# QuizMcqSection Enhancement Plan

## Goal

Add the enhanced features from QuizManagementSection to QuizMcqSection for a better admin experience while keeping the code lean and focused.

## Features to Implement

### 1. Extra BulkActionToolbar with Confirmations ⭐ HIGH PRIORITY

**Current State:**
- QuizMcqSection uses QuestionTable's basic bulk action bar
- No confirmation dialogs for destructive actions
- No animations

**Target State:**
- Add the enterprise `BulkActionToolbar` component
- Keep QuestionTable's basic bar (it still works)
- Add confirmation modals for Delete action
- Add loading states during actions

**Files to Modify:**
- `apps/frontend/src/app/admin/components/QuizMcqSection.tsx`
  - Import `BulkActionToolbar`
  - Add `selectedIds` state (currently not in QuizMcqSection)
  - Add `bulkActionLoading` state
  - Add `handleBulkAction` callback
  - Add `selectAll`, `deselectAll` callbacks
  - Pass `BulkActionToolbar` after QuestionTable

**Implementation:**
```tsx
// Add state
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [bulkActionLoading, setBulkActionLoading] = useState(false);

// Add callbacks
const handleBulkAction = useCallback(async (action: BulkActionType) => {
  if (selectedIds.length === 0) return;
  setBulkActionLoading(true);
  try {
    await bulkActionQuestions(selectedIds, action);
    setSelectedIds([]);
    handleRefresh();
  } catch (error) {
    console.error(`Failed to ${action} questions:`, error);
  } finally {
    setBulkActionLoading(false);
  }
}, [selectedIds, handleRefresh]);

// Add toolbar after QuestionTable
<BulkActionToolbar
  selectedIds={selectedIds}
  totalItems={questions.length}
  currentFilter={filters.status as StatusFilter}
  onSelectAll={() => setSelectedIds(questions.map(q => q.id))}
  onDeselectAll={() => setSelectedIds([])}
  onAction={handleBulkAction}
  onClose={() => setSelectedIds([])}
  loading={bulkActionLoading}
/>
```

---

### 2. Full Import Modal with Preview ⭐ HIGH PRIORITY

**Current State:**
- QuizMcqSection has no import functionality
- Import buttons exist but do nothing (or minimal)

**Target State:**
- Add import modal with:
  - Drag & drop file upload (can reuse FileUploader)
  - CSV format instructions
  - Import preview with warnings
  - Confirm/Cancel buttons

**Files to Modify:**
- `apps/frontend/src/app/admin/components/QuizMcqSection.tsx`
  - Add import modal state
  - Add `handleFileUpload` callback
  - Add `handleConfirmImport` callback
  - Add import preview state
  - Create Import Modal UI

**Implementation:**
```tsx
// Add state
const [showImportModal, setShowImportModal] = useState(false);
const [importPreview, setImportPreview] = useState<any>(null);
const [importLoading, setImportLoading] = useState(false);
const [importError, setImportError] = useState('');
const [lastImportContent, setLastImportContent] = useState('');

// Add modal JSX after QuestionTable
{showImportModal && (
  <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Questions">
    {/* File upload, format instructions, preview, confirm button */}
  </Modal>
)}
```

---

### 3. Items Per Page Selector ⭐ MEDIUM PRIORITY

**Current State:**
- QuizMcqSection uses fixed `QUESTIONS_PAGE_SIZE = 10`
- No selector for changing page size

**Target State:**
- Add dropdown to select items per page (10, 25, 50)
- Update API call when page size changes

**Files to Modify:**
- `apps/frontend/src/app/admin/components/QuizMcqSection.tsx`
  - Replace `QUESTIONS_PAGE_SIZE` constant with state
  - Add page size selector UI above/below table
  - Update data fetching when page size changes

**Implementation:**
```tsx
// Replace constant with state
const [pageSize, setPageSize] = useState(QUESTIONS_PAGE_SIZE);

// Add selector UI
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">Show:</span>
  <select 
    value={pageSize} 
    onChange={(e) => setPageSize(Number(e.target.value))}
    className="px-2 py-1 border rounded"
  >
    <option value={10}>10</option>
    <option value={25}>25</option>
    <option value={50}>50</option>
  </select>
</div>
```

---

### 4. Enhanced Status Dashboard ⭐ LOW PRIORITY

**Current State:**
- StatusFilter shows 4 blocks with counts
- No indication of which filter is active (except border)

**Target State:**
- Add active filter indicator (background highlight)
- Already mostly done in current implementation
- Could add subtle animation when filter changes

**Files to Modify:**
- `apps/frontend/src/components/ui/quiz-filters/StatusFilter.tsx`
  - Already has active state styling
  - Optional: Add smooth transition animation

---

## Features NOT Implementing

- **Export as JSON** - Not needed for QuizMcqSection, CSV is sufficient
- **Enhanced Status Dashboard** - Already sufficient in current implementation

---

## Implementation Order

1. **BulkActionToolbar** - Most impactful, users expect confirmation for deletes
2. **Import Modal** - Important for CSV imports
3. **Items Per Page Selector** - Nice to have, improves UX
4. **Enhanced Status Dashboard** - Optional, low priority

---

## Code Considerations

### Shared Components
Many of these features already exist as shared components:
- `BulkActionToolbar` - Already exists, just need to import and use
- `FileUploader` - Already exists, can reuse
- `Modal` - Already exists, can reuse

### State Management
QuizMcqSection currently uses URL-based filters via `useQuizFilters`. Need to ensure:
- Selected IDs state is local (not in URL)
- Import modal state is local
- Page size preference could be local or URL-based

### Type Safety
Ensure all callbacks have proper TypeScript types:
- `BulkActionType` from types
- `StatusFilter` type for current filter

---

## Testing Checklist

- [ ] Bulk actions work (publish, draft, trash, delete)
- [ ] Confirmation dialog appears for delete
- [ ] Loading state shows during bulk action
- [ ] Import modal opens/closes correctly
- [ ] CSV file upload works
- [ ] Import preview shows correct information
- [ ] Warnings display for invalid data
- [ ] Import success/failure states work
- [ ] Page size selector changes data fetch
- [ ] Pagination updates correctly with new page size

---

## File Summary

### Files to Modify:
1. `apps/frontend/src/app/admin/components/QuizMcqSection.tsx` - Add bulk actions, import modal, page selector
2. `apps/frontend/src/components/ui/quiz-filters/StatusFilter.tsx` - Optional animation enhancement

### Dependencies (already exist):
- `BulkActionToolbar` component
- `FileUploader` component
- `Modal` component
- `bulkActionQuestions` API function
- `importQuestionsFromCSV` utility

---

## Effort Estimate

| Feature | Complexity | Time |
|---------|-----------|------|
| BulkActionToolbar | Medium | 1-2 hours |
| Import Modal | Medium | 1-2 hours |
| Items Per Page | Low | 30 min |
| Status Dashboard | Low | 15 min |

**Total: ~3-4 hours**

---

## Notes

- Keep QuizMcqSection lean - it should remain a lightweight overview component
- Don't over-engineer - basic functionality is already good
- Focus on the BulkActionToolbar and Import Modal as priorities
- Items Per Page is nice-to-have but not critical
