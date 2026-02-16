# Frontend Implementation Plan - Quiz Feature

**Scope:** Frontend-only implementation (localStorage-based)  
**Excludes:** Analytics (to be done after frontend completion), Backend API integration  
**Goal:** Complete quiz game functionality with localStorage persistence

---

## 📊 CURRENT STATE ANALYSIS

### ✅ Already Implemented

| Feature | Location | Status |
|---------|----------|--------|
| Subject Management (CRUD) | `admin/page.tsx` | ✅ Complete |
| Category Organization | `admin/page.tsx` + `QuizSidebar.tsx` | ✅ Complete |
| Drag-and-drop reordering | `QuizSidebar.tsx` | ✅ Complete |
| Question Management (CRUD) | `QuestionManagementSection.tsx` | ✅ Complete |
| Chapter assignment | `QuestionManagementSection.tsx` | ✅ Complete |
| Bulk CSV import | `QuestionManagementSection.tsx` | ✅ Complete |
| Status workflow (published/draft/trash) | `QuestionManagementSection.tsx` | ✅ Complete |
| Pagination (10 items) | `QuestionManagementSection.tsx` | ✅ Complete |
| Subject display on home page | `TopicSection.tsx` | ✅ Complete |
| Subject display on quiz page | `quiz/page.tsx` | ✅ Complete |
| Chapter selection page | `quiz/page.tsx` | ✅ Complete |
| Level selection page | `quiz/page.tsx` | ✅ Complete |
| Custom emoji/icons | `admin/page.tsx` + `TopicCard.tsx` | ✅ Complete |

### 🚧 MISSING (Need to Implement)

| Feature | Location | Priority |
|---------|----------|----------|
| **Quiz Play Page** | `quiz/play/page.tsx` | P0 - Critical |
| **Quiz Results Page** | `quiz/results/page.tsx` | P0 - Critical |
| **Quiz State Management** | `hooks/useQuiz.ts` | P0 - Critical |
| **Question Display Component** | `components/quiz/QuestionCard.tsx` | P0 - Critical |
| **Timer Functionality** | `components/quiz/QuizTimer.tsx` | P0 - Critical |
| **Score Tracking** | localStorage + state | P0 - Critical |
| **Answer Validation** | Quiz engine logic | P0 - Critical |
| **Progress Tracking** | localStorage | P1 - High |
| **Special Quiz Modes** | `/quiz/random`, `/quiz/challenge` | P1 - High |
| **Achievement System** | localStorage + UI | P2 - Medium |

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Core Quiz Engine (P0 - Critical)
**Goal:** Make the quiz actually playable

#### 1.1 Create Quiz Play Page
**File:** `apps/frontend/src/app/quiz/play/page.tsx`

```typescript
// URL: /quiz/play?subject=animals&chapter=Mammals&level=medium

// Features needed:
- [ ] Load questions from localStorage (filtered by subject/chapter/level/status)
- [ ] Display current question with A/B/C/D options
- [ ] Handle answer selection
- [ ] Show correct/wrong feedback (immediate or end-of-quiz)
- [ ] Navigate between questions (Previous/Next)
- [ ] Track selected answers
- [ ] Timer (countdown per question or total quiz)
- [ ] Score calculation (correct answers only, or with time bonus)
- [ ] Progress indicator (Question 3 of 10)
- [ ] Submit quiz and redirect to results
```

#### 1.2 Create Quiz Components

**`components/quiz/QuestionCard.tsx`**
```typescript
interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelectAnswer: (option: string) => void;
  showFeedback?: boolean; // Whether to show correct/wrong immediately
  isCorrect?: boolean;
  correctAnswer?: string;
}
```

**`components/quiz/AnswerOptions.tsx`**
```typescript
interface AnswerOptionsProps {
  options: { key: string; text: string }[]; // A, B, C, D with text
  selectedKey: string | null;
  correctKey?: string; // For feedback mode
  onSelect: (key: string) => void;
  disabled?: boolean;
  showFeedback?: boolean;
}
```

**`components/quiz/QuizTimer.tsx`**
```typescript
interface QuizTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isRunning: boolean;
  variant: 'per-question' | 'total';
}
```

**`components/quiz/ProgressBar.tsx`**
```typescript
interface ProgressBarProps {
  current: number;
  total: number;
}
```

**`components/quiz/QuizNavigation.tsx`**
```typescript
interface QuizNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
}
```

#### 1.3 Create Quiz Hook
**File:** `apps/frontend/src/hooks/useQuiz.ts`

