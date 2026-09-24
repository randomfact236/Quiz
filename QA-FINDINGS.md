# QA Findings — Bug Tracker (DEFERRED + OPEN)

> **Policy (owner, 2026-09-19/20):** this file lists **open work only**. Resolved findings and
> logs are removed once fixed — resolved behaviours are documented in their respective feature
> files under `plan/`; full history lives in **git history** (`git log --grep=BUG` / `--grep=TASK` /
> `--grep=NOW` / `--grep=HARD`).
> Verification screenshots remain in `gui-test-screenshots/`.
> Priority basis: **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality ·
> **P3** = polish.
>
> **Structure rule (owner, 2026-09-23):** this tracker has exactly TWO tables —
> **DEFERRED on top** and **OPEN below**.
>
> - **DEFERRED:** never touch until the owner explicitly mentions the item — and even
>   then, first MOVE the item to OPEN before working on it.
> - **OPEN:** all normal conversation and work happens on open-table issues only.
> - Resolved findings are removed (documented in `plan/` files; history in git:
>   `git log --grep=NOW / --grep=HARD / --grep=TASK / --grep=BUG`).
>
> **Work-authorization rule (owner, 2026-09-23):** before working on ANY issue, ALWAYS move it
> from DEFERRED to OPEN first — then work on it. NEVER work on an issue while it sits in the
> DEFERRED table.
> **Resolution rule (owner, 2026-09-23):** for ALL resolved findings, ALWAYS recheck the
> resolved issue against the real code (and the live site where relevant) to confirm it is
> **completely resolved** — before it is removed/closed. A finding marked resolved but not
> fully fixed in code goes back to OPEN.
>
> **Record-before-remove rule (owner, 2026-09-24 — WORKING PROCESS):** removing a resolved
> task from this tracker REQUIRES a durable record, created BEFORE the removal:
>
> 1. **Record it** in the respective existing feature file under `plan/`
>    (e.g. `plan/02-mcq-quiz.md`) — dated, with what was done + how it was verified;
> 2. **If the resolved item was a NEW FEATURE with no plan file**, CREATE one first
>    (`plan/NN-<name>.md`, next free number per `plan/TODO.md`, conventions per
>    `plan/STANDARDS.md`) and keep the record there;
> 3. **Only then remove** the entry from the table.
>
> **Cross-check (mandatory):** before deleting an entry, grep the target plan file to
> confirm the record actually exists; after the removal, re-verify it survived (and that
> the entry count/headings are intact — scripted rebuilds have dropped entries before).
> **No entry leaves this tracker without its record** — an accidental removal without a
> record is treated as data loss: restore the entry from git and re-do the record first.
>
> **Reopen-after-change rule (owner, 2026-09-24 — WORKING PROCESS):** after EVERY change
> to this file, REOPEN/RE-READ it and show the updated content (the tables and any
> affected entries) in the same conversation — never end an edit relying on a remembered
> or cached view. This is both a courtesy to the owner and a built-in guard: the reopen
> step is what catches stale views, failed writes, and parallel-session collisions.

## Index

## DEFERRED — never touch until explicitly mentioned (owner 2026-09-23)

### Queued / parked items

| ID     | Title                                    | Was     | Area | Pri | Work by   | Status                              |
| ------ | ---------------------------------------- | ------- | ---- | --- | --------- | ----------------------------------- |
| NOW-02 | Rotate credentials + SSH/secrets hygiene | TASK-18 | ops  | P1  | owner/VPS | Deferred for now (owner 2026-09-24) |

---

### Queued item details

### NOW-02 - Rotate credentials + SSH/secrets hygiene (was TASK-18) — QUEUED NEXT

- **Date found:** 2026-09-22 (source: audit + plan/push-ownership-contract.md)
- **Area:** ops / VPS — **owner action**
- **Priority:** P1
- **Scope:** rotate admin/DB/Redis/JWT/OAuth credentials, SSH hardening, secret-history
  scan, audit logging.
- **Risk note (kept from the 2026-09-23 analysis):** prod content was wiped once already
  (2026-09-17) and credentials were NOT rotated as part of that recovery — anyone holding
  valid credentials from then still has working access. The firewall lockdown (NOW-01,
  done) removed the direct-origin bypass, which reduces exposure; rotation is the closure.
  Cheap to run: runbook ready at `plan/runbooks/credential-rotation.md`, ~1 hour with the
  owner present (new secrets must be recorded by the owner).
