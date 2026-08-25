# Quiz User Experience - Feature Documentation

## Overview

This document covers the complete user-facing quiz functionality including quiz modes, play features, session persistence, share functionality, results, and navigation UX.

---

## Quiz Modes

### Normal Mode

- **Flow:** Subject → Chapter → Level selection
- **Questions:** All questions in selected chapter at selected difficulty level
- **URL:** `/quiz/play?subject=X&chapter=Y&level=Z&mode=normal`

### Practice Mode

- **Flow:** Subject → Practice → Level selection
- **Questions:** All questions in selected subject at selected difficulty level
- **URL:** `/quiz/play?subject=X&level=Z&mode=practice&type=practice`

### Timer Challenge Mode

- **Flow:** Subject → Timer → Level selection
- **Questions:** All questions in selected subject at selected difficulty level
- **Timer:** Per-question countdown (30-120 seconds depending on level)
- **URL:** `/quiz/play?subject=X&level=Z&mode=timer`

---

## Quiz Play Features

### Session Initialization

- Default 10 questions per session
- All available questions loaded upfront (no arbitrary limits)
- Add more questions before starting: slider + dropdown selector
- Add more questions during quiz: modal with count selector

### Question Navigation

- **Next/Back buttons** for sequential navigation
- **Jump to specific question** via question number input
- **Progress bar** showing current position / total
- **Question counter** display: "Q5 of 20"

### Answer Interaction

- **Answer selection** with visual feedback (indigo highlight)
- **Correct/Wrong feedback** immediately after selection
- **Score tracking** live update
- **Skip question** button (marks as manually skipped)

### Timer Controls

- **Pause/Resume quiz** (timer mode only)
- **Time remaining** display per question or total
- **Auto-submit** when timer expires

---

## Question Tracking

### Skipped Questions

- **"⚡ Skipped N" button** shows count of manually skipped questions
- **Jump to skipped question** - navigates to first unanswered/skipped
- **Skip count updates correctly** on navigation
- **Skipped state persists** across refresh

### Unvisited Questions (Shared Link Flow)

- **"Q" button** for receivers of shared links
- **Jump to Q1** from unvisited state
- **Unvisited dismissed permanently** after first visit
- **Shared link flow:** `?question=N&shared=true&total=M`

---

## Session Persistence

### How It Works

**Storage:** `localStorage` with key `aiquiz:quiz-resume-session`

**Saved Data (`QuizResumeState`):**

```typescript
interface QuizResumeState {
  subject: string;
  chapter: string;
  level: string;
  mode: 'normal' | 'timer_challenge' | 'practice_challenge';
  currentQuestionIndex: number;
  sessionSize: number;
  answers: Record<string, string>;
  score: number;
  manuallySkipped: string[];
  availableQuestions: Question[];
  savedAt: number; // timestamp
  startedAt: string; // ISO date string
}
```

**Expiry:** 24 hours

### Save Triggers

- Answer selection
- Question navigation (next/previous)
- Skip question
- Add more questions
- **NOT saved** on fresh load before any interaction

### Resume Behavior

| Scenario                         | Behavior                                       |
| -------------------------------- | ---------------------------------------------- |
| Fresh start                      | No prompt, starts from Q1                      |
| Answer Q1, navigate away, return | Resume prompt: "Q2, 1 answered"                |
| Click Resume                     | Continues from saved position with all answers |
| Click Start Fresh                | Clears session, starts from Q1                 |
| Submit quiz                      | Session cleared, no prompt on refresh          |

### Implementation Details

**Mount Decision (`mountDecisionRef`):**

```typescript
// Single decision point on mount
mountDecisionRef.current = {
  resumeSession: savedData, // null if no valid session
  startIndex: isShared ? startFromShare - 1 : (resumeSession?.currentQuestionIndex ?? 0),
  sessionSize: isShared ? (initialTotal ?? 10) : (resumeSession?.sessionSize ?? 10),
  isShared: isSharedLink,
};
```

**Effect 1 Behavior:**

- If `mountDecisionRef.resumeSession` exists → skip loading, show prompt
- If resuming via `handleResumeSession()` → Effect 1 skips via `isResumingRef`
- If Start Fresh → `resetKey` increments, Effect 1 re-runs fresh

---

## Share Feature

### Share Button

- **Location:** Every question card
- **Action:** Copies URL to clipboard with toast notification

### URL Format

```
?question={currentQuestionNumber}&total={totalQuestions}&shared=true
```

Example: `?question=13&total=20&shared=true`

### Receiver Experience

1. Opens shared URL
2. Lands directly on shared question (auto-starts quiz)
3. Same session size as sharer
4. Unvisited button shows until first interaction
5. `shared=true` flag prevents false unvisited on refresh

### Implementation

**Share URL Construction:**

```typescript
const shareUrl =
  `${window.location.origin}/quiz/play` +
  `?subject=${subject}` +
  `&chapter=${encodeURIComponent(chapter)}` +
  `&level=${level}` +
  `&mode=${mode}` +
  `&question=${currentQuestionIndex + 1}` +
  `&total=${totalQuestions}` +
  `&shared=true`;
```

