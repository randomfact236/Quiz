# Feature TODO System — Master Tracker

> One TODO file per feature in `plan/`, in **dependency/build order** (identity first, then content,
> then aggregation, configuration, management, measurement):
> **Phase basis for every file:** P0 = critical/broken · P1 = major gaps · P2 = integration/quality · P3 = polish/tech debt
> (same convention as `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`, stated at the top of each file).
>
> Old feature ledgers from `docs/features/` were archived to `docs/features/archive/` on 2026-08-30 via `git mv`
> (history preserved). Each was diffed against its last committed git version before archiving — all matched; nothing
> had been silently altered.
>
> **Archive status (2026-08-30): the archived ledgers are OBSOLETE and safe to delete.** Every reference in the
> repo (plan docs, `docs/archive/README.md`, backend code comments in `image-riddles.controller.ts` /
> `image-riddles.service.ts`) has been consolidated to point at the new `plan/0X-*.md` files, and each archived
> file carries an OBSOLETE banner naming its replacement. Deleting `docs/features/archive/` breaks nothing —
> the content remains recoverable from git history if ever needed.
>
> Numbering note: files were renumbered on 2026-08-30 from a first-draft order into the dependency order
> below (user accounts 6→1, site settings 8→7, admin dashboard 7→8, analytics stays last). Cross-references
> inside every file were updated to match — file numbers are now stable.

| #   | Feature         | File                                           | Status               |
| --- | --------------- | ---------------------------------------------- | -------------------- |
| 1   | User Accounts   | [01-user-accounts.md](01-user-accounts.md)     | ✅ Done (2026-08-30) |
| 2   | MCQ Quiz        | [02-mcq-quiz.md](02-mcq-quiz.md)               | ✅ Done (2026-08-30) |
| 3   | Riddle MCQ      | [03-riddle-mcq.md](03-riddle-mcq.md)           | ✅ Done (2026-08-30) |
| 4   | Image Riddles   | [04-image-riddles.md](04-image-riddles.md)     | ✅ Done (2026-08-30) |
| 5   | Dad Jokes       | [05-dad-jokes.md](05-dad-jokes.md)             | ✅ Done (2026-08-30) |
| 6   | Achievements    | [06-achievements.md](06-achievements.md)       | ✅ Done (2026-08-30) |
| 7   | Site Settings   | [07-site-settings.md](07-site-settings.md)     | ✅ Done (2026-08-30) |
| 8   | Admin Dashboard | [08-admin-dashboard.md](08-admin-dashboard.md) | ✅ Done (2026-08-30) |
| 9   | Analytics       | [09-analytics.md](09-analytics.md)             | ✅ Done (2026-08-30) |
