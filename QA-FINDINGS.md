# QA Findings — Bug Tracker (OPEN ITEMS ONLY)

> **Policy (owner, 2026-09-19):** this file lists **open work only**. Resolved findings
> and per-session work logs are removed once fixed — their full history lives in **git
> history**: every fix commit references its BUG-XXX id (`git log --grep=BUG`), and
> verification screenshots remain in `gui-test-screenshots/`.
> Priority basis (same convention as `plan/STANDARDS.md` §1):
> **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality · **P3** = polish.

## Index

| ID        | Title                                                          | Area                      | Priority | Status            |
| --------- | -------------------------------------------------------------- | ------------------------- | -------- | ----------------- |
| BUG-005   | Legal pages not finalized                                      | Legal pages               | P1       | Resolved          |
| BUG-037   | Question like buckets: 1-like / 2-like / 3+-like containers    | quiz-mcq / riddle-mcq     | P2       | Fixed             |
| BUG-038   | Client-side exception while loading ("Application error")      | Frontend (global)         | P1       | Resolved          |
| BUG-039   | Mode selection: pre-open all levels in both modes              | quiz-mcq mode picker      | P2       | Fixed             |
| BUG-040   | Like + comment section on each question                        | quiz/riddle questions     | P2       | Fixed             |
| BUG-041   | Easy mode: answers all in the same position; audit placement   | quiz/riddle content       | P1       | Fixed             |
| BUG-042   | Separate "Science & Nature" into Science and Nature            | quiz subjects             | P2       | Open              |
| BUG-043   | Riddle mode pages: hide category, difficulty + Mix only        | riddle-mcq mode pages     | P2       | Fixed             |
| BUG-044   | Quiz mode pages: level selection block misplaced               | quiz-mcq mode pages       | P2       | Fixed             |
| BUG-045   | Question like not retained after refresh                       | per-question likes        | P1       | Fixed             |
| BUG-046   | Question comment not stored after refresh                      | per-question comments     | P1       | Fixed             |
| BUG-047   | Share does not show the different social media with copy link  | share UI (questions)      | P2       | Fixed             |
| BUG-048   | Like / comment / share counts visible to all users             | engagement counters       | P2       | Fixed             |
| BUG-049   | Make each question shareable with an icon                      | quiz-mcq play page        | P2       | Fixed             |
| BUG-050   | Comment click doesn't reach comments; can't delete own comment | per-question comments     | P1       | Fixed             |
| BUG-051   | Games share flickers when clicked                              | static games (share)      | P2       | Fixed             |
| BUG-052   | Answers in 2-column layout; full-width on small screens        | quiz/riddle answers UI    | P2       | Fixed             |
| BUG-053   | Feedback inside games when paused or at game over              | static games (pause/over) | P2       | Fixed             |
| BUG-054   | Riddle-mcq has no like, comment or share options               | riddle-mcq questions      | P2       | Fixed             |
| BUG-055   | Home share image: build approved multi-platform design (WP0)   | website share (home)      | P2       | Fixed             |
| H1        | Answer key still ships on the play reads                       | quiz/riddle/image-riddle  | P1       | Open (mine + go)  |
| H6        | Origin firewall not restricted to Cloudflare IPs               | ops / VPS                 | P1       | Open (owner)      |
| H8        | CSP lacks nonces; JWTs in localStorage                         | frontend security         | P2       | Open (mine)       |
| H9        | Prod credentials not rotated                                   | ops / security            | P1       | Open (owner)      |
| H4        | content:push baseline incomplete                               | content pipeline          | P2       | Open (your call)  |
| SEC-07    | Email verification not enforced (decision)                     | auth                      | P2       | Open (your call)  |
| SEC-10/12 | Anonymous writes not bound to a signed token                   | backend security          | P2       | Open (mine)       |
| SEC-11    | Throttler storage is in-memory (single instance)               | backend security          | P3       | Open (mine)       |
| BE-09     | CSV leakage/ambiguity content defects                          | content data              | P2       | Open (mine)       |
| BE-11     | Backend tests thin (analytics / duels / riddle-mcq)            | backend tests             | P3       | Open (mine)       |
| POLISH    | Visual polish list (10 items)                                  | frontend polish           | P3       | Open (needs eyes) |

