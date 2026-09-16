# Build Backlog — Cross-Feature Launch Items

> This is the **execution list**: the open work that spans feature files or blocks "website complete."
> Each item links to its owning feature file, where the full detail and acceptance criteria live —
> update status in both places when working an item. Phase basis: same P0–P3 convention as the
> feature TODO files (see [TODO.md](TODO.md)).
> Reconciled 2026-09-16 against the codebase and the retired root `BACKLOG.md` (whose still-open
> items moved to [future-features.md](future-features.md)); shipped items now carry dates below.

## Open

| #   | Item                                                                                                                                                                                                                                                                                                                                                       | Priority | Effort       | Owning feature(s)                                                                                                 | Depends on   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------------- | ------------ |
| 2   | **Riddle MCQ server-side sessions/results** — quiz-mcq part is done (`POST /sessions`, `sessions/history`, `sessions/high-scores` live); riddle-mcq history/resume remain localStorage-only (`lib/riddle-progress.ts`, `lib/riddle-resume.ts`, by design so far). Scope when picked up: riddle sessions table + API, or one shared design both games adopt | P1       | **Large**    | [01 User Accounts](01-user-accounts.md), [03 Riddle MCQ](03-riddle-mcq.md), [06 Achievements](06-achievements.md) | DB migration |
| 8   | **Achievements for image-riddles / dad-jokes** — quiz-mcq AND riddle-mcq already unlock server-side with progress sync (verified 2026-09-05); no achievement definitions exist for image-riddles/jokes. Owner decision on definitions is the gate (sync pipeline `lib/achievements.ts` → `POST /achievements/sync` is reusable)                            | P1       | Small–medium | [06 Achievements](06-achievements.md)                                                                             | —            |

## Suggested execution order

8 → 2 (8 is small once the owner signs off on definitions; 2 is the largest remaining item).

## Done

- **#1 ToastContainer mounted** (P0, one line) — [09 Site Shell & SEO](09-site-shell-seo.md). Every toast (achievement unlocks, vote/save/media feedback) renders; re-verified 2026-09-16: `<ToastContainer />` is rendered in `app/providers.tsx`.
- **#3 Site Settings split-brain closed** (P1, medium) — [11 Site Settings](11-site-settings.md). Real API on both sides, no localStorage mock; gameplay timers read server settings (verified 2026-09-05).
- **#4 SEO basics** (P1, small–medium) — [09 Site Shell & SEO](09-site-shell-seo.md). `sitemap.ts`, `robots.ts`, OG/Twitter metadata in root layout (2026-09-05).
- **#5 Newsletter — simple email collection** (P1, small) — [14 Newsletter](14-newsletter.md). Subscribe/unsubscribe endpoints, footer form, admin tab with list, status filter, search, CSV export (2026-09-05; campaigns/double-opt-in deferred — future-features §6).
- **#6 Profile page UI** (P1, small) — [01 User Accounts](01-user-accounts.md). `/profile` view/edit live (2026-09-05).
- **#7 Legal pages** (P1, small) — [09 Site Shell & SEO](09-site-shell-seo.md). `/privacy`, `/terms`, `/contact` (2026-09-05; approved copy text still owner-gated — future-features §6).
- **#9 Engagement counters & explanations** (P1/P2, medium) — [04 Image Riddles](04-image-riddles.md), [02 MCQ Quiz](02-mcq-quiz.md). Persisted image-riddle views + quiz question `explanation` column; review UI renders it (2026-09-05).
