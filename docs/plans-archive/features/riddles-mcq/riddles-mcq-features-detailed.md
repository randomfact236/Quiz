# Riddles MCQ Section - Detailed Feature Explanation

---

## Overview
The Riddles MCQ section offers word-based riddle puzzles where users guess the answer from multiple choice options.

---

## Page Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RIDDLES MCQ SECTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │   HOME     │───▶│  PRACTICE  │───▶│  CHAPTER   │───▶│   LEVEL    │
  │   Page     │    │   MODE     │    │  SELECT    │    │  SELECT    │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
        │                                                         │
        ▼                                                         ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │  STATS    │    │  SELECT    │    │  SELECT    │    │   RIDDLE   │
  │  Banner   │    │  CHAPTER   │    │  LEVEL     │    │   DISPLAY  │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
                                                                 │
        │                                                         ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │ CHALLENGE  │    │  PLAY     │    │  RESULTS   │    │  ANSWER    │
  │   MODE     │───▶│   MODE    │───▶│   PAGE     │    │  DISPLAY   │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
```

---

## Page 1: Riddles Home (`/riddles`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back                              RIDDLES                      ⚙️ Settings  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    📊 Your Riddles Stats                                    │
│         ┌─────────────────────────────────────────────────────────┐        │
│         │                                                          │        │
│         │    📚 12         📖 48         🧩 1,250                 │        │
│         │   Subjects    Chapters      Riddles                       │        │
│         │                                                          │        │
│         └─────────────────────────────────────────────────────────┘        │
│                                                                             │
│                                                                             │
│                    🎮 Ready to Solve Some Riddles?                         │
│                                                                             │
│         ┌─────────────────────┐  ┌─────────────────────┐                 │
│         │                     │  │                     │                 │
│         │    🎯              │  │    ⏱️              │                 │
│         │   PRACTICE         │  │   CHALLENGE         │                 │
│         │                     │  │                     │                 │
│         │   • No time limit  │  │   • Timed riddles  │                 │
│         │   • Show answers   │  │   • Score points   │                 │
│         │   • Learn at pace  │  │   • Beat your      │                 │
│         │                     │  │     best!          │                 │
│         │  [START PRACTICE]  │  │ [START CHALLENGE]  │                 │
│         │                     │  │                     │                 │
│         └─────────────────────┘  └─────────────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Stats Banner**: Shows total subjects, chapters, riddles
- **Mode Selection**: Practice or Challenge
- **Quick Start Buttons**

---

## Page 2: Practice Mode Selection (`/riddles/practice`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back                    PRACTICE MODE                        ⚙️ Settings  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    📚 Select Your Practice Type                              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  📁 Chapter-wise                                                           │
│  ─────────────────────────────────────                                     │
│                                                                             │
│  Select a specific chapter to practice:                                    │
│                                                                             │
│         ┌──────────────────────────────────────────────────────┐           │
│         │  🧩 Basic Riddles                                    │           │
│         │     🌱 Easy: 10  🌿 Medium: 15  🌲 Hard: 8  🔥 Expert: 5 │           │
│         └──────────────────────────────────────────────────────┘           │
│                                                                             │
│         ┌──────────────────────────────────────────────────────┐           │
│         │  🧩 Word Play                                        │           │
│         │     🌱 Easy: 8   🌿 Medium: 12  🌲 Hard: 6  🔥 Expert: 3  │           │
│         └──────────────────────────────────────────────────────┘           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  📚 All Chapters                                                           │
│  ─────────────────────────────────────                                     │
│                                                                             │
│  Practice riddles from all chapters:                                        │
│                                                                             │
│         ┌──────────────────────────────────────────────────────┐           │
│         │  📚 All Chapters (500)                               │           │
│         │     🌱 Easy: 50  🌿 Medium: 100  🌲 Hard: 200  🔥 Expert: 150  │           │
│         └──────────────────────────────────────────────────────┘           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  🎲 Complete Mix                                                          │
│  ─────────────────────────────────────                                     │
│                                                                             │
│  Random riddles from entire collection:                                     │
│                                                                             │
│         ┌──────────────────────────────────────────────────────┐           │
│         │  🎲 Complete Mix (1,250)                          │           │
│         │     Select level and number of riddles              │           │
│         └──────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Chapter-wise**: Practice specific chapter
- **All Chapters**: Mix from all chapters
- **Complete Mix**: Fully random
- **Level Counts**: Show riddles per level

---

## Page 3: Level Selection & Riddle Play

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back              Basic Riddles              🌱 Easy      ⏱️ No Timer    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Riddle 1 of 10                                        ████████░░ 80%        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  What has keys but can't open locks?                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  A) Piano                                            ✓           │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  B) Keyboard                                                      │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  C) Map                                                          │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  D) Lock                                                         │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│         ✅ Correct! The answer is Piano.                                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                      💡 Hint (3 remaining)                                 │
│                                                                             │
│                           [NEXT RIDDLE →]                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Question Display**: Riddle text with 4 options
- **Answer Selection**: Click to select A/B/C/D
- **Feedback**: Shows correct/incorrect after selection
- **Hint System**: Show hints if stuck
- **Next Button**: Manual advance in practice mode

---

## Page 4: Challenge Mode

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back              Word Riddles              ⭐ Medium    ⏱️ 0:23          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Riddle 3 of 15        🔥 Streak: 5                        💯 Score: 320    │
│                                        ████████████░░░░░ 45%               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  I speak without a mouth and hear without ears. What am I?                 │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  A) Echo                                          ✓           │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  B) Telephone                                               │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  C) Radio                                                   │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  D) Microphone                                              │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Timer**: Countdown per riddle (30 seconds)
- **Score Display**: Running score
- **Streak Counter**: Consecutive correct answers
- **Auto-Advance**: Move to next after time or answer

---

## Page 5: Results

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         🎉 RIDDLES COMPLETED!                                │
│                                                                             │
│                    ┌─────────────────────┐                                │
│                    │        80%          │                                │
│                    │     8 / 10          │                                │
│                    │     Correct         │                                │
│                    └─────────────────────┘                                │
│                                                                             │
│         Score: 850 pts                    🔥 Best Streak: 5                 │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  Riddle Breakdown:                                                         │
│                                                                             │
│  ✅ Q1: What has keys...           Correct ✓  (+100 pts)                   │
│  ✅ Q2: I speak without a mouth   Correct ✓  (+150 pts, streak bonus!)    │
│  ❌ Q3: What comes once in a min  Your: Hour    Correct: Minute            │
│  ✅ Q4: I have cities but no...   Correct ✓  (+100 pts)                    │
│  ...                                                                     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│              [PLAY AGAIN]          [CHANGE LEVEL]         [HOME]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Score Summary**: Percentage correct
- **Points Earned**: Total with breakdown
- **Streak Info**: Best streak achieved
- **Question Review**: All riddles with answers

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RIDDLES MCQ DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  1. LOAD DATA
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Fetch     │────▶│   Fetch     │────▶│   Fetch     │
  │  Subjects   │     │  Chapters   │     │  Riddles    │
  └─────────────┘     └─────────────┘     └─────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
  ┌─────────────────────────────────────────────────────────┐
  │                   STATE MANAGEMENT                      │
  │  selectedSubject | selectedChapter | selectedLevel     │
  └─────────────────────────────────────────────────────────┘
         │
         ▼
  2. GAMEPLAY
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Display  │────▶│   Answer    │────▶│   Score    │
  │   Riddle   │     │   Select    │     │   Update   │
  └─────────────┘     └─────────────┘     └─────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Next     │     │  Feedback   │     │   Results  │
  │   Riddle   │     │   Show      │     │   Display  │
  └─────────────┘     └─────────────┘     └─────────────┘
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/riddles/stats` | Get stats (subjects, chapters, riddles count) |
| GET | `/riddles/subjects` | Get subjects |
| GET | `/riddles/chapters` | Get chapters |
| GET | `/riddles/mcq/:chapterId` | Get MCQ riddles |
| GET | `/riddles/random` | Get random riddles |

---

## File Structure

```
apps/frontend/src/
├── app/riddles/
│   ├── page.tsx              # Home page
│   ├── practice/page.tsx     # Practice mode
│   ├── challenge/page.tsx   # Challenge mode
│   ├── play/page.tsx        # Play mode
│   └── results/page.tsx    # Results
└── lib/riddles-api.ts       # API functions
```

---

*Last Updated: 2026-03-17*
