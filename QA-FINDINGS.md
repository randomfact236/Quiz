# QA Findings — Bug Tracker (OPEN ITEMS ONLY)

> **Policy (owner, 2026-09-19/20):** this file lists **open work only**. Resolved findings and
> logs are removed once fixed — resolved behaviours are documented in their respective feature
> files under `plan/`; full history lives in **git history** (`git log --grep=BUG` / `--grep=TASK`).
> Verification screenshots remain in `gui-test-screenshots/`.
> Priority basis: **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality ·
> **P3** = polish.
>
> **Ordering rule UPDATE (owner, 2026-09-22):** the 2026-09-20 rule ("strictly chronological,
> never regroup") is **superseded by owner request**. Final structure — **two groups**:
> **GROUP 1 · REQUIRED NOW** (resolve right now) and **GROUP 2 · HARDENING / FOR LATER**
> (security hardening, decision items, deferred). IDs are sequential per group
> (NOW-xx / HARD-xx); every entry keeps its **"was TASK-xx"** cross-reference so git
> history and earlier discussions stay resolvable. New findings: file into the matching
> group with that group's next free number.

## Index

### GROUP 1 · REQUIRED NOW

| ID     | Title                                                            | Was            | Area      | Pri | Work by       | Status                     |
| ------ | ---------------------------------------------------------------- | -------------- | --------- | --- | ------------- | -------------------------- |
| NOW-01 | Restrict origin firewall to Cloudflare IPs                       | TASK-19        | ops       | P1  | owner/VPS     | Fixed 2026-09-22           |
| NOW-02 | Rotate credentials + SSH/secrets hygiene                         | TASK-18        | ops       | P1  | owner/VPS     | Open (runbook ready)       |
| NOW-03 | SEO big rock: RSC landing pages, per-content routes, JSON-LD, OG | TASK-11        | seo       | P2  | code          | Fixed 2026-09-22           |
| NOW-04 | Off-box backup replication + restore drill                       | TASK-20        | ops       | P2  | owner/VPS     | Fixed 2026-09-22           |
| NOW-05 | Uptime/error alerting wiring                                     | TASK-21        | ops       | P2  | owner/VPS     | Fixed 2026-09-22\*         |
| NOW-06 | Analytics: retention purge (C1) + A5/A10 events, tests, cache    | TASK-06        | analytics | P2  | code          | Fixed 2026-09-22           |
| NOW-07 | 60 over-long DB riddles rewrite + live content push              | TASK-03 resid. | content   | P2  | owner/content | Draft ready — owner review |

### GROUP 2 · HARDENING / FOR LATER

| ID      | Title                                                              | Was                     | Type      | Pri  | Work by    |
| ------- | ------------------------------------------------------------------ | ----------------------- | --------- | ---- | ---------- |
| HARD-01 | ✅ CSP: games gap closed + nonce assessment — PARTIAL 2026-09-22   | TASK-04                 | security  | P2   | code       |
| HARD-02 | ✅ Server-side grading phase 2c — FIXED 2026-09-23                 | TASK-15                 | security  | P1\* | code       |
| HARD-03 | ✅ Signed guest token for anonymous writes — FIXED 2026-09-22      | TASK-14                 | security  | P2   | code       |
| HARD-04 | ✅ Bulk import status/hint gaps — FIXED 2026-09-22                 | TASK-05                 | quality   | P2   | code       |
| HARD-05 | R2 media follow-ups                                                | TASK-22                 | media/ops | P2   | owner+code |
| HARD-06 | ✅ Games a11y + CSP-clean — FIXED (phone QA owed)                  | TASK-09 rem.            | a11y      | P3   | code+owner |
| HARD-07 | Dad jokes surfaces: saved, JotD SSR, trending + share              | TASK-10 (DEC-01)        | decision  | P2   | decision   |
| HARD-08 | Comments on quiz/riddle content                                    | TASK-12 (DEC-02)        | decision  | P3   | decision   |
| HARD-09 | SEC-07 email-verification gate                                     | TASK-13 (DEC-03)        | decision  | P2   | decision   |
| HARD-10 | Admin user-mgmt UI + dashboard unification + guest activity        | TASK-16 (DEC-04)        | decision  | P3   | decision   |
| HARD-11 | Installability: full manifest / theme-color                        | TASK-17 (DEC-05)        | decision  | P3   | decision   |
| HARD-12 | Analytics deferred items (funnels, accuracy join, retention tests) | TASK-07 (DEC-06)        | decision  | P3   | decision   |
| HARD-13 | Owner-deferred bucket (no action unless re-opened)                 | TASK-23 (DEF-01)        | deferred  | P3   | deferred   |
| HARD-14 | Riddle share deep-link (needs session-contract change)             | TASK-27 resid. (DEF-02) | deferred  | P3   | deferred   |

\* HARD-02 was rated P1 by the audit; practical stakes are low (fun-quiz score integrity), so it sits in hardening.

---

## GROUP 1 · REQUIRED NOW

### NOW-01 - Restrict origin firewall to Cloudflare IPs (was TASK-19) - FIXED 2026-09-22

- **Date found:** 2026-09-22 (source: audit)
- **Area:** ops / VPS — **owner action**
- **Priority:** P1
- **Reported:** the origin serves 80/443 to the whole internet, so anyone who learns the
  origin IP bypasses Cloudflare (WAF, rate limits, DDoS shield).
- **Verified live 2026-09-22 (pre-fix):** direct probe of the origin IP with
  `Host: pigzap.com` returned **HTTPS 200 / HTTP 308** — the bypass was open.
- **Fixed 2026-09-22, applied + verified live:**
  - `ufw` enabled (was inactive): default-deny incoming, allow 22/tcp (rate-limited),
    80/443 tcp+udp from all Cloudflare ranges, 3000/tcp (Dokploy UI — see note), host-self.
  - The 80/443 block actually lives in the iptables **DOCKER-USER** chain — Docker's DNAT
    bypasses ufw's INPUT for published ports (proven: origin still answered with ufw
    active). `/usr/local/sbin/cf-docker-firewall.sh` (idempotent, CF lists cached with
    fallback) + `cf-docker-firewall.service` systemd unit re-applies at boot.
  - Post-fix probes: pigzap.com + api.pigzap.com via Cloudflare = 200; direct-origin
    https/http = **connection timeout (blocked)**; SSH intact throughout.