---

## Audit snapshot — 2026-09-21 (all open engagement bugs fixed and verified)

Full tracker: **20 findings tracked — 19 Fixed/Resolved · 1 Open (BUG-042, content
side already shipped in CSVs — kept Open only pending owner confirmation of the live data).**

- **Fixed in the 2026-09-20/21 social + share wave (all GUI-verified):**
  BUG-040 · BUG-045 · BUG-046 · BUG-047 · BUG-048 (like/comment counts public; share-count
  events remain future work) · BUG-049 · BUG-050 · BUG-051 (games share: smooth expand/collapse,
  no layout jump, double copy-binding removed) · BUG-053 (in-game feedback shipped per the agreed
  design: 💬 ghost button on pause/game-over, 😞😐😊 rating + note → comments service as
  contentType='game'/kind='feedback', admin moderation panel) · BUG-054 · BUG-055 (home share:
  multi-platform template with real pig icon, live DB totals, 1200×630 + 1200×600 X variant).
- **Also fixed in the same wave:** comment timestamps migrated to timestamptz (fresh comments no
  longer display ~5h45m old); share images render the real pig logo (SVG rasterized to PNG for
  next/og) and the 🧩 riddle chip per design tokens.
- **Deferred:** none - BUG-005 signed off 2026-09-21.
- **BUG-005 resolved (2026-09-21) - legal review + sign-off:** copy re-verified against the shipped implementation: Google Analytics loads only after consent (CookieConsent gate, anonymize_ip), first-party play analytics store a /24 (IPv4) / /48 (IPv6) anonymized IP, the guest ID is a random localStorage value with no PII, newsletter unsubscribe is live (idempotent endpoint), and /contact is a real mailto page. No placeholder copy remains. Non-blocking additions the owner may still want later: governing-law / legal-entity / minimum-age clauses in Terms; retention + children's-privacy notes in Privacy; the banner's marketing toggle is future-only (no marketing cookies are set today, so the Privacy wording stays accurate).
- **Fixed/Resolved (19):** BUG-037–BUG-055 except BUG-042 (Open) and BUG-005 (Resolved), plus
  BUG-038.
- **Related non-bug work — remaining share-design packages:** WP2 (per-game accent OG images),
  WP3 (share-count events), WP4 (riddle results screen), WP5 (answer-reveal share, optional) —
  `designs/share-design-system-report.md`.

---

## Open

### Audit follow-ups (transcribed 2026-09-21 from `plan/AI-Quiz-Audit-2026-09-20.md`)

Everything else in that report is fixed - see its "Remediation log". These are the still-open items, with the action each needs.

- **H1 - answer key still ships on the play reads** (P1; mine + your go). Public quiz LIST endpoints are already stripped and the quiz/riddle/image-riddle graders are live. Action: switch the play loops to the graders (quiz play + review, riddle play + review, image-riddle guess panel incl. the "N letters" hint), then drop `correctAnswer` / `correctLetter` / `answer` from the play reads. Spec: `docs/h1-phase2c-plan.md`. Needs a browser pass on the three games.
- **H8 - CSP nonces + token storage** (P2; mine). Baseline CSP shipped; inline scripts still run under `'unsafe-inline'` and user/admin JWTs sit in localStorage. Action: nonce the three inline-script surfaces; plan HttpOnly refresh cookies.
- **H6 - origin firewall** (P1; owner/VPS). Compose ports are loopback-bound; still to do: restrict inbound 80/443 to Cloudflare IPs and allowlist the Dokploy panel.
- **H9 - credential rotation** (P1; owner). Rotate admin/DB/Redis/JWT/Google OAuth and decide on the git-history scrub. Steps: `docs/production-runbook.md` section 4.
- **H4 - content:push baseline** (P2; your call). The last full run stopped at 6450/11541 and the state file has no `questions` baseline. Action: dry run to confirm the gap, then push to completion.
- **SEC-07 - email-verification gate** (P2; your call). The verification flow exists but login ignores `emailVerified`. Decide: keep non-blocking (today) or 403 until verified.
- **SEC-10/12 - anonymous writes** (P2; mine). Comment flag, guest activity, image-riddle engage and duel display-name rely on a client-supplied guestId. Action: bind them to a server-signed guest token.
- **SEC-11 - throttler storage** (P3; mine). Rate limiting is per-instance, correct for the current single API container. Action: Redis-backed storage if we ever run replicas. `TRUST_PROXY` is now documented.
- **BE-09 - CSV content defects** (P2; mine + a push). Measured leakage/ambiguity rows; no repair script exists. Action: write the repair pass, re-audit the CSVs, then push.
- **BE-11 - thin backend tests** (P3; mine). question-likes + riddle validators covered (14 suites / 109 tests). Remaining: analytics, duels, riddle-mcq services; raise the Jest threshold above 20%.
- **POLISH - cosmetics A5** (P3; needs your eyes). 10 visual items (unify page gradients, radius/shadow scale, auth-page tokens, card-grid centralization, emoji -> lucide icons, content-width tokens, skeleton parity, token audit vs `designs/*`). All visual: I implement, you review.

