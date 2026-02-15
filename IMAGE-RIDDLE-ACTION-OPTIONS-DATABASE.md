# Image Riddle Action Options - Database Schema

## ✅ Database Migration Complete

### Columns Added to `image_riddles` Table:

| Column Name | Type | Nullable | Default | Purpose |
|-------------|------|----------|---------|---------|
| `action_options` | JSONB | YES | NULL | Stores action options array displayed below question |
| `use_default_actions` | BOOLEAN | YES | true | Flag to use default actions when custom not provided |

### Database Schema

```sql
-- Table: image_riddles
-- Columns for action options feature:

action_options       | jsonb    | YES | 
use_default_actions  | boolean  | YES | true

-- Index created:
idx_image_riddles_action_options (GIN index on action_options)
```

### Sample Data Structure

```json
{
  "action_options": [
    {
      "id": "submit-answer",
      "label": "Check Answer",
      "type": "button",
      "style": "primary",
      "size": "lg",
      "icon": "✓",
      "iconPosition": "left",
      "ariaLabel": "Submit your answer",
      "keyboardShortcut": "Enter",
      "isEnabled": true,
      "isVisible": true,
      "position": "below_question",
      "order": 5,
      "tooltip": "Check if your answer is correct (Enter)",
      "visibilityConditions": { "showWhenAnswerHidden": true },
      "animation": { 
        "entrance": "slideUp", 
        "hover": "scale", 
        "click": "press", 
        "duration": 150, 
        "delay": 0 
      },
      "loading": { 
        "showSpinner": true, 
        "text": "Checking...", 
        "disableWhileLoading": true 
      },
      "analyticsEvent": "answer_submitted",
      "createdAt": "2026-02-14T09:00:00.000Z",
      "updatedAt": "2026-02-14T09:00:00.000Z"
    },
    {
      "id": "show-hint",
      "label": "Show Hint",
      "type": "button",
      "style": "info",
      "size": "md",
      "icon": "💡",
      "iconPosition": "left",
      "ariaLabel": "Show hint",
      "keyboardShortcut": "Alt+H",
      "isEnabled": true,
      "isVisible": true,
      "position": "below_question",
      "order": 10,
      "tooltip": "Get a hint (Alt+H)",
      "visibilityConditions": { "showWhenAnswerHidden": true },
      "analyticsEvent": "hint_revealed"
    }
  ],
  "use_default_actions": true
}
```

### SQL to Query Action Options

```sql
-- Get riddle with action options
SELECT 
  id, 
  title, 
  action_options,
  use_default_actions
FROM image_riddles 
WHERE id = 'your-riddle-id';

-- Find riddles with custom action options
SELECT 
  id, 
  title 
FROM image_riddles 
WHERE action_options IS NOT NULL 
  AND jsonb_array_length(action_options) > 0;

-- Find riddles using default actions
SELECT 
  id, 
  title 
FROM image_riddles 
WHERE use_default_actions = true;
```

### Migration Files Created

| File | Purpose |
|------|---------|
| `add-action-options.sql` | Direct SQL migration |
| `1707912000000-AddActionOptionsToImageRiddles.ts` | TypeORM migration class |

### Backend Entity Integration

The `ImageRiddle` entity now includes:

```typescript
@Entity('image_riddles')
export class ImageRiddle {
  // ... existing columns ...

  @Column({ type: 'jsonb', nullable: true, default: null })
  actionOptions: IActionOption[] | null;

  @Column({ type: 'boolean', default: true })
  useDefaultActions: boolean;

  // Method to get effective actions
  getEffectiveActionOptions(): IActionOption[] {
    if (this.actionOptions?.length > 0) {
      return this.actionOptions;
    }
    if (!this.useDefaultActions) {
      return [];
    }
    return this.generateDefaultActionOptions();
  }
}
```

### Default Actions Generated

When `use_default_actions = true` and no custom actions provided:

1. **Submit Answer** (Primary button, Enter key)
2. **Show Hint** (If hint exists, Alt+H)
3. **Skip** (With confirmation, Alt+S)
4. **Reveal Answer** (With confirmation, Alt+A)
5. **Timer Controls** (If timer enabled)
6. **Fullscreen Toggle**
7. **Share**
8. **Report Issue**

---

**Migration Status**: ✅ Complete  
**Database**: PostgreSQL (ai-quiz)  
**Date**: 2026-02-14
