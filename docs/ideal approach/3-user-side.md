# User-Side Quiz Implementation
## Quiz Pages - Current Implementation

---

## 1. Overview

**Note:** This documents the **actual implementation** in `apps/frontend/src/`.

User-facing quiz pages are separate from admin panel.

---

## 2. Actual File Structure

```
apps/frontend/src/
├── app/
│   ├── quiz/
│   │   ├── page.tsx                    # Quiz home
│   │   ├── challenge/page.tsx          # Challenge mode
│   │   ├── practice/page.tsx          # Practice mode
│   │   ├── play/page.tsx              # Play page
│   │   ├── timer-challenge/page.tsx    # Timed challenge
│   │   └── results/page.tsx            # Results page
│   └── riddle-mcq/
│       ├── page.tsx                    # Riddle MCQ home
│       ├── challenge/page.tsx
│       ├── practice/page.tsx
│       ├── play/page.tsx
│       └── results/page.tsx
├── components/quiz/
│   ├── QuizTimer.tsx                  # Timer display (131 lines)
│   ├── QuizNavigation.tsx             # Navigation controls
│   └── (other quiz components)
└── hooks/
    └── useQuiz.ts                    # Quiz state hook
```

---

## 3. Actual QuizTimer (Components)

```typescript
// apps/frontend/src/components/quiz/QuizTimer.tsx
interface QuizTimerProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  variant?: 'bar' | 'circle' | 'minimal';
}

export function QuizTimer({
  timeRemaining,
  totalTime,
  isRunning: _isRunning,
  variant = 'bar',
}): JSX.Element {
  // Warning at 30s, Critical at 10s
  // Variants: bar (default), circle, minimal
}
```

---

## 4. Quiz Levels (Shared with Admin)

```typescript
type QuestionLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
```

| Level | Options | Description |
|-------|---------|-------------|
| easy | 2 | True/False |
| medium | 2 | 2 choice |
| hard | 3 | 3 choice |
| expert | 4 | 4 choice |
| extreme | 0 | Open answer |

---

## 5. Actual Public Quiz API Endpoints

```typescript
// apps/frontend/src/lib/quiz-api.ts

// Get questions by subject (PUBLIC - published only)
async function getQuestionsBySubject(
  subjectSlug: string,
  filters: { status?, level?, chapter?, search? },
  page: number,
  limit: number
): Promise<{ data: QuizQuestion[]; total: number }>

// Get random questions by level (PUBLIC)
async function getRandomQuestions(
  level: string,
  count: number
): Promise<QuizQuestion[]>

// Get mixed random questions (PUBLIC)
async function getMixedQuestions(count: number): Promise<QuizQuestion[]>

// Get chapters by subject
async function getChaptersBySubject(subjectId: string): Promise<QuizChapter[]>
```

---

## 6. Quiz Modes (Actual)

| Mode | Timer | Immediate Feedback | Notes |
|------|-------|-------------------|-------|
| Challenge | Yes | No | Competitive |
| Practice | No | Yes | Learning focused |
| Play | No | No | General |
| Timer Challenge | Yes | No | Extended time |

---

## 7. NOT Implemented (Future Considerations)

| Feature | Priority | Notes |
|---------|----------|-------|
| Leaderboard | Low | Global rankings |
| Achievements | Low | Badges system |
| Progress tracking | Medium | Store results |
| Social sharing | Low | Share results |

---

## 8. Related Documents

- [Master Plan](./0-master-plan.md)
- [Backend Implementation](./1-backend.md)
- [Admin Panel Implementation](./2-admin-panel.md)