- **✅ Dokploy :3000 flag CLOSED 2026-09-23** (was: UI published on 0.0.0.0:3000):
  `cf-docker-firewall.sh` now appends owner-IP ACCEPT rules from
  `/etc/dokploy-allow-ips.list` (currently `27.34.64.78`) followed by a :3000 DROP for
  everyone else — IPv6 :3000 dropped outright (owner connects over IPv4). Verified live:
  Dokploy loads 200 via the owner path, site/API via Cloudflare unchanged, and the
  rules re-apply at boot via the same systemd unit. If the owner's IP rotates: edit
  `/etc/dokploy-allow-ips.list` + rerun the script (SSH-based reopen one-liner is
  `iptables -D DOCKER-USER -i eth0 -p tcp --dport 3000 -j DROP`).

### NOW-02 - Rotate credentials + SSH/secrets hygiene (was TASK-18)

- **Date found:** 2026-09-22 (source: audit + plan/push-ownership-contract.md)
- **Area:** ops / VPS — **owner action**
- **Priority:** P1
- **Reported:** rotate admin/DB/Redis/JWT/OAuth credentials, SSH hardening, secret-history
  scan, audit logging.
- **Context:** prod content was wiped once already (2026-09-17); credentials were not
  rotated as part of that recovery — treat this as the follow-up it deserves.
- **Status:** OPEN — needs the owner present (new secrets must be recorded by the owner).
  Runbook prepared 2026-09-22, stored at `plan/runbooks/credential-rotation.md`.

### NOW-03 - SEO big rock (was TASK-11) - FIXED 2026-09-22 (landing core; full RSC body conversion remains)

- **Date found:** 2026-09-22 (source: plan/15, audit)
- **Area:** seo — **code work**
- **Priority:** P2
- **Shipped 2026-09-22** (details in plan/15 §P2):
  - Real per-content segments **`/quiz-mcq/[subject]`** and **`/riddle-mcq/[category]`**:
    server pages (revalidate 3600) with per-content titles (live question/riddle counts),
    descriptions, canonicals, per-page OG images (existing /api/og types) and
    BreadcrumbList JSON-LD; hub views take `initialSubject`/`initialCategory` (query-param
    links unchanged); cards/back-links now use the segment form; sitemap emits segment
    URLs (fixed its riddle section, which emitted `?subject=` URLs the hub never read);
    `?subject=`/`?category=` wrappers canonicalize onto the segments while `?q=`/`?score=`
    share surfaces stay self-canonical (SHARE-01).
  - `src/middleware.ts` (matcher-scoped): unknown slugs get a real **307 → module hub**
    (slug lists cached 60s, fail-open). Reason: Next 15.5 streaming metadata flushes the
    200 shell before data-fetched notFound()/redirect() can resolve in-page.
