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

Every duel family renders through the **same components as solo play** — not a one-off page:

- Question card + `AnswerOptions` (2/3/4-col grid, open-answer input for open tiers)
- Per-question timer (countdown ring) + auto-advance pacing with reveal (the BUG-001 feel)
- Instant green/red feedback + **stored explanation** where one exists (NOW-06)
- Progress %, streak, skip; per-question **like · comment · share** row (the same one solo uses)
- Results: both scores, durations, per-question review ("replay both answers"), win/tie/draw
- Phone-first layout identical to solo play; the lobby is the only unique screen

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
and sees your run afterwards. No realtime needed.
**Games (live, gated)** — only 2P-capable/turn-based shapes (tic-tac-toe ships 2P; word/sliding
could ship "same board, alternating" with a server-held state). Requires the realtime decision
(3-s poll vs WebSocket) and per-game adapters — deliberately the LAST phase, not a promise.

## 7. Phases, effort, and what ships when

| Phase                                    | Work                                                                                                                                | Effort | Ships           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------- |
| **0 — DONE** (63b0e18, 69c6df4, 35e7ef5) | invite links, name gate, live progress, poll-until-finish, heartbeat, resume, nav + Play Hub discovery, all 5 quiz levels, CORS fix | —      | live on prod    |
| **1 — duel feel**                        | rebuild the question screen on shared components (cards, timer, auto-advance, progress, explanations, action row, results review)   | ~1.5 d | next            |
| **2 — riddle + image-riddle duels**      | contentType, category picker, alias grading, riddle share text                                                                      | ~1 d   | after 1         |
| **3 — subject picker (quiz)**            | subjectId filter end-to-end                                                                                                         | ~2 h   | with 1          |
| **4 — game challenge links (async)**     | payload/invite_token, per-game run records, 8 game adapters, hub “challenge a friend” on results                                    | ~2 d   | after 2         |
| **5 — live games** (gated)               | realtime layer + per-game state adapters                                                                                            | 3–5 d+ | only after a go |
| **+ hygiene**                            | backend specs for the duels module (currently none — audit BE-11 PARTIAL), E2E for the full two-device flow                         | ~0.5 d | with 1          |

## 8. Non-goals (explicit)

- No websockets/realtime in phases 0–4 (polling is enough; a realtime layer is a separate decision)
- No accounts required to duel (guest identity by design; logged-in identity is an open decision)
- Live duels for canvas runners are NOT promised — async challenges serve them
- No scraped content anywhere (NOW-19 rights stance holds)

## 9. Related

QA-FINDINGS NOW-27 (this work), NOW-28 (CORS regression that blocked all writes),
plan/02 §P2 (quiz deep-links), plan/03 (riddle sessions/deep-links), plan/future-features §1
(the original "needs owner go-ahead" note, now superseded by this plan).
