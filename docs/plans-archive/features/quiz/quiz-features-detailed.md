# Quiz Section - Detailed Feature Explanation

---

## Overview
The Quiz section is the main educational feature allowing users to test their knowledge across various subjects with multiple difficulty levels.

---

## Page Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUIZ SECTION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │   HOME   │───▶│ SUBJECT  │───▶│ CHAPTER  │───▶│  LEVEL   │───▶│   MODE   │
  │  Page    │    │ Selection │    │ Selection│    │ Selection│    │ Selection│
  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                              │
                                                                              ▼
                                                                         ┌──────────┐
                                                                         │  QUIZ    │
                                                                         │  PLAY    │
                                                                         └──────────┘
                                                                              │
                                                                              ▼
                                                                         ┌──────────┐
                                                                         │ RESULTS  │
                                                                         │  Page    │
                                                                         └──────────┘
```

---

## Page 1: Quiz Home (`/quiz`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back                           AI QUIZ                    ⚙️ Settings   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    🎓 Academic                                               │
│         ┌────────────────────────────────────────┐                         │
│         │  📚 📚 📚                              │                         │
│         │                                        │                         │
│         │  📖 English      🔬 Science           │                         │
│         │  500 questions   450 questions          │                         │
│         │                                        │                         │
│         │  🌍 Geography    🔢 Math              │                         │
│         │  300 questions   280 questions         │                         │
│         └────────────────────────────────────────┘                         │
│                                                                             │
│                    💼 Professional                                         │
│         ┌────────────────────────────────────────┐                         │
│         │  💼 💼                                  │                         │
│         │                                        │                         │
│         │  💼 Business      💪 Health            │                         │
│         │  150 questions   120 questions         │                         │
│         └────────────────────────────────────────┘                         │
│                                                                             │
│                    🎮 Entertainment                                        │
│         ┌────────────────────────────────────────┐                         │
│         │  📚 📚 📚                              │                         │
│         │                                        │                         │
│         │  🎬 Movies       🎵 Music             │                         │
│         │  200 questions   180 questions        │                         │
│         └────────────────────────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Category Sections**: Academic, Professional, Entertainment
- **Subject Cards**: Show emoji, name, question count
- **Collapsible Sections**: Click to expand/collapse
- **Click Action**: Navigate to chapter selection

---

## Page 2: Chapter Selection (after subject click)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back         📚 Animals (Subject)        🎯 500 Questions            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    📖 Select Chapter                                       │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  📚 All Chapters (500)                     │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🐾 Mammals (150)                          │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🐦 Birds (120)                            │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🐟 Marine Life (100)                     │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🦎 Reptiles (80)                         │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │  🐝 Insects (50)                           │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **All Chapters Option**: Select all chapters combined
- **Chapter Cards**: Show name, question count
- **Click Action**: Navigate to level selection

---

## Page 3: Level Selection

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back         📚 Animals / Mammals            🎯 150 Questions         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    📊 Select Difficulty                                    │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │                                              │                     │
│         │           🌱 EASY                          │                     │
│         │         30 seconds/question                 │                     │
│         │         50 questions available              │                     │
│         │                                              │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │                                              │                     │
│         │           ⭐ MEDIUM                         │                     │
│         │         45 seconds/question                │                     │
│         │         40 questions available              │                     │
│         │                                              │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
│         ┌────────────────────────────────────────────┐                     │
│         │                                              │                     │
│         │           🔥 HARD                          │                     │
│         │         60 seconds/question                │                     │
│         │         35 questions available              │                     │
│         │                                              │                     │
│         └────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Level Options**: Easy, Medium, Hard, Expert, Extreme
- **Time per Level**: Display time limit
- **Question Count**: Show available questions per level

---

## Page 4: Mode Selection

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back         📚 Animals / Mammals / Easy       🎯 50 Questions          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    🎮 Select Mode                                           │
│                                                                             │
│         ┌──────────────────────────────────────────────────────────┐        │
│         │                                                           │        │
│         │     🎯 PRACTICE MODE                                     │        │
│         │     ─────────────────                                    │        │
│         │     • No time limit                                      │        │
│         │     • Show correct answer after each question             │        │
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
│         │     • 30 seconds per question                             │        │
│         │     • Score tracking                                      │        │
│         │     • Streak bonuses                                      │        │
│         │     • Leaderboard                                        │        │
│         │                                                           │        │
│         │              [START CHALLENGE]                            │        │
│         │                                                           │        │
│         └──────────────────────────────────────────────────────────┘        │
│                                                                             │
│         ┌──────────────────────────────────────────────────────────┐        │
│         │                                                           │        │
│         │     ⏰ TIMER CHALLENGE                                    │        │
│         │     ────────────────────                                  │        │
│         │     • Total time limit                                    │        │
│         │     • Answer as many as possible                         │        │
│         │     • Speed bonus                                        │        │
│         │     • Final score                                        │        │
│         │                                                           │        │
│         │              [START TIMER]                                │        │
│         │                                                           │        │
│         └──────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Practice Mode**: Unlimited time, show answers
- **Challenge Mode**: Timed, scoring, streaks
- **Timer Challenge**: Total time limit, speed bonus

---

## Page 5: Quiz Play (`/quiz/play`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📚 Animals      📖 Mammals      🌱 Easy      ⏱️ 0:25                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Question 3 of 10                                    ████████░░ 80%        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  What is the largest mammal in the world?                                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  A) African Elephant                              ✓           │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  B) Blue Whale                                                │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  C) Giraffe                                                   │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  D) Polar Bear                                               │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                      💡 Show Hint                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Header**: Subject, Chapter, Level, Timer
- **Progress Bar**: Visual progress indicator
- **Question Card**: Question text with options
- **Answer Selection**: Click to select (A, B, C, D)
- **Visual Feedback**: Green/Red after selection
- **Hint Button**: Show hint if available

---

## Page 6: Results (`/quiz/results`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         🎉 QUIZ COMPLETED!                                  │
│                                                                             │
│                    ┌─────────────────────┐                                │
│                    │        80%          │                                │
│                    │     8 / 10          │                                │
│                    │     Correct         │                                │
│                    └─────────────────────┘                                │
│                                                                             │
│         Score: 850 pts                    🔥 Streak: 5                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  Question Breakdown:                                                      │
│                                                                             │
│  ✅ Q1: What is the largest mammal?        Correct ✓                       │
│  ✅ Q2: What do plants need to grow?        Correct ✓                       │
│  ❌ Q3: What is the fastest bird?          Your: Peregrine Falcon         │
│                                                  Correct: Cheetah           │
│  ✅ Q4: How many legs does a spider have?  Correct ✓                       │
│  ...                                                                     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│              [REVIEW ANSWERS]          [PLAY AGAIN]          [HOME]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Score Display**: Percentage, correct/total
- **Points**: Total points earned
- **Streak**: Best streak achieved
- **Question Breakdown**: List of all questions with correct/incorrect
- **Review Answers**: See explanations
- **Play Again**: Restart same quiz
- **Home**: Return to quiz home

---

## Admin Panel Features

### Page: Quiz Management (`/admin`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Admin Panel        [Dashboard] [Quiz] [Riddles] [Jokes] [Settings]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Subject: [ All ▼ ]  Chapter: [ All ▼ ]  Level: [ All ▼ ]  🔍 Search     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Subject: All (975)  |  📚 Animals (500)  |  📚 Science (475)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Chapter: All Chapters (975)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 🐾 Mammals (150)  |  🐦 Birds (120)  |  🐟 Marine Life (100)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Level: All Levels (975)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 🌱 Easy (206)  |  ⭐ Medium (189)  |  🔥 Hard (187)  |  💎 Expert   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  Questions (Showing 1-10 of 975)                         [+ Add Question]  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ☐ │ Question          │ Level  │ Chapter  │ Status │ Actions       │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ ☐ │ What is the...    │ Easy   │ Mammals  │ ✓ Pub  │ ✏️ 🗑️        │   │
│  │ ☐ │ What do plants... │ Medium │ Plants   │ ✓ Pub  │ ✏️ 🗑️        │   │
│  │ ☐ │ How many legs...  │ Hard   │ Insects  │ Draft  │ ✏️ 🗑️        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [◀ 1 2 3 ... 98 ▶]   Show: [10 ▼]                                      │
│                                                                             │
│  Bulk Actions: [Publish] [Draft] [Trash] [Delete]                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Admin Features
- **Filter Bar**: Subject, Chapter, Level filters with counts
- **Search**: Search questions by text
- **Question List**: Paginated table with columns
- **Status Indicators**: Published (✓), Draft, Trash
- **Actions**: Edit, Delete per question
- **Bulk Actions**: Multiple select + actions
- **Add Question**: Modal form for new questions
- **CSV Import**: Bulk import questions

---

## Data Flow

### Quiz State Management (`useQuiz` Hook)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUIZ STATE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   SELECT     │     │   LOAD       │     │   DISPLAY    │
  │  SUBJECT    │────▶│  QUESTIONS   │────▶│   QUESTION    │
  └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   SELECT     │     │   SET        │     │   ANSWER     │
  │  CHAPTER    │────▶│  QUESTIONS   │────▶│   QUESTION   │
  └──────────────┘     └──────────────┘     └──────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   SELECT     │     │   START      │     │   CHECK      │
  │  LEVEL      │────▶│  QUIZ        │────▶│   ANSWER     │
  └──────────────┘     └──────────────┘     └──────────────┘
                                                    │
                                                    ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   SELECT     │     │   UPDATE     │     │   NEXT/      │
  │  MODE       │────▶│  PROGRESS    │────▶│  COMPLETE    │
  └──────────────┘     └──────────────┘     └──────────────┘
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quiz/subjects` | Get all subjects |
| GET | `/quiz/subjects/:slug` | Get subject with chapters |
| GET | `/quiz/questions/:chapterId` | Get questions by chapter |
| GET | `/quiz/random/:level` | Get random questions |
| GET | `/quiz/mixed` | Get mixed difficulty questions |
| POST | `/quiz/questions` | Create question |
| POST | `/quiz/questions/bulk` | Bulk import |
| PATCH | `/quiz/questions/:id` | Update question |
| DELETE | `/quiz/questions/:id` | Delete question |

---

## File Structure

### Frontend Routes
```
/quiz                    - Subject selection
/quiz/play              - Quiz play
/quiz/results           - Results display
/admin                  - Admin panel
```

### Key Files
```
apps/frontend/src/
├── app/quiz/
│   ├── page.tsx              - Subject/chapter/level selection
│   ├── play/page.tsx          - Quiz play interface
│   └── results/page.tsx       - Results display
├── hooks/
│   └── useQuiz.ts            - Quiz state management
├── lib/
│   └── quiz-api.ts           - API functions
└── components/quiz/          - Quiz components
```

---

*Last Updated: 2026-03-17*
