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

| ID      | Title                                                                          | Area                | Pri | Status   |
| ------- | ------------------------------------------------------------------------------ | ------------------- | --- | -------- |
| TASK-01 | Question-likes do not survive a refresh                                        | engagement          | P1  | Open     |
| TASK-02 | Analytics ingest retry can double-count events (C4)                            | analytics           | P1  | Open     |
| TASK-03 | BE-09 CSV leakage/ambiguity repairs + re-audit                                 | content data        | P1  | Open     |
| TASK-04 | H8 remainder: CSP nonces + HttpOnly token storage                              | security            | P2  | Open     |
| TASK-05 | Bulk import lacks status (image riddles, jokes) / hint (riddles)               | import (3 modules)  | P2  | Open     |
| TASK-06 | Analytics gaps: A5 events, A10 resume, A7 anchor, C1 purge, C2 tests, C3 cache | analytics           | P2  | Open     |
| TASK-07 | Analytics deferred: funnels, accuracy join, retention tests, ops metrics       | analytics           | P3  | Open     |
| TASK-08 | 10 TODO/FIXME markers in src                                                   | code cleanup        | P3  | Open     |
| TASK-09 | Games debt: AA contrast, reduced-motion, focus, daily picture, phone QA        | games               | P3  | Open     |
| TASK-10 | Dad jokes: saved jokes, JotD SSR, trending + share buttons                     | jokes (decision)    | P2  | Open     |
| TASK-11 | SEO: RSC landing pages, per-content routes, JSON-LD, OG, audit panel           | seo (decision)      | P2  | Open     |
| TASK-12 | Comments on quiz/riddle content (decision)                                     | comments (decision) | P3  | Open     |
| TASK-13 | SEC-07 email-verification gate (decision)                                      | auth (decision)     | P2  | Open     |
| TASK-14 | SEC-10/12 signed guest token for anonymous writes (decision)                   | security (decision) | P2  | Open     |
| TASK-15 | H1 server-side grading phase 2c (decision)                                     | security (decision) | P1  | Open     |
| TASK-16 | Admin user-mgmt UI; dashboard unification; guest-users activity                | admin (decision)    | P3  | Open     |
| TASK-17 | Installability: full manifest / theme-color (decision)                         | pwa (decision)      | P3  | Open     |
| TASK-18 | H9 rotate credentials + SSH/secrets hygiene                                    | ops (owner)         | P1  | Open     |
| TASK-19 | H6 restrict origin firewall to Cloudflare IPs                                  | ops (owner)         | P1  | Open     |
| TASK-20 | OPS-19 off-box backup replication + restore drill                              | ops (owner)         | P2  | Open     |
| TASK-21 | OPS-21 uptime/error alerting wiring                                            | ops (owner)         | P2  | Open     |
| TASK-22 | R2: confirm upload, custom domain, migrate media, token hygiene                | media (owner)       | P2  | Open     |
| TASK-23 | Deferred by owner (no action unless re-opened)                                 | various             | P3  | Deferred |

---

## Open

### TASK-01 - Question-likes do not survive a refresh

- **Date found:** 2026-09-22 (source: plan/17-question-engagement.md)
- **Area:** question engagement
- **Priority:** P1
- **Reported:** likes live in component state only - a refresh loses them; needs persistence.

### TASK-02 - Analytics ingest retry can double-count events

- **Date found:** 2026-09-22 (source: plan/13-analytics.md, C4)
- **Area:** analytics ingest
- **Priority:** P1
- **Reported:** client flush() re-queues the whole batch on POST failure; if the server persisted it, the retry double-counts. Needs an idempotency key.

### TASK-03 - BE-09 CSV leakage/ambiguity repairs + re-audit

- **Date found:** 2026-09-22 (source: audit)
- **Area:** content data
- **Priority:** P1
- **Reported:** measured leakage/ambiguity rows in the quiz/riddle CSVs; no repair script exists. Repair, re-audit, then push.