- **Verified (prod build, `next start`):** science landing 200 with
  `<title>Science Quiz — 499 Questions</title>` + segment canonical + og:image +
  2×JSON-LD; brain-teasers landing 200 with segment canonical; unknown slugs 307 with
  `location: /quiz-mcq|/riddle-mcq`; `/quiz-mcq/play` + hubs unaffected; sitemap.xml
  lists segment URLs; frontend tsc + build clean.
- **Remaining (owner go):** full RSC conversion of hub/section bodies (plan/15 P2 item),
  GSC integration, organic segmentation (P3).

### NOW-04 - Off-box backup replication + restore drill (was TASK-20) - FIXED 2026-09-22

- **Date found:** 2026-09-22 (source: OPS-19)
- **Area:** ops / VPS — **owner action**
- **Priority:** P2
- **Reported:** backups live on the same VPS they protect — single point of failure.
- **Verified 2026-09-22:**
  - Off-box replication was already wired by the parallel session (rclone remote `r2` in
    backup.sh, 2026-09-21) — confirmed working: 2 objects in `r2:quiz-backups/db`, last
    night's 2.1MB dump copied at 03:30.
  - **Restore drill PASS:** `quiz_db_20260922_033002.sql.gz` restored into a throwaway
    postgres:18 container — counts matched the prod snapshot exactly (questions 11,541 /
    riddle_mcqs 3,000 / users 1 / comments 3 / question_likes 6); analytics_events grew
    on prod since the snapshot, as expected.
  - Drill finding fixed: dump emitted 38 `OWNER TO` errors in a fresh container →
    backup.sh now uses `--no-owner --no-privileges` (drill logged in
    `/opt/quiz-backups/README.md`).

### NOW-05 - Uptime/error alerting wiring (was TASK-21) - FIXED 2026-09-22 (one owner step left)

- **Date found:** 2026-09-22 (source: OPS-21)
- **Area:** ops / VPS — **owner action**
- **Priority:** P2
- **Wired 2026-09-22, live:** `/usr/local/bin/quiz-uptime.sh` on a 1-minute cron checks
  https://pigzap.com/ + the API summary endpoint, counts consecutive failures (state in
  `/opt/quiz-alerts/`), fires `{text:...}` JSON webhooks on failure AND recovery, and
  dead-man-pings a heartbeat URL on every clean run.
- **Owner step (only thing missing — no channel existed on the VPS):** create a free
  healthchecks.io check (or Discord/Slack/Telegram webhook) and put it in
  `/opt/quiz-alerts/alert.env` as `HEARTBEAT_URL=` and/or `ALERT_WEBHOOK=` — no restart
  needed; the script reads it per run.

### NOW-06 - Analytics: retention purge + coverage gaps (was TASK-06) - FIXED 2026-09-22

- **Date found:** 2026-09-22 (source: plan/13: A5, A7 partial, A10, C1, C2, C3, D1)
- **Area:** analytics — **code work**
- **Priority:** P2
- **Fixed 2026-09-22** (checkboxes in plan/13 §4b updated):
  - **C1** `analytics-retention.service.ts`: in-process job (boot+45s, then every 24h),
    deletes raw rows older than `ANALYTICS_RETENTION_MONTHS` (default 13) in 5k-row
    `DELETE … RETURNING` batches, invalidates `analytics:*` caches on deletion; 6 unit
    tests.
  - **A5** `content_viewed` (quiz subject view, riddle category, image-riddle category,
    joke category) + `search_performed` (jokes server search, image-riddles client search).
  - **A10** `resume_prompt_shown` / `resume_declined` for quiz + riddle resume prompts.
  - **A7** Google-only signups now emit `signup_completed` (method google) via the
    OAuth-code exchange with `isNewUser`, fired BEFORE guest-id rotation so the funnel
    join key survives.
  - **C2** partial (ingest idempotency 8 + retention 6 tests; DB-harness SQL tests still
    deferred per plan), **C3** reviewed/documented, **D1** analytics doc refreshed.
