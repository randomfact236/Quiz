# Feature 06 — Achievements (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

---

## 1. File inventory

Backend (apps/backend/src/achievements/) (built in P1 #3):

| File                                                    | Purpose                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `achievements.module.ts` + `achievements.controller.ts` | `POST /achievements/sync` (idempotent upsert, optional JWT/guest attribution, 20/min) + `GET /achievements/unlocks`                                        |
| `achievements.service.ts`                               | Upsert with earlier-timestamp-wins; **drops unknown achievement ids** against a mirror of the client id list (buggy clients can't accumulate garbage rows) |
| `entities/achievement-unlock.entity.ts`                 | `user_achievements`: UNIQUE (userId                                                                                                                        | guestId, achievementId), unlockedAt |
| `dto/sync-achievements.dto.ts`                          | Batch (max 100) of {achievementId, unlockedAt} + guestId                                                                                                   |

Frontend (`apps/frontend/src/`):

| File                            | Purpose                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/achievements.ts`           | The whole system: 10 predefined achievements, unlock store (`aiquiz:achievements`, record of id → {…, unlockedAt}), condition evaluator (`checkAchievements`), per-achievement progress calc, stats, unlock toasts |
| `app/achievements/page.tsx`     | `/achievements` page — all achievements with unlock state (gold vs gray), progress bars, stats header                                                                                                              |
| `types/quiz-mcq.ts`             | `Achievement` type (id, name, description, icon, condition: type + threshold)                                                                                                                                      |
| `lib/progress.ts`               | Data source: `getQuizHistory()` (localStorage `aiquiz:quiz-history`), `getTotalStats()` (totalQuizzes, averageScore, day-streak), `saveQuizResult` + chapter/subject progress                                      |
| `hooks/useQuizMcq.ts`           | **The only evaluation trigger** — `saveToHistory` → `checkAchievements()` → `toastAchievementUnlocks()` on quiz-mcq completion; uncommitted `track('achievement_unlocked', …)` events                              |
| `lib/storage.ts`                | Keys: `ACHIEVEMENTS` (`aiquiz:achievements`); **`RIDDLE_ACHIEVEMENTS` (`aiquiz:riddle-achievements`) exists but is used nowhere**                                                                                  |
| `__tests__/useQuizMcq.test.tsx` | Asserts `toastAchievementUnlocks` is called on completion (mocked) — **no dedicated achievements test suite**                                                                                                      |

## 2. The 10 achievements and how they actually evaluate

| Achievement      | Declared condition  | Actual evaluator behavior                                                                            |
| ---------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| First Steps      | quiz_count ≥ 1      | ✅ correct (history length)                                                                          |
| Quiz Enthusiast  | quiz_count ≥ 10     | ✅ correct                                                                                           |
| Quiz Master      | quiz_count ≥ 50     | ✅ correct                                                                                           |
| Perfect Score    | perfect_score ≥ 1   | ✅ correct (score === maxScore)                                                                      |
| Speed Demon      | speed_run < 30s     | ✅ works (threshold = seconds; any quiz ≤ 30s with maxScore > 0)                                     |
| Chapter Champion | chapter_complete    | ⚠️ **mis-evaluated** — checks perfect _quizzes_ (identical to Perfect Score), not chapter completion |
| Subject Explorer | subject_explore ≥ 5 | ⚠️ loose — counts subjects with score **> 0** (any correct answer), not "complete a chapter"         |
| Streak Master    | streak ≥ 10         | ❌ **dead** — evaluator is an empty `case`; can never unlock                                         |
| Persistence      | retry ≥ 3           | ✅ works (chapters with 3+ attempts in history)                                                      |
| Accuracy Expert  | accuracy ≥ 90       | ⚠️ loose — uses all-time `averageScore` ≥ 90 with ≥ 10 quizzes, not a "maintain 90%+" window         |

`getAchievementProgress` has real progress math only for quiz_count, perfect_score, accuracy, subject_explore; all other types fall to `default: unlocked ? 100 : 0` (no intermediate progress shown for Speed Demon, Chapter Champion, Streak Master, Persistence).

## 3. Current status

**Done:** complete client-side unlock store with timestamps; 10 achievements defined; evaluation + toast wiring on quiz-mcq AND riddle-mcq completion; `/achievements` page with progress bars and locked/unlocked styling; committed `achievement_unlocked` analytics events per unlock; **server-side sync built and verified** (idempotent upsert with user/guest attribution + unlocks readback).

**Remaining gaps:** image-riddles completions still don't feed achievements (owner decision on semantics — see P1 #1); localStorage remains the live source of truth with the server as a fire-and-forget mirror (no read-back/re-hydration path yet — unlocks synced from another device won't appear locally).

## 4. Task breakdown

### P0 — critical / broken

- None open. The system doesn't crash or corrupt data; it just under-delivers (see P1/P2).

### P1 — major gaps

- [x] **Riddle-mcq completions wired into `checkAchievements`** — **open decision:** image-riddle completions → achievements semantics (a solved riddle isn't a scored session; 1-question perfect sessions would cheapen quiz_count/perfect_score).
- [x] **Streak tracker**
- [x] **Server-side persistence**

### P2 — integration / quality

- [x] **`chapter_complete` evaluator fixed**
- [x] **`subject_explore` semantics**
- [x] **Progress math for every condition**
- [x] Analytics parity
- [x] **Dedicated evaluator tests**

### P3 — polish / tech debt

- [x] **`RIDDLE_ACHIEVEMENTS` key removed**
- [x] **Accuracy Expert description aligned**
- [x] **Chapter Champion vs Perfect Score**
- [x] **Hardcoded achievements list**
- [ ] Server→client re-hydration not built — sync is one-way (client → server); merge `GET /achievements/unlocks` into localStorage on login if cross-device continuity matters.

## 5. Cross-feature touchpoints

- **MCQ Quiz + Riddle MCQ** — unlock triggers (`saveToHistory` / riddle submit); source of the committed `achievement_unlocked` events.
- **Riddle MCQ** — wired (combined evaluator); **Image Riddles** — not wired (owner decision on semantics, P1 #1).
- **Analytics** — `achievement_unlocked` events (committed) with module `quiz-mcq`.
- **User Accounts** — server-side attribution exists: unlocks attribute to the JWT user or the guest id, synced via `POST /achievements/sync`. Cross-device re-hydration (server → localStorage) is not built.