- **Status:** DEFERRED FOR NOW (owner 2026-09-24 — supersedes the earlier
  queued-next sequencing; runbook + the 2026-09-24 runbook additions are ready,
  ~1 hour with the owner present, resume the moment the owner says go).

---

---

## OPEN — normal conversation work happens only on these

> **⚠️ 2026-09-24 live-exposure audit:** production runs code OLDER than `2b17264` — the
> deploy has been pending since 2026-09-23. Verified live: `/riddle-mcq/*` public reads
> ship the FULL answer key (`answer` + `correctLetter` + `explanation`), and
> `/image-riddles/random` + by-id ship the raw answer. ALL fixes exist in local commits
> (`2b17264` era + `9858323` + the 2026-09-24 hardening) — **they go live with the next
> push to production.** Live checks that PASS: quiz list answer-strip, `answers/check`
> grader (400), admin guard (401), CSP/HSTS/frame-deny headers.

| ID      | Title                                                                  | Was                     | Area           | Pri | Work by       | Status                                          |
| ------- | ---------------------------------------------------------------------- | ----------------------- | -------------- | --- | ------------- | ----------------------------------------------- |
| NOW-03  | SEO residual: RSC hub bodies (chapter landings DONE)                   | TASK-11                 | seo            | P2  | code          | Open (RSC bodies remain)                        |
| NOW-05  | Uptime/error alerting — one owner step left                            | TASK-21                 | ops            | P2  | owner/VPS     | Open (owner step only)                          |
| NOW-07  | 60 over-long DB riddles rewrite + live content push                    | TASK-03 resid.          | content        | P2  | owner/content | Draft ready — owner review                      |
| NOW-09  | Surface stored answer explanations post-answer                         | new 2026-09-23          | ux/seo         | P2  | code+content  | Partial — riddle side fixed; quiz needs content |
| NOW-10  | Image-riddle catalog replacement (wipe + extract from benchmark sites) | new 2026-09-23          | content        | P2  | owner+content | Open — rights decision gates execution          |
| HARD-13 | Owner-deferred bucket — session persistence first                      | TASK-23 (DEF-01)        | deferred       | P3  | owner+code    | Open — session persistence first                |
| HARD-14 | Riddle share deep-link (needs session-contract change)                 | TASK-27 resid. (DEF-02) | deferred       | P3  | deferred      | Open — after session contract                   |
| HARD-15 | Duel / PvP mode — web-first                                            | new 2026-09-23          | feature/growth | P2  | code          | Open — after session contract                   |
| HARD-01 | CSP residuals: 'unsafe-inline' + HttpOnly token storage                | TASK-04                 | security       | P2  | decision      | Open — owner decision                           |
| HARD-05 | R2 media follow-ups                                                    | TASK-22                 | media/ops      | P2  | owner+code    | Open                                            |
| HARD-06 | ✅ Games a11y + CSP-clean — FIXED (phone QA owed)                      | TASK-09 rem.            | a11y           | P3  | code+owner    | Fixed — owner phone QA                          |
| HARD-07 | Dad jokes surfaces: saved, JotD SSR, trending + share                  | TASK-10 (DEC-01)        | decision       | P2  | decision      | Open — owner decision                           |
| HARD-08 | Comments on quiz/riddle content                                        | TASK-12 (DEC-02)        | decision       | P3  | decision      | Open — owner decision                           |
| HARD-09 | SEC-07 email-verification gate                                         | TASK-13 (DEC-03)        | decision       | P2  | decision      | Open — owner decision                           |
| HARD-10 | Admin user-mgmt UI + dashboard unification + guest activity            | TASK-16 (DEC-04)        | decision       | P3  | decision      | Open — owner decision                           |
| HARD-11 | Installability: full manifest / theme-color                            | TASK-17 (DEC-05)        | decision       | P3  | decision      | Open — owner decision                           |
| HARD-12 | Analytics deferred items (funnels, accuracy join, retention tests)     | TASK-07 (DEC-06)        | decision       | P3  | decision      | Open — owner decision                           |

### Open item details

### NOW-03 - SEO residual: RSC hub bodies (was TASK-11) - chapter landings DONE 2026-09-23; RSC bodies remain

