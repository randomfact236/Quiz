# Quiz Session Persistence Rewrite Plan

## Overview

Complete rewrite of quiz session persistence to fix accumulated issues from incremental fixes. Single decision point on mount. No async conflicts. sessionRef set BEFORE setState.

---

## Step 1: Read Files First

- `src/hooks/useQuiz.ts`
- `src/app/quiz/play/page.tsx`
- `src/lib/quiz-resume.ts`

---

## Step 2: What to REMOVE

### From `useQuiz.ts`:

| Item                              | Line Numbers | Notes                                                                                     |
| --------------------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `showResumePrompt` state          | ~193         | Remove                                                                                    |
| `pendingResumeState` state        | ~194         | Remove                                                                                    |
| `resetKey` state                  | ~197         | Remove                                                                                    |
| `isResumingRef` ref               | ~171         | Remove                                                                                    |
| Effect 1 resume check block       | ~202-210     | Remove entire if block                                                                    |
| `handleResumeSession` function    | ~483-512     | Remove entirely                                                                           |
| `handleStartFresh` function       | ~520-524     | Remove entirely                                                                           |
| Save effect                       | ~442-477     | Remove entirely                                                                           |
| `clearQuizResume()` in submitQuiz | ~410         | Remove this call                                                                          |
| Resume exports                    | ~650-655     | showResumePrompt, pendingResumeState, handleResumeSession, handleStartFresh, triggerReset |

### From `play/page.tsx`:

| Item                     | Line Numbers | Notes           |
| ------------------------ | ------------ | --------------- |
| Resume prompt UI JSX     | ~211-253     | Remove entirely |
| `clearQuizResume` import | ~23          | Remove          |

---

## Step 3: What to ADD (Clean Rewrite)

### Design Principle

```
Single decision point on mount.
No async conflicts.
sessionRef set BEFORE setState.
Effect 1 NEVER runs for resumed session.
```

---

### A. `mountDecisionRef` — One-time mount decision (useRef, runs once)

**Location:** In useQuiz.ts, after sessionRef declaration (~line 167)

```typescript
const mountDecisionRef = useRef<{
  resumeSession: QuizResumeState | null;
  startIndex: number;
  sessionSize: number;
  isShared: boolean;
} | null>(null);

if (mountDecisionRef.current === null) {
  const isShared = isSharedLink ?? false;
  let resumeSession: QuizResumeState | null = null;

  if (!isShared) {
    const saved = loadQuizResume();
    const currentMode = type ? `${mode}_${type}` : (mode ?? 'normal');
    if (saved && isQuizResumeMatch(saved, subject, chapter, level, currentMode)) {
      resumeSession = saved;
    }
  }

  mountDecisionRef.current = {
    resumeSession,
    startIndex: isShared
      ? startFromShare
        ? startFromShare - 1
        : 0
      : resumeSession
        ? resumeSession.currentQuestionIndex
        : 0,
    sessionSize: isShared ? initialTotal || 10 : resumeSession ? resumeSession.sessionSize : 10,
    isShared,
  };
}
```

---

### B. Resume prompt state (simple)

**Location:** After mountDecisionRef (~after line ~185)

```typescript
const [showResumePrompt] = useState(() => mountDecisionRef.current?.resumeSession !== null);
const [pendingResumeState] = useState(() => mountDecisionRef.current?.resumeSession ?? null);
```

---

### C. Effect 1 — NEVER runs for resume

**Location:** Replace existing Effect 1 (~line 199)

```typescript
useEffect(() => {
  if (mountDecisionRef.current?.resumeSession) return;

  const controller = new AbortController();

  const load = async () => {
    if (controller.signal.aborted) return;

    const { all, total } = await loadQuestions(subject, chapter, level);
    if (controller.signal.aborted) return;

    setOriginalTotal(total);

    if (all.length === 0) {
      setState((prev) => ({ ...prev, status: 'completed' }));
      return;
    }

    const decision = mountDecisionRef.current!;
    const initialQuestions = all.slice(0, decision.sessionSize);

    sessionRef.current = {
      id: generateUUID(),
      subject,
      subjectName: subject,
      chapter,
      level,
      questions: initialQuestions,
      answers: {},
      score: 0,
      maxScore: initialQuestions.length,
      startedAt: new Date().toISOString(),
      timeTaken: 0,
      status: 'in-progress',
    };

    const initialVisited = new Set<string>();
    const startQ = initialQuestions[decision.startIndex];
    if (startQ) initialVisited.add(startQ.id);

    setState((prev) => ({
      ...prev,
      availableQuestions: all,
      questions: initialQuestions,
      sessionSize: decision.sessionSize,
      currentQuestionIndex: decision.startIndex,
      answers: {},
      score: 0,
      timeRemaining: timeLimit || 0,
      status: 'playing',
      startTime: Date.now(),
      sessionId: sessionRef.current!.id,
      visited: initialVisited,
      manuallySkipped: new Set<string>(),
      dismissedUnvisited: false,
    }));

    saveCurrentSession(sessionRef.current);
  };

  load();
  return () => controller.abort();
}, [subject, chapter, level]);
// NO resetKey, NO isSharedLink, NO mode, NO type in deps
```

---

### D. handleResumeSession — clean, sets sessionRef FIRST

**Location:** After Effect 1 (~after line 260)

