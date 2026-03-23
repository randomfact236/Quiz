# Riddles Image Section - Detailed Feature Explanation

---

## Overview
The Riddles Image section features visual puzzles where users guess the answer based on images.

---

## Page Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RIDDLES IMAGE SECTION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │   HOME     │───▶│  BROWSE    │───▶│  SELECT    │───▶│   PLAY     │
  │   Page     │    │  RIDDLES   │    │  RIDDLE    │    │   MODAL    │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
        │                                                         │
        ▼                                                         ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │  STATS     │    │  FILTER    │    │   VIEW     │    │  RESULTS   │
  │  Banner    │    │  SEARCH    │    │   IMAGE    │    │  FEEDBACK  │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
```

---

## Page 1: Image Riddles Home (`/image-riddles`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back                      IMAGE RIDDLES                      ⚙️ Settings  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔍 Search riddles...                                                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │                     │ │                     │ │                     │   │
│  │   🦁 Animals        │ │   🔑 Objects        │ │   🏰 Places        │   │
│  │   45 riddles       │ │   32 riddles       │ │   28 riddles       │   │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
│                                                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │                     │ │                     │ │                     │   │
│  │   👤 People         │ │   🍕 Food           │ │   🌲 Nature         │   │
│  │   18 riddles       │ │   22 riddles       │ │   35 riddles       │   │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                    🧩 All Riddles (180)                                     │
│                                                                             │
│  Filter: [All ▼] [Easy ▼]  Sort: [Newest ▼]                              │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  🏆 Easy   │ │  ⭐ Medium  │ │  🔥 Hard   │ │  💎 Expert │           │
│  │   ⏱️ 1:30  │ │   ⏱️ 2:00  │ │   ⏱️ 2:30  │ │   ⏱️ 3:00  │           │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤           │
│  │             │ │             │ │             │ │             │           │
│  │  [IMAGE]    │ │  [IMAGE]   │ │  [IMAGE]   │ │  [IMAGE]   │           │
│  │             │ │             │ │             │ │             │           │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤           │
│  │ What has    │ │ What has    │ │ What can    │ │ What is     │           │
│  │ four legs  │ │ four legs  │ │ you carry   │ │ never      │           │
│  │ and says   │ │ and says   │ │ but never   │ │ goes       │           │
│  │ woof?     │ │ meow?     │ │ uses?      │ │ backward? │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│                          ◀ 1 2 3 ... 15 ▶                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Category Sidebar**: 2-column sticky sidebar
- **Difficulty Filter**: Easy, Medium, Hard, Expert
- **Search**: Filter by title or answer
- **Sort Options**: Newest, Oldest, Random, Difficulty
- **Riddle Cards**: Image + difficulty badge + timer + title
- **Pagination**: 12 riddles per page

---

## Page 2: Riddle Modal (Click to Play)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✕                                    🏆 Easy          ⏱️ 1:15            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────┐                            │
│                    │                           │                            │
│                    │                           │                            │
│                    │        [IMAGE]            │                            │
│                    │                           │                            │
│                    │                           │                            │
│                    └───────────────────────────┘                            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  What has four legs and says woof?                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  Enter your answer...                                           │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│      [💡 Hint]      [❌ Give Up]                    [✅ Check Answer]    │
│                                                                             │
│                                                                             │
│                         (Keyboard: ← → Navigate, Esc Close)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Image Display**: Large modal image
- **Difficulty Badge**: Top right
- **Timer**: Countdown (if enabled)
- **Answer Input**: Text field
- **Action Buttons**: Hint, Give Up, Submit
- **Keyboard Navigation**: Arrow keys to navigate

---

## Page 3: Answer Feedback

### Correct Answer
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✕                                    🏆 Easy          ⏱️ Done!            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────┐                            │
│                    │         ✓ CORRECT!       │                            │
│                    │                           │                            │
│                    │        [IMAGE]            │                            │
│                    │                           │                            │
│                    └───────────────────────────┘                            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  What has four legs and says woof?                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  Dog                                                      ✓       │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                    Answer: Dog                                              │
│                                                                             │
│                    Attempts: 1                                              │
│                                                                             │
│                           [NEXT RIDDLE →]                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Wrong Answer (Shake Animation)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✕                                    🏆 Easy          ⏱️ 0:45            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────┐                            │
│                    │                           │                            │
│                    │        [IMAGE]            │                            │
│                    │                           │                            │
│                    └───────────────────────────┘                            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  What has four legs and says woof?                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  Cat                                                      ✗       │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                    ❌ Wrong! Try again.                                     │
│                    Hint: It's a common pet that barks.                     │
│                                                                             │
│                    Attempts: 2 / 3                                         │
│                                                                             │
│                      [HINT]     [GIVE UP]     [TRY AGAIN]                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Correct Feedback**: Green checkmark, show answer
- **Wrong Feedback**: Red X, shake animation
- **Hint System**: Progressive hints
- **Attempts Counter**: Track tries

---

## Action Options System

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ACTION OPTIONS CONFIG                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Each riddle can have configurable actions:

  ┌─────────────────────────────────────────────────────────────────────┐
  │  BUTTON TYPE                                                       │
  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
  │  │   button    │  │    link     │  │   toggle    │               │
  │  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                             │
│  STYLE OPTIONS                                                         │
│  ┌────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐          │
│  │primary │ │secondary│ │ success │ │ danger │ │ warning │          │
│  └────────┘ └─────────┘ └─────────┘ └────────┘ └─────────┘          │
│                                                                             │
│  DEFAULT ACTIONS:                                                        │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │
│  │ 💡 Hint        │ │ 👁️ View       │ │ 🔊 Sound     │               │
│  │ button/info    │ │ button/primary │ │ button/warning│              │
│  └────────────────┘ └────────────────┘ └────────────────┘               │
│                                                                             │
│  ┌────────────────┐ ┌────────────────┐                                   │
│  │ ❌ Give Up     │ │ ✅ Check Ans   │                                   │
│  │ button/danger │ │ button/success │                                   │
│  └────────────────┘ └────────────────┘                                   │
```

