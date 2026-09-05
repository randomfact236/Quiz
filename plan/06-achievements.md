# Feature 06 — Achievements (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30; **re-audited + E2E-tested 2026-09-05** (unlocks seeded via the sync endpoint for guest `e2e-achiever`). **No archived ledger doc existed for this feature**
> (`docs/features/archive/` has no achievements file) — this file is built entirely from current code.

---

## 1. File inventory

Backend (apps/backend/src/achievements/) — **BUILT 2026-08-30, re-verified 2026-09-05** (the original 'backend: none' claim predates P1 #3):

| File                                                    | Purpose                                                                                                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `achievements.module.ts` + `achievements.controller.ts` | `POST /achievements/sync` (idempotent upsert, optional JWT/guest attribution, 20/min) + `GET /achievements/unlocks`                                                    |
| `achievements.service.ts`                               | Upsert with earlier-timestamp-wins; **2026-09-05: drops unknown achievement ids** against a mirror of the client id list (buggy clients can't accumulate garbage rows) |
| `entities/achievement-unlock.entity.ts`                 | `user_achievements`: UNIQUE (userId                                                                                                                                    | guestId, achievementId), unlockedAt |
| `dto/sync-achievements.dto.ts`                          | Batch (max 100) of {achievementId, unlockedAt} + guestId                                                                                                               |

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

## 2. The 10 achievements and how they actually evaluate (verified against the evaluator)

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

## 3. Current status (verified)

**Done:** complete client-side unlock store with timestamps; 10 achievements defined; evaluation + toast wiring on quiz-mcq AND riddle-mcq completion; `/achievements` page with progress bars and locked/unlocked styling; committed `achievement_unlocked` analytics events per unlock; **server-side sync built and verified** (idempotent upsert with user/guest attribution + unlocks readback).

**Remaining gaps (2026-09-05):** image-riddles completions still don't feed achievements (owner decision on semantics — see P1 #1); localStorage remains the live source of truth with the server as a fire-and-forget mirror (no read-back/re-hydration path yet — unlocks synced from another device won't appear locally).

## 4. Task breakdown

### P0 — critical / broken

- None open. The system doesn't crash or corrupt data; it just under-delivers (see P1/P2).

### P1 — major gaps

- [x] **Riddle-mcq completions wired into `checkAchievements`** — DONE in the feature-03 pass (commit `ea2098e`): combined quiz+riddle history feeds the evaluator; chapter-scoped conditions skip blank-chapter riddles. **Image-riddles: needs owner decision** — a solved image riddle is not a scored quiz session; feeding them as 1-question perfect sessions would cheapen quiz_count/perfect_score. Wire once the semantics are decided.
- [x] **Streak tracker** — DONE in the feature-02 pass (commit `7b57f2f`): `lib/challenge-streak.ts` (consecutive correct in challenge mode, persistent best) feeds the previously-dead `streak` case.
- [x] **Server-side persistence** — BUILT 2026-08-30 (code-complete; live probe pending DB restore — see anomalies): `user_achievements` table (migration `1789200000000`, UNIQUE attribution+achievementId), new `AchievementsModule` with `POST /achievements/sync` (idempotent upsert, earlier timestamps win) + `GET /achievements/unlocks`; `unlockAchievement` mirrors unlocks fire-and-forget (guestId or user attribution).

### P2 — integration / quality

- [x] **`chapter_complete` evaluator fixed** — DONE in the feature-02 pass (commit `88f1964`): counts DISTINCT chapters with a perfect session (was an exact Perfect Score duplicate).
- [x] **`subject_explore` semantics** — VERIFIED ALREADY MATCHES 2026-08-30: the description says "complete at least one chapter", and `saveQuizResult` defines chapter completion as `score > 0` — so counting subjects with any positive-score session IS chapter-completion counting. Documented in the evaluator; no behavior change available to make.
- [x] **Progress math for every condition** — DONE 2026-08-30: `getAchievementProgress` now computes speed_run (fastest run vs target), chapter_complete (distinct perfect chapters), streak (tracker best), retry (max attempts per chapter) on the combined history; 6 new tests.
- [x] Analytics parity — RESOLVED 2026-09-05 (supersedes the deferral): `achievement_unlocked` is committed in both engines.
- [x] **Dedicated evaluator tests** — DONE 2026-08-30: `__tests__/achievements.test.ts` (9 tests: conditions + progress math) plus riddle-integration cases in `riddle-progress.test.ts`.

### P3 — polish / tech debt

- [x] **`RIDDLE_ACHIEVEMENTS` key removed** — DONE 2026-08-30 (was unreferenced outside `lib/storage.ts`).
- [x] **Accuracy Expert description aligned** — DONE 2026-08-30: now reads "Keep a 90%+ all-time average over 10 quizzes", matching the all-time-average check.
- [x] **Chapter Champion vs Perfect Score** — RESOLVED by the P2 fix (they diverge: distinct perfect chapters vs any perfect quiz); both stay.
- [x] **Hardcoded achievements list** — ACCEPTED 2026-08-30: 9 stable definitions; a backend-config move only pays off with per-tenant or frequently-tuned gamification. Revisit if gamification grows.

## 5. Cross-feature touchpoints

- **MCQ Quiz + Riddle MCQ** — unlock triggers (`saveToHistory` / riddle submit); source of the committed `achievement_unlocked` events.
- **Riddle MCQ** — wired (combined evaluator); **Image Riddles** — not wired (owner decision on semantics, P1 #1).
- **Analytics** — `achievement_unlocked` events (committed) with module `quiz-mcq`.
- **User Accounts** — server-side attribution exists: unlocks attribute to the JWT user or the guest id, synced via `POST /achievements/sync`. Cross-device re-hydration (server → localStorage) is not built.

## 6. Extras (2026-09-05 audit — noted, not acted on)

- **Seeded test data:** guest `e2e-achiever` holds first-steps, speed-demon, accuracy-expert
  (synced via the endpoint) — kept for manual checks. Two underscore-id junk rows from a bad
  probe were deleted; the sync now drops unknown ids server-side (new allowlist mirrors the
  client list — keep the two in sync if achievements ever change).
- **Server→client re-hydration not built:** the sync is one-way (client → server). If
  cross-device continuity matters, `GET /achievements/unlocks` should merge into localStorage on
  login — small follow-up, needs an owner nod.
- **Image-riddles semantics decision still open** (P1 #1) — the last unwired content module.