### BUG-037 — Question like buckets: 1-like / 2-like / 3+-like containers

- **Date found:** 2026-09-18 (reported 19:48)
- **Area:** quiz-mcq / riddle-mcq (question likes + classification)
- **Priority:** P2
- **Reported:** When people like a question it gets recorded to a separate container — three
  containers: 1 like, 2 likes, 3-and-above liked questions. The question itself doesn't move;
  it is simply recorded/classified by its like count.
- **Note:** no likes infrastructure exists for quiz/riddle questions today (liked-categories
  is a different feature; image-riddles likes are a deferred owner decision). Needs a
  question-likes table (guest/user dedupe), like API + UI on questions, and a report/surface
  for the three buckets (bucketing logic itself is a trivial GROUP BY on like counts).
- **Owner clarification (2026-09-19):** the buckets are INTERNAL ONLY — nothing exposed to
  users. Likes are collected and classified; once enough likes accumulate, the owner can
  publish selected questions under chosen headings. Scope when built: like capture
  (frictionless one-tap in the question flow) + likes table with per-guest dedupe + internal
  admin view of the three buckets. Buckets should be derived (query by count), not stored
  membership.
- **Fix (2026-09-19):** `question_likes` table (migration 1791000000000, dedupe unique
  index on contentType+questionId+guestId, userId column for logged-in upgrades);
  idempotent POST /question-likes + GET /question-likes/my (throttled, question existence
  validated per family); internal GET /admin/question-likes/buckets derives exact-1 /
  exact-2 / 3+ by COUNT joined to question text; admin panel 'Question Likes' section
  renders the three buckets per family; one-tap heart on the quiz play card and riddle
  play card (no counts public). Verified: capture + dedupe + grouping in DB; GUI tap
  round-trips against a real question.

### BUG-038 — Client-side exception while loading the site ("Application error")

- **Date found:** 2026-09-19
- **Area:** Frontend (global; reported while loading via `127.0.0.1:3010`)
- **Priority:** P1
- **Reported:** "Application error: a client-side exception has occurred while loading
  127.0.0.1 (see the browser console for more information)." No repro steps or console
  output captured yet.
- **Note:** reproduce outside the in-app browser pane first — the pane's stale render cache
  (serves old documents keyed by path) can pair cached HTML with freshly fetched JS and
  crash; if it only reproduces in-pane, treat as the known pane defect, not an app bug.
- **Resolved (2026-09-19):** server-side audit — all 15 JS chunks referenced by the served
  homepage return 200 and match the current build; the pane loaded the site across dozens
  of navigations this session without the crash. Verdict: known IDE-pane stale-cache
  defect (old HTML + new JS pairing), not an app bug. Hard refresh (Ctrl+Shift+R) or a
  normal browser clears it.

### BUG-039 — Mode selection: pre-open all levels in both modes

- **Date found:** 2026-09-19
- **Area:** quiz-mcq inline mode/level picker (per-chapter)
- **Priority:** P2
- **Reported:** In mode selection, all the levels inside a mode should be pre-opened
  (expanded by default) in both Timer and Practice modes. Owner also referenced the
  "back to chapter" / "back to mode selection" navigation while reporting — clarify whether
  those back buttons are part of the request or just context when picked up.
