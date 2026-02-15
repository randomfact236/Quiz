# UI Changes Summary - Image Riddle Action Options

## Changes Made

### 1. Edit/Delete Buttons Below Question (List View)
**Location**: `apps/frontend/src/app/image-riddles/page.tsx` - Riddle Cards

Added Edit and Delete buttons below each question title in the grid/list view:

```tsx
{/* Edit/Delete Actions Below Question */}
<div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
  <button className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
    ✏️ Edit
  </button>
  <button className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100">
    🗑️ Delete
  </button>
</div>
```

**Screenshot Style**:
```
┌─────────────────────────────┐
│  [Image]                    │
│                             │
├─────────────────────────────┤
│  🌱 Easy    💡 Hint         │
│  What is hidden in this...  │
│                             │
│  ✏️ Edit  🗑️ Delete         │  ← NEW!
└─────────────────────────────┘
```

### 2. Action Options Moved Below Image (Modal View)
**Location**: `apps/frontend/src/app/image-riddles/page.tsx` - Modal Content

**Before**:
```
Question Title
[Skip] [Reveal Answer]  ← Actions here
[Image]
Timer Section...
```

**After**:
```
Question Title
[Image]
[⏭️ Skip] [👁️ Reveal Answer]  ← Actions now here
Timer Section...
```

### 3. Simplified Default Actions
**Location**: `getDefaultActions()` function

Removed:
- Submit Answer button
- Show Hint button
- Timer control buttons
- Fullscreen button
- Share button
- Report button

Kept only:
- **⏭️ Skip** - Outline style, with confirmation dialog
- **👁️ Reveal Answer** - Primary style, with confirmation dialog

## Visual Layout

### Riddle Card (List View)
```
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │        [Image]           │ │
│ │     ⏱️ 1:30 (timer)      │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ 🌱 Easy          💡 Hint     │
│ What is hidden in...?        │
│                              │
│ ✏️ Edit     🗑️ Delete        │  ← NEW!
└──────────────────────────────┘
```

### Riddle Modal (Detail View)
```
┌─────────────────────────────────────┐
│ 🌱 Easy                    [X]      │
├─────────────────────────────────────┤
│ What is hidden in this image?       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │          [IMAGE]                │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│    [⏭️ Skip]  [👁️ Reveal Answer]   │  ← MOVED HERE!
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ⏱️ Timer Controls...           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Files Modified

1. `apps/frontend/src/app/image-riddles/page.tsx`
   - Added Edit/Delete buttons to riddle cards
   - Moved action options below image in modal
   - Simplified default actions (Skip + Reveal only)

## Backend

No backend changes required - the existing `actionOptions` column in the database already supports custom actions.

## Next Steps

To connect the Edit/Delete buttons to backend:

1. **Edit**: Navigate to edit page or open edit modal
   ```tsx
   router.push(`/admin/image-riddles/${riddle.id}/edit`);
   ```

2. **Delete**: Call delete API
   ```tsx
   await fetch(`/api/image-riddles/${riddle.id}`, { method: 'DELETE' });
   ```

---

**Status**: ✅ Frontend UI Changes Complete
**Date**: 2026-02-14