```typescript
const handleResumeSession = useCallback(() => {
  const saved = pendingResumeState;
  if (!saved) return;

  const newId = generateUUID();
  sessionRef.current = {
    id: newId,
    subject: saved.subject,
    subjectName: saved.subject,
    chapter: saved.chapter,
    level: saved.level,
    questions: saved.availableQuestions.slice(0, saved.sessionSize),
    answers: saved.answers,
    score: saved.score,
    maxScore: saved.sessionSize,
    startedAt: saved.startedAt,
    timeTaken: 0,
    status: 'in-progress',
  };

  setState((prev) => ({
    ...prev,
    availableQuestions: saved.availableQuestions,
    questions: saved.availableQuestions.slice(0, saved.sessionSize),
    sessionSize: saved.sessionSize,
    currentQuestionIndex: saved.currentQuestionIndex,
    answers: saved.answers,
    score: saved.score,
    manuallySkipped: new Set(saved.manuallySkipped),
    status: 'playing',
    startTime: Date.now(),
    sessionId: newId,
    visited: new Set(Object.keys(saved.answers)),
    timeRemaining: timeLimit || 0,
  }));

  setShowResumePrompt(false);
  saveCurrentSession(sessionRef.current);
}, [pendingResumeState, timeLimit]);
```

---

### E. handleStartFresh — clean

**Location:** After handleResumeSession (~after line 290)

```typescript
const handleStartFresh = useCallback(() => {
  clearQuizResume();
  setShowResumePrompt(false);
  mountDecisionRef.current = {
    resumeSession: null,
    startIndex: 0,
    sessionSize: 10,
    isShared: false,
  };
}, []);
```

---

### F. Save effect — clean, saves after real interaction

**Location:** After handleStartFresh (~after line 300)

```typescript
useEffect(() => {
  if (state.status !== 'playing') return;
  if (state.availableQuestions.length === 0) return;
  if (
    Object.keys(state.answers).length === 0 &&
    state.manuallySkipped.size === 0 &&
    state.currentQuestionIndex === 0
  )
    return;

  const currentMode = type ? `${mode}_${type}` : (mode ?? 'normal');

  saveQuizResume({
    subject,
    chapter,
    level,
    mode: currentMode as QuizResumeState['mode'],
    currentQuestionIndex: state.currentQuestionIndex,
    sessionSize: state.sessionSize,
    answers: state.answers,
    score: state.score,
    manuallySkipped: Array.from(state.manuallySkipped),
    availableQuestions: state.availableQuestions,
    savedAt: Date.now(),
    startedAt: new Date(state.startTime).toISOString(),
  });
}, [
  state.currentQuestionIndex,
  state.answers,
  state.manuallySkipped,
  state.sessionSize,
  state.status,
]);
```

---

### G. Export from return object

**Location:** In return statement (~line 636)

```typescript
showResumePrompt,
pendingResumeState,
handleResumeSession,
handleStartFresh,
```

---

### H. Resume prompt UI in play/page.tsx

**Location:** Before loading check (~line 211)

```typescript
if (quiz.showResumePrompt && quiz.pendingResumeState) {
  const saved = quiz.pendingResumeState;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-2">Resume Quiz?</h2>
        <p className="text-gray-600 mb-1">
          You have an unfinished session from earlier.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Question <strong>{saved.currentQuestionIndex + 1}</strong> of{' '}
          <strong>{saved.sessionSize}</strong> —{' '}
          <strong>{Object.keys(saved.answers).length}</strong> answered
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              quiz.handleStartFresh();
              setHasStarted(false);
            }}
            className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
          >
            Start Fresh
          </button>
          <button
            onClick={() => {
              quiz.handleResumeSession();
              setHasStarted(true);
            }}
            className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Resume Q{saved.currentQuestionIndex + 1}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### I. Remove clearQuizResume import from page.tsx

**Location:** ~line 23

```typescript
// REMOVE: import { clearQuizResume } from '@/lib/quiz-resume';
```

---

## Step 4: Implementation Order

1. **`useQuiz.ts`** — Remove old resume code first
2. **`play/page.tsx`** — Remove old resume UI
3. **`useQuiz.ts`** — Add mountDecisionRef and new resume logic
4. **`play/page.tsx`** — Add new resume prompt UI

---

## Step 5: What Must NOT Change (Existing Features)

- Normal quiz play flow
- Share feature (handleShare, URL sync)
- Skipped questions button
- Unvisited questions button (shared links)
- Add more questions feature
- Timer behavior (total/per-question)
- Pause/resume quiz
- Go to next/previous navigation
- Submit quiz flow
- Quiz results page

---

## Step 6: Testing Checklist

| #   | Scenario                                    | Expected                        |
| --- | ------------------------------------------- | ------------------------------- |
| 1   | Fresh quiz → answer Q1 → navigate → refresh | Resume prompt: "Q2, 1 answered" |
| 2   | Click Resume                                | Continues from Q2 with answer   |
| 3   | Click Start Fresh                           | Pre-quiz screen                 |
| 4   | Start Quiz                                  | Fresh from Q1                   |
| 5   | Answer all → Submit                         | Results page                    |
| 6   | After submit → refresh                      | No resume prompt                |
| 7   | Shared link ?question=6&shared=true         | Lands on Q6                     |
| 8   | Add 5 questions → refresh                   | Resumes with correct count      |
| 9   | Skip Q3 → refresh                           | Q3 still skipped                |
| 10  | Timer mode → refresh                        | Resumes correctly               |
| 11  | Practice mode → refresh                     | Resumes correctly               |

---

## Step 7: Rollback Plan

If something breaks:

1. Revert to previous working commit
2. Run `docker-compose up -d --build frontend`
3. Test scenarios 1-4 first
4. If basic flow works, incrementally test others

**Previous working state:** Before the incremental fixes (resetKey, isResumingRef, etc.)

---

## Step 8: Build and Test

```bash
npx tsc --noEmit --skipLibCheck
docker-compose up -d --build frontend
```

Test in incognito/private window to avoid cache issues.