- **Verified:** backend tsc clean; analytics suites 14/14 pass; frontend tsc clean.

### NOW-07 - 60 over-long DB riddles + live content push (was TASK-03 residue)

- **Date found:** 2026-09-22 (source: TASK-03 repair report)
- **Area:** content — **owner/content judgment + push**
- **Priority:** P2
- **Status:** DRAFT READY 2026-09-22 — all 60 rows exported from prod (with options +
  answer letters) and proposed ≤220-char rewrites written to
  `scripts/overlong-riddle-rewrites-DRAFT.tsv` for owner review. **Nothing has been
  pushed** — apply only after the owner approves wording, then the standing post-push
  rule: flush `quiz:*`/`riddle-mcq:*` redis keys (BUG-038).
- **⚠️ New finding from the drafting pass (owner must judge):** the 30 open-answer rows
  are **self-contradictory as stored in prod** — the question says the bakery receipt
  _clears_ the culprit, yet the stored answer IS that culprit (explanations blame a
  jogger instead). Confirmed 30/30. The draft rewrites them as "stale/fake alibi" so the
  stored answer becomes deducible, flagged CAUTION per row. Additionally, the 30 MCQ
  rows' stored **explanations are inverted** (they praise the answer's alibi the puzzle
  refutes). Both need an owner decision + an explanation-rewrite pass in the same
  content push.

---

## GROUP 2 · HARDENING / FOR LATER

### HARD-01 - CSP nonces + HttpOnly token storage (was TASK-04) - PARTIALLY FIXED 2026-09-22

- **Date found:** 2026-09-22 (source: audit)
- **Area:** security / frontend — **code work**
- **Priority:** P2
- **Reported:** baseline CSP ships `'unsafe-inline'` (verified: `apps/frontend/next.config.mjs:89`);
  tokens sit in localStorage. Nonce the inline scripts; plan HttpOnly refresh cookies.
- **What was actually fixed 2026-09-22 — the real CSP gap:**
  - Prod probe showed app pages served CSP fine, but **the eight static games
    (`/games/<slug>/index.html`) served NO CSP at all** — public/ static files bypass
    `next.config` headers().
  - `middleware.ts` now decorates every `/games/*` response with the strictest policy on
    the site: `script-src 'self'`, no remote anything, `connect-src` allows only same
    origin + the API origin (pig-feedback.js posts game feedback there, BUG-053).
    Verified against the games' actual HTML (same-origin assets + data: favicons only).
    Verified on prod build: game page 200 with the CSP; app routes unaffected.
- **Why full nonces are NOT being done (assessment, not deferral):** nonces require
  dynamic rendering, and three parts of this site are structurally incompatible —
  (a) prerendered/ISR pages embed the generation-time nonce, which a later request's
  CSP rejects (blocked hydration); (b) the games' static HTML `<script src>` tags can't
  carry per-request nonces and `strict-dynamic` would block them; (c) Next's own
  bootstrap scripts only auto-nonce on dynamic routes. `'unsafe-inline'` on app pages
  stays as the documented residual risk — it weakens XSS defense-in-depth but is not an
  active hole.
- **HttpOnly refresh-cookie half:** remains a design decision (changes the guest/auth
  flow the owner deliberately kept friction-free) — parked with the owner.

### HARD-02 - Server-side grading phase 2c (was TASK-15) - FIXED 2026-09-23

- **Date found:** 2026-09-22 (source: audit, H1 phase 2c)
- **Area:** security — **code work**
- **Priority:** P1 by audit; practical stakes low (devtools can manipulate a fun-quiz score)
- **Fixed 2026-09-23 (H1 phase 2c complete — see plan/02 H1 todo):**
  - All three graders (quiz / riddle / image-riddle answers-check) now return the
    VERDICT ONLY — they previously echoed the answer key on every call.
  - Graders grade by OPTION TEXT (shuffle-proof): the BUG-041 serve-shuffle remaps the
    served letter per response, so the old letter-vs-stored-letter grading was wrong
    whenever the correct value moved slots — latent bug fixed en route.
  - New throttled reveal endpoints (quiz/riddle answers/reveal, image-riddles
    answers/reveal) serve the key ONLY for post-session review / give-up reveal.
  - Play reads stripped of the key: quiz random/mixed/by-level/by-id play; riddle
    subject riddles/mixed/random/by-id; image-riddle search ships `answerLength`
    instead of the answer.
  - Frontend: quiz + riddle engines grade via the server (verdict attached to the
    question objects — scoring/streaks/review/analytics switch automatically);
    verdicts persist in resume snapshots (old snapshots keep their embedded keys as
    fallback); image-riddle game grades via the server and reveals on correct guess
    or explicit give-up.