- **Date found:** 2026-09-22 (source: plan/15, audit)
- **Area:** seo — **code work**
- **Priority:** P2
- **Shipped 2026-09-22 (full record: plan/15 §P2):** real per-content segments
  `/quiz-mcq/[subject]` + `/riddle-mcq/[category]` — server pages (revalidate 3600) with
  per-content titles (live counts), descriptions, canonicals, per-page OG images,
  BreadcrumbList JSON-LD; middleware 307 for unknown slugs (Next 15.5 streaming-metadata
  workaround); sitemap emits segment URLs; `?subject=`/`?category=` wrappers canonicalize
  onto the segments while `?q=`/`?score=` share surfaces stay self-canonical (SHARE-01).
- **✅ Chapter landings DONE 2026-09-23 (verified live local + GUI screenshots):**
  - `/quiz-mcq/[subject]/[chapter]` (the TriviaPlaza long-tail play): 92 chapters, ALL
    with descriptive names (DB-verified — zero renames needed). Slugs derive from chapter
    names via `lib/slug.ts` (single source shared by pages/sitemap/middleware).
  - Each page: ISR 3600, live chapter count in the title, canonical, BreadcrumbList
    JSON-LD, subject OG card, a "Sample questions" section (easy-level MCQs from the
    answer-key-free public reads — the default listing order serves the open-ended
    extreme tier first, so samples pin `level=easy`), sibling-chapter link grid, play
    CTAs by chapter name (the play page's contract).
  - Middleware validates two-segment paths with REAL 307s (unknown subject → hub,
    unknown chapter → subject landing; per-subject chapter cache 60s, fail-open).
  - Sitemap emits all 92 chapter URLs (priority 0.5; verified in /sitemap.xml).
  - Subject landings render a server-side "Browse all <Subject> chapters" crawlable
    grid with live counts (the interactive hub hydrates client-side — this grid is the
    crawler-visible entry surface).
- **Remaining (owner go):** full RSC conversion of hub/section bodies (plan/15 P2 item);
  organic segmentation (P3); curated niche packs ("90s Music Quiz") once GSC shows which
  long-tails earn them.

### NOW-09 - Surface stored answer explanations post-answer (new 2026-09-23) — PARTIAL: riddle side fixed; quiz side needs content (owner)

- **Date found:** 2026-09-23 (source: competitor pass — Britannica lesson: every answer
  carries explanatory, learnable content)
- **Area:** quiz/riddle UX + SEO — **code + content**
- **Priority:** P2
- **⚠️ Premise corrected during implementation (DB-verified 2026-09-23):** the claim
  "explanations already sit on our MCQ rows" was WRONG for quiz — `questions.explanation`
  is **0 of 11,541 published** populated. Riddles are the opposite: **3,000 of 3,000**
  riddles carry explanation AND hint.
- **✅ Fixed 2026-09-23 (riddle side — real content, verified via API):**
  - **LEAK FIX (security):** riddle `toPublicRiddle` shipped `explanation` on all
    pre-answer public reads — and every explanation explains the answer ("it's a
    coffin because…"), so this was a live answer-key leak (the same class HARD-02
    closed for answer fields). Explanation is now stripped from public reads and
    returns ONLY with the verdict (`answers/check`) and from `answers/reveal`
    (both graders + both reveal endpoints now carry it; quiz graders wired identically,
    dormant until content exists).
  - UI: in-play "💡 Why" panel under the options after the verdict (quiz + riddle
    cards); review screens fall back to the reveal's explanation (RiddleReview +
    QuestionReview). Component-level test coverage kept green (548/548).
- **Remaining (owner decision):** QUIZ explanations must be AUTHORED — 11,541 rows
  with an empty explanation column is a content-ops task (like NOW-07), not code; the
  surface renders automatically per-question as content lands. Options: author
  explanations per subject (content pass), crowd none (leave as-is), or fold into the
  NOW-07 rewrite pass. SEO surfacing of explanations on landing pages deliberately NOT
  built while the quiz column is empty.

### NOW-05 - Uptime/error alerting wiring (was TASK-21) - WIRED 2026-09-22; one owner step left

