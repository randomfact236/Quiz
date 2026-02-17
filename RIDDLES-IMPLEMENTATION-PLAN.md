# Riddles Feature Implementation Plan
## AI Quiz Platform - Product Readiness Roadmap

**Architecture:** No-login, localStorage-only  
**Last Updated:** 2026-02-17  
**Status:** Active Development

---

## 🎯 Executive Summary

This plan outlines the remaining features to make the Riddles section product-ready while respecting the **no-login, localStorage-only architecture**. Focus is on user engagement, retention, and immediate value delivery.

**Current Status:**
- ✅ Riddle Management (Admin CRUD, import/export)
- ✅ Chapter-based browsing
- ✅ Basic list view with expandable answers
- ❌ Game modes (Timer/Practice) - buttons show "coming soon"
- ❌ Progress tracking
- ❌ User engagement features

---

## 🚨 Phase 0: Critical Fixes (Deploy First)

| Feature | Why | Implementation |
|---------|-----|----------------|
| **Fix "0 Riddles" Display** | Looks broken to users | Hide empty chapters or show "Coming Soon" badge |
| **Session Persistence** | Prevent rage-quit on refresh | Auto-save to `localStorage` every 10 seconds |
| **Progress Indicators** | Show value immediately | Add completion % to chapter cards |
| **Data Loss Warning** | Set user expectations | One-time banner: "Saved on this device only" |

### Technical Requirements
```typescript
// Auto-save current game session
localStorageKey: 'aiquiz:riddle-session'
interface RiddleSession {
  riddles: Riddle[];
  currentIndex: number;
  answers: Record<number, string>;
  timeRemaining: number;
  mode: 'timer' | 'practice';
  lastSavedAt: string;
}
```

---

## 🎮 Phase 1: Core Game Modes (Week 1)

### 1.1 Riddle Play Page (`/riddles/play`)
**Priority:** P0 | **Effort:** High

#### Features:
- Full-screen riddle player interface
- Display riddle question with chapter/difficulty badges
- Multiple choice answer selection (A/B/C/D)
- Navigation: Previous/Next buttons
- Progress indicator (question X of Y)
- **Continue Button** - Resume last session if interrupted
- Submit/Finish button

#### Technical Requirements:
```typescript
// New file: src/app/riddles/play/page.tsx
interface RiddlePlayState {
  riddles: Riddle[];
  currentIndex: number;
  answers: Record<number, string>; // riddleId -> selectedOption
  timeRemaining: number;
  status: 'playing' | 'paused' | 'completed';
  mode: 'timer' | 'practice';
}

// Auto-save every 10 seconds
useEffect(() => {
  const interval = setInterval(() => {
    saveToLocalStorage('aiquiz:riddle-session', state);
  }, 10000);
  return () => clearInterval(interval);
}, [state]);
```

---

### 1.2 Timer Challenge Mode (`/riddles/challenge`)
**Priority:** P0 | **Effort:** High

Similar to Quiz Timer Challenge layout with 3 sections:
1. **Chapter Wise Mix** - Select chapter + difficulty
2. **All Chapter Level Wise Mix** - All chapters at selected difficulty  
3. **Complete Mix** - All chapters, all difficulties

#### Features:
- Countdown timer (per-question or total session)
- Auto-submit when time expires
- Score calculation with time bonus
- URL: `/riddles/play?chapter=X&level=Y&mode=timer`

#### Timer Configuration:
```typescript
const RIDDLE_TIMERS = {
  easy: 30,
  medium: 45,
  hard: 60,
  expert: 90,
};
```

---

### 1.3 Practice Mode (`/riddles/practice`)
**Priority:** P0 | **Effort:** Medium

Same 3-section layout as Timer Challenge:
- No timer pressure
- Shows hint button (if hint exists)
- Immediate feedback on answer selection
- Can navigate freely between questions
- URL: `/riddles/play?chapter=X&level=Y&mode=practice`

---

### 1.4 Results Page (`/riddles/results`)
**Priority:** P0 | **Effort:** Medium

