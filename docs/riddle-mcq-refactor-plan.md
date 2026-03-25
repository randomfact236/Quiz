# Riddle MCQ Refactor Plan

## Status: ✅ COMPLETE

Completed: 2026-03-25

### Architecture
Category → Subject → MCQ (no chapters)

### Summary
Removed the chapter layer from the Riddle MCQ module. MCQs now reference subjects directly instead of going through chapters.

### Verification
- TypeScript errors: 0
- Build status: passing
- Chapter references: none

### Backend Changes
- Removed `riddle_chapters` table and entity
- Removed `riddle_chapter_slug_history` entity
- Updated `riddle_mcqs` to have `subjectId` directly
- Updated `riddle-subject.entity.ts` to have `riddles` relation
- Removed all chapter-related endpoints
- Added server-side filtering to `/riddle-mcq/all`

### Frontend Changes
- Removed chapter functions from riddle-mcq-api.ts
- Created useRiddleMcqFilters hook for URL-based state
- Refactored admin panel (RiddleMcqSection, admin/page.tsx)
- Updated user-facing pages (challenge, practice, play, page)
- Updated RiddleStatsBanner (removed totalChapters)
- Updated MobileFooter (getSubjects instead of getAllChapters)

### Files Modified
**Backend:**
- apps/backend/src/riddle-mcq/entities/*.ts
- apps/backend/src/riddle-mcq/dto/*.ts
- apps/backend/src/riddle-mcq/riddle-mcq.service.ts
- apps/backend/src/riddle-mcq/riddle-mcq.controller.ts

**Frontend:**
- apps/frontend/src/lib/riddle-mcq-api.ts
- apps/frontend/src/lib/useRiddleMcqFilters.ts
- apps/frontend/src/app/admin/components/RiddleMcqSection.tsx
- apps/frontend/src/app/admin/page.tsx
- apps/frontend/src/app/riddle-mcq/challenge/page.tsx
- apps/frontend/src/app/riddle-mcq/practice/page.tsx
- apps/frontend/src/app/riddle-mcq/play/page.tsx
- apps/frontend/src/app/riddle-mcq/page.tsx
- apps/frontend/src/app/riddle-mcq/components/RiddleStatsBanner.tsx
- apps/frontend/src/components/MobileFooter.tsx
