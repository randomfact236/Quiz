# getCategoryDesign - Skipped

**Status:** SKIPPED - Not identical, context-specific variations

**Reason:** The two implementations have subtle but meaningful differences:

| Aspect | quiz/page.tsx | TopicSection.tsx |
|--------|---------------|------------------|
| colorClass | `text-blue-600` (text color) | `bg-gradient-to-r from-blue-50 to-indigo-50` (background gradient) |
| icon size | `h-5 w-5` | `h-4 w-4` |
| icon color | none (inherits) | `text-indigo-600` (explicit) |

**Decision:** Risk of introducing subtle bugs outweighs -32 lines savings.

**Future consideration:** Could consolidate with a config object approach:
```typescript
// Example approach
const CATEGORY_CONFIG = {
  academic: {
    textColor: 'text-blue-600',
    bgGradient: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    iconName: 'GraduationCap',
    iconSize: 'h-5 w-5',
    iconColor: 'text-indigo-600'
  },
  // ...
};

function getCategoryDesign(categoryName: string, style: 'text' | 'bg' = 'text') {
  // returns appropriate style based on param
}
```
