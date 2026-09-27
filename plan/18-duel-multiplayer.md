# Feature 18 — Duels / Multiplayer (Web-first, all content)

> **Phase basis:** P0 = critical/broken · P1 = major gap · P2 = integration/quality · P3 = polish
> (see `plan/STANDARDS.md` §1). Owner request 2026-09-27: "duel needs proper planning, for
> quiz, riddle and games too." Supersedes the piecemeal work tracked in QA-FINDINGS **NOW-27**.
> Status: **PLAN — Phase 0 shipped** (see §7). Everything below is the agreed scope.

---

## 1. What exists today (baseline, 2026-09-27)

| Layer            | State                                                                                                                                                                                                                     | Where                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Backend duels    | Frozen question set, 6-char code, **server-side grading**, DB-clock duration, 10-min TTL, 30-s silence rule, presence, guest-token guards                                                                                 | `apps/backend/src/duels/*` (commit b081423) |
| Frontend `/duel` | Lobby → create → share link → name gate → race → result with live opponent + poll-until-finish + resume; noindex; in nav + Play Hub                                                                                       | `app/duel/page.tsx` (63b0e18)               |
| Quiz levels      | All 5 (easy…extreme); extreme is open-ended                                                                                                                                                                               | duel page + `duels-public.controller.ts`    |
| Security         | Answers never leave the server; guest token on all writes (CORS fixed 69c6df4)                                                                                                                                            | `duels.service.ts`, `main.ts`               |
| **Gaps**         | No content type beyond quiz · no subject picker · no riddles · no games · plain question UI (doesn't reuse `QuestionCard`/`AnswerOptions`) · no explanations/timer/auto-advance in duel · no backend tests for the module | —                                           |

## 2. Content families in scope

| Family                      | Live-duel fit                          | Grading                          | Phase                             |
| --------------------------- | -------------------------------------- | -------------------------------- | --------------------------------- |
| **Quiz MCQ** (5 levels)     | ✅ today                               | letter (server)                  | 0/1                               |
| **Text riddles** (4 levels) | ✅ same engine + content type          | open answer, tolerant match      | 2                                 |
| **Image riddles**           | ✅ rides the riddle path (image shown) | open answer                      | 2                                 |
| **Arcade games (8)**        | ⚠️ **not** the question-list engine    | client-run, server-stored result | 3 (async links) / 4 (live, gated) |

## 3. Shared duel experience (the "complete feel")

**Mode alignment (owner decision 2026-09-27): the duel player IS the timer-challenge pace.**
Solo quiz play already has both paces on one screen (`/quiz-mcq/play?mode=timer|practice`) and
riddles the same (`/riddle-mcq/play?mode=timer|practice`, `RiddleCard` takes `timeRemaining`).
Duel v1 = **timer mode** (per-question countdown + auto-advance + reveal); practice/untimed is
not a duel pace (a duel is a race). An "untimed duel" lobby toggle can come later if wanted.

Implementation: extract the timer-mode flow out of `quiz-mcq/play/page.tsx` (858 lines) into a
shared flow component/hook so `/quiz-mcq/play` and `/duel` render the SAME flow — not a third
parallel copy that drifts. Riddle duels (phase 2) likewise render `RiddleCard` in its timer mode.

Every duel family then gets, for free, what solo play already has:

- Question card + `AnswerOptions` (2/3/4-col grid, open-answer input for open tiers)
- Per-question timer + auto-advance pacing with reveal, comments-cancels-advance (BUG-040)
- Instant green/red feedback + **stored explanation** where one exists (NOW-06)
- Progress %, streak, skip; per-question **like · comment · share** row (the same one solo uses)
- Results: both scores, durations, per-question review ("replay both answers"), win/tie/draw
- Phone-first layout identical to solo play; the lobby + live opponent progress bar are the
  only duel-specific screens

## 4. Match model (backend changes)

```
duel_matches:  + content_type varchar(16)   'quiz' | 'riddle'   (default 'quiz')
                + subject_id  uuid | null                     (quiz subject filter; riddle category)
                + mode        varchar(16)   'race' (default) | 'async'  (game challenges)
                + payload     jsonb        frozen ids OR { seed, board, run } for game challenges
                + invite_token varchar(20) unique | null       (link-friendly for games)
```

- One frozen set per match; `gradeAnswer` already branches letter ↔ open answer
- Riddle open-answer matching: trim + case-fold + alias list (owner's thresholds), tolerant
  substring match as a documented follow-up
- Async challenges: POST run result (score, seed, duration) → token; GET /duels/challenges/:token
  returns the challenger run; no live match row needed beyond a lightweight record
- Reconnect: widen the silence rule (30 s → 90 s) and treat a lapsed poll as **stalled** (not
  voided) for 3 minutes before abandonment

## 5. Invite + discovery (the actual product surface)

- **Lobby:** family chips (Quiz · Riddles) → level chips (family-specific) → subject/category
  picker (optional filter; all = default) → name → Create
- **Waiting:** big code, `navigator.share` + copy (done), **QR code** (offline-generated, so a
  friend scans on the spot at the same table), live "waiting…" state, cancel/leave
- **Discovery:** nav (done), Play Hub card (done), quiz results screen ("Race your score"),
  home "Friends" strip when the player has a pending invite
- **Sharing:** per-family share text (score line for quiz/riddle; run line for games)

## 6. Per-family specifics

**Quiz** — subject picker; explanations where stored; extremes as open-answer (done).
**Riddles** — category picker; hint cost tracked and shared in results; open-answer grading with
aliases; share text “I cracked N riddles — beat me”.
**Image riddles** — show the image, typed answer, alias matching; identical flow to riddles.
**Games (async, v1)** — deterministic seeds everywhere they exist (sliding daily, word seeded
generator, memory daily): the link carries `?seed=…&level=…`; the server stores your run
(`score`, `durationMs`, `seed`, `moves` for puzzle games) and the friend lands on the same board
and sees your run afterwards. No realtime needed. Endless games (runners, snake, tap-or-dont-tap)
have no board to reproduce → "beat my score" challenges (run record only). Network note: run
recording requires ONE new allow-listed games endpoint (e.g. `/api/v1/game-challenges`) added to
the games CSP + rate limits — the 2026-09-25 rule currently permits only `/share-counts` and
`/comments`.
**Games (live, gated)** — only 2P-capable/turn-based shapes (tic-tac-toe ships 2P; word/sliding
could ship "same board, alternating" with a server-held state). Requires the realtime decision
(3-s poll vs WebSocket) and per-game adapters — deliberately the LAST phase, not a promise.

## 7. Phases, effort, and what ships when

| Phase                                    | Work                                                                                                                                                                                                                          | Effort | Ships           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------- |
| **0 — DONE** (63b0e18, 69c6df4, 35e7ef5) | invite links, name gate, live progress, poll-until-finish, heartbeat, resume, nav + Play Hub discovery, all 5 quiz levels, CORS fix                                                                                           | —      | live on prod    |
| **1 — duel feel**                        | extract the timer-mode flow into a shared component used by `/quiz-mcq/play` **and** `/duel` (cards, countdown, auto-advance, progress, explanations, action row, results review) + live opponent bar — concrete steps in §10 | ~2 d   | next            |
| **2 — riddle + image-riddle duels**      | contentType, category picker, `RiddleCard` timer mode in the duel flow, alias grading, riddle share text                                                                                                                      | ~1 d   | after 1         |
| **3 — subject picker (quiz)**            | subjectId filter end-to-end                                                                                                                                                                                                   | ~2 h   | with 1          |
| **4 — game challenge links (async)**     | payload/invite_token, per-game run records, 8 game adapters, hub “challenge a friend” on results                                                                                                                              | ~2 d   | after 2         |
| **5 — live games** (gated)               | realtime layer + per-game state adapters                                                                                                                                                                                      | 3–5 d+ | only after a go |
| **+ hygiene**                            | backend specs for the duels module (currently none — audit BE-11 PARTIAL), E2E for the full two-device flow                                                                                                                   | ~0.5 d | with 1          |

## 8. Non-goals (explicit)

- No websockets/realtime in phases 0–4 (polling is enough; a realtime layer is a separate decision)
- No accounts required to duel (guest identity by design; logged-in identity is an open decision)
- Live duels for canvas runners are NOT promised — async challenges serve them
- No scraped content anywhere (NOW-19 rights stance holds)

## 9. Related

QA-FINDINGS NOW-27 (this work), NOW-28 (CORS regression that blocked all writes),
plan/02 §P2 (quiz deep-links), plan/03 (riddle sessions/deep-links), plan/future-features §1
(the original "needs owner go-ahead" note, now superseded by this plan).

---

## 10. Phase 1 implementation plan (concrete — written 2026-09-27)

**Goal:** the duel question screen becomes the solo timer-challenge flow (§3) with a live
opponent bar, explanations, and a results review — plus the subject picker (phase 3 ships here)
and the backend test hygiene row. Everything below is grounded in the code as it exists today.

### Step 1 — Extract the pacing hook (do first, zero behavior change)

- New `apps/frontend/src/hooks/useQuestionPacing.ts`: extract from `quiz-mcq/play/page.tsx`
  (lines ~255–330) the auto-advance machinery — `AUTO_ADVANCE_MS = 3000`, `autoAdvanceTimer`
  ref, `clearAutoAdvance`, `scheduleAutoAdvance`, and the BUG-040 comments gate
  (`commentsOpen` / `toggleComments` / proceed-on-close). Hook API roughly:
  `useQuestionPacing({ enabled, advanceMs, onAdvance })` → `{ scheduleAdvance, clearAdvance,
commentsOpen, toggleComments, proceedAfterComments }`.
- Rewire `/quiz-mcq/play` onto the hook; the page keeps confirm-submit, bubbles, session logic.
- **Verify:** `npm run build`; manual — practice mode auto-advances after ~3 s, opening
  comments cancels the advance, closing proceeds; timer mode unaffected (it advances on expiry).

### Step 2 — Duel question screen on the shared components

Rewrite the `phase === 'playing'` block of `app/duel/page.tsx`:

- **Adapter:** `DuelQuestion {id, question, options}` → the quiz `Question` shape
  `QuestionCard`/`AnswerOptions` expect (optional fields empty). Card renders the identical
  2/3/4-column adaptive grid (BUG-052) and open-answer input for extreme.
- **Countdown:** per-question limit from the SAME source timer mode uses (the `mode === 'timer'`
  `timeLimit` computation in `play/page.tsx`, passed through `useQuizMcq` today — duel computes
  it per level directly). 1-s tick; **expiry = advance without any server call** (unanswered,
  never graded wrong — the opponent's "completed" count simply doesn't move). Document this in
  the duel page header comment.
- **Auto-advance:** after a graded answer, `useQuestionPacing` (Step 1) drives the 3-s reveal →
  next; BUG-040 behavior identical (comments cancel, close proceeds). No confirm-submit in a
  duel — the last answer goes straight to finish.
- **Action row:** `QuestionCard` already carries the share + comments plumbing — wire
  `ShareMenu` (with `countKey` share-count events) and `QuestionComments`
  (`contentType: 'quiz-question'`, `questionId`) — duel questions ARE quiz-mcq question rows, so
  the component works verbatim. Likes stay internal-only (plan/17).
- **Opponent bar:** replace the current text line with a two-lap progress bar (me vs opponent,
  names + % answered), fed by the existing 3-s poll. Streak count local (matches solo).

### Step 3 — Explanations through the answer endpoint

- Backend `duels.service.ts gradeAnswer` response `{ correct, completed }` → add
  `correctAnswer` + `explanation` (from the question row). **Post-grading only** — the question
  views served BEFORE answering still ship no key and no explanation (the security stance holds).
- Frontend: reveal panel under the card during the 3-s advance window (same styling as solo).

### Step 4 — Results review + share

- Track `myPicks: (string | null)[]` locally during play (also covers skipped/expired).
- Backend: the finished-state view (`pollDuel`/`finishDuel` once `status !== 'running'`) adds a
  per-question reveal array — `questionId, question, options, correctAnswer, explanation`
  (safe post-finish; nothing ships before both players are done).
- Finished screen: list all frozen questions — your pick vs correct + explanation, reusing the
  `QuestionReview` display pattern (it already fetches reveals for solo results; duel gets them
  inline from the match view instead).
- **Deliberately deferred:** replaying the OPPONENT's per-question picks — needs a
  `duel_answers` table (phase-2 migration alongside `content_type`). Review shows both SCORES
  and durations, picks only for you.
- Share: ShareMenu with the duel score text.

### Step 5 — Subject picker (plan phase 3, ships with this phase)

- **ONE migration now:** `content_type varchar(16) default 'quiz'` + `subject_id uuid null`
  on `duel_matches`. `mode` / `payload` / `invite_token` stay in the phase-4 (games) migration —
  no point carrying unused columns through two deploys.
- `CreateDuelDto` + `createMatch`: optional `subjectId`; filter via the question → chapter →
  subject relation (duels already inject the quiz `Question` repo — `duels.module.ts`; confirm
  the exact relation name at implementation).
- Lobby: subject chips (same `getSubjects` feed the homepage topics use, "All subjects"
  default) → `createDuel({ level, subjectId })`; waiting-screen share text names the subject.

### Step 6 — Backend test hygiene (the "+ hygiene" row)

- `duels.service.spec.ts` / `duels-public.controller.spec.ts`: grading (MCQ letters AND extreme
  open answers ≤ 120 chars), 30-s silence void, TTL expiry, code-generation collision retry,
  guest-token guard rejections.

### Order, estimate, verification

Order: 1 → 2+3 → 4 → 5 → 6. Estimate ~2 d (Steps 1–4) + 2 h (5) + 0.5 d (6).
Final gate: `npm run build` (frontend), backend build + new specs green, then a two-browser
manual duel: timed expiry path, comments-cancel path, extreme open answer, refresh-resume,
noindex header intact, poll survives backgrounding (heartbeat).

**Consciously NOT in phase 1:** relaxed/untimed pace (§3 note), riddle family (phase 2), game
challenges (phase 4), opponent pick replay (needs duel_answers), QR code (§5, cheap follow-up).
