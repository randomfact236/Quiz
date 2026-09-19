# QA Findings — Bug Tracker (OPEN ITEMS ONLY)

> **Policy (owner, 2026-09-19):** this file lists **open work only**. Resolved findings
> and per-session work logs are removed once fixed — their full history lives in **git
> history**: every fix commit references its BUG-XXX id (`git log --grep=BUG`), and
> verification screenshots remain in `gui-test-screenshots/`.
> Priority basis (same convention as `plan/STANDARDS.md` §1):
> **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality · **P3** = polish.

## Index

| ID      | Title                                                       | Area                  | Priority | Status   |
| ------- | ----------------------------------------------------------- | --------------------- | -------- | -------- |
| BUG-005 | Legal pages not finalized                                   | Legal pages           | P1       | Deferred |
| BUG-037 | Question like buckets: 1-like / 2-like / 3+-like containers | quiz-mcq / riddle-mcq | P2       | Open     |

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