- **Relation:** extends the BUG-027 inline picker (which opens chapters 1–2 by default).
- **Fix (2026-09-19):** every chapter's inline mode+level picker is now expanded by
  default (`expandedChapters[index] ?? true`). Verified: 6/6 pickers open on load.

### BUG-040 — Like + comment section on each question

- **Date found:** 2026-09-19
- **Area:** quiz-mcq / riddle-mcq questions (in the question flow)
- **Priority:** P2
- **Reported:** Add a like and comment section on each question.
- **Note:** reconcile with existing decisions — comments already exist on the quiz review
  screen (BUG-036) and question likes were specified as INTERNAL-ONLY with bucket
  classification (BUG-037). Making both visible per-question in the play flow supersedes or
  extends those; get the owner's intent confirmed (placement: during play vs review) before
  building.
- **Progress (2026-09-19):** the LIKE half is live — one-tap heart on the quiz play card
  and riddle play card (BUG-037 implementation). Remaining: owner confirmation on whether
  COMMENTS should also move into the play flow (BUG-036 scoped them to the review screen)
  or stay review-only.

### BUG-041 — Easy mode: all answers placed in the same position; audit placement quality

- **Date found:** 2026-09-19
- **Area:** quiz-mcq content/presentation (answer option ordering)
- **Priority:** P1
- **Reported:** In easy mode, all the answers are placed in the same place (the correct
  answer always lands on the same option slot, making the pattern learnable). Owner asks to
  check the answer placement quality overall.
- **Task when picked up:** audit the answer-shuffling/placement path (content generation +
  render order) across all levels, not just easy; add/verify a uniform shuffle so correct
  answers distribute across slots.
- **Fix (2026-09-19):** audit found correctLetter was A-or-B for EVERY MCQ level (never
  C/D), and easy mode is 95% two-option True/False with 'True' always first. Serve-time
  shuffle added at the shared random fetch point (ContentServiceBase.findRandomItems —
  covers quiz and riddle flows): options are Fisher-Yates shuffled per fetch and
  correctLetter remapped to follow the correct text. Stored content unchanged; verified
  True now leads ~47% of two-option serves and 4-option letters distribute across slots.
- **Status:** FIXED 2026-09-19 in the authoring CSVs. Root cause: the generator
  interleaves chapters round-robin and cycles answer letters in the same rhythm, locking
  every chapter to one slot (file-level totals pooled to 50/50 and hid it). Fix: letters
  rebalanced within each (level, chapter/subject) group, then randomized with a
  constrained walk — balanced quota per group, weighted random pick, never the same
  letter three times in a row in file order; strictly ascending numeric options excepted.
  Verified: 280/280 quiz chapter-cells and 70/70 riddle subject-cells balanced; max
  same-letter run 3-6 (locked-pair files highest); invariance vs HEAD clean (no answer
  text changed); audit clean. Note: within each level, answers are equal across the
  options that level displays (easy 2 -> 50/50, riddle medium 3 -> 33x3, 4-option -> 25x4);
  equal A-D on EVERY question would require showing 4 options at all levels (BUG-016
  spec change — owner decision, not requested).

### BUG-042 — Separate "Science & Nature" into two subjects

- **Date found:** 2026-09-19
- **Area:** quiz subjects (content structure)
- **Priority:** P2
- **Reported:** Split the combined "Science & Nature" subject into separate Science and
  Nature subjects (content reassignment + subject rows + landing card).
- **Status:** PARTIAL — editorial ruling given by owner 2026-09-19: Science = Physics &
  Chemistry, Space & Astronomy, Scientists & Discoveries (499 q); Nature = Plants &
  Animals, Human Body & Biology, Earth & Weather (501 q). CSV split executed same day:
  quiz-csv/science-nature.csv replaced by science.csv + nature.csv (placement fixes and
  open-ended tiers carried over; audit + chapter balance clean on both). REMAINING
  ENGINEERING: import the two new subjects to the local DB; remove the old "Science &
  Nature" subject + its 1,000 questions from local/live DB (the push has no delete — the
  old subject would keep serving duplicates); add the Nature landing card + subject
  slugs/routes (app code).

