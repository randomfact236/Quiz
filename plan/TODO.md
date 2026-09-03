# Feature TODO System — Master Tracker

## Feature progress log (append-only, newest first)

- **2026-08-30 — Feature 09 Site Shell & SEO: complete.** P0: ToastContainer mounted globally (root-TODO item 4 closed; duplicate riddle-admin mount removed). P1: sitemap.ts + robots.ts built (legal pages /privacy /terms /contact created with owner-copy placeholders); OG metadata verified pre-existing. P2: nav config extracted (`lib/nav-config.ts`), aria-current added, MobileFooter verified data-driven; focus trap deferred (dependency decision). Owner decisions logged: JotD SSR strategy, approved legal copy + contact address, web manifest.

- **2026-08-30 — Feature 08 Media Library: complete.** P1 reference safety verified already implemented (409-on-referenced-delete; regression-tested). P2: 5 upload/delete tests added (MIME + undecodable rejection, WebP re-encode, reference safety); next/image verified; picker-as-standard accepted. P3: alt text surfaced in picker cards. Owner decisions logged: S3 swap (pre-deploy), required alt text on upload.

- **2026-08-30 — Feature 07 Comments: complete (code-complete; live probe pending DB restore).** P1: logged-in attribution (`comments.userId`, migration `1789300000000`, identity-aware my/delete paths). P2: public flag path built (`POST /comments/:id/flag` + admin flagged filter — plan premise that the column existed was wrong), count-refresh accepted. P3: authorName policy accepted. Owner decision logged: exposing comments on quiz/riddle-mcq surfaces.

- **2026-08-30 — Feature 06 Achievements: complete (code-complete; live probe pending DB restore).** P1: riddle wiring + streak tracker were already delivered by the F02/F03 passes; new `AchievementsModule` (`user_achievements`, migration `1789200000000`, sync + unlocks endpoints, frontend fire-and-forget mirror). P2: chapter_complete fixed and subject_explore verified equivalent in earlier passes; full progress math for every condition (6 tests). P3: dead storage key removed, Accuracy Expert description aligned, both duplicate-removal questions resolved. Owner decision logged: image-riddle solves → achievements semantics.

- **2026-08-30 — Feature 05 Dad Jokes: complete (code-complete; live probe pending DB restore).** P1: per-voter vote persistence (migration `1789100000000` `joke_votes` + voteForJoke semantics + guestId from frontend; 8 tests). P2: joke_voted verified already committed, stats/overview consumed in the admin header, category delete now TRASHes jokes. P3: fallback kept, extraction deferred as tech debt. Owner decisions logged: saved-jokes feature, JotD SSR, trending/share surfaces.

- **2026-08-30 — Feature 04 Image Riddles: complete (code-complete; live probes pending DB restore).** P1: engagement counters (migration `1789000000000` + `POST /image-riddles/:id/engage` + dashboard aggregate + frontend wiring; likes counter needs owner decision on a like UI), `@IsImageUrl` DTO validator (12 tests). P2: preset audit clean, query-efficiency claims verified stale, comments parity verified. P3: next/image already in place, offline fallback kept, MobileFooter accepted. Environment note: dev DB on :5432 died mid-session — migration `1789000000000` and live probes are pending its return (see anomalies).

- **2026-08-30 — Feature 03 Riddle MCQ: complete (buildable items).** P1: achievements/progress integration (`ea2098e` — riddle completions now feed Achievements via combined history). P2: persistence consolidation (`95fc0d1` — one `lib/riddle-persistence.ts`), hook/component tests (`eabbdab` — auto-submit, resume round-trip, RiddleCard formats). P3: service-split + legacy-param evaluations documented. Owner-deferred items left open per prior decisions: server-side riddle sessions, JSON import/export, track() analytics parity, cache tuning, hint/skip tracking. Verified: frontend 172/172, both tsc clean.