#### Features:
- Score summary (correct/total)
- Time taken
- Breakdown by difficulty
- List of correct vs incorrect answers
- Option to retry same set
- Save to history

#### Data Structure:
```typescript
interface RiddleHistory {
  sessions: RiddleSession[];
  totalSolved: number;
  streakDays: number;
  lastPlayedAt: string;
}

// Storage key: aiquiz:riddle-history
```

---

## 🎁 Phase 2: Engagement Features (Week 2)

| Feature | Storage | Priority | Description |
|---------|---------|----------|-------------|
| **Daily Riddle** | `localStorage` | **#1** | One special riddle per day. Drives daily returns. |
| **Favorites** | `localStorage` | **#2** | Heart icon on cards. Bookmark riddles to revisit. |
| **Streak Counter** | `localStorage` | **#3** | Flame icon in header. Consecutive days played. |
| **Personal Bests** | `localStorage` | **#4** | Your own high scores per chapter/difficulty. |
| **Achievements** | `localStorage` | **#5** | 5-10 simple badges (First Solve, Speed Demon, etc.) |
| **Export/Import JSON** | File download | **#6** | "Backup your progress" - user-controlled data portability |

### localStorage Schema
```typescript
// All riddles user data
aiquiz:riddle-history        // Session results array
aiquiz:riddle-favorites      // Bookmarked riddle IDs: number[]
aiquiz:riddle-streak         // {current: number, lastPlayedDate: string}
aiquiz:riddle-achievements   // Unlocked badge IDs: string[]
aiquiz:riddle-settings       // {sound: boolean, darkMode: boolean}
aiquiz:riddle-session        // Auto-save current game (for resume)
aiquiz:daily-riddle          // {date: string, riddleId: number, completed: boolean}
```

### Achievement Ideas (5-10 simple ones)
```typescript
const RIDDLE_ACHIEVEMENTS = [
  { id: 'first-solve', name: 'First Steps', desc: 'Solve your first riddle', icon: '🎯' },
  { id: 'speed-demon', name: 'Speed Demon', desc: 'Solve 5 timer riddles under 10s each', icon: '⚡' },
  { id: 'perfect-10', name: 'Perfect 10', desc: 'Get 10/10 in one session', icon: '💯' },
  { id: 'streak-3', name: 'On Fire', desc: '3 day streak', icon: '🔥' },
  { id: 'streak-7', name: 'Weekly Warrior', desc: '7 day streak', icon: '📅' },
  { id: 'riddle-novice', name: 'Riddle Novice', desc: 'Solve 10 riddles', icon: '🌱' },
  { id: 'riddle-expert', name: 'Riddle Expert', desc: 'Solve 50 riddles', icon: '🏆' },
  { id: 'riddle-master', name: 'Riddle Master', desc: 'Solve 100 riddles', icon: '👑' },
  { id: 'chapter-master', name: 'Chapter Master', desc: 'Solve 10 riddles in one chapter', icon: '📚' },
  { id: 'hint-hater', name: 'Pure Skill', desc: 'Solve 20 riddles without hints', icon: '🧠' },
];
```

---

## ✨ Phase 3: Polish (Week 3)

| Feature | Notes |
|---------|-------|
| **Sound Effects Toggle** | `localStorage` preference. Optional enhancement. |
| **Keyboard Shortcuts** | 1-4 for options, arrows for navigation. Accessibility + power users. |
| **Confetti Animation** | Visual reward on perfect score. |
| **Offline Support** | Service Worker + IndexedDB for larger storage. |
| **Dark Mode** | You have moon icon in header already. Extend to riddle pages. |

---

## ❌ Features to Skip Entirely

| Feature | Reason |
|---------|--------|
| Global leaderboards | Requires login/backend |
| Multiplayer | Requires auth + real-time infrastructure |
| Cross-device sync | Requires cloud storage |
| Hint currency system | No monetization system yet |
| Premium/gated content | No payment system |
| Social sharing | Requires OAuth/integration |

---

## 📁 File Structure