- **Date found:** 2026-09-22 (source: OPS-21)
- **Area:** ops / VPS — **owner action**
- **Priority:** P2
- **Wired + live 2026-09-22 (full record: audit file §6.3 OPS-21):** `/usr/local/bin/quiz-uptime.sh`
  on a 1-minute cron checks https://pigzap.com/ + the API summary endpoint, counts consecutive
  failures (state in `/opt/quiz-alerts/`), fires `{text:...}` JSON webhooks on failure AND
  recovery, and dead-man-pings a heartbeat URL on every clean run.
- **Owner step (only thing missing — no channel existed on the VPS):** create a free
  healthchecks.io check (or Discord/Slack/Telegram webhook) and put it in
  `/opt/quiz-alerts/alert.env` as `HEARTBEAT_URL=` and/or `ALERT_WEBHOOK=` — no restart
  needed; the script reads it per run.

### NOW-07 - 60 over-long DB riddles + live content push (was TASK-03 residue)

- **Date found:** 2026-09-22 (source: TASK-03 repair report)
- **Area:** content — **owner/content judgment + push**
- **Priority:** P2
- **Status:** DRAFT READY 2026-09-22 — all 60 rows exported from prod (with options +
  answer letters) and proposed ≤220-char rewrites written to
  `scripts/overlong-riddle-rewrites-DRAFT.tsv` for owner review. **Nothing has been
  pushed** — apply only after the owner approves wording, then the standing post-push
  rule: flush `quiz:*`/`riddle-mcq:*` redis keys (BUG-038).
- **⚠️ New finding from the drafting pass (owner must judge):** the 30 open-answer rows
  are **self-contradictory as stored in prod** — the question says the bakery receipt
  _clears_ the culprit, yet the stored answer IS that culprit (explanations blame a
  jogger instead). Confirmed 30/30. The draft rewrites them as "stale/fake alibi" so the
  stored answer becomes deducible, flagged CAUTION per row. Additionally, the 30 MCQ
  rows' stored **explanations are inverted** (they praise the answer's alibi the puzzle
  refutes). Both need an owner decision + an explanation-rewrite pass in the same
  content push.

### NOW-10 - Image-riddle catalog replacement: wipe + extract from the benchmark sites (new 2026-09-23) — OPEN (rights decision gates execution)

- **Date found:** 2026-09-23 (owner request in the competitor-comparison discussion)
- **Area:** content — **owner decision + content work**
- **Priority:** P2
- **Owner request as stated:** remove ALL existing image riddles, then extract image
  riddles from the four benchmark websites (Trivia Crack / Britannica / TriviaPlaza /
  FunTrivia) and ADD ONLY the extracted ones.
- **Owner decisions required BEFORE execution — nothing has been done:**
  1. **Rights:** scraped puzzles and their images are copyrighted by their publishers;
     republishing verbatim is a legal risk. Options: (a) treat them as format/style
     inspiration and re-create original riddles (safe), (b) use only public-domain/CC
     sources, (c) accept the risk — owner's call, recorded here.
  2. **Source reality (verified live 2026-09-23):** none of the four sites publishes true
     "image riddles" in our format (image + word answer). Closest: FunTrivia Photo
     Quizzes / Photo Match — MCQ-with-picture, needs format conversion. Trivia Crack =
     JS app shell (nothing extractable), Britannica = bot-wall 403 on all fetchers,
     TriviaPlaza = none seen. Expect low yield; re-creation likely beats scraping.
  3. **Destructive:** wipes 1,906 live image riddles across 10 categories. Standing
     rules apply: DB backup first, wipe + push, then FLUSH image-riddle redis keys
     (BUG-038).
- **Status:** OPEN (owner 2026-09-24). Execution gated on the owner rights decision
  (re-create originals recommended).

### HARD-01 - CSP residuals: 'unsafe-inline' + HttpOnly token storage (was TASK-04) - games gap FIXED 2026-09-22; residuals parked

- **Date found:** 2026-09-22 (source: audit)
- **Area:** security / frontend — **decision**
- **Priority:** P2
- **Fixed 2026-09-22 (full record: audit file §6.1 H8):** the eight static games served NO
  CSP at all — `middleware.ts` now decorates every `/games/*` response with the strictest
  policy on the site (`script-src 'self'`, no remote anything, `connect-src` same-origin +
  API origin; two inline theme-loader hashes). Verified on prod build.