```typescript
interface UseQuizReturn {
  // State
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>; // questionId -> selectedOption
  score: number;
  timeRemaining: number;
  status: 'loading' | 'playing' | 'paused' | 'completed';
  
  // Actions
  selectAnswer: (option: string) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  submitQuiz: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  
  // Computed
  currentQuestion: Question | null;
  progress: number; // 0-100
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
}

export function useQuiz(subject: string, chapter: string, level: string): UseQuizReturn;
```

#### 1.4 Quiz State Interface
```typescript
interface QuizSession {
  id: string; // UUID for the session
  subject: string;
  chapter: string;
  level: string;
  questions: Question[];
  answers: Record<number, string>;
  score: number;
  maxScore: number;
  startedAt: string;
  completedAt?: string;
  timeTaken: number; // in seconds
  status: 'in-progress' | 'completed' | 'abandoned';
}

// Storage: localStorage key 'aiquiz:current-session' (for resume)
// Storage: localStorage key 'aiquiz:quiz-history' (for completed)
```

---

### Phase 2: Quiz Results (P0 - Critical)
**Goal:** Show quiz results and allow review

#### 2.1 Create Results Page
**File:** `apps/frontend/src/app/quiz/results/page.tsx`

```typescript
// URL: /quiz/results?session=uuid

// Features:
- [ ] Display score summary (correct/total, percentage, grade)
- [ ] Show time taken
- [ ] Breakdown by difficulty (how many easy/medium/hard correct)
- [ ] Question review list:
  - Each question with user's answer
  - Whether it was correct
  - Correct answer shown
  - Option to expand for full question details
- [ ] Retry button (same quiz)
- [ ] Back to chapters button
- [ ] Share result (copy text to clipboard)
```

#### 2.2 Results Components

**`components/quiz/ScoreCard.tsx`**
```typescript
interface ScoreCardProps {
  score: number;
  total: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  timeTaken: number;
}
```

**`components/quiz/QuestionReview.tsx`**
```typescript
interface QuestionReviewProps {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  questionNumber: number;
}
```

**`components/quiz/PerformanceBreakdown.tsx`**
```typescript
interface PerformanceBreakdownProps {
  byDifficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
    expert: { correct: number; total: number };
  };
}
```

---

### Phase 3: Progress Tracking (P1 - High)
**Goal:** Track user progress across quizzes

#### 3.1 Progress Storage
**File:** `apps/frontend/src/lib/progress.ts`

```typescript
interface ChapterProgress {
  subject: string;
  chapter: string;
  attempts: number;
  bestScore: number;
  lastScore: number;
  averageScore: number;
  completed: boolean;
  lastAttemptAt: string;
}

interface SubjectProgress {
  subject: string;
  totalChapters: number;
  completedChapters: number;
  totalAttempts: number;
  bestScore: number;
  overallAccuracy: number;
}

// Storage keys:
// 'aiquiz:chapter-progress' -> Record<`${subject}:${chapter}`, ChapterProgress>
// 'aiquiz:subject-progress' -> Record<string, SubjectProgress>
// 'aiquiz:quiz-history' -> QuizSession[]
```

#### 3.2 Progress Utilities
```typescript
// lib/progress.ts
export function saveQuizResult(session: QuizSession): void;
export function getChapterProgress(subject: string, chapter: string): ChapterProgress | null;
export function getSubjectProgress(subject: string): SubjectProgress | null;
export function getQuizHistory(): QuizSession[];
export function clearQuizHistory(): void;
export function isChapterCompleted(subject: string, chapter: string): boolean;
export function getRecommendedChapters(subject: string): string[]; // Chapters with low scores
```

#### 3.3 Update Chapter Selection UI
**File:** `quiz/page.tsx - ChapterSelection component`

```typescript
// Add to ChapterInfo:
interface ChapterInfo {
  name: string;
  questionCount: number;
  levels: Set<string>;
  progress?: ChapterProgress; // Add progress data
}

// Display:
// - Show completion badge (✓) if chapter completed
// - Show best score badge
// - Show "Retry" or "Continue" button based on progress
```

#### 3.4 Update Home Page Stats
**File:** `components/home/StatsSection.tsx`

```typescript
// Replace static stats with dynamic:
- Total Quizzes Taken: From quiz-history
- Total Questions Answered: Calculate from history
- Accuracy Rate: Calculate from history
- Current Streak: Consecutive days with quizzes
- Best Score: From all completed quizzes
```

---

### Phase 4: Special Quiz Modes (P1 - High)
**Goal:** Add variety to quiz experience

#### 4.1 Random Quiz Mode
**File:** `apps/frontend/src/app/quiz/random/page.tsx`

```typescript
// URL: /quiz/random?count=20

// Features:
- [ ] Select question count (10, 20, 50)
- [ ] Random questions from ALL subjects
- [ ] Random difficulty mix
- [ ] Same quiz engine, different question source
```

