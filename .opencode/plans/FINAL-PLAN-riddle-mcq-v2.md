# Riddle MCQ Section - Complete Implementation Plan

**Version:** 2.1  
**Date:** 2026-03-24  
**Status:** Ready for Implementation (Updated: Frontend pages exist under `/riddles/`, need rename)
**Objective:** Create a fully functional `riddle-mcq/` module that mirrors the `quiz/` module architecture

---

## DOCUMENT PURPOSE

This plan provides **complete implementation details** for the Riddle MCQ section. Anyone reading this document should be able to:
- Understand what the Riddle MCQ section does
- See exactly what features are included
- Understand the database structure
- See the complete API endpoints
- Know what UI components are needed
- Understand how data flows through the system
- Implement the entire system without additional guidance

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Current Implementation (Phase 1-10)](#2-current-implementation-phase-1-10)
3. [Target Architecture](#3-target-architecture)
4. [Database Schema](#4-database-schema)
5. [Feature Specification](#5-feature-specification)
6. [UI/UX Design](#6-uiux-design)
7. [API Endpoints](#7-api-endpoints)
8. [Data Flow](#8-data-flow)
9. [Implementation Phases](#9-implementation-phases)
10. [File Summary](#10-file-summary)
11. [Migration Plan](#11-migration-plan)
12. [Cache Strategy](#12-cache-strategy)
13. [Code Cleanup](#13-code-cleanup)
14. [Verification Checklist](#14-verification-checklist)
15. [Future Implementation](#15-future-implementation)

---

## 1. Overview

### 1.1 What is Riddle MCQ?

The Riddle MCQ section is a quiz-like system where users answer multiple-choice riddles organized by subjects and chapters. It mirrors the Quiz section exactly but uses riddle-style questions instead of general knowledge questions.

### 1.2 Core Features

| Feature | Description |
|---------|-------------|
| Subject Selection | Users browse riddles by category (Academic, Professional, Entertainment) |
| Chapter Selection | Each subject has multiple chapters |
| Level Selection | 5 difficulty levels: Easy, Medium, Hard, Expert, Extreme |
| Quiz Play | Users answer MCQ riddles within time limits |
| Practice Mode | No time limit, show correct answer after each question |
| Timer Challenge | Race against time to answer as many as possible |
| Admin Management | Full CRUD for subjects, chapters, and riddles |
| CSV Import/Export | Bulk import riddles from CSV, export filtered results |
| Status Management | Publish/Draft/Trash system for riddles |
| Hierarchical Filtering | Filter by Subject → Chapter → Level → Status |

### 1.3 Module Structure

```
apps/backend/src/riddle-mcq/          # NEW module (mirrors quiz/) ✅ EXISTS
apps/frontend/src/app/riddle-mcq/    # RENAME from riddles/ (frontend pages)
apps/frontend/src/lib/riddle-mcq-api.ts  # RENAME from riddles-api.ts
```

---

## 2. Current Implementation (Phase 1-10)

This plan implements Riddle MCQ to mirror Quiz architecture exactly. All 26 features below will be implemented.

### Phase 1-5: Core System

| # | Feature | Description |
|---|---------|-------------|
| 1 | Subject Selection | Users browse riddles by category (Academic, Professional, Entertainment) |
| 2 | Chapter Selection | Each subject has multiple chapters |
| 3 | Difficulty Level Selection | 5 levels: Easy, Medium, Hard, Expert, Extreme |
| 4 | Question Display | MCQ format with options A/B/C/D |
| 5 | Progress Bar | Shows current/total questions |
| 6 | Results Display | Score, correct/incorrect breakdown |
| 7 | Browser Back/Forward | Navigation support |
| 8 | URL Parameters | Shareable links with state |
| 9 | Practice Mode | Unlimited time, show answers |
| 10 | Challenge Mode | Timed questions (30 sec default) |
| 11 | Timer Challenge Mode | Total time limit, speed bonus |
| 12 | Streak Tracking | Track consecutive correct answers |
| 13 | CSV Bulk Import | Import riddles from CSV |
| 14 | CSV Export | Export filtered riddles |
| 15 | Full Admin CRUD | Create/Read/Update/Delete all entities |
| 16 | Question Status | Published/Draft/Trash system |
| 17 | Filter by Status/Level/Chapter | Hierarchical filtering |
| 18 | Search Questions | Text search on riddle content |
| 19 | Real-time Filter Counts | Show counts in filter UI |
| 20 | Docker Deployment | Container-ready configuration |

### Phase 5b: Chapter Slug System

| # | Feature | Description |
|---|---------|-------------|
| 21 | Chapter Slug | Auto-generated slugs with history |

### Phase 6: Database Indexes

| # | Feature | Description |
|---|---------|-------------|
| 22 | Database Indexes | Composite + single column indexes |

### Phase 7: Redis Cache

| # | Feature | Description |
|---|---------|-------------|
| 23 | Redis Cache | getOrSet caching with TTL |

### Phase 8: Code Cleanup

| # | Feature | Description |
|---|---------|-------------|
| 24 | Code Cleanup | Remove dead code, unused imports |

### Phase 9: UUID Progress Tracking

| # | Feature | Description |
|---|---------|-------------|
| 25 | UUID Progress | localStorage with chapterUUID keys |

### Phase 10: Public Endpoint Security

| # | Feature | Description |
|---|---------|-------------|
| 26 | Public Endpoint | /public/ endpoints force published status |

---

### Why This Structure?

| Reason | Description |
|--------|-------------|
| Quiz Mirror | Same architecture as proven Quiz system |
| Separation | New `riddle-mcq/` vs old `riddles/` |
| Complete | All 26 features cover full user + admin experience |
| Extensible | Future features build on solid foundation |

---

## 3. Target Architecture

### 3.1 Backend Structure

```
apps/backend/src/
├── quiz/                         ✅ Existing (unchanged)
│   ├── quiz.controller.ts
│   ├── quiz.service.ts
│   ├── quiz.module.ts
│   └── entities/
│       ├── question.entity.ts
│       ├── subject.entity.ts
│       └── chapter.entity.ts
│
├── riddle-mcq/                   ✗ NEW
│   ├── riddle-mcq.controller.ts
│   ├── riddle-mcq.service.ts
│   ├── riddle-mcq.module.ts
│   ├── dto/
│   │   └── riddle-mcq.dto.ts
│   └── entities/
│       ├── riddle-mcq.entity.ts
│       ├── riddle-subject.entity.ts
│       └── riddle-chapter.entity.ts
│
├── riddles/                      → DELETE (old module)
├── image-riddles/                ✅ Existing (unchanged)
└── common/                       ✅ Existing
```

### 3.2 Frontend Structure

```
apps/frontend/src/
├── app/
│   ├── quiz/                     ✅ Existing (unchanged)
│   │   ├── page.tsx             # Subject/chapter selection
│   │   ├── play/page.tsx        # Quiz play
│   │   ├── results/page.tsx     # Results display
│   │   ├── practice-mode/        # Practice mode
│   │   └── timer-challenge/      # Timer challenge
│   │
│   ├── riddle-mcq/              ✏️ RENAME from riddles/
│   │   ├── page.tsx             # Subject/chapter selection
│   │   ├── play/page.tsx        # Riddle quiz play
│   │   ├── results/page.tsx     # Results display
│   │   ├── practice/page.tsx     # Practice mode (note: practice not practice-mode)
│   │   └── challenge/page.tsx     # Timer challenge (note: challenge not timer-challenge)
│   │
│   └── riddles/                  → DELETE (renamed to riddle-mcq)
│
├── lib/
│   ├── riddle-mcq-api.ts        ✏️ RENAME from riddles-api.ts
│   └── riddles-api.ts            → DELETE
│
└── hooks/
    ├── useRiddleMcq.ts          ✗ NEW (mirrors useQuiz.ts)
    └── useRiddleMcqSubjects.ts  ✗ NEW (mirrors useQuizSubjects.ts)
```

### 3.3 Database Structure

```sql
-- Riddle Subjects (mirrors quiz_subjects)
riddle_subjects
├── id (UUID, PK)
├── name (VARCHAR)
├── slug (VARCHAR, UNIQUE)
├── emoji (VARCHAR, nullable)
├── category (ENUM: academic, professional, entertainment)
├── order (INT, default 0)
├── isActive (BOOLEAN, default true)
└── timestamps

-- Riddle Chapters (mirrors quiz_chapters)
riddle_chapters
├── id (UUID, PK)
├── name (VARCHAR)
├── subjectId (UUID, FK → riddle_subjects.id)
├── isActive (BOOLEAN, default true)
└── timestamps

-- Riddle MCQs (mirrors quiz_questions)
riddle_mcqs
├── id (UUID, PK)
├── question (TEXT)
├── options (JSON, nullable)  -- ['A', 'B', 'C', 'D'] or null for expert
├── correctAnswer (VARCHAR, nullable)  -- 'A', 'B', 'C', 'D' or null for expert
├── level (ENUM: easy, medium, hard, expert, extreme)
├── explanation (TEXT, nullable)
├── chapterId (UUID, FK → riddle_chapters.id)
├── status (ENUM: published, draft, trash)
└── timestamps
```

---

## 4. Database Schema

### 4.1 RiddleSubject Entity

```typescript
// File: apps/backend/src/riddle-mcq/entities/riddle-subject.entity.ts

import {
  Entity,
  PrimaryGeneratedUUID,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { RiddleChapter } from './riddle-chapter.entity';

@Entity('riddle_subjects')
export class RiddleSubject {
  @PrimaryGeneratedUUID('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({
    type: 'enum',
    enum: ['academic', 'professional', 'entertainment'],
    default: 'entertainment',
  })
  category: 'academic' | 'professional' | 'entertainment';

  @Column({ default: 0 })
  @Index()
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RiddleChapter, (chapter) => chapter.subject)
  chapters: RiddleChapter[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

### 4.2 RiddleChapter Entity

```typescript
// File: apps/backend/src/riddle-mcq/entities/riddle-chapter.entity.ts

import {
  Entity,
  PrimaryGeneratedUUID,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { RiddleSubject } from './riddle-subject.entity';
import { RiddleMcq } from './riddle-mcq.entity';

@Entity('riddle_chapters')
export class RiddleChapter {
  @PrimaryGeneratedUUID('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  @Index()
  subjectId: string;

  @ManyToOne(() => RiddleSubject, (subject) => subject.chapters)
  @JoinColumn({ name: 'subjectId' })
  subject: RiddleSubject;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RiddleMcq, (mcq) => mcq.chapter)
  mcqs: RiddleMcq[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

### 4.3 RiddleMcq Entity

```typescript
// File: apps/backend/src/riddle-mcq/entities/riddle-mcq.entity.ts

import {
  Entity,
  PrimaryGeneratedUUID,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RiddleChapter } from './riddle-chapter.entity';

export enum RiddleLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
  EXTREME = 'extreme',
}

export enum RiddleStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  TRASH = 'trash',
}

@Entity('riddle_mcqs')
@Index(['chapterId', 'level', 'status'])  // Composite index
@Index(['chapterId'])
@Index(['level'])
@Index(['status'])
export class RiddleMcq {
  @PrimaryGeneratedUUID('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'simple-json', nullable: true })
  options: string[];  // ['A', 'B', 'C', 'D'] for easy/medium/hard; null for expert/extreme

  @Column({ nullable: true })
  correctAnswer: string;  // 'A', 'B', 'C', 'D' for easy/medium/hard; null for expert/extreme

  @Column({
    type: 'enum',
    enum: RiddleLevel,
    default: RiddleLevel.EASY,
  })
  level: RiddleLevel;

  @Column({ type: 'text', nullable: true })
  explanation: string;  // Shown after answering in practice mode

  @Column()
  @Index()
  chapterId: string;

  @ManyToOne(() => RiddleChapter, (chapter) => chapter.mcqs)
  @JoinColumn({ name: 'chapterId' })
  chapter: RiddleChapter;

  @Column({
    type: 'enum',
    enum: RiddleStatus,
    default: RiddleStatus.DRAFT,
  })
  status: RiddleStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

### 4.4 Level Definitions

| Level | Options | Correct Answer | Explanation |
|-------|---------|----------------|-------------|
| Easy | A, B, C, D | Letter | Optional |
| Medium | A, B, C, D | Letter | Optional |
| Hard | A, B, C, D | Letter | Optional |
| Expert | **None** | **null** | Optional |
| Extreme | **None** | **null** | Optional |

---

## 5. Feature Specification

### 5.1 User-Facing Features

#### 5.1.1 Subject Selection
- Display subjects organized by category (Academic, Professional, Entertainment)
- Show emoji, name, and riddle count per subject
- Clickable cards that navigate to chapter selection
- Collapsible category sections

#### 5.1.2 Chapter Selection
- Show "All Chapters" option to include all chapters
- Display chapter cards with riddle count
- Filter by selected subject
- Click to proceed to level selection

#### 5.1.3 Level Selection
- 5 levels: Easy, Medium, Hard, Expert, Extreme
- Show question count per level
- Display time per question (configurable)
- Level icons and colors:
  - Easy: 🌱 Green
  - Medium: ⭐ Blue
  - Hard: 🔥 Orange
  - Expert: 💎 Purple
  - Extreme: 💀 Dark

#### 5.1.4 Quiz Play Modes

**Practice Mode:**
- No time limit
- Show correct answer after each question
- No score tracking
- Unlimited replay

**Challenge Mode:**
- 30 seconds per question (configurable)
- Score tracking
- Streak bonuses
- No answer reveal

**Timer Challenge Mode:**
- Total time limit (e.g., 5 minutes)
- Answer as many as possible
- Speed bonus points
- Final score display

#### 5.1.5 Results Display
- Score percentage and fraction (e.g., 80% - 8/10)
- Total points earned
- Streak achieved
- Question breakdown with correct/incorrect
- Play Again / Home buttons

### 5.2 Admin-Facing Features

#### 5.2.1 Status Dashboard
- 4 cards: All, Published, Draft, Trash
- Each shows count and percentage
- Progress bar visualization
- Click to filter by status
- Color-coded: Blue/Green/Yellow/Red

#### 5.2.2 Filter System
- **Subject Filter**: Pills with counts, add/edit/delete icons
- **Chapter Filter**: Cascades from subject, shows only relevant chapters
- **Level Filter**: 5 level buttons with counts
- **Status Filter**: Published/Draft/Trash toggle
- **Search**: Debounced text search on riddle content

#### 5.2.3 Riddle Table
| Column | Description |
|--------|-------------|
| Checkbox | Bulk selection |
| # | Row number (per page) |
| Question | Riddle text (truncated) |
| Options | A/B/C/D with correct highlighted |
| Answer | Correct letter + text |
| Chapter | Chapter name |
| Level | Colored badge |
| Status | Dropdown (Pub/Draft/Trash) |
| Actions | Edit/Delete links |

#### 5.2.4 Bulk Actions
| Action | Confirmation | Available In |
|--------|-------------|--------------|
| Publish | No | all, draft, trash |
| Draft | No | all, published, trash |
| Trash | Yes | all, published, draft |
| Delete | Yes | trash only |

#### 5.2.5 CRUD Modals

**Subject Modal:**
- Name (required)
- Emoji (picker with 15 options: 📚🧪🌍🔢📝🎨🎵🏃🍎🌱🔬💻🌐📖🧮)
- Category (academic/professional/entertainment)

**Chapter Modal:**
- Subject (required dropdown)
- Name (required)

**Riddle Modal:**
- Subject (required, cascades to chapter)
- Chapter (required, filtered by subject)
- Level (Easy/Medium/Hard/Expert/Extreme buttons)
- Status (Draft/Published toggle)
- Question (textarea)
- Options (4 inputs for non-expert levels)
- Correct Answer (radio A/B/C/D)
- Explanation (optional textarea)

#### 5.2.6 CSV Import
- Drag-and-drop upload zone
- Preview with subject name, count, warnings
- Confirm/Cancel buttons
- Auto-close on success (2.5s delay)

#### 5.2.7 CSV Export
- Exports filtered riddles
- Includes: Subject, Chapter, Question, Options, Correct Answer, Level

---

## 6. UI/UX Design

### 6.1 User Pages

#### 6.1.1 Riddle MCQ Home (`/riddle-mcq`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back                           RIDDLE MCQ                    ⚙️ Settings   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    🎓 Academic                                               │
│         ┌────────────────────────────────────────┐                         │
│         │  🧩 🧩 🧩                              │                         │
│         │                                        │                         │
│         │  🧩 Logic       🧩 Science            │                         │
│         │  50 riddles     45 riddles              │                         │
│         │                                        │                         │
│         │  🧩 Math        🧩 Trivia              │                         │
│         │  30 riddles     25 riddles              │                         │
│         └────────────────────────────────────────┘                         │
│                                                                             │
│                    💼 Professional                                           │
│         ┌────────────────────────────────────────┐                         │
│         │  🧩 🧩                                  │                         │
│         │                                        │                         │
│         │  🧩 Business      🧩 Technology        │                         │
│         │  15 riddles      20 riddles           │                         │
│         └────────────────────────────────────────┘                         │
│                                                                             │
│                    🎮 Entertainment                                          │
│         ┌────────────────────────────────────────┐                         │
│         │  🧩 🧩 🧩                              │                         │
│         │                                        │                         │
│         │  🎬 Movies       🎵 Music               │                         │
│         │  40 riddles     35 riddles             │                         │
│         └────────────────────────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.1.2 Chapter/Level Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back         🧩 Logic (Subject)           🎯 50 Riddles                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    📖 Select Chapter                                       │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🧩 All Chapters (50)                       │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🧩 Brain Teasers (15)                     │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🧩 Lateral Thinking (12)                   │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│                    📊 Select Difficulty                                    │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │           🌱 EASY                          │                     │
│         │         30 seconds/riddle                   │                     │
│         │         15 riddles available                │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │           ⭐ MEDIUM                         │                     │
│         │         45 seconds/riddle                   │                     │
│         │         12 riddles available                │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.1.3 Mode Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back         🧩 Logic / Brain Teasers / Easy   🎯 15 Riddles            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    🎮 Select Mode                                           │
│                                                                             │
│         ┌──────────────────────────────────────────────────────────┐        │
│         │                                                           │        │
│         │     🎯 PRACTICE MODE                                     │        │
│         │     ─────────────────                                    │        │
│         │     • No time limit                                      │        │
│         │     • Show correct answer after each riddle               │        │
│         │     • No score tracking                                  │        │
│         │     • Unlimited replay                                    │        │
│         │                                                           │        │
│         │              [START PRACTICE]                             │        │
│         │                                                           │        │
│         └──────────────────────────────────────────────────────────┘        │
│                                                                             │
│         ┌──────────────────────────────────────────────────────────┐        │
│         │                                                           │        │
│         │     ⏱️ CHALLENGE MODE                                   │        │
│         │     ───────────────────                                   │        │
│         │     • 30 seconds per riddle                               │        │
│         │     • Score tracking                                      │        │
│         │     • Streak bonuses                                      │        │
│         │                                                           │        │
│         │              [START CHALLENGE]                            │        │
│         │                                                           │        │
│         └──────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.1.4 Quiz Play

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🧩 Logic      🧩 Brain Teasers   🌱 Easy      ⏱️ 0:25                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Riddle 3 of 15                                    ████████░░ 80%          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  I have cities, but no houses live there.                                  │
│  I have mountains, but no trees grow there.                                │
│  I have water, but no fish swim there.                                    │
│  What am I?                                                                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  A) A Map                                                      │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  B) A Dream                                                    │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  C) A Globe                                                    │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  D) A Painting                                                 │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                      💡 Show Hint                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Admin Panel

#### 6.2.1 Riddle MCQ Management (`/admin` → Riddle MCQ section)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Admin Panel        [Dashboard] [Quiz] [Riddle MCQ] [Riddles] [Settings]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Subject: [ All ▼ ]  Chapter: [ All ▼ ]  Level: [ All ▼ ]  🔍 Search     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Subject: All (975)  |  🧩 Logic (500)  |  🧩 Science (475)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Chapter: All Chapters (975)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 🧩 Brain Teasers (150)  |  🧩 Lateral Thinking (120)  |  ...        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Level: All Levels (975)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 🌱 Easy (206)  |  ⭐ Medium (189)  |  🔥 Hard (187)  |  ...        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  Riddles (Showing 1-10 of 975)                            [+ Add Riddle]  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ☐ │ # │ Riddle              │ Level  │ Chapter  │ Status │ Actions   │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ ☐ │ 1 │ I have cities...    │ Easy   │ Brain   │ ✓ Pub  │ ✏️ 🗑️    │   │
│  │ ☐ │ 2 │ What has keys...    │ Medium │ Logic   │ ✓ Pub  │ ✏️ 🗑️    │   │
│  │ ☐ │ 3 │ Forward I am...     │ Hard   │ Lateral │ Draft  │ ✏️ 🗑️    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [◀ 1 2 3 ... 98 ▶]   Show: [10 ▼]                                        │
│                                                                             │
│  Bulk Actions: [Publish] [Draft] [Trash] [Delete]                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. API Endpoints

### 7.1 Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddle-mcq/subjects` | Get all active subjects |
| GET | `/riddle-mcq/subjects/:slug` | Get subject by slug with chapters |
| GET | `/riddle-mcq/chapters/:subjectId` | Get chapters by subject |
| GET | `/riddle-mcq/mcqs/:chapterId` | Get published MCQs by chapter |
| GET | `/riddle-mcq/quiz/:chapterId` | Get quiz-ready MCQs (published only) |
| GET | `/riddle-mcq/random/:level` | Get random MCQs by level |
| GET | `/riddle-mcq/mixed` | Get mixed difficulty MCQs |

### 7.2 Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddle-mcq/subjects/all` | Get all subjects (including inactive) |
| GET | `/riddle-mcq/mcqs/all` | Get all MCQs with filters |
| POST | `/riddle-mcq/subjects` | Create subject |
| PATCH | `/riddle-mcq/subjects/:id` | Update subject |
| DELETE | `/riddle-mcq/subjects/:id` | Delete subject |
| POST | `/riddle-mcq/chapters` | Create chapter |
| PATCH | `/riddle-mcq/chapters/:id` | Update chapter |
| DELETE | `/riddle-mcq/chapters/:id` | Delete chapter |
| POST | `/riddle-mcq/mcqs` | Create MCQ |
| PATCH | `/riddle-mcq/mcqs/:id` | Update MCQ |
| DELETE | `/riddle-mcq/mcqs/:id` | Delete MCQ |
| POST | `/riddle-mcq/mcqs/bulk` | Bulk create MCQs |
| POST | `/riddle-mcq/mcqs/bulk-action` | Bulk action (publish/draft/trash/delete) |

### 7.3 Stats/Filter Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddle-mcq/filter-counts` | Get counts by subject/chapter/level/status |
| GET | `/riddle-mcq/stats/overview` | Get overall statistics |
| GET | `/riddle-mcq/subjects/:slug/status-counts` | Get status counts for subject |

### 7.4 API Request/Response Examples

#### GET /riddle-mcq/filter-counts
```json
// Response
{
  "subjectCounts": [
    { "slug": "logic", "name": "Logic", "emoji": "🧩", "count": 150 },
    { "slug": "science", "name": "Science", "emoji": "🔬", "count": 120 }
  ],
  "chapterCounts": [
    { "name": "Brain Teasers", "subjectSlug": "logic", "count": 50 },
    { "name": "Lateral Thinking", "subjectSlug": "logic", "count": 45 }
  ],
  "levelCounts": [
    { "level": "easy", "count": 60 },
    { "level": "medium", "count": 45 },
    { "level": "hard", "count": 30 }
  ],
  "statusCounts": [
    { "status": "all", "count": 150 },
    { "status": "published", "count": 100 },
    { "status": "draft", "count": 40 },
    { "status": "trash", "count": 10 }
  ]
}
```

#### POST /riddle-mcq/mcqs
```json
// Request
{
  "question": "I have cities, but no houses live there. I have mountains, but no trees grow there. What am I?",
  "options": ["A Map", "A Dream", "A Globe", "A Painting"],
  "correctAnswer": "A",
  "level": "easy",
  "chapterId": "uuid-here",
  "status": "draft"
}

// Response
{
  "id": "new-uuid",
  "question": "...",
  "status": "draft",
  ...
}
```

#### POST /riddle-mcq/mcqs/bulk-action
```json
// Request
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"],
  "action": "publish"
}

// Response
{
  "success": true,
  "affectedCount": 3
}
```

---

## 8. Data Flow

### 8.1 Admin Filter Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN FILTER FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks filter (e.g., Subject = Logic)                        │
│         ↓                                                           │
│  setFilter('subject', 'logic')                                     │
│         ↓                                                           │
│  URL updates: ?subject=logic                                         │
│         ↓                                                           │
│  useRiddleMcqFilters reads URL                                      │
│         ↓                                                           │
│  countParams regenerated: { subject: 'logic' }                      │
│  dataParams regenerated: { subject: 'logic', status: 'published' }  │
│         ↓                                                           │
│  useEffect triggers data fetch                                       │
│         ↓                                                           │
│  Parallel API calls:                                                │
│  ┌─────────────────┐    ┌─────────────────┐                        │
│  │ getFilterCounts │    │ getAllMcqs      │                        │
│  └────────┬────────┘    └────────┬────────┘                        │
│           │                       │                                 │
│           ↓                       ↓                                 │
│     filterCounts state      mcqs state                              │
│           │                       │                                 │
│           └───────────┬───────────┘                                 │
│                       ↓                                              │
│              UI re-renders                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 User Quiz Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       USER QUIZ FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ SUBJECT  │───▶│ CHAPTER  │───▶│  LEVEL   │───▶│   MODE   │      │
│  │ SELECT   │    │ SELECT   │    │ SELECT   │    │ SELECT   │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                            │       │
│                                                            ▼       │
│                                                       ┌──────────┐ │
│                                                       │  QUIZ   │ │
│                                                       │  PLAY   │ │
│                                                       └──────────┘ │
│                                                            │       │
│                                                            ▼       │
│                                                       ┌──────────┐ │
│                                                       │ RESULTS  │ │
│                                                       │  PAGE    │ │
│                                                       └──────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Cache Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CACHE FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GET /riddle-mcq/filter-counts                                     │
│         ↓                                                           │
│  Check Redis: riddle-mcq:filter-counts                              │
│         ↓                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │           Cache HIT?                     │                       │
│  └─────────────────────────────────────────┘                       │
│              │                   │                                   │
│             YES                  NO                                 │
│              │                   │                                   │
│              ▼                   ▼                                  │
│     Return cached         Query database                            │
│         data              getFilterCounts()                        │
│              │                   │                                  │
│              │                   ▼                                  │
│              │           Store in Redis                             │
│              │           Set TTL: 300s                              │
│              │                   │                                  │
│              └─────────┬─────────┘                                  │
│                        ▼                                           │
│                 Return data                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Phases

### Phase 1: Create Module Structure
1. Create `apps/backend/src/riddle-mcq/` directory
2. Create `entities/`, `dto/` subdirectories
3. Set up basic module file

### Phase 2: Create Entities
1. Create `riddle-subject.entity.ts` (copy from riddles/, clean up)
2. Create `riddle-chapter.entity.ts` (copy from riddles/, clean up)
3. Create `riddle-mcq.entity.ts` (copy from riddles/, add indexes)
4. Verify entity relationships

### Phase 3: Create DTOs
1. Create pagination DTOs
2. Create subject DTOs (Create/Update)
3. Create chapter DTOs (Create/Update)
4. Create MCQ DTOs (Create/Update)
5. Create bulk action DTOs

### Phase 4: Create Controller
1. Create all public endpoints
2. Create all admin endpoints
3. Add Swagger decorators
4. Add auth guards (JwtAuthGuard, RolesGuard)
5. **Include PATCH /chapters/:id endpoint** (missing in old riddles module)

### Phase 5: Create Service
1. Implement subject CRUD
2. Implement chapter CRUD (including update)
3. Implement MCQ CRUD
4. Implement filter-counts logic
5. Implement bulk operations
6. Add Fisher-Yates shuffle for random selection

### Phase 5b: Chapter Slug System
1. Add `slug` field to `riddle-chapter.entity.ts`
   - `@Column({ nullable: false }) slug: string`
   - Add unique constraint: `['slug', 'subjectId']`
   - Auto-generate on chapter creation (same regex as quiz)
2. Create `riddle_chapter_slug_history` entity:
   ```typescript
   @Entity('riddle_chapter_slug_history')
   export class RiddleChapterSlugHistory {
     @PrimaryGeneratedUUID('uuid')
     id: string;
     
     @Column()
     chapterId: string;
     
     @Column()
     oldSlug: string;
     
     @Column()
     newSlug: string;
     
     @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
     createdAt: Date;
   }
   ```
3. Add `resolveChapterId` helper in service:
   - Accepts UUID or slug
   - If slug, looks up UUID
   - If UUID, returns directly
   - Returns null if not found
4. Update all chapter-related queries to use `resolveChapterId`
5. Frontend: pass `chapter.slug` in URLs
6. Verify old slug URLs still work (slug history resolution)

### Phase 6: Database Indexes
1. Create migration: `AddRiddleMcqIndexes`
2. Run migration
3. Verify indexes created

### Phase 7: Redis Cache
1. Add cache keys constants
2. Add cache TTL constants
3. Wrap `findAllSubjects` with getOrSet
4. Wrap `getFilterCounts` with getOrSet
5. Wrap `findMcqsByChapter` with getOrSet
6. Add cache invalidation to all mutations
7. Verify cache working

### Phase 8: Code Cleanup
1. Remove unused imports
2. Remove dead code
3. Run TypeScript check
4. Run build
5. Create documentation

### Phase 9: UUID Progress Tracking
1. localStorage key structure mirrors Quiz system:
   ```
   riddle-mcq:progress:{chapterUUID}
   riddle-mcq:session:{chapterUUID}
   riddle-mcq:history
   ```
2. Progress stored per chapterUUID (not chapter name/slug)
3. Session management uses UUID keys
4. History tracks all attempts with chapterUUID reference
5. Frontend hooks use UUID-based keys (like useQuiz.ts)
6. No migration needed (fresh implementation)

### Phase 10: Public Endpoint Security
1. Add `/riddle-mcq/public/mcqs/:chapterId` endpoint
   - Forces `status = published` at database level
   - Users CANNOT fetch draft riddles
2. Update frontend API to use `/public/` endpoints:
   - `getRiddleMcqsByChapter()` → `/public/mcqs/:chapterId`
   - `getRiddleQuiz()` → `/public/quiz/:chapterId`
3. Admin endpoints remain unchanged (can access all statuses)
4. Same pattern as `/quiz/public/questions`

---

## 10. File Summary

### 10.1 Backend Files to CREATE

| File Path | Description |
|-----------|-------------|
| `riddle-mcq/riddle-mcq.controller.ts` | All API endpoints |
| `riddle-mcq/riddle-mcq.service.ts` | Business logic |
| `riddle-mcq/riddle-mcq.module.ts` | Module configuration |
| `riddle-mcq/entities/riddle-subject.entity.ts` | Subject entity |
| `riddle-mcq/entities/riddle-chapter.entity.ts` | Chapter entity (with slug) |
| `riddle-mcq/entities/riddle-mcq.entity.ts` | MCQ entity |
| `riddle-mcq/entities/riddle-chapter-slug-history.entity.ts` | Slug history entity |
| `riddle-mcq/dto/riddle-mcq.dto.ts` | All DTOs |
| `migrations/AddRiddleMcqIndexes.ts` | Database indexes migration |

### 10.2 Frontend Files to RENAME/CREATE

| File Path | Action | Description | Source |
|-----------|--------|-------------|--------|
| `lib/riddle-mcq-api.ts` | RENAME | API functions | `lib/riddles-api.ts` |
| `hooks/useRiddleMcq.ts` | CREATE | Quiz state management | Mirror of `useQuiz.ts` |
| `hooks/useRiddleMcqSubjects.ts` | CREATE | Subject data hook | Mirror of `useQuizSubjects.ts` |
| `app/riddle-mcq/page.tsx` | RENAME | Subject/chapter selection | `app/riddles/page.tsx` |
| `app/riddle-mcq/play/page.tsx` | RENAME | Quiz play | `app/riddles/play/page.tsx` |
| `app/riddle-mcq/results/page.tsx` | RENAME | Results display | `app/riddles/results/page.tsx` |
| `app/riddle-mcq/practice/page.tsx` | RENAME | Practice mode | `app/riddles/practice/page.tsx` |
| `app/riddle-mcq/challenge/page.tsx` | RENAME | Timer challenge | `app/riddles/challenge/page.tsx` |

### 10.3 Files to MODIFY

| File | Changes |
|------|---------|
| `app.module.ts` | Add RiddleMcqModule, Remove RiddlesModule |
| All riddle-mcq pages | Update API imports from `riddles-api` to `riddle-mcq-api` |
| `admin/page.tsx` | Update riddle section imports |

### 10.4 Files to DELETE

| File | Reason |
|------|--------|
| `riddles/` (entire frontend module) | Renamed to riddle-mcq/ |
| `lib/riddles-api.ts` | Renamed to riddle-mcq-api.ts |

**Note:** The backend `riddles/` module (if exists) should be checked - the new `riddle-mcq/` module is the target.

---

## 11. Migration Plan

### 11.1 Migration File: AddRiddleMcqIndexes

```typescript
// File: apps/backend/src/migrations/AddRiddleMcqIndexes.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRiddleMcqIndexes1700000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Riddle MCQ table indexes
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_chapterId 
            ON riddle_mcqs (chapterId)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_level 
            ON riddle_mcqs (level)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_status 
            ON riddle_mcqs (status)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_mcqs_chapterId_level_status 
            ON riddle_mcqs (chapterId, level, status)
        `);

        // Riddle Chapter table indexes
        await queryRunner.query(`
            CREATE INDEX idx_riddle_chapters_subjectId 
            ON riddle_chapters (subjectId)
        `);

        // Riddle Subject table indexes
        await queryRunner.query(`
            CREATE INDEX idx_riddle_subjects_slug 
            ON riddle_subjects (slug)
        `);
        
        await queryRunner.query(`
            CREATE INDEX idx_riddle_subjects_order 
            ON riddle_subjects (order)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_chapterId_level_status`);
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_status`);
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_level`);
        await queryRunner.query(`DROP INDEX idx_riddle_mcqs_chapterId`);
        await queryRunner.query(`DROP INDEX idx_riddle_chapters_subjectId`);
        await queryRunner.query(`DROP INDEX idx_riddle_subjects_order`);
        await queryRunner.query(`DROP INDEX idx_riddle_subjects_slug`);
    }

}
```

### 11.2 Migration Commands

```bash
# Generate migration
npm run migration:generate -- src/migrations/AddRiddleMcqIndexes

# Run migration
npm run migration:run

# Revert migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## 12. Cache Strategy

### 12.1 Cache Keys

```typescript
// In RiddleMcqService

private readonly CACHE_KEYS = {
  SUBJECTS: 'riddle-mcq:subjects',
  FILTER_COUNTS: 'riddle-mcq:filter-counts',
  MCQS: 'riddle-mcq:mcqs',
  SUBJECT: (slug: string) => `riddle-mcq:subject:${slug}`,
  CHAPTERS: (subjectId: string) => `riddle-mcq:chapters:${subjectId}`,
};

private readonly CACHE_TTL = {
  SUBJECTS: 600,       // 10 minutes
  FILTER_COUNTS: 300,  // 5 minutes
  MCQS: 600,           // 10 minutes
};
```

### 12.2 Cache Methods

| Method | Wrapped With | TTL |
|--------|--------------|-----|
| `findAllSubjects()` | getOrSet(CACHE_KEYS.SUBJECTS) | 600s |
| `getFilterCounts()` | getOrSet(CACHE_KEYS.FILTER_COUNTS) | 300s |
| `findMcqsByChapter()` | getOrSet(CACHE_KEYS.MCQS:${chapterId}) | 600s |

### 12.3 Cache Invalidation

| Mutation | Invalidation |
|----------|--------------|
| Create Subject | delPattern('riddle-mcq:*') |
| Update Subject | delPattern('riddle-mcq:*') |
| Delete Subject | delPattern('riddle-mcq:*') |
| Create Chapter | delPattern('riddle-mcq:*') |
| Update Chapter | delPattern('riddle-mcq:*') |
| Delete Chapter | delPattern('riddle-mcq:*') |
| Create MCQ | delPattern('riddle-mcq:*') |
| Update MCQ | delPattern('riddle-mcq:*') |
| Delete MCQ | delPattern('riddle-mcq:*') |
| Bulk Action | delPattern('riddle-mcq:*') |

---

## 13. Code Cleanup

### 13.1 Cleanup Checklist

- [ ] Remove unused imports in controller
- [ ] Remove unused imports in service
- [ ] Remove unused DTOs
- [ ] Remove dead methods
- [ ] Remove commented-out code
- [ ] Verify no circular dependencies
- [ ] Run `npx tsc --noEmit`
- [ ] Run `npm run build`
- [ ] Verify 0 errors in both

### 13.2 Common Issues to Check

| File | Issue | Solution |
|------|-------|----------|
| controller.ts | Unused `Type`, `IsBoolean` imports | Remove |
| service.ts | Unused `FindOptionsWhere`, `ILike` | Remove |
| service.ts | Dead `getStatusCounts()` method | Remove if not used |
| hooks | Unused return values | Clean up interface |

---

## 14. Verification Checklist

### 14.1 Phase 1-5 Verification

- [ ] All public endpoints return correct data
- [ ] All admin endpoints work with auth
- [ ] Subject CRUD works
- [ ] Chapter CRUD works (including PATCH)
- [ ] MCQ CRUD works
- [ ] Bulk create works
- [ ] Bulk actions work
- [ ] CSV import works
- [ ] CSV export works
- [ ] Filter counts return correct numbers
- [ ] Pagination works
- [ ] Search works

### 14.2 Phase 5b Verification (Chapter Slug System)

- [ ] Chapter slugs auto-generated on create
- [ ] Slug history table created
- [ ] Old slug URLs resolve correctly (slug history)
- [ ] resolveChapterId helper works with UUID and slug
- [ ] Frontend uses chapter.slug in URLs

### 14.3 Phase 6 Verification

- [ ] Migration file created
- [ ] Migration runs without errors
- [ ] All indexes exist in database
- [ ] Query performance improved

### 14.4 Phase 7 Verification

- [ ] Cache TTLs set correctly
- [ ] Cache hits on repeated calls
- [ ] Cache invalidation works on mutations
- [ ] Response times improved (5-20ms target)

### 14.5 Phase 8 Verification

- [ ] No unused imports
- [ ] No dead code
- [ ] TypeScript check passes
- [ ] Build passes with 0 errors
- [ ] Documentation updated

### 14.6 Phase 9 Verification (UUID Progress)

- [ ] localStorage uses chapterUUID keys
- [ ] Progress saves correctly per chapter
- [ ] Session resumes correctly
- [ ] History tracks all attempts

### 14.7 Phase 10 Verification (Public Endpoints)

- [ ] /public/mcqs/:chapterId forces published status
- [ ] /public/quiz/:chapterId forces published status
- [ ] Draft riddles NOT accessible via public endpoints
- [ ] Admin can still access all statuses

### 14.8 Frontend Verification

- [ ] Subject selection page works
- [ ] Chapter/level selection works
- [ ] Quiz play works
- [ ] Results display works
- [ ] Practice mode works
- [ ] Timer challenge works
- [ ] Admin UI works
- [ ] CSV import/export works in admin

---

## Phase Summary

| Phase | Description | Deliverables |
|-------|-------------|---------------|
| Phase 1 | Module Structure | Backend module ✅ EXISTS, Frontend RENAME |
| Phase 2 | Entities | Subject, Chapter, MCQ, SlugHistory |
| Phase 3 | DTOs | All Create/Update/Pagination DTOs |
| Phase 4 | Controller | All API endpoints |
| Phase 5 | Service | Business logic, CRUD, bulk ops |
| Phase 5b | Chapter Slug System | Slug field, history, resolve helper |
| Phase 6 | Database Indexes | Migration, Performance |
| Phase 7 | Redis Cache | Caching, Performance |
| Phase 8 | Code Cleanup | Quality, Documentation |
| Phase 9 | UUID Progress Tracking | localStorage, session management |
| Phase 10 | Public Endpoint Security | /public/ endpoints, status enforcement |

### Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend riddle-mcq module | ✅ EXISTS | Controller, Service, Module, Entities, DTOs all exist |
| Backend riddle-mcq entities | ⚠️ INCOMPLETE | Missing `status` field, wrong PK type, no indexes |
| Frontend riddle-mcq pages | ✅ EXISTS | Under `/riddles/`, need RENAME to `/riddle-mcq/` |
| Frontend riddle-mcq-api.ts | ⚠️ MISSING | Need to RENAME from `riddles-api.ts` |
| Frontend hooks | ⚠️ MISSING | `useRiddleMcq.ts`, `useRiddleMcqSubjects.ts` need to be created |

---

## Quick Reference

### Key Differences from Old Riddles Module

| Aspect | Old (riddles/) | New (riddle-mcq/) |
|--------|---------------|-------------------|
| Module structure | Mixed with classic | Separate clean module |
| PATCH /chapters | ❌ Missing | ✅ Included |
| Indexes | ❌ None | ✅ Full composite |
| Cache | ❌ None | ✅ Full implementation |
| Filter counts | ❌ Missing | ✅ Included |
| Architecture | Inconsistent | Mirrors quiz/ exactly |
| Chapter slug | ❌ None | ✅ Auto-generated |
| Public endpoints | ❌ None | ✅ /public/ enforced |
| UUID progress | ❌ None | ✅ localStorage keys |

---

## Future Implementation (After Phase 10)

These features are planned but not included in the current implementation phases.

### 🔜 Deferred (Require Authentication)
These features require user login/authentication before implementation:

| Feature | Priority | Description |
|---------|----------|-------------|
| User Authentication | HIGH | Required for cross-device sync |
| Session Resume Dialog | HIGH | Check for existing session on play page mount |
| Auto-Save Interval | HIGH | Periodic saving every 10 seconds |
| Navigation Warning | MEDIUM | Warn before leaving page with unsaved progress |
| Quiz History Page | MEDIUM | View all past riddle attempts |
| Session Expiry Handling | MEDIUM | Clear sessions older than 24 hours |
| Resume Entry Point | MEDIUM | "Continue where you left off" on home |
| Backend Session API | HIGH | Save/resume/list sessions server-side |

### UI/UX Enhancements
| Feature | Priority | Description |
|---------|----------|-------------|
| Dark Mode | LOW | Theme toggle, system preference support |
| Loading States | MEDIUM | Skeleton loaders, progress indicators |
| Responsive Design | MEDIUM | Mobile, tablet optimizations |
| Accessibility | LOW | ARIA labels, screen reader support |

### User Features
| Feature | Priority | Description |
|---------|----------|-------------|
| Multi-Topic Selection | MEDIUM | Select multiple subjects at once |
| Custom Timer Settings | LOW | User-defined time limits |
| Timer Persistence | LOW | sessionStorage on refresh |
| Results URL Preservation | LOW | Shareable results links |
| Achievement Badges | LOW | Gamification |
| Global Leaderboards | LOW | Competitive play |
| Points System | LOW | Gamification |
| Multiplayer Mode | LOW | Competitive play |
| Timed Tournaments | LOW | Competitive events |

### Admin Features
| Feature | Priority | Description |
|---------|----------|-------------|
| Question Hint UI | LOW | Add hint field, display during riddle |
| Question Duplication | LOW | Clone to same/different chapter |
| Admin CRUD for all entities | MEDIUM | Full UI for management |
| Filter Presets | LOW | Save filter combinations |
| Sort Options | LOW | Sort by date, level, status |
| Date Range Filter | LOW | Filter by creation/update date |
| Question Tags | LOW | Tag-based filtering |
| Image/Media Attachments | LOW | Upload images to riddles |
| PDF Export | LOW | Export riddles to PDF |
| Undo Bulk Actions | LOW | Toast with undo option |
| Question Analytics | MEDIUM | Attempt counts, success rate dashboard |
| Content Scheduling | LOW | Publish riddles at specific times |

### CSV/Import-Export
| Feature | Priority | Description |
|---------|----------|-------------|
| JSON Import support | LOW | Import riddles from JSON |
| Export functionality | LOW | Different CSV formats |
| Template Downloads | LOW | Download import templates |

### Performance
| Feature | Priority | Description |
|---------|----------|-------------|
| Service Worker | LOW | Offline caching |
| API Response Caching | MEDIUM | Additional endpoint caching |
| Materialized Views | LOW | Pre-computed aggregates (not recommended) |

### Testing
| Feature | Priority | Description |
|---------|----------|-------------|
| Unit Tests | MEDIUM | Utility functions, components |
| Integration Tests | MEDIUM | API endpoints, user flows |
| E2E Tests | MEDIUM | Critical journeys |

### Documentation
| Feature | Priority | Description |
|---------|----------|-------------|
| API Documentation | MEDIUM | Swagger/OpenAPI |
| User Guide | LOW | Admin panel, import riddles |
| Developer Documentation | LOW | Architecture, contributing |

### Platform
| Feature | Priority | Description |
|---------|----------|-------------|
| Multi-language Support | LOW | i18n |
| Role-based Access Control | MEDIUM | Extended RBAC beyond admin |
| Audit Logs | LOW | Track changes |
| Webhooks | LOW | External integrations |

---

*This plan provides complete implementation details for the Riddle MCQ section.*
*Anyone with TypeScript/NestJS experience can implement this system following this document.*