### BUG-043 — Riddle mode pages: hide category, show only difficulty + Mix

- **Date found:** 2026-09-19
- **Area:** riddle-mcq Timer Challenge / Practice Mode pages
- **Priority:** P2
- **Reported:** In riddle Timer Challenge and Practice Mode, do not show the category
  selection — show only the mode-wise difficulty level selection and Mix.
- **Fix (2026-09-19):** /riddle-mcq?mode=practice|timer renders a focused view — the
  matching mode's difficulty grid plus a Mix card (all subjects, all levels,
  /riddle-mcq/play?subjectId=all&level=all); the Browse-by-Category grid is hidden in that
  context. Verified in the browser.

### BUG-044 — Quiz mode pages: level selection block misplaced

- **Date found:** 2026-09-19
- **Area:** quiz-mcq Timer Challenge / Practice Mode pages
- **Priority:** P2
- **Reported:** In quiz Timer Challenge and Practice Mode, the mode-level selection is not
  in its proper place — adjust the layout/placement.
- **Fix (2026-09-19):** the difficulty panel was a child of the subjects row grid
  (grid-cols-3/4), squeezing it into a single column. It now spans the full row
  (col-span-full) directly below the expanded subject's row. Verified in the browser.

### BUG-045 — Question like not retained after refresh

- **Date found:** 2026-09-19
- **Area:** per-question likes (quiz/riddle question flow)
- **Priority:** P1
- **Reported:** Liked a question, refreshed the page — the like did not survive the reload
  (gone on return).
- **Note:** persistence is broken or keyed to something ephemeral (in-memory state /
  localStorage without the right key / guest-id not stable). When picked up, check whether
  the like reaches the API at all and whether it is tied to a stable guest identity.

### BUG-046 — Question comment not stored after refresh

- **Date found:** 2026-09-19
- **Area:** per-question comments (quiz/riddle question flow)
- **Priority:** P1
- **Reported:** Commented on a question, refreshed — the comment is not stored/does not
  reappear after the reload.
- **Note:** same suspects as BUG-045 (no API write, or write succeeds but the read path
  filters it out — e.g., status/guest filtering). Verify the POST response and the list
  endpoint separately.

### BUG-047 — Share does not show the different social media with copy link

- **Date found:** 2026-09-19
- **Area:** share UI on the question/result surface
- **Priority:** P2
- **Reported:** In share, it does not show the different social media options with the copy
  link (no Facebook / X / WhatsApp / copy-link choices visible where the owner tested).
- **Note:** the site already has the 4-target `ShareMenu` (live on jokes/image-riddles and
  quiz results per BUG-035); the surface the owner tested is either using a plain
  navigator.share button or not wired to ShareMenu — find which surface and wire it to the
  same component.

### BUG-048 — Like / comment / share counts should be visible to all users

- **Date found:** 2026-09-19
- **Area:** question engagement counters (likes / comments / shares)
- **Priority:** P2
- **Reported:** All the data should be visible to all users — the number of likes, comments,
  and shares per question.
- **Note:** needs public aggregate-count endpoints (or counts embedded in the question
  payload) + count chips in the question UI. Shares need a counted event (share intents are
  plain URLs today, so a client-side share event must fire when the target is chosen).
  Tension to resolve with BUG-037 (likes were specced internal-only with buckets): public
  per-question like counts are a different surface — owner's call stands as reported here.

### BUG-049 — Make each question (or its content) shareable with an icon

- **Date found:** 2026-09-19
- **Area:** quiz-mcq play page (e.g. `/quiz-mcq?subject=animals`)
- **Priority:** P2
- **Reported:** On the quiz play page, make each question (or its respective content)
  shareable via a share icon on the question.
- **Note:** the 4-target ShareMenu exists and is wired on quiz results and hub cards —
  per-question share is a new placement; decide what the share payload is (question text +
  play link, or result-style challenge text).

### BUG-050 — Comment click doesn't reach the comment section; can't delete own comment

