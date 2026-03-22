# Admin Sidebar Enhancement Plan

## Goal

Create an editable, drag-and-drop admin sidebar with categorized sections that can be reordered, edited, and expanded/collapsed.

## Features

### 1. **Categorized Sections**
- Default sections: Academic, Professional & Life, Entertainment & Culture, Other Modules
- Each section can contain multiple items (subjects/modules)
- Visual section headers with "+ Add" button

### 2. **Drag-and-Drop Functionality**
- Reorder sections (drag section headers)
- Reorder items within sections (drag individual items)
- Smooth animations during drag
- Visual feedback (drag handles, drop zones)

### 3. **Edit Functionality**
- **Inline editing**: Click to rename section or item
- **Edit modal**: For more complex edits (icon, color, etc.)
- **Delete**: With confirmation dialog
- **Add new**: Section or item

### 4. **Expand/Collapse**
- Click section header to expand/collapse
- Remember expanded state (persist in localStorage)
- Visual indicator (chevron icon)

### 5. **Subject Management**
- Subjects automatically appear under "Academic" section
- Drag subjects between sections
- Edit subject emoji/name inline
- Count badges for each subject

## Technical Implementation

### Backend Changes

#### Database Schema
```sql
-- New table for sidebar sections
CREATE TABLE sidebar_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20) DEFAULT 'blue',
  order_index INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- New table for sidebar items (links subjects/modules to sections)
CREATE TABLE sidebar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sidebar_sections(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('subject', 'module', 'link')),
  target VARCHAR(100) NOT NULL, -- subject slug or route
  icon VARCHAR(50),
  emoji VARCHAR(10),
  order_index INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints
- `GET /api/admin/sidebar` - Get all sections with items
- `POST /api/admin/sidebar/sections` - Create new section
- `PUT /api/admin/sidebar/sections/:id` - Update section
- `DELETE /api/admin/sidebar/sections/:id` - Delete section
- `PUT /api/admin/sidebar/sections/:id/order` - Reorder sections
- `POST /api/admin/sidebar/items` - Create new item
- `PUT /api/admin/sidebar/items/:id` - Update item
- `DELETE /api/admin/sidebar/items/:id` - Delete item
- `PUT /api/admin/sidebar/items/:id/order` - Reorder items within section
- `PUT /api/admin/sidebar/items/:id/move` - Move item to different section

### Frontend Implementation

#### Components

1. **DraggableSidebar** (`components/ui/sidebar/DraggableSidebar.tsx`)
   - Main sidebar container
   - Handles drag-and-drop context
   - Manages section/item state

2. **SidebarSection** (`components/ui/sidebar/SidebarSection.tsx`)
   - Individual section header
   - Expand/collapse functionality
   - Drag handle for reordering
   - Edit/Delete buttons (visible on hover)
   - "+ Add" button for new items

3. **SidebarItem** (`components/ui/sidebar/SidebarItem.tsx`)
   - Individual sidebar item
   - Drag handle
   - Edit/Delete buttons
   - Count badge
   - Active state styling

4. **EditSectionModal** (`components/ui/sidebar/EditSectionModal.tsx`)
   - Modal for editing section
   - Name, icon, color picker
   - Save/Cancel buttons

5. **EditItemModal** (`components/ui/sidebar/EditItemModal.tsx`)
   - Modal for editing item
   - Name, icon/emoji, target
   - Section selector

6. **AddSectionModal** (`components/ui/sidebar/AddSectionModal.tsx`)
   - Create new section
   - Name, icon, color

7. **AddItemModal** (`components/ui/sidebar/AddItemModal.tsx`)
   - Create new item
   - Choose from available subjects/modules
   - Or create custom link

#### Drag-and-Drop Setup

Using `@dnd-kit`:
```tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

#### State Management

```typescript
interface SidebarState {
  sections: SidebarSection[];
  isLoading: boolean;
  error: string | null;
  expandedSections: string[]; // section IDs
}

interface SidebarSection {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  isCollapsed: boolean;
  items: SidebarItem[];
}

interface SidebarItem {
  id: string;
  sectionId: string;
  name: string;
  slug: string;
  type: 'subject' | 'module' | 'link';
  target: string;
  icon?: string;
  emoji?: string;
  order: number;
  count?: number;
  isVisible: boolean;
}
```

#### Key Features

1. **Drag Handlers**
   - `handleDragStart`: Identify dragged item
   - `handleDragOver`: Determine drop position
   - `handleDragEnd`: Update order, move between sections

2. **Edit Modes**
   - Click section header to expand/collapse
   - Double-click or "Edit" button to enter edit mode
   - Inline text field for quick renames
   - Modal for complex edits

