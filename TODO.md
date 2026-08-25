# TODO — Tracked Follow-ups

Logged decisions/flags from the capacity build so they don't get lost. Completed items move to the bottom.

## Open

### 1. BullMQ reshuffle job for `random_weight`

- **Status:** deliberately not built (per scope decision).
- When mass deletions accumulate, weight distribution develops gaps near 1.0 → wrap-around logic covers correctness, but if uniformity matters add a periodic job: `UPDATE <table> SET random_weight = RANDOM()` for questions/riddle_mcqs.

## Resolved

### image-riddles `stats/overview`: public vs admin-only — **RESOLVED: keep public**

- **Decision:** 2026-08-25, confirmed by owner. Endpoint stays public, consistent with sibling endpoints (`riddle-mcq/stats/overview`, quiz/jokes/image-riddles public count surfaces).
- **Reasoning:** payload is pure aggregates (total riddles/categories, per-difficulty breakdown, average timer) with no user data; frontend home/mode-picker surfaces consume it for display; single count query, Redis-cacheable. No code change required.

## Done

- [x] 2026-08-25 — image-riddles route shadowing fixed: `GET :id` moved below literal routes (`status-counts`, `stats/overview`). Verified live: status-counts → 401 unauthenticated (was unreachable/shadowed), stats → 200, `:id` lookups unaffected. Commit: see git log "image-riddles route order".
- [x] 2026-08-25 — apps/backend/.env untracked (credential exposure); rotation of dev creds done; prod rotation pending before any deploy (see plan/capacity-plan.md Track C security note).