- **Date found:** 2026-09-19
- **Area:** per-question comments (quiz/riddle question flow)
- **Priority:** P1
- **Reported:** Two symptoms reported together: (1) clicking comment does not
  redirect/scroll to the comment section; (2) after commenting, the owner could not delete
  their own comment.
- **Note:** (1) is likely a missing scroll/anchor or the collapsed 💬 chip not expanding on
  click; (2) needs delete-own wired on this surface (guest-scoped delete already exists in
  the comments API).

### BUG-051 — Games share flickers when clicked

- **Date found:** 2026-09-19
- **Area:** static games — share toggle (all 8)
- **Priority:** P2
- **Reported:** Clicking the Share option in the games causes flickering.
- **Note:** likely suspects: the reveal toggling layout (card height jump) or touch devices
  firing both pointerdown- and click-driven updates. Reproduce, then consider a
  smooth expand/collapse (no layout jump) and a single toggle event.
- **Resolved (2026-09-21):** both suspects confirmed — the row toggled `hidden` instantly
  (card height jump) and the runner games bound `copyResult` twice (double toast). All 8 games
  now animate the row (max-height/opacity collapse, `hidden` re-applied after the transition)
  with a single copy listener; asset URLs bumped to `?v=4`.

### BUG-052 — Answers in a 2-column layout; full-width stacked on small screens

- **Date found:** 2026-09-19
- **Area:** quiz/riddle answer options UI
- **Priority:** P2
- **Reported:** Two-column answer layout would be better — it covers less screen width;
  on small screen sizes the answers should stack full-width inside the container.
- **Note:** responsive: 2 columns on md+ screens, single full-width column below the
  breakpoint.
- **Analyzed (2026-09-19, owner suspected already implemented — confirmed in code):** the
  shared `components/quiz-mcq/AnswerOptions.tsx` (used by BOTH quiz `QuestionCard` and
  riddle `RiddleCard`, lines 135–141) already implements exactly this: 2 options →
  `grid-cols-1 sm:grid-cols-2`, 3 → `grid-cols-1 sm:grid-cols-3`, 4 →
  `grid-cols-1 sm:grid-cols-2` (2×2), open-ended → single column. Full-width stacked on
  small screens, adaptive columns on larger ones. No code change needed.
- **Design note:** the share-image designs (`designs/share-design-content-items.html`)
  mirror this same grid — 4 options render 2×2 in the share card.

### BUG-053 — Feedback inside games when paused or at game over

- **Date found:** 2026-09-19
- **Area:** static games — pause / game-over screens
- **Priority:** P2
- **Reported:** Feedback inside the game when paused or when the game is over.
- **Agreed design (owner 2026-09-19, "add as you planned"):** bottom of the pause/game-over
  card = a subtle last-row "💬 Feedback" ghost button; tapping it expands a collapsible
  section INSIDE the card (same pattern as the Share toggle) with an emoji rating
  (😞 😐 😊) + optional one-line text + Send. Primary actions (Retry) stay above it — the
  feedback slot is deliberately the lowest-attention spot, passive (never a prompt).
  Backend: reuse the comments service with a new FEEDBACK kind tagged with the game slug so
  entries land in the existing admin moderation panel; guest identity as for comments.
  Build notes: static games stay dependency-free (plain fetch to the comments API),
  version-bump asset URLs (?v=N) per the 4-hour /games cache rule.
- **Resolved (2026-09-21):** `kind='feedback'` + `contentType='game'` (contentId = game slug;
  comments.contentId widened uuid→text, migrations 1792100000000/1792200000000) accepted by
  the shared comments service; public feeds still exclude feedback — entries land in the admin
  moderation panel. A dependency-free `public/shared/pig-feedback.js` widget (ghost 💬 button +
  😞😐😊 + optional note) is included by all 8 games' pause/game-over cards; `?v` bumped.
  GUI-verified end-to-end against the local backend.

### BUG-054 — Riddle-mcq has no like, comment or share options

- **Date found:** 2026-09-20
- **Area:** riddle-mcq (question flow)
- **Priority:** P2
- **Reported:** In riddle-mcq there is no like, comment, or share option — implement them
  (quiz questions have them; riddles do not).