#### 4.2 Challenge Mode
**File:** `apps/frontend/src/app/quiz/challenge/page.tsx`

```typescript
// URL: /quiz/challenge

// Features:
- [ ] Timed marathon (5 minutes)
- [ ] Answer as many as possible
- [ ] Lives system (3 wrong = game over)
- [ ] Increasing difficulty (easy → medium → hard → expert)
- [ ] Streak bonus (consecutive correct)
- [ ] High score tracking (localStorage)
- [ ] Leaderboard (local only)
```

#### 4.3 Practice Mode
**File:** `apps/frontend/src/app/quiz/practice/page.tsx`

```typescript
// URL: /quiz/practice?subject=X&chapter=Y

// Features:
- [ ] No timer
- [ ] No score pressure
- [ ] Show explanation immediately after answer
- [ ] Option to practice only missed questions
- [ ] Focus on learning
```

---

### Phase 5: Achievements (P2 - Medium)
**Goal:** Gamification elements

#### 5.1 Achievement System
**File:** `apps/frontend/src/lib/achievements.ts`

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: {
    type: 'quiz_count' | 'perfect_score' | 'streak' | 'chapter_complete' | 'subject_master';
    threshold: number;
  };
  unlockedAt?: string;
}

// Predefined achievements:
const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', condition: { type: 'quiz_count', threshold: 1 } },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Complete 10 quizzes', icon: '🏆', condition: { type: 'quiz_count', threshold: 10 } },
  { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on any quiz', icon: '💯', condition: { type: 'perfect_score', threshold: 1 } },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Complete a quiz in under 30 seconds', icon: '⚡', condition: { type: 'quiz_count', threshold: 1 } }, // With time filter
  { id: 'chapter-champion', name: 'Chapter Champion', description: 'Complete all questions in a chapter correctly', icon: '👑', condition: { type: 'chapter_complete', threshold: 1 } },
  { id: 'subject-expert', name: 'Subject Expert', description: 'Complete all chapters in a subject', icon: '🎓', condition: { type: 'subject_master', threshold: 1 } },
  { id: 'streak-master', name: 'Streak Master', description: 'Answer 10 questions correctly in a row', icon: '🔥', condition: { type: 'streak', threshold: 10 } },
  { id: 'persistence', name: 'Persistence', description: 'Retry a quiz 3 times', icon: '🔄', condition: { type: 'quiz_count', threshold: 3 } }, // Same chapter
];

// Storage: 'aiquiz:achievements' -> Record<string, Achievement>
```

#### 5.2 Achievement Notification
**File:** `components/quiz/AchievementPopup.tsx`

```typescript
// Show popup when achievement unlocked
// Play sound (optional)
// Confetti animation
```

#### 5.3 Achievement Page
**File:** `apps/frontend/src/app/achievements/page.tsx`

```typescript
// Grid of all achievements
// Show locked vs unlocked
// Progress bar for in-progress achievements
```

---

## 📁 FILE STRUCTURE (Target)

```
apps/frontend/src/
├── app/
│   ├── quiz/
│   │   ├── page.tsx                    # Subject selection (exists)
│   │   ├── play/
│   │   │   └── page.tsx               # NEW: Quiz play
│   │   ├── results/
│   │   │   └── page.tsx               # NEW: Quiz results
│   │   ├── random/
│   │   │   └── page.tsx               # NEW: Random quiz
│   │   ├── challenge/
│   │   │   └── page.tsx               # NEW: Challenge mode
│   │   └── practice/
│   │       └── page.tsx               # NEW: Practice mode
│   ├── achievements/
│   │   └── page.tsx                   # NEW: Achievement gallery
│   └── ... (existing pages)
├── components/
│   └── quiz/                          # NEW: Quiz-specific components
│       ├── QuestionCard.tsx
│       ├── AnswerOptions.tsx
│       ├── QuizTimer.tsx
│       ├── ProgressBar.tsx
│       ├── QuizNavigation.tsx
│       ├── ScoreCard.tsx
│       ├── QuestionReview.tsx
│       ├── PerformanceBreakdown.tsx
│       └── AchievementPopup.tsx
├── hooks/
│   └── useQuiz.ts                     # NEW: Quiz state management
├── lib/
│   ├── storage.ts                     # Exists
│   ├── progress.ts                    # NEW: Progress tracking
│   └── achievements.ts                # NEW: Achievement system
└── types/
    └── quiz.ts                        # NEW: Shared quiz types
