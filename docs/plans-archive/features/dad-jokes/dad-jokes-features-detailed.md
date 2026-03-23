# Dad Jokes Section - Detailed Feature Explanation

---

## Overview
The Dad Jokes section provides clean, family-friendly jokes for entertainment. Users can browse, like, share, and discover new jokes.

---

## Page Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DAD JOKES SECTION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │   HOME     │───▶│  BROWSE    │───▶│  SELECT    │───▶│  INTERACT  │
  │   Page     │    │  JOKES    │    │  CATEGORY  │    │  VOTE/SHARE │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
        │                                                         │
        ▼                                                         ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
  │  RANDOM    │    │  SEARCH    │    │   JOKE    │    │  COPY/     │
  │  JOKE     │    │  RESULTS   │    │   CARD    │    │  SHARE     │
  └────────────┘    └────────────┘    └────────────┘    └────────────┘
```

---

## Page 1: Dad Jokes Home (`/jokes`)

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back                              DAD JOKES                    ⚙️ Settings │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔍 Search jokes...                                      🎲 Random Joke    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│                    📂 Browse by Category                                    │
│                                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐       │
│  │                               │ │                               │       │
│  │         😂                    │ │         💻                   │       │
│  │                               │ │                               │       │
│  │    Classic Dad Jokes         │ │   Programming Jokes          │       │
│  │                               │ │                               │       │
│  │    Timeless classics...       │ │   For the nerdy dad...      │       │
│  │                               │ │                               │       │
│  │       85 jokes              │ │       42 jokes              │       │
│  │                               │ │                               │       │
│  └─────────────────────────────┘ └─────────────────────────────┘       │
│                                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐       │
│  │                               │ │                               │       │
│  │         👶                    │ │         💼                   │       │
│  │                               │ │                               │       │
│  │  Parenting Dad Jokes          │ │   Work Office Dad Jokes      │       │
│  │                               │ │                               │       │
│  │    Adventures of raising...  │ │    Corporate humor...        │       │
│  │                               │ │                               │       │
│  │       56 jokes              │ │       38 jokes              │       │
│  │                               │ │                               │       │
│  └─────────────────────────────┘ └─────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Category Cards**: Visual cards for each category
- **Search Bar**: Search all jokes
- **Random Button**: Get random joke
- **Category Counts**: Show number of jokes per category

---

## Page 2: Jokes List

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back              Programming Jokes (42)              🎲 Random         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔍 Search jokes...                                      [Clear]             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Why do programmers always mix up Christmas and Halloween?         │   │
│  │                                                                     │   │
│  │         👉 Tap to reveal punchline 👈                              │   │
│  │                                                                     │   │
│  │  ────────────────────────────────────────────────────────────       │   │
│  │                                                                     │   │
│  │  Because Oct 31 = Dec 25!                                        │   │
│  │                                                                     │   │
│  │  ────────────────────────────────────────────────────────────       │   │
│  │                                                                     │   │
│  │    👍 142    👎 5                    [📋 Copy]  [📤 Share]        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  What do you call a programmer from Finland?                       │   │
│  │                                                                     │   │
│  │         👉 Tap to reveal punchline 👈                              │   │
│  │                                                                     │   │
│  │  ────────────────────────────────────────────────────────────       │   │
│  │                                                                     │   │
│  │  Nerdic!                                                          │   │
│  │                                                                     │   │
│  │  ────────────────────────────────────────────────────────────       │   │
│  │                                                                     │   │
│  │    👍 89     👎 12                   [📋 Copy]  [📤 Share]        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                          ◀ 1 2 3 4 ▶    Show: [12 ▼]                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Features
- **Joke Cards**: Setup with hidden punchline
- **Click to Reveal**: Tap to show punchline
- **Like/Dislike**: Vote buttons
- **Copy Button**: Copy joke to clipboard
- **Share Button**: Share to social media
- **Pagination**: 12 jokes per page

---

## Page 3: Vote Interaction

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VOTING SYSTEM                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  BEFORE VOTE:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  Why do programmers hate nature?                                   │
  │                                                                     │
  │  It has too many bugs.                                            │
  │                                                                     │
  │       👍 142          👎 5                                        │
  │                                                                     │
  │   [  Like  ]    [  Dislike  ]                                     │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  AFTER LIKE:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  Why do programmers hate nature?                                   │
  │                                                                     │
  │  It has too many bugs.                                            │
  │                                                                     │
  │      👍 143 🟢      👎 5                                          │
  │                                                                     │
  │   [ ✓ Liked ]    [  Dislike  ] ← Disabled (already voted)       │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  LOCAL STORAGE PERSISTENCE:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  {                                                                   │
  │    "joke_votes": {                                                 │
  │      "joke-uuid-1": "like",                                        │
  │      "joke-uuid-2": "dislike",                                    │
  │      "joke-uuid-3": "like"                                         │
  │    }                                                                │
  │  }                                                                   │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Page 4: Copy & Share

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COPY & SHARE SYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  COPY TO CLIPBOARD:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  Why do programmers always mix up Christmas and Halloween?         │
  │                                                                     │
  │  Because Oct 31 = Dec 25!                                        │
  │                                                                     │
  │  ────────────────────────────────────────────────────────────       │
  │                                                                     │
  │                  [📋 Copy to Clipboard]                            │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  BUTTON STATES:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  Default:  📋 Copy                                                 │
  │                                                                     │
  │  Clicked: ✓ Copied!  (shows for 2 seconds)                       │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  SHARE OPTIONS:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  [📤 Share]                                                         │
  │       │                                                             │
  │       ├── 🌐 Native Share (if available)                          │
  │       │        └── Uses: navigator.share()                        │
  │       │                                                             │
  │       ├── 🐦 Twitter/X                                             │
  │       │        └── twitter.com/intent/tweet?text=...              │
  │       │                                                             │
  │       └── 📧 Email (fallback)                                      │
  │                └── mailto:?subject=...&body=...                   │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Search System

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEARCH SYSTEM                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  SEARCH INPUT:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  🔍 Search jokes...                              [X Clear]         │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
       │
       ▼
  DEBOUNCE (300ms):
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  wait 300ms after user stops typing                                │
  │  then search                                                       │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
       │
       ▼
  SEARCH FIELDS:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  Searches in:                                                       │
  │  ├── joke.setup                                                    │
  │  ├── joke.punchline                                               │
  │  ├── joke.category                                                 │
  │  └── joke.joke (legacy single-field)                               │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
       │
       ▼
  RESULTS:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  Found 5 jokes for "programmer":                                   │
  │                                                                     │
  │  1. Why do programmers always mix up...                           │
  │  2. What do you call a programmer from...                         │
  │  3. How many programmers does it take...                           │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Random Joke Feature

### Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RANDOM JOKE SYSTEM                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  RANDOM BUTTON:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │                     🎲 Random Joke                                 │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
       │
       ▼
  SHUFFLE ALGORITHM (Fisher-Yates):
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  function seededShuffle(arr, seed) {                              │
  │    const a = [...arr];                                            │
  │    let s = seed;                                                  │
  │    for (let i = a.length - 1; i > 0; i--) {                     │
  │      s = (s * 1664525 + 1013904223) & 0x7fffffff;               │
  │      const j = s % (i + 1);                                      │
  │      [a[i], a[j]] = [a[j], a[i]];                                │
  │    }                                                               │
  │    return a;                                                       │
  │  }                                                                 │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
       │
       ▼
  RESULT:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  ┌───────────────────────────────────────────────────────────┐    │
  │  │                                                           │    │
  │  │   🎲 Your Random Dad Joke                                 │    │
  │  │                                                           │    │
  │  │   Why do Java developers wear glasses?                    │    │
  │  │                                                           │    │
  │  │   Because they can't C#!                                   │    │
  │  │                                                           │    │
  │  │   👍 256    👎 12     [🔄 Another]  [📋 Copy]           │    │
  │  │                                                           │    │
  │  └───────────────────────────────────────────────────────────┘    │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jokes/classic` | Get jokes |
| GET | `/jokes/classic/categories` | Get categories |
| POST | `/jokes/classic/:id/vote` | Vote on joke |

---

## File Structure

```
apps/frontend/src/
├── app/jokes/
│   └── page.tsx              # Main jokes page
├── components/jokes/
│   ├── JokeCard.tsx        # Joke display
│   ├── VoteButtons.tsx     # Like/dislike buttons
│   └── CategoryCard.tsx    # Category display
└── lib/
    └── jokes-api.ts        # API functions
```

---

*Last Updated: 2026-03-17*
