# Feature TODO System — Master Tracker

> One TODO file per feature in `plan/`, in **dependency/build order** (identity first, then content,
> then engagement, infrastructure, configuration, management, measurement).
> **Cross-feature launch items** (spanning several features, with priority/effort/execution order) are
> consolidated in **[BUILD-BACKLOG.md](BUILD-BACKLOG.md)** — start there when planning work.
> **Phase basis for every file:** P0 = critical/broken · P1 = major gaps · P2 = integration/quality · P3 = polish/tech debt
> (defined in `plan/STANDARDS.md` §1, stated at the top of each file).
>
> Old feature ledgers from `docs/features/` were archived to `docs/features/archive/` on 2026-08-30 via `git mv`
> (history preserved). Each was diffed against its last committed git version before archiving — all matched; nothing
> had been silently altered.
>
> **Archive status (2026-08-30): the archived ledgers were REMOVED.** History: they were first archived to
> `docs/features/archive/` via `git mv` (each verified identical to its last commit), then all repo references
> (plan docs, `docs/archive/README.md`, backend code comments in `image-riddles.controller.ts` /
> `image-riddles.service.ts`) were consolidated to point at the new `plan/0X-*.md` files, and finally the
> archive folder was deleted. Nothing references them; the `plan/0X-*.md` files are the sole feature ledgers.
> The old content remains recoverable from git history (pre-rename commits) if ever needed.
>
> Numbering notes: files were renumbered on 2026-08-30 from a first-draft order into the dependency order
> (user accounts 6→1, site settings 8→7, admin dashboard 7→8, analytics stays last). On the same day the list
> grew from 9 to 12: Comments, Media, and Site Shell & SEO were inserted at 07–09 (they precede configuration,
> management, and measurement). Then a third pass added **Landing Page & Shared UI at 10** (homepage, `/play`
> picker, health endpoints, shared UI kit — the last unowned code), shifting Site Settings→11,
> Admin Dashboard→12, Analytics→13. Cross-references inside every file were updated to match — file numbers
> are now stable.

| #   | Feature                  | File                                               | Status               |
| --- | ------------------------ | -------------------------------------------------- | -------------------- |
| 1   | User Accounts            | [01-user-accounts.md](01-user-accounts.md)         | ✅ Done (2026-08-30) |
| 2   | MCQ Quiz                 | [02-mcq-quiz.md](02-mcq-quiz.md)                   | ✅ Done (2026-08-30) |
| 3   | Riddle MCQ               | [03-riddle-mcq.md](03-riddle-mcq.md)               | ✅ Done (2026-08-30) |
| 4   | Image Riddles            | [04-image-riddles.md](04-image-riddles.md)         | ✅ Done (2026-08-30) |
| 5   | Dad Jokes                | [05-dad-jokes.md](05-dad-jokes.md)                 | ✅ Done (2026-08-30) |
| 6   | Achievements             | [06-achievements.md](06-achievements.md)           | ✅ Done (2026-08-30) |
| 7   | Comments                 | [07-comments.md](07-comments.md)                   | ✅ Done (2026-08-30) |
| 8   | Media Library            | [08-media.md](08-media.md)                         | ✅ Done (2026-08-30) |
| 9   | Site Shell & SEO         | [09-site-shell-seo.md](09-site-shell-seo.md)       | ✅ Done (2026-08-30) |
| 10  | Landing Page & Shared UI | [10-landing-shared-ui.md](10-landing-shared-ui.md) | ✅ Done (2026-08-30) |
| 11  | Site Settings            | [11-site-settings.md](11-site-settings.md)         | ✅ Done (2026-08-30) |
| 12  | Admin Dashboard          | [12-admin-dashboard.md](12-admin-dashboard.md)     | ✅ Done (2026-08-30) |
| 13  | Analytics                | [13-analytics.md](13-analytics.md)                 | ✅ Done (2026-08-30) |

## Progress snapshot (2026-08-30)

Completion = 100 minus a priority-weighted penalty for open tasks (P0 = −10, P1 = −5, P2 = −2, P3 = −1 each).
All 13 features are built and verified; the percentages measure remaining tracked work, not missing features.
Recompute after working any backlog item.

| Feature                | Open P0/P1/P2/P3          | Complete |
| ---------------------- | ------------------------- | -------- |
| 01 User Accounts       | 0/6/4/3                   | 59%      |
| 02 MCQ Quiz            | 0/4/5/4                   | 66%      |
| 03 Riddle MCQ          | 0/3/5/3                   | 72%      |
| 04 Image Riddles       | 0/3/4/3                   | 74%      |
| 05 Dad Jokes           | 0/3/4/4                   | 73%      |
| 06 Achievements        | 0/3/5/4                   | 71%      |
| 07 Comments            | 0/2/2/1                   | 85%      |
| 08 Media Library       | 0/2/3/1                   | 83%      |
| 09 Site Shell & SEO    | 1/3/3/2                   | 67%      |
| 10 Landing & Shared UI | 0/2/3/2                   | 82%      |
| 11 Site Settings       | 0/4/3/2                   | 72%      |
| 12 Admin Dashboard     | 0/3/4/3                   | 74%      |
| 13 Analytics           | 0/3/4/3                   | 74%      |
| **Overall**            | **1/41/49/35 (126 open)** | **≈73%** |