- **Verified:** backend 129/129 + tsc; frontend 561/561 + tsc; Playwright play-throughs
  quiz 7/7 and riddle 4/4 (grader called per answer, verdict-only responses, feedback
  rendered, zero page errors); image-riddle API probes (catalog stripped, wrong guess
  verdict-only, reveal serves the answer).

### HARD-03 - Signed guest token for anonymous writes (was TASK-14) - FIXED 2026-09-22

- **Date found:** 2026-09-22 (source: audit, SEC-10/12)
- **Area:** security — **code work**
- **Priority:** P2
- **Reported:** guest ids for likes/comments are unsigned → forgeable (like/comment spam
  vector). Sign the guest token server-side.
- **Fixed 2026-09-22** (SEC-12 binding; locally committed, goes live on next push):
  - `guest-token.service.ts`: `token = HMAC-SHA256(GUEST_TOKEN_SECRET‖JWT_SECRET, guestId)`;
    `POST /guest-users/token` (throttled 10/min) issues `{guestId, token}`, signing either
    a server-minted `srv_…` id or an EXISTING legacy `guest_…` id as-is — the migration
    path that keeps every existing visitor's likes/comments matching.
  - `GuestTokenGuard` enforces the pair on the identity-authorizing writes: like
    (`POST /question-likes`), comment create + delete-own, guest activity heartbeat,
    and login merge. Verified constant-time.
  - Frontend: `ensureGuestToken()` caches the pair, attaches it on all four write
    helpers (like, post comment, delete-own, login merge); a 403 auto-re-issues once
    and retries (heals stale cached tabs); `rotateGuestId()` drops the pair so the
    next guest can't reuse it.
- **Scope notes:** comment `flag` has no identity to bind (idempotent by comment id);
  analytics ingest keeps unsigned guestId (read-only attribution, not a write);
  duels' own guestId endpoints (join/leave/name) are game-scoped and get the token
  binding in a follow-up pass.
- **Verified:** backend tsc clean; guest-token spec 6/6; full frontend suite 561/561;
  full backend suite green.

### HARD-04 - Bulk import status/hint gaps (was TASK-05) - FIXED 2026-09-22

- **Date found:** 2026-09-22 (source: plan/03, 04, 05)
- **Area:** import (3 modules) — **code work**
- **Priority:** P2
- **Reported:** imported image riddles/jokes land DRAFT with no publish step; riddle bulk
  import drops hint (no hint button / hint_used analytics). Only bites the admin
  bulk-import path — the content pipeline (push-content.mjs) is unaffected.
- **Fixed 2026-09-22 (audit found the finding partly stale):**
  - Riddles: bulk import already carried hint AND status end-to-end (import service
    honours `dto.hint`/`dto.status`; admin ImportModal maps both columns).
  - Image riddles: `CreateImageRiddleDto` gained optional validated `status`;
    createRiddle (single + bulk) applies `dto.status ?? DRAFT`; the admin import hook
    maps an optional `status` column (previously: toggle each riddle after import).
  - Jokes: `CreateDadJokeDto` gained optional `status`; single + bulk creation honour
    it. The jokes import modal ADVERTISED a `status` column but the mapping dropped it —
    now passed through.
  - Default remains DRAFT everywhere when no status is supplied (safe-by-default).
- **Verified:** backend tsc clean; frontend tsc clean.

### HARD-05 - R2 media follow-ups (was TASK-22)

- **Date found:** 2026-09-22 (source: plan/17-r2-storage-setup.md)
- **Area:** media — **owner + code**
- **Priority:** P2
- **Reported:** confirm one admin Media upload end-to-end (untested path); move off
  `r2.dev` (rate-limited, not meant for prod) to a custom domain; rclone-migrate existing
  media; token hygiene.

### HARD-06 - Games a11y polish + phone QA (was TASK-09 remainder) - FIXED 2026-09-23 (owner phone QA remains)