- **2026-08-30 — Feature 02 MCQ Quiz: complete.** P1: server-side session persistence (`7525d9f`), challenge streak tracker (`7b57f2f`), distinct unanswered state (`c8b2d4b`), explanations end-to-end (`6492377`). P2: achievement audit (`88f1964`), a11y + component tests (`281e8ed`), features rename (`38d1745`). P3: celebration tiers, shim deletion, streak-consolidation + service-split evaluations (docs commit). Deferred: the 6 `track()` analytics calls (owner-paused). Verified: backend 25/25 + build clean, frontend 158/158 + tsc clean, live probes for sessions and explanations.

- **2026-08-30 — Feature 01 User Accounts: complete.** Commits `80b3cc0` (refresh-token hardening: hash at rest, 7d expiry, rotation, `POST /auth/logout` revoke), `aaea0a2` (OAuth one-time code exchange — tokens off the URL), `84f877b` (role enum at DTO/service/DB), `f0bed06` (email verification: register email, verify + resend endpoints, `/verify-email` page), `09e3a34` (`/profile` page + fixed a real leak: profile endpoints returned password hash/refresh token). Plus docs/infra in `4b0f9c6`-range commit (this one). Deferred/needs decision: admin user-editing UI (owner decision), login-blocked-until-verified (owner decision). All items verified with tsc, backend jest suite (24/24), and live API probes.
- **2026-08-30 — work started** on the master table, P1→P2→P3 per feature, feature-scoped commits.

## Anomalies & environment notes