- **Full nonces: NOT being done (assessment, not deferral):** nonces require dynamic
  rendering — incompatible with prerendered/ISR pages, the games' static HTML `<script>`
  tags, and Next's own bootstrap scripts. `'unsafe-inline'` on app pages stays as the
  documented residual risk (weakens XSS defense-in-depth, not an active hole).
- **HttpOnly refresh-cookie half:** design decision (changes the guest/auth flow the owner
  deliberately kept friction-free) — parked with the owner.

### HARD-05 - R2 media follow-ups (was TASK-22)

- **Date found:** 2026-09-22 (source: plan/17-r2-storage-setup.md)
- **Area:** media — **owner + code**
- **Priority:** P2
- **Reported:** confirm one admin Media upload end-to-end (untested path); move off
  `r2.dev` (rate-limited, not meant for prod) to a custom domain; rclone-migrate existing
  media; token hygiene.

### HARD-06 - Games a11y polish + phone QA (was TASK-09 remainder) - FIXED 2026-09-23 (owner phone QA remains)

- **Date found:** 2026-09-22 (source: plan/games/\*)
- **Area:** games — **owner 10-min phone QA**
- **Priority:** P3
- **Fixed 2026-09-23 (commit `81080c2`; memory-quiz QA record in plan/games/08 §22):**
  AA contrast (computed WCAG audit, 7 games): muted text #64748b failed on the page
  gradient (2.93-3.81:1) → #475569 (worst case 4.67:1); dark-theme primary buttons
  #3b82f6 failed with white text (3.68:1) → #2563eb (5.17:1). Sliding-puzzle: segmented
  radio groups got roving tabindex + arrow-key selection; round start focuses the board.
  All 8 games verified zero JS errors and zero CSP violations (games CSP completed with
  the two inline theme-loader script hashes).
- **Remaining (owner):** the 10-minute phone QA pass.

### HARD-07 - Dad jokes surfaces (was TASK-10, briefly DEC-01) — DECISION

- **Date found:** 2026-09-22 (source: plan/05) — saved jokes, JotD SSR, trending + share buttons. P2.

### HARD-08 - Comments on quiz/riddle content (was TASK-12, briefly DEC-02) — DECISION

- **Date found:** 2026-09-22 (source: plan/07) — P3.

### HARD-09 - SEC-07 email-verification gate (was TASK-13, briefly DEC-03) — DECISION

- **Date found:** 2026-09-22 (source: audit) — real consideration, low actual risk; adds
  signup friction the owner has resisted before. P2.

### HARD-10 - Admin user-mgmt UI + dashboard unification + guest activity (was TASK-16, briefly DEC-04) — DECISION

- **Date found:** 2026-09-22 (source: plan/09) — note: "dashboard unification" overlaps
  HARD-13's "admin-dashboard unification"; dedupe when deciding (HARD-13 is now QUEUED
  next, so coordinate the two when picked up). P3.

### HARD-11 - Installability: full manifest / theme-color (was TASK-17, briefly DEC-05) — DECISION

- **Date found:** 2026-09-22 (source: audit) — related: manifest still carries the
  hardcoded "AI Quiz" branding (see rebrand state). P3.

### HARD-12 - Analytics deferred items (was TASK-07, briefly DEC-06) — DECISION

- **Date found:** 2026-09-22 (source: plan/13: funnels, accuracy join, retention tests, B6/B7) —
  additive once picked up; collection already in place. P3.

### HARD-13 - Owner-deferred bucket — items revisited in sequence (was TASK-23, briefly DEF-01) — OPEN (session persistence first)

- **Date found:** 2026-09-22
- **Contents (original owner-deferred list):** riddle-mcq session persistence /
  JSON import-export / cache tuning; image-riddle server-side progress;
  admin-dashboard unification (dedupe with HARD-10 when reached); games R2-2/R2-3
  extras; LinkedIn + Pinterest share previews.
- **Status:** OPEN (owner 2026-09-24) — start with the riddle-mcq session persistence
  item; it is the HARD-15 (duel) prerequisite.

### HARD-14 - Riddle share deep-link (was TASK-27 residue, briefly DEF-02) — OPEN (after the session contract lands)

- **Date found:** 2026-09-22 — riddle question shares still use the hub `?q=` form; the
  riddle play flow has no shared-start contract (subjectId/level based, no in-session
  question identity). Implementing means changing the riddle session contract — opened 2026-09-24 with the rest of the
  contract-chain items; implement after the session contract lands. Note: the same session-contract work is a HARD-15
  (duel) prerequisite and HARD-13 is queued — sequence them together when the queue
  reaches that point. P3.

