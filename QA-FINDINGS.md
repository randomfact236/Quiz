# QA Findings — Bug Tracker (OPEN ITEMS ONLY)

> **Policy (owner, 2026-09-19/20):** this file lists **open work only**. Resolved findings and
> logs are removed once fixed — resolved behaviours are documented in their respective feature
> files under `plan/` (quiz/riddle refinements in `plan/02`/`plan/03` §6; question engagement in
> `plan/17-question-engagement.md`); full history lives in **git history** (`git log --grep=BUG`).
> Verification screenshots remain in `gui-test-screenshots/`.
> Priority basis: **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality ·
> **P3** = polish.
> **Ordering rule (owner, 2026-09-20):** entries stay strictly chronological — **oldest on top,
> latest at the bottom**, in the exact order they were reported. Never grouped by feature/area
> and never re-sorted.

## Index

| ID      | Title                                                        | Area                 | Pri | Status |
| ------- | ------------------------------------------------------------ | -------------------- | --- | ------ |
| BUG-048 | Like / comment / share counts visible to all users           | engagement counters  | P2  | Open   |
| BUG-051 | Games share flickers when clicked                            | static games (share) | P2  | Open   |
| BUG-055 | Home share image: build approved multi-platform design (WP0) | website share (home) | P2  | Open   |

---

## Open

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
- **Verified in code (2026-09-20) — PARTIAL:** like counts public (LikeButton +
  `question-likes/counts`) and comment count chip live; **share counts still missing** (no
  share-count event anywhere). Remaining: count share-target clicks + expose totals.

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
- **Verified in code (2026-09-20) — STILL OPEN:** the toggle is an instant `hidden` flip
  (`.share-row[hidden]{display:none}`) with no transition — the card height jump on
  expand/collapse is the flicker. Fix: animate the reveal, keep the single click handler.

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

- **Verified in code (2026-09-20) — STILL OPEN:** `opengraph-image.tsx` still renders the
  old text-only design; the approved multi-platform template (WP0) is not applied yet.

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
