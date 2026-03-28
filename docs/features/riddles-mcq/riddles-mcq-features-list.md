# Riddles MCQ Section - Feature List

## Current Structure
```
Category → Subject → Riddle (no chapters)
```

## Implemented Features

### ✅ Core/Basic Features
- Subject/Category Selection
- Difficulty Level Selection (Easy, Medium, Hard, Expert)
- Multiple Choice Display (4 options)
- Answer Selection (A, B, C, D)
- Progress Tracking (current/total)
- Results Summary (correct/incorrect)

### ✅ Good to Have Features
- Practice Mode (unlimited time, show answer)
- Challenge Mode (timed riddles)
- Streak Tracking
- Hint System
- Statistics Banner (total subjects, riddles)

### ✅ Enterprise Grade Features
- Category-wise Selection
- All Subjects Mode
- Complete Mix Mode
- Subject-wise Level Counts
- Docker Deployment Support
- Backend API Integration
- Redis Cache
- Database Indexing

---

## Implementation Order

### Phase 1: Admin Panel - Category & Subject Management

#### 1.1 Category CRUD
- [ ] Create Category API (POST)
- [ ] Read Categories API (GET list, GET single)
- [ ] Update Category API (PUT/PATCH)
- [ ] Delete Category API (DELETE)
- [ ] Category list in Admin UI
- [ ] Category create/edit form in Admin UI
- [ ] Category delete confirmation in Admin UI
- [ ] Category status toggle (published/draft/trash)

#### 1.2 Subject CRUD
- [ ] Create Subject API (POST)
- [ ] Read Subjects API (GET list, GET single)
- [ ] Update Subject API (PUT/PATCH)
- [ ] Delete Subject API (DELETE)
- [ ] Subject list in Admin UI (filter by category)
- [ ] Subject create/edit form in Admin UI
- [ ] Subject delete confirmation in Admin UI
- [ ] Subject status toggle (published/draft/trash)

---

### Phase 2: Admin Panel - Riddle Management

#### 2.1 Riddle CRUD
- [ ] Create Riddle API (POST)
- [ ] Read Riddles API (GET list with filters, GET single)
- [ ] Update Riddle API (PUT/PATCH)
- [ ] Delete Riddle API (DELETE)

#### 2.2 Riddle Admin UI
- [ ] Riddle list view with search/filter by subject/level/status
- [ ] Riddle create/edit form in Admin UI
- [ ] Riddle delete confirmation in Admin UI
- [ ] Difficulty Filter in Admin
- [ ] Status Management (published/draft/trash)

---

### Phase 3: Data Import/Export

#### 3.1 Bulk Import
- [ ] CSV import API endpoint
- [ ] CSV import UI in Admin
- [ ] Import validation & error reporting
- [ ] Subject auto-creation during import (optional)

---

### Phase 4: User Experience Enhancements

#### User Features
- [ ] Daily Challenges (new riddle each day)
- [ ] Progress Saving (localStorage resume)
- [ ] Favorites/Bookmarks
- [ ] History Tracking

#### Game Enhancements
- [ ] Sound Effects (correct/wrong sounds)
- [ ] Timer Display (visual countdown)
- [ ] Share Results (social sharing)

---

### Phase 5: Gamification

- [ ] Achievement Badges
- [ ] Global Leaderboards
- [ ] Performance Analytics
- [ ] User Profiles/Accounts

---

### Phase 6: Platform Features

#### Admin
- [ ] Bulk Operations (publish, archive, delete)
- [ ] Analytics Dashboard
- [ ] Question Bank Management

#### Technical
- [ ] CDN for Images
- [ ] API Rate Limiting
- [ ] Content Moderation
- [ ] Reporting System

#### UI/UX
- [ ] Dark Mode
- [ ] Accessibility (ARIA, keyboard nav)
- [ ] Animations & Transitions
- [ ] Mobile App (PWA)

#### Social
- [ ] Social Features (follow users)
- [ ] Comments/Reviews on Riddles

#### Multiplayer
- [ ] Multiplayer Mode (compete with others)
- [ ] Timed Tournaments

---

## Feature Summary

| Phase | Items | Status |
|-------|-------|--------|
| Phase 1: Category & Subject CRUD | 16 | 🔜 Next |
| Phase 2: Riddle CRUD | 9 | 📋 After Phase 1 |
| Phase 3: Bulk Import | 4 | 📋 After Phase 2 |
| Phase 4: User Experience | 7 | 🚀 Future |
| Phase 5: Gamification | 4 | 🚀 Future |
| Phase 6: Platform | 16 | 🚀 Future |
| **Total Future** | **56** | |

---

## Implementation Details

### Entity Fields

| Entity | Fields |
|--------|--------|
| **Category** | name, emoji, slug, status |
| **Subject** | name, emoji, slug, categoryId, status |
| **Riddle** | question, options (A,B,C,D), correctAnswer, level, hint, explanation, subjectId, status |

### Status Values
- `published` - visible to users
- `draft` - saved but not visible
- `trash` - deleted but restorable

### Bulk Import CSV Format
```csv
question,optionA,optionB,optionC,optionD,correctAnswer,level,subject,hint,explanation
```

### Difficulty Levels
- easy
- medium
- hard
- expert