```

---

## 📋 IMPLEMENTATION ORDER

### Week 1: Core Quiz (P0)
| Day | Task | Files |
|-----|------|-------|
| 1 | Create quiz types and interfaces | `types/quiz.ts` |
| 2 | Create `useQuiz` hook | `hooks/useQuiz.ts` |
| 3 | Create quiz components (QuestionCard, AnswerOptions) | `components/quiz/*.tsx` |
| 4 | Create quiz play page | `quiz/play/page.tsx` |
| 5 | Create results page + components | `quiz/results/page.tsx`, `ScoreCard.tsx`, `QuestionReview.tsx` |
| 6 | Add timer functionality | `QuizTimer.tsx`, integrate into play page |
| 7 | Polish and bug fixes | All quiz files |

### Week 2: Progress & Modes (P1)
| Day | Task | Files |
|-----|------|-------|
| 1 | Create progress utilities | `lib/progress.ts` |
| 2 | Update StatsSection with real data | `StatsSection.tsx` |
| 3 | Update ChapterSelection with progress | `quiz/page.tsx` |
| 4 | Create random quiz mode | `quiz/random/page.tsx` |
| 5 | Create challenge mode | `quiz/challenge/page.tsx` |
| 6 | Create practice mode | `quiz/practice/page.tsx` |
| 7 | Polish and bug fixes | All mode files |

### Week 3: Achievements & Polish (P2)
| Day | Task | Files |
|-----|------|-------|
| 1 | Create achievement system | `lib/achievements.ts` |
| 2 | Create achievement popup component | `AchievementPopup.tsx` |
| 3 | Create achievements page | `achievements/page.tsx` |
| 4 | Integrate achievements into quiz flow | `useQuiz.ts`, `quiz/play/page.tsx` |
| 5 | Add animations and polish | Various |
| 6 | Testing and bug fixes | All files |
| 7 | Performance optimization | All files |

---

## 🔧 TECHNICAL NOTES

### Question Type (Current - keep as is)
```typescript
interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // 'A', 'B', 'C', or 'D'
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
  status?: 'published' | 'draft' | 'trash';
  // Future: explanation?: string; (add when ready)
}
```

### localStorage Keys
```typescript
const STORAGE_KEYS = {
  // Existing
  SETTINGS: 'aiquiz:settings',
  SUBJECTS: 'aiquiz:subjects',
  QUESTIONS: 'aiquiz:questions',
  
  // NEW
  CURRENT_SESSION: 'aiquiz:current-session',  // For quiz resume
  QUIZ_HISTORY: 'aiquiz:quiz-history',        // Completed quizzes
  CHAPTER_PROGRESS: 'aiquiz:chapter-progress',
  SUBJECT_PROGRESS: 'aiquiz:subject-progress',
  ACHIEVEMENTS: 'aiquiz:achievements',
  CHALLENGE_HIGH_SCORE: 'aiquiz:challenge-high-score',
};
```

### Quiz Flow
```
1. User selects subject → /quiz?subject=animals
2. User selects chapter → /quiz?subject=animals&chapter=Mammals
3. User selects level → /quiz?subject=animals&chapter=Mammals&level=medium
4. Start quiz → /quiz/play?subject=animals&chapter=Mammals&level=medium
5. Complete quiz → /quiz/results?session=uuid
6. Retry or choose new chapter
```

---

## ✅ ACCEPTANCE CRITERIA

### Quiz Play
- [ ] Can start quiz from chapter/level selection
- [ ] Questions load from localStorage correctly
- [ ] Can select answers (A/B/C/D)
- [ ] Can navigate between questions
- [ ] Timer works (counts down)
- [ ] Score calculates correctly
- [ ] Submit quiz shows results

### Results
- [ ] Score displayed correctly
- [ ] Can review all questions
- [ ] Can see correct vs wrong answers
- [ ] Can retry same quiz
- [ ] Progress saved to localStorage

### Progress Tracking
- [ ] Chapter completion tracked
- [ ] Best scores saved
- [ ] Home page stats updated
- [ ] Chapter badges shown (completed/in-progress)

### Modes
- [ ] Random quiz works
- [ ] Challenge mode works with lives
- [ ] Practice mode works (no timer)

---

## 🚫 OUT OF SCOPE (Analytics Phase Later)

1. **Backend API integration** - Keep using localStorage
2. **User authentication** - Local progress only
3. **Real-time sync** - Single user only
4. **Detailed analytics** - To be done in analytics phase
5. **Question explanations** - Add field later when content ready
6. **Image-based questions** - Future enhancement

---

*Plan Created: 2026-02-16*  
*Focus: Frontend-only, localStorage-based quiz functionality*  
*Excludes: Analytics, Backend API, Real-time features*