- **Date found:** 2026-09-22 (source: plan/games/\*)
- **Area:** games — **code + owner 10-min phone QA**
- **Priority:** P3
- **Fixed 2026-09-23:**
  - AA contrast (computed WCAG audit, 7 games): muted text #64748b failed on the page
    gradient (2.93-3.81:1) → #475569 (worst case 4.67:1); dark-theme primary buttons
    #3b82f6 failed with white text (3.68:1) → #2563eb (5.17:1).
  - Sliding-puzzle: segmented radio groups (picture-mode, size-cards) got roving
    tabindex + arrow-key selection; round start focuses the board (board focusable).
  - All 8 games verified zero JS errors and zero CSP violations (games CSP completed
    with the two inline theme-loader script hashes).
- **Remaining (owner):** the 10-minute phone QA pass.

### HARD-07 - Dad jokes surfaces (was TASK-10, briefly DEC-01) — DECISION

- **Date found:** 2026-09-22 (source: plan/05) — saved jokes, JotD SSR, trending + share buttons. P2.

### HARD-08 - Comments on quiz/riddle content (was TASK-12, briefly DEC-02) — DECISION

- **Date found:** 2026-09-22 (source: plan/07) — P3.

### HARD-09 - SEC-07 email-verification gate (was TASK-13, briefly DEC-03) — DECISION

- **Date found:** 2026-09-22 (source: audit) — real consideration, low actual risk; adds
  signup friction the owner has resisted before. P2.

### HARD-10 - Admin user-mgmt UI + dashboard unification + guest activity (was TASK-16, briefly DEC-04) — DECISION

- **Date found:** 2026-09-22 (source: plan/09) — note: "dashboard unification" overlaps
  HARD-13's deferred "admin-dashboard unification"; dedupe when deciding. P3.

### HARD-11 - Installability: full manifest / theme-color (was TASK-17, briefly DEC-05) — DECISION

- **Date found:** 2026-09-22 (source: audit) — related: manifest still carries the
  hardcoded "AI Quiz" branding (see rebrand state). P3.

### HARD-12 - Analytics deferred items (was TASK-07, briefly DEC-06) — DECISION

- **Date found:** 2026-09-22 (source: plan/13: funnels, accuracy join, retention tests, B6/B7) —
  additive once picked up; collection already in place. P3.

### HARD-13 - Owner-deferred bucket (was TASK-23, briefly DEF-01) — DEFERRED

- **Date found:** 2026-09-22 — riddle-mcq session persistence / JSON import-export / cache
  tuning; image-riddle server-side progress; admin-dashboard unification (see HARD-10);
  games R2-2/R2-3 extras; LinkedIn + Pinterest share previews. P3.

### HARD-14 - Riddle share deep-link (was TASK-27 residue, briefly DEF-02) — DEFERRED

- **Date found:** 2026-09-22 — riddle question shares still use the hub `?q=` form; the
  riddle play flow has no shared-start contract (subjectId/level based, no in-session
  question identity). Implementing means changing the riddle session contract — deferred
  with reason when TASK-27 shipped. P3.

---

## Resolved — 2026-09-22 sweep (original IDs kept for git traceability; ages out per policy)

- **TASK-01** likes survive refresh — already shipped (`5ee5ab7`/`2c86cfc`); verified API + Playwright E2E.
- **TASK-02** analytics double-count — `clientEventId` + unique index + dedupe; migration `1793100000000`; 117 backend tests pass; live double-POST verified.
- **TASK-03** CSV leakage/ambiguity — `scripts/repair-be09-csv.py` + `repair-be09-db.sql`, 10 rows fixed both sides, re-audit clean; residue -> NOW-07.
- **TASK-08** TODO/FIXME markers — **non-issue**: all 10 hits were comments referencing the TODO.md _file_, not markers.
- **TASK-24/25/26** Memory Quiz — grid answers tappable (`bf55e38`+), swap reveal order, level-clear focus crash; E2E 39/39.
- **TASK-27** quiz share deep-link — play URLs with `qid=<uuid>`, resolve by identity, "Unvisited" chip opt-in; Playwright PASS; riddle side -> HARD-14.

Commits: `c4faea6` (TASK-01/02/03/27), `6b0b7bc` (TASK-09 partial), `bf55e38`+ (TASK-24/25/26).