---

## Filtering & Sorting

### Filter Options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FILTER SYSTEM                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  CATEGORY FILTER                    DIFFICULTY FILTER
  ┌────────────────────┐             ┌────────────────────┐
  │ 🦁 Animals     (45) │             │ [All Difficulty] │
  │ 🔑 Objects    (32) │             │ ──────────────────│
  │ 🏰 Places     (28) │             │ 🌱 Easy       (30)│
  │ 👤 People     (18) │             │ ⭐ Medium     (50)│
  │ 🍕 Food       (22) │             │ 🔥 Hard       (60)│
  │ 🌲 Nature     (35) │             │ 💎 Expert     (40)│
  └────────────────────┘             └────────────────────┘

  SORT OPTIONS                       SEARCH
  ┌────────────────────┐             ┌────────────────────┐
  │ [Sort: Newest   ▼] │             │ 🔍 Search...     │
  │ ──────────────────│             └────────────────────┘
  │ 🌟 Newest        │
  │ 📅 Oldest        │
  │ 🎲 Random        │
  │ 📊 Difficulty    │
  └────────────────────┘
```

---

## Timer System

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TIMER SYSTEM                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  DEFAULT TIMERS BY DIFFICULTY:
  ┌────────────┬────────────┬────────────────────────────────────┐
  │ Difficulty │   Time     │           Description              │
  ├────────────┼────────────┼────────────────────────────────────┤
  │   Easy    │   1:30     │   90 seconds - Relaxed pace       │
  │  Medium   │   2:00     │  120 seconds - Standard pace       │
  │   Hard    │   2:30     │  150 seconds - Challenge           │
  │  Expert   │   3:00     │  180 seconds - Expert level        │
  └────────────┴────────────┴────────────────────────────────────┘

  TIMER DISPLAY:
  ┌─────────────────────────────────────────────────────────────────────┐
  │  ⏱️ 1:25 ████████████████░░░░░░░░░░░░░░░░░░░░░░░░  65%         │
  └─────────────────────────────────────────────────────────────────────┘

  TIMEOUT BEHAVIOR:
  1. Timer reaches 0
  2. Auto-reveal answer
  3. Show "Time's Up!" message
  4. Mark as incorrect
  5. Auto-advance to next (optional)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/image-riddles/categories` | Get categories |
| GET | `/image-riddles/questions` | Get riddles |
| GET | `/image-riddles/random` | Get random riddles |

---

## File Structure

```
apps/frontend/src/
├── app/image-riddles/
│   └── page.tsx              # Main page with grid + modal
├── components/image-riddles/
│   ├── ActionOptions.tsx     # Configurable action buttons
│   ├── RiddleCard.tsx        # Card display
│   └── RiddleModal.tsx       # Play modal
└── lib/
    └── initial-data.ts       # Default riddles
```

---

*Last Updated: 2026-03-17*