- **Owner clarification (2026-09-20):** keep like, comment and share TOGETHER as one action
  row, exactly like done in quiz-mcq's question (`components/quiz-mcq/QuestionCard.tsx`
  action row: `LikeButton` + comment toggle with public count chip + share button opening the
  ShareMenu, with the comments panel below).
- **Scope when picked up:** mirror that quiz-mcq action row on the riddle question card —
  `LikeButton` with riddle content type, comment toggle/panel (guest-scoped comments service),
  share → ShareMenu using the approved riddle question share design (teal gradient, riddle
  text + options in the image — `designs/share-design-system-report.md` #6). Fix the known
  open bugs first: like/comment persistence (BUG-045/046) and comment click/delete-own wiring
  (BUG-050) must work here too. No results screen exists yet (BUG-036 deferral), so the
  question card is the placement.

- **Resolved (2026-09-20):** unified action row shipped on the riddle question card —
  `LikeButton` moved out of its absolute corner into the row, Comment toggle with public
  count chip (internal `getCommentCounts('riddle-question')`), Share button opening the
  per-riddle ShareMenu (text payload per share-design-system §3 #6: riddle text + compact
  options A)…B)…, durable `/riddle-mcq` URL, answer never included). Comments panel below
  the options with the quiz-style Close button; comment wiring no longer gated on
  `answered` (available pre-answer like quiz; open still blocks advancing). Header mix-share
  upgraded from clipboard-only to the ShareMenu (mix payload, durable play URL); the dead
  clipboard toast removed. GUI-verified: action row renders pre-answer, ShareMenu payload
  correct, panel opens/closes; riddle-card suite 10/10.

### BUG-055 — Home share image: build the approved multi-platform design

- **Date found:** 2026-09-20
- **Area:** website share (home `og:image` + metadata)
- **Priority:** P2
- **Reported:** Owner finalised and approved a new home share design (supersedes the earlier
  "do not touch" — this entry is the tracked build). Current home image is the old text-only
  dynamic render; the approved design adds the pig icon, five product pillars, live totals and
  the domain pill.
- **Approved design:** ONE percentage-driven HTML template rendered by `next/og` for every
  platform — master 1200×630 1.91:1 (`og:image` for all surfaces) · 1200×600 2:1
  (`twitter:image`) · optional 1200×1200 1:1 (WhatsApp/iMessage thumb). Content (all inside the
  safe zone): pig icon + `siteName` wordmark (SEO settings) · tagline "Quizzes · Riddles · Dad
  Jokes · Image Puzzles · **Games**" (Games LAST, aligned with the stats line) · DYNAMIC stats
  line "11,541 questions · 3,000 riddles · 1,013 jokes · 1,906 image puzzles · 8 games"
  (live DB counts; count baked into the image URL so platforms refetch after content pushes) ·
  "PIGZAP.COM" pill. Decorative emojis 🧠🧩😂🖼️ in the bleed (opacity .12–.16).
- **Metadata (approved wording):** og:title "PigZap — Interactive Quizzes, Riddles & Dad Jokes" ·
  og:description "Play interactive quizzes, brain-teasing riddles, dad jokes and image puzzles on
  PigZap — test your knowledge and have fun!" · og:url https://pigzap.com · twitter:card
  summary_large_image (+ twitter title/description/image).
- **Implementation:** report WP0 (`designs/share-design-system-report.md`) — keep the dynamic
  `opengraph-image.tsx` mechanism, swap in this template; embed the icon for next/og.
- **Design references:** `designs/og-website-redesign-multiplatform.html` (all-platform template
  render) · `og-website-design-format.html` (annotated spec sheet) · `og-website-share-demo.html`
  (metadata + platform cards) · `og-website-1200x630.png` (reference render).

---

## Template for new findings

```markdown
### BUG-XXX — <title>

- **Date found:** YYYY-MM-DD
- **Area:** <module / page>
- **Priority:** P0–P3
- **Reported:** <what is wrong, from the owner's or tester's view>
- **Evidence:** <screenshot filenames / notes in `gui-test-screenshots/`>
```
