# TODO — Tracked Follow-ups

Logged decisions/flags from the capacity build so they don't get lost. Completed items move to the bottom.

## Open

### 1. image-riddles `stats/overview`: decide public vs admin-only

- **Status:** awaiting decision (recommendation given 2026-08-25, see below)
- **Current state:** public (`@_Public()`), returns aggregate counts only (total riddles/categories, per-difficulty counts, average timer) — no user data.
- **Recommendation:** keep **public**. It mirrors `riddle-mcq/stats/overview` and `quiz` public count surfaces, which the home/mode-picker pages consume for display; it leaks no sensitive data and is Redis-cacheable. If consistency with "all /stats under admin" is preferred, it's a one-line decorator removal + frontend fallback for the stats banner.

### 2. BullMQ reshuffle job for `random_weight`

- **Status:** deliberately not built (per scope decision).
- When mass deletions accumulate, weight distribution develops gaps near 1.0 → wrap-around logic covers correctness, but if uniformity matters add a periodic job: `UPDATE <table> SET random_weight = RANDOM()` for questions/riddle_mcqs.

## Done

- [x] 2026-08-25 — image-riddles route shadowing fixed: `GET :id` moved below literal routes (`status-counts`, `stats/overview`). Verified live: status-counts → 401 unauthenticated (was unreachable/shadowed), stats → 200, `:id` lookups unaffected. Commit: see git log "image-riddles route order".
- [x] 2026-08-25 — apps/backend/.env untracked (credential exposure); rotation of dev creds done; prod rotation pending before any deploy (see plan/capacity-plan.md Track C security note).
