# Future Improvements

> Master list of features and improvements to be implemented in future updates.

---

## 📋 Global Features (Cross-cutting features)

### Browser History Navigation ✅ DONE
- [x] URL params for quiz flow (`?subject=animals&chapter=Mammals`)
- [x] Browser back/forward button support
- [x] Shareable/bookmarkable URLs
- [ ] SessionStorage for quiz progress (mid-quiz refresh resume)
- [ ] Timer persistence on refresh
- [ ] Results page URL preservation

### Authentication
- [ ] User Registration
  - Allow users to sign up
  - Email verification
- [ ] Password Reset
  - Forgot password flow
  - Reset via email
- [ ] User Roles
  - More granular role-based access control
  - Content creator vs admin vs viewer

---

## 📋 Quiz (All quiz-related improvements)

### High Priority
- [ ] **Quiz Topic**
  - Allow users to select specific topics/subjects before starting quiz
  - Filter questions by selected topic
  - Support multiple topics in a single quiz

- [ ] **Quiz Timer**
  - Configurable time limit per quiz
  - Auto-submit when time expires
  - Display remaining time to user

- [ ] **Quiz Progress Saving**
  - Save progress if user leaves mid-quiz
  - Resume from where user left off

### Medium Priority
- [ ] **Question Pool / Randomization**
  - Randomize question order
  - Select random subset of questions per quiz

- [ ] **Quiz Analytics**
  - Track user performance over time
  - Show detailed results after quiz completion

### Low Priority
- [ ] **Gamification**
  - Points system
  - Achievements/Badges
  - Leaderboards

---

## 📋 Quiz Admin Features

### High Priority
- [ ] **Question Hint UI**
  - Add hint field to question form
  - Display hints during quiz (optional)
  - Store hints in database

### Medium Priority
- [ ] **Subject Reordering**
  - Enable order field in UpdateSubject API
  - Drag-and-drop reordering in admin UI
  - Persist custom order

- [ ] **Question Duplication**
  - Clone/duplicate existing questions
  - Quick action button in question list
  - Clone to same or different chapter

### Medium Priority
- [ ] **Excel Import**
  - Support .xlsx file format
  - Use xlsx library for parsing
  - Same validation as CSV import

- [ ] **PDF Export**
  - Export questions to PDF format
  - Include question, options, answer key
  - Use jspdf library

- [ ] **Undo Bulk Actions**
  - Store previous state before bulk action
  - Show toast with undo option (30 second window)
  - Implement restore logic for each action type

### Low Priority
- [ ] **Question Tags**
  - Add tags column to Question entity
  - Tag management UI
  - Filter questions by tags

- [ ] **Image/Media Attachments**
  - Add image upload support
  - Display images in questions
  - Support for audio/video questions

- [ ] **Question Analytics**
  - Track question attempt counts
  - Success rate per question
  - Admin analytics dashboard

---

## 📋 Filter System Enhancements (Phase 3)

### Filter Presets
- [ ] Save frequently used filter combinations
- [ ] Quick access buttons for common filters
- [ ] Persist presets in localStorage

### Keyboard Navigation
- [ ] Arrow keys to navigate filter buttons
- [ ] Enter/Space to select filter
- [ ] Escape to clear filters

### Count Animations
- [ ] Animate count numbers when they update
- [ ] Color transitions for active/inactive filters
- [ ] Smooth transitions between filter states

### Additional Filters
- [ ] Date Range Filter - Filter by creation/update date
- [ ] Has Explanation Filter - Questions with/without explanations
- [ ] Sort Options - Sort by date, level, chapter, alphabetical
- [ ] Filter Summary - "Showing X of Y questions" display

---

## 📋 CSV Import (For importing questions)

### High Priority
- [ ] **Duplicate Question Detection**
  - Skip questions that already exist in the database
  - Or offer option to update existing questions
  - Or warn user before import about potential duplicates

### Medium Priority
- [ ] **Import Preview Enhancement**
  - Show more detailed preview of questions to be imported
  - Allow selective import (choose which questions to import)
- [ ] **Validation Improvements**
  - Validate question text length
  - Check for empty or whitespace-only options
  - Validate correct answer matches an existing option

### Low Priority
- [ ] **Support for other file formats**
  - JSON import
  - Excel (.xlsx) import
- [ ] **Export functionality**
  - Export questions to CSV
  - Export with different formats

---

## 📋 UI/UX

- [ ] **Dark Mode**
  - Theme toggle
  - System preference detection

- [ ] **Responsive Design**
  - Better mobile experience
  - Tablet optimizations

- [ ] **Loading States**
  - Skeleton loaders
  - Progress indicators

- [ ] **Accessibility**
  - ARIA labels
  - Keyboard navigation
  - Screen reader support

---

## 📋 Performance

- [ ] **Caching**
  - Cache API responses
  - Service worker for offline support

- [ ] **Optimizations**
  - Lazy loading for images
  - Code splitting
  - Bundle size optimization

---

## 📋 Testing

- [ ] **Unit Tests**
  - Test utility functions
  - Test components

- [ ] **Integration Tests**
  - Test API endpoints
  - Test user flows

- [ ] **E2E Tests**
  - Critical user journeys
  - Quiz taking flow

---

## 📋 Documentation

- [ ] **API Documentation**
  - Swagger/OpenAPI specs
  - Request/Response examples

- [ ] **User Guide**
  - How to use admin panel
  - How to import questions
  - How to create quizzes

---

*Last Updated: 2026-03-17*