### HARD-15 - Duel / PvP mode — web-first (new 2026-09-23) — OPEN (build after the session contract)

- **Date found:** 2026-09-23 (source: competitor pass — Trivia Crack's core hook; owner
  asked "website, app, or both?")
- **Area:** feature / growth — **code work (was decision; owner queued it 2026-09-23)**
- **Priority:** P2
- **Decision record:** owner initially did not want it; on 2026-09-23 queued it, and on
  2026-09-24 moved it to OPEN — on the WEBSITE first, web-first and
  mobile-first. Rationale on record: there is no app yet (web = 100% of the audience;
  withholding the feature from web withholds it from everyone), web is the SEO funnel
  that feeds a future app, and the expensive part — the backend — already exists: the
  `duels` module (public controller: join/leave/name) ships with ZERO frontend
  references today; any future app shell (e.g. Capacitor wrap) talks to the same API.
  Precedent: Trivia Crack itself is app-first yet added browser play (CrazyGames, 2023).
  v1 tradeoff: weaker push notifications vs native — cover with async design +
  email/PWA push.
- **Prerequisite:** session-contract work — HARD-13's riddle-mcq session persistence
  item (quiz side is closer: play URLs already carry `qid=` deep links, TASK-27).
  Sequence: HARD-13 session contract → HARD-15 duel UI.

---

## Resolved — removed from this tracker (policy: open items only)

Fully-fixed findings live in their respective `plan/` files and in git history
(`git log --grep=NOW` / `--grep=HARD` / `--grep=TASK` / `--grep=BUG`). Cleanup 2026-09-23:

- NOW-01 → audit file §6.1 **H6** (firewall + Dokploy :3000 closure)
- NOW-04 → audit file §6.3 **OPS-19** (off-box replication + restore drill PASS)
- NOW-06 → plan/13 §4b (A5/A7/A10/C1 DONE entries, were already recorded there)
- HARD-02 → audit file §6.1 **H1** (phase 2c complete 2026-09-23)
- HARD-03 → audit file §6.2 **SEC-10/12** (signed guest token)
- HARD-04 → plan/03 §P3 (hint import — closed stale), plan/04 §P3 (status import), plan/05 §P3 (jokes status import)
- Resolved sweep 2026-09-22 (TASK-01/02/03/08/24/25/26/27) → plan/17, plan/13, plan/02 §6
  (TASK-03 + TASK-27), plan/games/08 §22 (TASK-24/25/26); TASK-08 was a non-issue
- NOW-08 → plan/02 (Daily Challenge built + play-fixes; **live-verified on
  production 2026-09-24**: API + web + 92-chapter sitemap + riddle/image-riddle
  strips; record-before-remove cross-checked before removal)

---

## Competitor comparison

Benchmark vs four reference quiz/trivia sites (owner request 2026-09-23). Our site = PigZap (quiz-mcq, riddle-mcq, image riddles, dad jokes, games).

