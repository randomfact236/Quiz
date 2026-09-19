# QA Findings — Bug Tracker (OPEN ITEMS ONLY)

> **Policy (owner, 2026-09-19):** this file lists **open work only**. Resolved findings
> and per-session work logs are removed once fixed — their full history lives in **git
> history**: every fix commit references its BUG-XXX id (`git log --grep=BUG`), and
> verification screenshots remain in `gui-test-screenshots/`.
> Priority basis (same convention as `plan/STANDARDS.md` §1):
> **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality · **P3** = polish.

## Index

| ID      | Title                                                         | Area                  | Priority | Status   |
| ------- | ------------------------------------------------------------- | --------------------- | -------- | -------- |
| BUG-005 | Legal pages not finalized                                     | Legal pages           | P1       | Deferred |
| BUG-037 | Question like buckets: 1-like / 2-like / 3+-like containers   | quiz-mcq / riddle-mcq | P2       | Fixed    |
| BUG-038 | Client-side exception while loading ("Application error")     | Frontend (global)     | P1       | Resolved |
| BUG-039 | Mode selection: pre-open all levels in both modes             | quiz-mcq mode picker  | P2       | Fixed    |
| BUG-040 | Like + comment section on each question                       | quiz/riddle questions | P2       | Open     |
| BUG-041 | Easy mode: answers all in the same position; audit placement  | quiz/riddle content   | P1       | Fixed    |
| BUG-042 | Separate "Science & Nature" into Science and Nature           | quiz subjects         | P2       | Open     |
| BUG-043 | Riddle mode pages: hide category, difficulty + Mix only       | riddle-mcq mode pages | P2       | Fixed    |
| BUG-044 | Quiz mode pages: level selection block misplaced              | quiz-mcq mode pages   | P2       | Fixed    |
| BUG-045 | Question like not retained after refresh                      | per-question likes    | P1       | Open     |
| BUG-046 | Question comment not stored after refresh                     | per-question comments | P1       | Open     |
| BUG-047 | Share does not show the different social media with copy link | share UI (questions)  | P2       | Open     |
| BUG-048 | Like / comment / share counts visible to all users            | engagement counters   | P2       | Open     |

---

## Open

### BUG-005 — Legal pages not finalized

- **Date found:** 2026-09-16
- **Area:** Legal pages
- **Priority:** P1
- **Reported:** Legal pages need to be finalized (content review + sign-off).
- **Status:** DEFERRED by owner (2026-09-17). Drafts were completed 2026-09-16 — the
  PLACEHOLDER banners are gone and both pages carry full copy reflecting the site's actual
  practices (guest IDs, account data, first-party truncated-IP analytics, local-storage
  prefs, newsletter, comments). Re-opens only for the final legal review + sign-off when
  the owner resumes it.

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