```
src/app/riddles/
├── page.tsx                 # Browse chapters (existing)
├── challenge/
│   └── page.tsx             # Timer challenge selection (NEW)
├── practice/
│   └── page.tsx             # Practice mode selection (NEW)
├── play/
│   └── page.tsx             # Active riddle player (NEW)
├── results/
│   └── page.tsx             # Session results (NEW)
└── daily/
    └── page.tsx             # Daily riddle (Phase 2)

src/components/riddles/
├── RiddlePlayerCard.tsx     # Question + options display
├── RiddleProgressBar.tsx    # Progress through session
├── RiddleTimer.tsx          # Countdown timer
├── RiddleNavigation.tsx     # Prev/Next/Submit buttons
├── RiddleResultsSummary.tsx # Score breakdown
├── DailyRiddleWidget.tsx    # Show on homepage (Phase 2)
└── StreakIndicator.tsx      # Flame icon in header (Phase 2)

src/hooks/
├── useRiddle.ts             # Game state management
├── useRiddleHistory.ts      # History & stats
├── useDailyRiddle.ts        # Daily riddle logic (Phase 2)
└── useStreak.ts             # Streak tracking (Phase 2)
```

---

## 🔄 Reusable from Quiz Implementation

| Quiz Component | Riddle Adaptation | Changes Needed |
|----------------|-------------------|----------------|
| `useQuiz.ts` | `useRiddle.ts` | Change question format (options[] vs optionA/B/C/D) |
| `/quiz/challenge` | `/riddles/challenge` | Same 3-section foldable layout |
| `/quiz/practice-mode` | `/riddles/practice` | Same layout, no timer |
| `/quiz/play` | `/riddles/play` | Adapt for riddle data structure |
| `/quiz/results` | `/riddles/results` | Same score display logic |
| `QuestionCard.tsx` | `RiddlePlayerCard.tsx` | Use options[] array instead of named fields |
| `Timer.tsx` | `RiddleTimer.tsx` | Reuse timer hook as-is |

---

## 📊 Success Metrics (Trackable without Login)

| Metric | How to Track | Target |
|--------|--------------|--------|
| Daily active users | `localStorage` streak participation | 50% return rate |
| Retention | Return visits with existing progress | 30% weekly retention |
| Engagement | Avg riddles solved per session | 5+ riddles |
| Feature usage | Favorites count, export clicks | 20% use favorites |
| Completion rate | Sessions completed vs abandoned | 70% completion |

---

## 🚀 Implementation Timeline

### Week 1: Core Game Modes
- Day 1-2: Phase 0 fixes (0-riddles display, session persistence)
- Day 3-4: `/riddles/play` page + `useRiddle` hook
- Day 5-7: `/riddles/challenge` and `/riddles/practice` selection pages

### Week 2: Engagement Features
- Day 1-2: Daily Riddle + widget
- Day 3-4: Favorites system
- Day 5: Streak counter + achievements
- Day 6-7: Export/Import JSON + personal bests

### Week 3: Polish & Launch
- Day 1-2: Sound effects + keyboard shortcuts
- Day 3: Confetti + animations
- Day 4-5: Testing + bug fixes
- Day 6-7: Performance optimization + dark mode

**Ship after Week 2** if needed. Phase 3 is bonus polish.

---

## ✅ Pre-Launch Checklist

- [ ] No "coming soon" buttons on homepage
- [ ] Session auto-saves and can resume
- [ ] All 4 difficulty levels work (easy/medium/hard/expert)
- [ ] Results page shows score breakdown
- [ ] History persists across browser sessions
- [ ] Mobile responsive design
- [ ] Empty chapters hidden or show "Coming Soon"

---

## 📝 Notes

1. **No Backend Required** - Everything stored in localStorage
2. **No Login Required** - User identified by browser only
3. **Data Portability** - Export/Import lets users backup/transfer progress
4. **Privacy First** - No user data leaves their device

---

## 🆘 Emergency Scope Cut

If behind schedule, cut in this order:
1. ~~Phase 3 polish features~~
2. ~~Achievements~~
3. ~~Export/Import~~
4. ~~Personal bests~~
5. **Keep:** Daily Riddle, Favorites, Streak, Core Game Modes

Minimum viable: Timer/Practice modes + session persistence.