| Dimension            | **Us (PigZap)**                                                           | [Trivia Crack](https://triviacrack.com/)  | [Britannica](https://www.britannica.com/)              | [TriviaPlaza](https://www.triviaplaza.com/)    | [FunTrivia](https://www.funtrivia.com/)                       |
| -------------------- | ------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------- |
| Core model           | Play-yourself quiz/hub (MCQ + riddles + image riddles)                    | PvP / mobile-style trivia duel game       | Encyclopedia + quizzes as a learning sidecar           | Casual play-in-place trivia quizzes            | Large community-written quiz archive                          |
| Content depth        | 11.5k+ questions, 3k riddles, growing DB                                  | Fixed game categories, live opponents     | Authoritative reference articles first, quizzes second | Modest hand-picked quiz set                    | Very large (100k+ quizzes, UGC)                               |
| Formats              | MCQ, riddle MCQ, visual/image riddles, rebus-style, jokes, 8 arcade games | Category duels, streaks                   | Articles + knowledge quizzes                           | MCQ + fill-in/missing-word decade packs        | MCQ, match, photo, fill-in, classification, label, crosswords |
| Accounts             | Optional — friction-free guest play + Google                              | Account/platform required for progression | Account optional for reading                           | Anonymous play                                 | Account for scores/history                                    |
| Social / retention   | Likes, comments, achievements, newsletter, share deep-links               | Duels, ranks, cross-play                  | None (reference brand pull)                            | Minimal                                        | Profiles, high scores, forums                                 |
| SEO surface          | SSR landing pages, per-subject routes, JSON-LD, sitemap                   | App-store / brand-driven                  | Massive organic encyclopedia traffic                   | Long-tail quiz keywords                        | Deep archive of long-tail quiz pages                          |
| Monetization posture | Content platform (owner-defined)                                          | Ads + IAP (mobile F2P)                    | Subscription (Britannica) + ads                        | Ads                                            | Ads + premium membership                                      |
| **Gap to close**     | —                                                                         | No live multiplayer / duel mode           | No encyclopedia-grade explanatory copy under answers   | Quiz set is narrower than their homepage packs | No UGC quiz creation pipeline                                 |

### Verified live 2026-09-23 (fetch pass)

- **Trivia Crack** — triviacrack.com is a JS-only app shell (nothing crawlable); features
  verified via Wikipedia. 600M+ downloads, ~150M annual actives, #1 trivia app in
  125+ countries; 7 mascot categories; the hook is async PvP duels + progression; browser play
  arrived via CrazyGames (2023). Web presence = brand funnel, zero SEO content surface.
- **Britannica** — 403s all automated fetchers (bot wall), so this column stays positioning-based:
  authoritative encyclopedia = E-E-A-T moat + massive organic traffic; quizzes are a learning
  sidecar; ads + Premium subscription; no social layer.
- **TriviaPlaza** — 13 top categories + General Knowledge; the real shape is LONG-TAIL: per-decade
  packs (1950s–2020s), Eurovision, Lyrics, Song Titles ("1964 Hits & Missing Word 1/2"), fill-in
  format, "get graded", dated "recent quizzes" (freshness cadence), keyword-rich URLs
  (`/1956-hits-missing-words-quiz/`), no accounts. No ads seen on fetched pages (footer carries a
  book product). Smaller catalog than ours, but the decade/niche long tail is their SEO engine.
- **FunTrivia** — 2.5M questions / ~168k quizzes / 14k topics / 20 categories / 9,656 crosswords /
  K-12 organized sets, since 1995. Formats: MCQ, match, collection, photo, photo-match, fill-in,
  classification, label. Retention machine: DAILY games (Duel, Mind Melt, Knockout, Monster Quiz,
  Global Challenge tournament, Team Heroes) + HOURLY games + teams + badges/ranks. UGC via Author
  Central + "Adventures in Authoring"; Ask FunTrivia Q&A. Monetization: Gold membership (ad-free +
  perks), pub-trivia packs, content licensing.

### Opportunity ranking (from the verified pass)

1. **Daily ritual hook** → filed as **NOW-08**.
2. **Surface stored explanations** (Britannica lesson) → filed as **NOW-09** (pairs with NOW-07's rewrite pass).
3. **Duel UI on the existing backend** → filed as **HARD-15** — owner queued it 2026-09-23: built right after the ACTIVE queue, web-first.
4. **Long-tail landing pages** (TriviaPlaza lesson) → folded into **NOW-03 residual** (chapter-level pages).
5. **Fill-in format** (TriviaPlaza + FunTrivia): missing-word/fill-in packs are proven casual
   formats we don't have; our word-puzzle game + open-ended riddle tiers are adjacent cover — not filed, pick up with NOW-03 niche packs if wanted.
6. **UGC creation** (FunTrivia): stays deferred — a content-ops race, not a code gap.
7. **Monetization:** all four monetize (IAP / subscription / membership); we deliberately don't — owner posture, listed for completeness.
8. **Image-riddle catalog replacement** (owner request during this pass) → filed as **NOW-10**, queued next; rights decision needed before execution.

Our live edge over all four: zero-account friction-free play, zero-ad clean UX, share system with
dynamic OG images + quiz deep-links (none of the four has this), the 8-game arcade bundle, and
hybrid formats (image riddles, dad jokes) none of them carry. Minor live observation: the home
counters section rendered a "Loading…" placeholder at fetch time — client-side counts, worth a look
if it persists.

Open action: opportunities filed as above — no further IDs auto-created.