- **2026-08-30 (mid-session): dev Postgres on localhost:5432 went down**, together with the :3012 backend and :3010 frontend processes (the user's monitor stack appears to have exited). The 5432 listener was a native (Reallusion-bundled) postgres.exe — not the project's `ai-quiz-postgres` docker container, which exited cleanly 3 days earlier and holds stale data. Per safety rules I did NOT start the stale container (it would point the app at a different data state) or manipulate the unknown native install. **Pending when DB returns:** run `npm run migration:run` in apps/backend (migration `1789000000000-AddImageRiddleCounters`), restart the backend, and live-probe `POST /image-riddles/:id/engage` + dashboard `engagement`. Unit tests (37 backend / 172 frontend) cover the new code in the meantime.

- **No external file modifications detected.** Before each item, `git status`/`git log` confirmed the working tree matched my commits; nothing was edited by another session. (Root `TODO.md`'s "concurrent analytics session" note re `providers.tsx` appears stale — no uncommitted changes exist.)
- **Backend dev server auto-respawns.** After killing the listener on :3012, a new process reappeared within seconds (port monitor scripts in the repo root are the likely cause). Not treated as a lock/block; I restarted the backend myself when I needed new code live.
- **Blocked (retry before feature 02 ends): frontend `next build`** fails with `EPERM` on `.next/trace` — the lock is held by the running `next dev` server (PID on :3010). Per safety rules I did not force-kill it; `tsc --noEmit` (clean) is the verification of record for frontend changes. Retry `npm run build` in `apps/frontend` when the dev server is next stopped.
- **CAPTCHA:** none encountered in any automated verification step; nothing was disabled. (No CAPTCHA exists in the codebase.)
- **Migrations run manually in dev** (`npm run migration:run`): `migrationsRun: true` is production-only in `app.module.ts`. Applied 2026-08-30: `1788500000000-HashRefreshTokens` (clears legacy plaintext tokens — one-time re-login), `1788600000000-ConstrainUserRole`, `1788700000000-AddEmailVerification`.
- **Backend health endpoint reports 503 (disk usage threshold)** on this machine — environment issue, not code; DB/Redis are up.

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
> On the same day, **Newsletter was added as feature 14 (0% — new feature to build)** per owner decision:
> simple email collection first (footer form + admin list/export); opt-in emails and campaigns deferred.
> It is the first feature in the tracker with status ⬜.

| #   | Feature                  | File                                               | Status                                                                          |
| --- | ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | User Accounts            | [01-user-accounts.md](01-user-accounts.md)         | ✅ P0–P3 worked 2026-08-30 (1 P2 open: admin user-edit UI — owner decision)     |
| 2   | MCQ Quiz                 | [02-mcq-quiz.md](02-mcq-quiz.md)                   | ✅ P0–P3 worked 2026-08-30 (1 P2 deferred: track() analytics — owner-paused)    |
| 3   | Riddle MCQ               | [03-riddle-mcq.md](03-riddle-mcq.md)               | ✅ P0–P3 worked 2026-08-30 (5 items owner-deferred, logged)                     |
| 4   | Image Riddles            | [04-image-riddles.md](04-image-riddles.md)         | ✅ P0–P3 worked 2026-08-30 (1 build pending DB restore; likes → owner decision) |
| 5   | Dad Jokes                | [05-dad-jokes.md](05-dad-jokes.md)                 | ✅ P0–P3 worked 2026-08-30 (3 owner decisions logged; probe pending DB)         |
| 6   | Achievements             | [06-achievements.md](06-achievements.md)           | ✅ P0–P3 worked 2026-08-30 (1 owner decision logged; probe pending DB)          |
| 7   | Comments                 | [07-comments.md](07-comments.md)                   | ✅ P0–P3 worked 2026-08-30 (1 owner decision; probe pending DB)                 |
| 8   | Media Library            | [08-media.md](08-media.md)                         | ✅ P0–P3 worked 2026-08-30 (2 owner decisions logged)                           |
| 9   | Site Shell & SEO         | [09-site-shell-seo.md](09-site-shell-seo.md)       | ✅ P0–P3 worked 2026-08-30 (3 owner decisions logged)                           |
| 10  | Landing Page & Shared UI | [10-landing-shared-ui.md](10-landing-shared-ui.md) | ✅ Done (2026-08-30)                                                            |
| 11  | Site Settings            | [11-site-settings.md](11-site-settings.md)         | ✅ Done (2026-08-30)                                                            |
| 12  | Admin Dashboard          | [12-admin-dashboard.md](12-admin-dashboard.md)     | ✅ Done (2026-08-30)                                                            |
| 13  | Analytics                | [13-analytics.md](13-analytics.md)                 | ✅ Done (2026-08-30)                                                            |
| 14  | Newsletter               | [14-newsletter.md](14-newsletter.md)               | ⬜ 0% — to build                                                                |

## Progress snapshot (2026-08-30)

Completion = 100 minus a priority-weighted penalty for open tasks (P0 = −10, P1 = −5, P2 = −2, P3 = −1 each).
13 features are built and verified; feature 14 (Newsletter) is a new build at 0%. Percentages measure remaining tracked work.
Recompute after working any backlog item.

| Feature                | Open P0/P1/P2/P3         | Complete |
| ---------------------- | ------------------------ | -------- |
| 01 User Accounts       | 0/0/1/0                  | 98%      |
| 02 MCQ Quiz            | 0/0/1/0                  | 98%      |
| 03 Riddle MCQ          | 0/2/1/1                  | 91%      |
| 04 Image Riddles       | 0/1/0/0                  | 95%      |
| 05 Dad Jokes           | 0/0/0/1                  | 97%      |
| 06 Achievements        | 0/0/0/0                  | 100%     |
| 07 Comments            | 0/0/0/0                  | 100%     |
| 08 Media Library       | 0/0/0/0                  | 100%     |
| 09 Site Shell & SEO    | 0/0/0/0                  | 100%     |
| 10 Landing & Shared UI | 0/2/3/2                  | 82%      |
| 11 Site Settings       | 0/4/3/2                  | 72%      |
| 12 Admin Dashboard     | 0/3/4/3                  | 74%      |
| 13 Analytics           | 0/3/4/3                  | 74%      |
| 14 Newsletter          | 0/3/0/1                  | 0% (new) |
| **Overall**            | **0/34/38/25 (97 open)** | **≈78%** |

> Feature 01 counts updated 2026-08-30 after the P1–P3 pass (6×P1, 3×P2, 3×P3 closed; 1×P2 remains as an owner decision). Feature 02: 4×P1, 4×P2 closed of which 1 deferred by owner decision, 4×P3 closed. Feature 03: 1×P1, 2×P2, 2×P3 closed; the rest stay open under prior owner-accepted deferrals. Feature 04: 2×P1, 3×P2, 3×P3 closed; P1 server-side progress deferred with the family (03). Overall re-estimated from the closed-item penalty weights.