**Landing Behavior:**

- `isSharedLink = true` → skip pre-quiz screen, start directly
- `startFromShare = questionParam` → initialIndex = question - 1
- `isShared = true` in mountDecision → don't check for saved session

---

## Results Page

### Score Display

- **Score count-up animation** from 0 to final score
- **Grade badge** with spring animation
- **Confetti effect** triggered when score > 70%

### Grade Thresholds

| Score   | Grade |
| ------- | ----- |
| 90-100% | A     |
| 80-89%  | B     |
| 70-79%  | C     |
| 60-69%  | D     |
| <60%    | F     |

### Question Review

- **Review mode** showing all questions
- **Correct answer** highlighted in green
- **User's answer** shown (correct or wrong)
- **Navigation** between questions

### Back Navigation

- **Back to Quiz List** → `/quiz`
- **Try Again** → starts new session with same settings

---

## Navigation & UX

### NProgress Loading Bar

- Shows on all route transitions
- Color: indigo theme
- Height: 3px
- Position: top of viewport

### Mode-Aware Back Navigation

| Mode     | Back Destination                                 |
| -------- | ------------------------------------------------ |
| Normal   | `/quiz?subject=X&chapter=Y`                      |
| Practice | `/quiz?subject=X` (back to practice mode select) |
| Timer    | `/quiz?subject=X` (back to timer mode select)    |

### Subject Display

- **Subject emoji** and **name** shown on quiz page header
- Loaded via lightweight `/api/v1/quiz/subjects/meta/:slug` endpoint

### URL Sync

- Question number syncs to URL during quiz play
- `?question=N` updated on each navigation
- URL preserved on refresh

---

## File Structure

### Frontend Files

```
apps/frontend/src/
├── app/quiz/
│   ├── page.tsx              # Quiz selection (subject/chapter/level/mode)
│   └── play/page.tsx        # Quiz play interface
├── components/quiz/
│   ├── QuestionCard.tsx      # Question display with options
│   ├── ResultsCelebration.tsx # Confetti and grade animation
│   └── ScoreCard.tsx        # Score display component
├── hooks/
│   └── useQuiz.ts           # Core quiz state management
├── lib/
│   ├── quiz-api.ts          # API calls
│   ├── quiz-resume.ts       # Session persistence functions
│   └── storage.ts           # LocalStorage utilities
└── types/
    └── quiz.ts              # TypeScript interfaces
```

### Backend Files

```
apps/backend/src/quiz/
├── quiz.controller.ts        # API endpoints
├── quiz.service.ts          # Business logic
└── quiz.module.ts           # Module definition
```

---

## State Management

### Quiz State Shape

```typescript
interface QuizState {
  questions: Question[];
  availableQuestions: Question[];
  sessionSize: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  score: number;
  timeRemaining: number;
  status: 'loading' | 'playing' | 'paused' | 'completed';
  startTime: number;
  sessionId: string;
  visited: Set<string>;
  manuallySkipped: Set<string>;
  dismissedUnvisited: boolean;
}
```

### Key Hooks

- `useQuiz()` - Main state management hook
- Returns actions: `selectAnswer`, `goToNext`, `goToPrevious`, `handleSkip`, `submitQuiz`, etc.
- Returns computed: `currentQuestion`, `progress`, `isFirstQuestion`, `isLastQuestion`, etc.

---

## API Endpoints

### Public Endpoints

| Endpoint                                | Description                    |
| --------------------------------------- | ------------------------------ |
| `GET /api/v1/quiz/subjects`             | List all subjects              |
| `GET /api/v1/quiz/subjects/:slug`       | Subject with chapters          |
| `GET /api/v1/quiz/subjects/meta/:slug`  | Lightweight subject name/emoji |
| `GET /api/v1/quiz/questions/:chapterId` | Published questions by chapter |
| `GET /api/v1/quiz/mixed`                | Random mixed questions         |
| `GET /api/v1/quiz/random/:level`        | Random questions by level      |

### Admin Endpoints

| Endpoint                        | Description       |
| ------------------------------- | ----------------- |
| `POST /api/v1/quiz/sessions`    | Save quiz session |
| `GET /api/v1/quiz/sessions/:id` | Get session by ID |

---

## Testing Checklist

### Core Flow

- [ ] Normal mode quiz plays correctly
- [ ] Practice mode quiz plays correctly
- [ ] Timer mode countdown works
- [ ] Pause/resume works in timer mode

### Session Persistence

- [ ] Session saved after answering question
- [ ] Session saved after skipping question
- [ ] Session saved after navigating
- [ ] Resume prompt appears on refresh
- [ ] Resume restores exact position and answers
- [ ] Start Fresh clears session
- [ ] No prompt after fresh start
- [ ] No prompt after submit

### Share Feature

- [ ] Share button copies correct URL
- [ ] Shared link lands on correct question
- [ ] Shared link has same session size
- [ ] Unvisited button shows on shared link
- [ ] `shared=true` prevents false unvisited on refresh

### Results

- [ ] Score displays correctly
- [ ] Count-up animation plays
- [ ] Grade badge shows
- [ ] Confetti triggers for >70%
- [ ] Question review works