### TASK-04 - H8 remainder: CSP nonces + HttpOnly token storage

- **Date found:** 2026-09-22 (source: audit)
- **Area:** security / frontend
- **Priority:** P2
- **Reported:** baseline CSP ships with unsafe-inline; tokens sit in localStorage. Nonce the inline scripts; plan HttpOnly refresh cookies.

### TASK-05 - Bulk import lacks status / hint

- **Date found:** 2026-09-22 (source: plan/03, 04, 05)
- **Area:** import (3 modules)
- **Priority:** P2
- **Reported:** imported image riddles/jokes land DRAFT with no publish step; riddle bulk import drops hint (no hint button / hint_used analytics).

### TASK-06 - Analytics coverage gaps

- **Date found:** 2026-09-22 (source: plan/13: A5, A7 partial, A10, C1, C2, C3, D1)
- **Area:** analytics
- **Priority:** P2
- **Reported:** no content_viewed/search_performed events; resume-prompt decisions untracked; guest->registered anchor partial; no retention purge job; module has zero tests; 60s cache only; one stale doc section.

### TASK-07 - Analytics deferred items (rationale recorded)

- **Date found:** 2026-09-22 (source: plan/13: funnels, accuracy join, retention tests, B6/B7)
- **Area:** analytics
- **Priority:** P3
- **Reported:** additive once picked up; collection already in place.

### TASK-08 - TODO/FIXME markers in source (10)

- **Date found:** 2026-09-22 (code scan)
- **Area:** code cleanup
- **Priority:** P3

### TASK-09 - Games quality debt

- **Date found:** 2026-09-22 (source: plan/games/\*)
- **Area:** games
- **Priority:** P3
- **Reported:** AA contrast, reduced-motion variants, roving focus/arrow keys, daily-picture determinism, plus the owner""s 10-minute phone QA.

### TASK-10 to TASK-17 - Owner decisions (scope choices)

- **Date found:** 2026-09-22 (source: plan/05, 15, 07, audit, 01/12, 09)
- **Priority:** P1-P3
- **Reported:** dad-joke surfaces (saved jokes, JotD SSR, trending/share); SEO big rock (RSC landing pages, per-content routes+metadata, JSON-LD, per-module OG, audit panel, organic segmentation, robots control); comments on quiz/riddle; SEC-07 gate; SEC-10/12 guest token; H1 phase 2c grading; admin user-mgmt UI + dashboard unification; installability manifest.

### TASK-18 to TASK-21 - Owner / VPS operations

- **Date found:** 2026-09-22 (source: audit + plan/push-ownership-contract.md)
- **Priority:** P1-P2
- **Reported:** rotate credentials (admin/DB/Redis/JWT/OAuth) + SSH hardening + secret-history scan + audit logging; restrict origin firewall to Cloudflare IPs; off-box backups + restore drill; uptime/error alerting.

### TASK-22 - R2 media follow-ups

- **Date found:** 2026-09-22 (source: plan/17-r2-storage-setup.md)
- **Area:** media
- **Priority:** P2
- **Reported:** confirm one admin Media upload end-to-end; move off r2.dev to a custom domain; rclone-migrate existing media; token hygiene.

### TASK-23 - Deferred by owner (no action unless re-opened)

- **Date found:** 2026-09-22 (various plans, marked deferred/owner-accepted)
- **Priority:** P3
- **Reported:** riddle-mcq session persistence / JSON import-export / cache tuning; image-riddle server-side progress; admin-dashboard unification; games R2-2/R2-3 extras; LinkedIn + Pinterest share previews.

### BUG-XXX — <title>

- **Date found:** YYYY-MM-DD
- **Area:** <module / page>
- **Priority:** P0–P3
- **Reported:** <what is wrong, from the owner's or tester's view>
- **Evidence:** <screenshot filenames / notes in `gui-test-screenshots/`>

```

```