3. **Visual Feedback**
   - Drag handle icon (grip vertical)
   - Hover effects on editable items
   - Active state indicator
   - Loading states during API calls

4. **Persistence**
   - Order saved to database immediately after drag
   - Expanded/collapsed state in localStorage
   - Optimistic UI updates

## UI/UX Design

### Section Header
```
┌──────────────────────────────────────┐
│ ⠿  ACADEMIC                    [+] [▼] │  ← Drag handle, Add button, Expand
├──────────────────────────────────────┤
│ ⠿ 📚 Math                      (0) [✏️] [🗑️] │
│ ⠿ 🧪 Science                   (5) [✏️] [🗑️] │
│ ⠿ 📖 History                   (3) [✏️] [🗑️] │
└──────────────────────────────────────┘
```

### Edit Mode
```
┌──────────────────────────────────────┐
│ ⠿ [Academic          ] [💾] [✕]     │  ← Inline edit with save/cancel
├──────────────────────────────────────┤
│ ...items...                          │
└──────────────────────────────────────┘
```

### Empty State
```
┌──────────────────────────────────────┐
│ ⠿  PROFESSIONAL & LIFE           [+] │
├──────────────────────────────────────┤
│  No subjects yet                     │
│  [+ Add Subject]                     │
└──────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Backend
1. Create database migration for new tables
2. Implement API endpoints
3. Seed default sections (Academic, Professional, etc.)
4. Migration script to move existing subjects to sections

### Phase 2: Frontend Components
1. Create DraggableSidebar component with dnd-kit setup
2. Create SidebarSection component
3. Create SidebarItem component
4. Create modal components (Add/Edit)
5. Add API integration hooks

### Phase 3: Integration
1. Replace existing sidebar in admin page
2. Connect to backend API
3. Add loading/error states
4. Test drag-and-drop functionality

### Phase 4: Polish
1. Add animations (Framer Motion)
2. Add keyboard navigation
3. Mobile responsive design
4. Accessibility improvements

## API Integration

```typescript
// hooks/useSidebar.ts
export function useSidebar() {
  const [sections, setSections] = useState<SidebarSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data, error, mutate } = useSWR('/api/admin/sidebar', fetcher);

  const reorderSections = async (sectionIds: string[]) => {
    await api.put('/api/admin/sidebar/sections/reorder', { sectionIds });
    mutate();
  };

  const moveItem = async (itemId: string, targetSectionId: string, newOrder: number) => {
    await api.put(`/api/admin/sidebar/items/${itemId}/move`, {
      sectionId: targetSectionId,
      order: newOrder,
    });
    mutate();
  };

  // ... other methods

  return {
    sections: data?.sections || [],
    isLoading,
    error,
    reorderSections,
    moveItem,
    // ...
  };
}
```

## Testing

1. **Drag-and-Drop**
   - Reorder sections
   - Reorder items within section
   - Move item to different section
   - Cancel drag operation

2. **Edit Operations**
   - Rename section
   - Rename item
   - Change icon/emoji
   - Delete with confirmation

3. **State Persistence**
   - Order persists after refresh
   - Expanded/collapsed state persists
   - Changes reflect immediately

4. **Edge Cases**
   - Empty sections
   - Single item in section
   - All sections collapsed
   - Network errors

## Security Considerations

1. Validate user has admin role for all mutations
2. Sanitize input for section/item names
3. Prevent deletion of system-required sections
4. Rate limiting on reorder operations

## Future Enhancements

1. **Custom Icons**: Upload custom icons for sections
2. **Color Themes**: Custom colors per section
3. **Permissions**: Different sidebar per user role
4. **Keyboard Shortcuts**: Ctrl+E to edit, Delete to remove
5. **Undo/Redo**: History of sidebar changes

## Dependencies

Already installed:
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- framer-motion

Additional needed:
- None! All required packages are already available.

## Time Estimate

- Backend (API + Database): 4-6 hours
- Frontend Components: 6-8 hours
- Integration & Testing: 2-3 hours
- **Total: 12-17 hours**

## Success Criteria

- [ ] Sidebar sections can be reordered via drag-and-drop
- [ ] Items can be reordered within sections
- [ ] Items can be moved between sections
- [ ] Sections can be renamed inline
- [ ] Items can be renamed inline
- [ ] Sections can be expanded/collapsed
- [ ] New sections can be added
- [ ] New items can be added to sections
- [ ] Sections and items can be deleted (with confirmation)
- [ ] Changes persist after page refresh
- [ ] Loading and error states handled
- [ ] Mobile responsive
- [ ] Keyboard accessible
