# Feature TODO System — Master Tracker

> One TODO file per feature in `plan/`, in **dependency/build order** (identity first, then content,
> then engagement, infrastructure, configuration, management, measurement):
> **Phase basis for every file:** P0 = critical/broken · P1 = major gaps · P2 = integration/quality · P3 = polish/tech debt
> (same convention as `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`, stated at the top of each file).
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
> management, and measurement), shifting Site Settings→10, Admin Dashboard→11, Analytics→12. Cross-references
> inside every file were updated to match — file numbers are now stable.

| #   | Feature          | File                                           | Status               |
| --- | ---------------- | ---------------------------------------------- | -------------------- |
| 1   | User Accounts    | [01-user-accounts.md](01-user-accounts.md)     | ✅ Done (2026-08-30) |
| 2   | MCQ Quiz         | [02-mcq-quiz.md](02-mcq-quiz.md)               | ✅ Done (2026-08-30) |
| 3   | Riddle MCQ       | [03-riddle-mcq.md](03-riddle-mcq.md)           | ✅ Done (2026-08-30) |
| 4   | Image Riddles    | [04-image-riddles.md](04-image-riddles.md)     | ✅ Done (2026-08-30) |
| 5   | Dad Jokes        | [05-dad-jokes.md](05-dad-jokes.md)             | ✅ Done (2026-08-30) |
| 6   | Achievements     | [06-achievements.md](06-achievements.md)       | ✅ Done (2026-08-30) |
| 7   | Comments         | [07-comments.md](07-comments.md)               | ✅ Done (2026-08-30) |
| 8   | Media Library    | [08-media.md](08-media.md)                     | ✅ Done (2026-08-30) |
| 9   | Site Shell & SEO | [09-site-shell-seo.md](09-site-shell-seo.md)   | ✅ Done (2026-08-30) |
| 10  | Site Settings    | [10-site-settings.md](10-site-settings.md)     | ✅ Done (2026-08-30) |
| 11  | Admin Dashboard  | [11-admin-dashboard.md](11-admin-dashboard.md) | ✅ Done (2026-08-30) |
| 12  | Analytics        | [12-analytics.md](12-analytics.md)             | ✅ Done (2026-08-30) |
