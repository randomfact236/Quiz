# Feature 17 — Question Engagement (likes & like-buckets) (TODO & Status)

> **Phase basis (applies to all feature TODO files):** **P0** = critical/broken · **P1** = major gaps ·
> **P2** = integration/quality · **P3** = polish/tech debt. See `plan/STANDARDS.md` §1.
> Created 2026-09-20 to give per-question engagement a spec home — resolved from QA-FINDINGS
> **BUG-037**; companion to feature 07 (Comments) and feature 16 (Liked Categories, which is a
> different feature — category-level likes, do not merge).

---

## 1. Spec (owner-approved, resolved from BUG-037)

- **Question likes** — `LikeButton` on every quiz/riddle question (quiz `contentType='quiz'`,
  riddle `'riddle-question'`), guest/user dedupe, no login gate (same guest identity as comments).
- **Like buckets — INTERNAL ONLY (owner decision 2026-09-19):** every like is recorded and
  classified by count into three internal containers: **exactly-1 · exactly-2 · 3-and-above**.
  Questions never move; buckets are **derived** (GROUP BY like count), never stored membership.
  Purpose: a content-curation signal — once enough likes accumulate, the owner can publish
  selected questions under chosen headings. Publish-to-heading surfaces are **phase 2**,
  deliberately out of scope until the owner calls for them.
- **Admin view:** internal report of the three buckets (admin-only, no public exposure).

## 2. Status

- [x] Like capture on quiz + riddle question cards (`LikeButton` in the question action row —
      BUG-040 / BUG-054)
- [x] Bucket model finalized (internal-only, derived by count)
- [ ] **Question-likes persistence** — likes currently don't survive a refresh (QA-FINDINGS
      **BUG-045**, P1): likes table + API with per-guest unique constraint
- [ ] Internal bucket report surface (admin)
- [ ] Share-count events + public like/comment/share counters (QA-FINDINGS **BUG-048**)

## 3. Cross-feature touchpoints

- **Comments (07)** — the action-row neighbour; comment persistence tracked as QA-FINDINGS BUG-046.
- **MCQ Quiz (02) / Riddle MCQ (03)** — hosts of the unified question action row (likes · comments · share).
- **Liked Categories (16)** — separate feature; not merged with question likes.
