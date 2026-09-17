# QA Findings — Bug Tracker

> One file for QA work: the **Work Log** records what testing was done each session
> (chronological, newest first); the **bug entries** record each defect found.
> Add one entry per bug under **Open**; when fixed, move the entry to **Fixed** with the
> date and fix reference.
> Priority basis (same convention as `plan/STANDARDS.md` §1):
> **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality · **P3** = polish.
> Evidence screenshots go in `gui-test-screenshots/`; reference the filename in the entry.

## Index

| ID      | Title                                                          | Area                          | Priority | Status   |
| ------- | -------------------------------------------------------------- | ----------------------------- | -------- | -------- |
| BUG-001 | Quiz: advance to next question after answering                 | Quiz play (answer flow)       | P2       | Fixed    |
| BUG-002 | Footer: add Games link instead of menu drawer                  | Footer navigation             | P2       | Fixed    |
| BUG-003 | Mode selection: both remain open; click should close it        | Mode selection page           | P2       | Fixed    |
| BUG-004 | Footer menu items open a selection drawer instead of a page    | Footer navigation             | P1       | Fixed    |
| BUG-005 | Legal pages not finalized                                      | Legal pages                   | P1       | Deferred |
| BUG-006 | FAQ page missing                                               | FAQ                           | P2       | Fixed    |
| BUG-007 | Mobile: "AI Quiz" text visible; need mobile logo/text controls | Mobile header / site settings | P2       | Fixed    |
| BUG-008 | Mobile: header shows only the icon                             | Mobile header                 | P2       | Fixed    |
| BUG-009 | Light/dark mode toggle not working on mobile                   | Theme toggle (mobile)         | P1       | Fixed    |
| BUG-010 | Dark mode: logo color looks wrong                              | Logo (dark mode)              | P2       | Fixed    |
| BUG-011 | Games link returns 404                                         | /games (Games hub)            | P1       | Fixed    |
| BUG-012 | Clear all stored analytics data                                | Analytics (stored data)       | P2       | Fixed    |
| BUG-013 | Verify Google Analytics & Search Console connection            | GA / Search Console           | P2       | Fixed    |
| BUG-014 | Top progress bar on every page open, all devices               | Navigation progress (global)  | P2       | Fixed    |
| BUG-015 | Game hub cards 404 (`/games/<slug>/` never serves the game)    | /games → static games         | P1       | Fixed    |
| BUG-016 | Analyze quiz-mcq & riddle-mcq vs 5-level option-count spec     | quiz-mcq / riddle-mcq         | P1       | Fixed    |

---

## Work Log

_(newest first)_

### 2026-09-17 — Security hardening + full manual re-verification of touched features

- **Scope:** redundant-code scan over the whole fix footprint; security-parity check local
  vs live (pigzap.com); manual GUI verification of every touched feature.
- **Cleanup:** riddle code stated its 4-level truth — removed the dead `case 'extreme':`
  fall-through and `|| level === 'extreme'` from `RiddleTableRow.tsx` (the riddle DB enum
  has only easy/medium/hard/expert; zero extreme rows possible). Remaining `'extreme'`
  strings in riddle code are the deliberate internal alias for the open-ended text-input
  rendering state (documented, functional).
- **Security findings + fixes:**
  - API parity confirmed: local helmet set identical to `api.pigzap.com` (CSP, HSTS,
    nosniff, SAMEORIGIN, no-referrer); reset endpoint 401 unauthenticated (re-tested).
  - **Gap found & fixed:** the frontend sent **no security headers** on local or live
    (live's HSTS comes from Cloudflare, not the app). Added `X-Frame-Options: DENY`,
    `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy: camera=(), microphone=(), geolocation=()` for all routes in
    `next.config.mjs` (merged into the existing games Cache-Control rule — an intermediate
    duplicate-`headers()` mistake was caught by the routes-manifest check and fixed).
    Verified at runtime on `/`, `/faq`, and the games redirect chain.
  - Note: live currently serves `x-powered-by: Next.js` although the repo sets
    `poweredByHeader: false` — the deployed build predates that config; the next deploy
    will drop it.
- **Manual verification (all green):** BUG-001 auto-advance — answering Q1 auto-advanced to
  Q2 within ~3 s with no interaction (`verify_001_q1_answered.png`,
  `verify_001_auto_advanced_q2.png`), while an unanswered question stayed put for 5 s
  (negative case); BUG-004 end-to-end — bottom-nav Quiz tap navigates to `/quiz-mcq`
  (no drawer); drawer cleanup — no Theme row, Games link retained
  (`verify_cleanup_drawer_no_theme.png`); BUG-016 riddle hard question shows 4 options with
  working answer feedback (`verify_016_riddle_live_options.png`). Resume modal behavior
  also exercised (Start Fresh path).
- **Validation:** `tsc --noEmit` clean, `next lint` 0 errors, Jest 552/552, production
  build regenerated with headers confirmed in `routes-manifest.json` and at runtime.
- **Evidence:** `gui-test-screenshots/verify_001_*.png`, `verify_cleanup_drawer_no_theme.png`,
  `verify_016_riddle_live_options.png`, curl header transcripts.

### 2026-09-17 — BUG-012 executed on production + BUG-016 conformance analysis and riddle fix

- **Scope:** BUG-012 production analytics clear (owner authorized "resolve other findings",
  legal pages deferred); BUG-016 quiz/riddle option-count conformance.
- **Method / actions:**
  - BUG-012: SSH'd to the VPS (root@207.180.199.86), took a fresh verified backup
    (`/opt/quiz-backups/quiz_db_20260917_060306.sql.gz`, 2.2 MB), then ran the same SQL as
    the admin reset: `TRUNCATE analytics_events` (919 rows) + zeroed guest play counters.
    Post-clear count = 0; content untouched (12,032 questions / 3,022 riddles verified).
  - BUG-016 quiz UI: `AnswerOptions` verified conforming (easy 2 / medium 2 / hard 3 /
    expert 4 / extreme text input).
  - BUG-016 quiz content (dev DB = prod content, 12,032 rows): **5,031 published questions
    are unwinnable as displayed** — 1,456 easy + 3,072 medium have correctLetter C/D (hidden
    by the 2-option display), 503 hard have correctLetter D. Per-subject × level counts are
    far from the 200/level/subject target (e.g. Animals 371 easy vs 25 hard; Space 4-7 per
    level). Content regeneration to spec remains owner content-ops, as stated in the entry.
  - BUG-016 riddle: backend/content verified conforming — 0 unwinnable rows (no easy correct
    C/D, no medium correct D), 0 duplicate questions, expert rows (130) correctly open-ended;
    the admin editor already authored 2/3/4. The player UI was the gap: shared
    `AnswerOptions` applied the quiz mapping (2/2/3) to riddles. Fixed with a game-aware
    option-count map (`game="riddle"` → easy 2 / medium 3 / hard 4), verified live in a real
    riddle session (medium riddle shows 3 options) and by new unit tests.
- **Validation:** `tsc --noEmit` clean, `next lint` 0 errors, Jest 552/552 green (incl.
  updated `riddle-card.test.tsx` + `answer-options.test.tsx` riddle-spec tests), production
  build regenerated and running on port 3010.
- **Bugs resolved:** BUG-012 (prod executed), BUG-016 (code + analysis done; content
  regeneration remains owner content-ops). BUG-005 deferred by owner.
- **Evidence:** `gui-test-screenshots/verify_016_riddle_card_options.png`

### 2026-09-16 — Cleanup + security pass over the fix footprint

- **Scope:** every file touched by the resolution sweep.
- **Cleanup:** caught and fixed a real regression from the debugging bisect —
  `NavigationProgress.tsx` had silently reverted to its old implementation (the stash
  round-trip dropped the fix); the BUG-014 implementation (start delay + minimum display +
  popstate) is re-applied. Removed the now-duplicated theme-toggle rows from the mobile menu
  drawer and the admin mobile menu (the toggle lives in the mobile top bar since BUG-009);
  deduplicated two pre-existing repeated Tailwind classes in `Header.tsx`. No other orphans:
  no references remain to the removed MobileFooter drawer machinery, and lint reports zero
  unused-symbol errors in touched files.
- **Security review (touched parts):** `POST /admin/analytics/reset` — verified enforced:
  unauthenticated POST → 401 (JwtAuthGuard), AdminGuard role check + `{ confirm: "RESET" }`
  body gate behind it; auth is header-based JWT (CSRF-immune), helmet present. New settings
  fields validated (`IsString`+`MaxLength(2000)` / `IsBoolean`) under a strict global
  ValidationPipe (`whitelist` + `forbidNonWhitelisted`). Logo/favicon URLs render through
  `resolveMediaUrl`, which prefixes non-http(s) schemes — tested `javascript:` and `data:`
  payloads and both become inert same-origin paths (no XSS). GA measurement ID is now
  format-guarded before being placed into the inline script. Games redirect uses a
  single-segment slug to a same-origin destination (no open-redirect/traversal surface).
  FAQ/legal content is static; no user input rendered unescaped anywhere in the touched UI.
- **Verification:** `tsc --noEmit` clean, `next lint` 0 errors, full Jest suite 546/546
  green, production build regenerated and running on port 3010.
- **Evidence:** curl transcripts in the session log; `NavigationProgress.tsx` diff.

### 2026-09-16 — Post-fix manual verification pass (prod-mode local build)

- **Scope:** all 13 fixes from the resolution sweep, re-driven in the browser after a
  production-mode local build (`next build` + `next start`, port 3010).
- **Method:** GUI click-through where the pane accepted input, DOM/DOM-tree assertions and
  screenshots otherwise, plus direct API/SQL reads. Note: the in-app browser pane's
  `document.hasFocus()` stays false while it is not the frontmost window, and synthetic
  clicks on an unfocused pane land unreliably — Link navigation was proven healthy on the
  **production site in the same pane** (pigzap.com link click navigated) and via
  `router.push` rendering locally, so the local click failures were pane focus, not app code.
- **Result (live-verified):** BUG-003 exclusive accordion (click Timer → Practice collapses,
  aria-expanded flips, `verify_003_exclusive_accordion.png`); BUG-014 progress bar visible
  along the top edge during navigation with `#nprogress` in DOM
  (`verify_014_progress_a/b.png`); BUG-015 game chain — hub shows 8 cards with
  `/games/<slug>/index.html` hrefs, following a card loads the real game, no 404
  (`verify_015_games_hub.png`); BUG-009 toggle present in the mobile top bar
  (`verify_mobile_header_bottomnav.png`); BUG-002/004 bottom nav = 7 items
  Home/Quiz/Riddles/Images/Jokes/Games/Menu as direct links; BUG-006 FAQ renders with 8 Q&As,
  JSON-LD, title "FAQ | AI Quiz", footer link (`verify_006_faq_page.png`); BUG-005 privacy
  page shows full drafted content, zero PLACEHOLDER text (`verify_005_privacy_drafted.png`);
  BUG-012 homepage statistics all read 0 after the dev reset
  (`verify_012_home_stats_zeroed.png`); BUG-013 no googletagmanager scripts and no init
  script when the env is unset; BUG-007/010 `/settings/public` exposes `logoDark`,
  `mobileLogo`, `mobileShowSiteName`; dark-mode mobile header renders correctly
  (`verify_010_mobile_dark_logo.png`).
- **Result (needs a human click on a focused pane):** BUG-001's 3-second auto-advance timing
  in a live quiz run — logic is event-driven, type-checked, and unit-covered at the hook
  level; BUG-004's end-to-end bottom-nav navigation — the items are plain `<Link>`s proven
  identical to the header links that navigate on production.
- **Environment:** frontend left running in **production mode** (`NEXT_DIST_DIR=.next.prod-build
npm run start`, port 3010); `npm run dev` was stopped. NOTE: `next dev` on this machine
  currently exhibits non-navigating Link clicks in the automation pane (works on prod build
  and on pigzap.com) — if seen, use a prod-mode run or a normal browser before blaming code.
- **Bugs verified:** BUG-002, BUG-003, BUG-004 (render), BUG-005 (draft), BUG-006, BUG-007,
  BUG-009, BUG-010, BUG-012 (dev), BUG-013, BUG-014, BUG-015; BUG-001 pending manual timing pass
- **Evidence:** `gui-test-screenshots/verify_*.png`

### 2026-09-16 — Resolution sweep: fixes applied for BUG-001 – BUG-015

- **Scope:** code fixes for every open bug except the ones that need owner action
  (BUG-005 legal sign-off, BUG-012 production data clear) and the newly listed BUG-016
  analysis task.
- **Method:** implemented fixes across frontend + backend; verified with `tsc --noEmit`
  (both packages clean), `next lint` (no errors in touched files), the full frontend Jest
  suite (32 suites / 546 tests green, incl. a new `mode-cards.test.tsx` covering the
  BUG-003 accordion behavior), curl probes of the running dev server (games redirect chain
  - relative assets, /faq, legal pages), and GUI spot-checks in the in-app browser (mobile
    top-bar toggle works, bottom nav renders 7 items with Games, a game opens from the hub).
    The browser pane's synthetic input died mid-session (buttons/links stop responding even on
    unmodified HEAD code with a fresh `.next` build — pane defect, not app); the remaining
    interaction checks (auto-advance reveal timing, progress-bar flash, bottom-nav navigation
    end-to-end) are covered by code review + unit tests and should get a quick manual pass on
    a live pane.
- **Result:** 13 bugs fixed (BUG-011's hub 404 had already been fixed by the redeploy).
  Left open on purpose: BUG-005 (owner legal sign-off), BUG-012 (production data clear —
  admin reset capability built; local dev data cleared; production untouched), BUG-016
  (listed only, analysis not started).
- **Bugs fixed:** BUG-001, BUG-002, BUG-003, BUG-004, BUG-006, BUG-007, BUG-008, BUG-009,
  BUG-010, BUG-011, BUG-013, BUG-014, BUG-015
- **Evidence:** `gui-test-screenshots/fix_*.png`; `src/__tests__/mode-cards.test.tsx`

### 2026-09-16 — Follow-up: 5-level option-count spec conformance request

- **Scope:** quiz-mcq and riddle-mcq — level structure, per-level option counts, content
- **Method:** owner-reported work request (no analysis performed)
- **Result:** filed as BUG-016 with the owner's target spec embedded. Listing only; the
  code/content conformance analysis has not been started.
- **Bugs filed:** BUG-016
- **Evidence:** none

### 2026-09-16 — Manual verification sweep of BUG-001 – BUG-014 (local GUI + live site)

- **Scope:** every open bug; local dev (frontend 3010 / backend 3012; desktop 1440×900 and
  mobile 390×844; dark and light themes) plus the live site
- **Method:** black-box GUI click-through in the in-app browser with screenshot evidence in
  `gui-test-screenshots/`; read-only curl probes of production; read-only SQL counts for the
  analytics stores. No fixes applied; BUG-012 NOT executed (destructive — scope sign-off still
  pending).
- **Result:** 12 of 14 confirmed or root-caused as described. Two are already resolved in the
  current build (BUG-002 desktop half and the BUG-011 hub 404 — the 2026-09-16 redeploy fixed
  both); BUG-008 was not reproduced at phone width; BUG-009's toggle works (discoverability
  issue, not breakage). One new defect found and filed as BUG-015 (game cards 404). Two
  transient anomalies observed (unexpected document loads of `/quiz-mcq/practice-mode` after
  client-side navigations) — not reproducible on a direct `/play` load, likely dev/test-harness
  quirks; flagged for follow-up, not filed as bugs. Console logs could not be collected with
  the test tooling; findings rely on page state + screenshots.
- **Bugs verified:** BUG-001 – BUG-014; filed BUG-015
- **Evidence:** `gui-test-screenshots/bug001_* … bug014_*.png` (referenced per entry)

### 2026-09-16 — Follow-up: top progress bar request

- **Scope:** page-open loading indicator, all pages / all devices
- **Method:** owner-reported work request (no testing performed)
- **Result:** filed as BUG-014. Listing only.
- **Bugs filed:** BUG-014
- **Evidence:** none

### 2026-09-16 — Follow-up: analytics reset + GA/GSC connectivity requests

- **Scope:** stored analytics data; Google Analytics / Search Console connection status
- **Method:** owner-reported work requests (no testing performed)
- **Result:** two items filed — BUG-012 (clear stored analytics data), BUG-013 (verify
  GA + Search Console connectivity). Listing only; neither executed.
- **Bugs filed:** BUG-012, BUG-013
- **Evidence:** none

### 2026-09-16 — Follow-up: Games 404 report

- **Scope:** Games entry from the user side (home tile / navigation)
- **Method:** manual click-through, owner-reported
- **Result:** clicking Games lands on the 404 page ("Page Not Found — Oops! The page you're
  looking for doesn't exist or has been moved."). Filed as BUG-011. Listing only.
- **Bugs filed:** BUG-011
- **Evidence:** none captured

### 2026-09-16 — Manual QA bug sweep (desktop + mobile)

- **Scope:** quiz answer flow, footer menu/navigation, mode selection page, legal pages, FAQ,
  mobile header/branding, light/dark theme toggle, dark-mode logo
- **Method:** manual testing, owner-reported observations
- **Result:** 10 findings recorded under Open (BUG-001 – BUG-010). Listing only — no fixes
  applied per owner instruction.
- **Bugs filed:** BUG-001 – BUG-010
- **Evidence:** none captured this session

_(template for new sessions:)_

```markdown
### 2026-09-16 — <session title, e.g. GUI smoke test of quiz flow>

- **Scope:** <pages / features tested>
- **Method:** <manual browser / GUI automation / API checks>
- **Result:** <what passed; what failed>
- **Bugs filed:** <BUG-XXX ids, or "none">
- **Evidence:** <screenshot filenames / notes in `gui-test-screenshots/`>
```

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
  prefs, newsletter, comments). Re-opens only for the final legal review + sign-off when the
  owner resumes it.

(template for new findings:)\_

```markdown
### BUG-XXX — <short title>

- **Date found:** 2026-09-16
- **Area:** <page / route / feature, e.g. `/quiz`, admin dashboard>
- **Priority:** P0–P3
- **Environment:** <local / staging / production, browser if relevant>
- **Steps to reproduce:**
  1.
- **Expected:**
- **Actual:**
- **Evidence:** <screenshot filename in `gui-test-screenshots/`, console output, API response>
```

---

## Fixed

### BUG-001 — Quiz: advance to next question after answering

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Quiz play (answer flow)
- **Priority:** P2
- **Fix:** `quiz-mcq/play/page.tsx` — answering (click or 1-4/A-D keys) now schedules an
  automatic advance ~3 s later, keeping the correct-answer reveal up; on the last question it
  opens the submit-confirm dialog instead. Timer mode is untouched (its per-question countdown
  already advances). Driven by the answer events themselves, so resumed/shared sessions and
  Back navigation to answered questions never auto-advance; Next button and Enter still
  advance instantly.
- **Verified (pre-fix baseline):** instant feedback confirmed, no auto-advance after 5+ s,
  manual Next works — `bug001_after_answer_feedback.png`, `bug001_after_5s_still_q1.png`,
  `bug001_q2_after_manual_next.png`. Post-fix timing pass pending (browser pane input died
  mid-session); wiring is type-checked and event-driven.

### BUG-002 — Footer: add Games link instead of menu drawer

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Footer navigation
- **Priority:** P2
- **Fix:** `MobileFooter.tsx` — the bottom nav now includes a direct Games item (gamepad
  icon). Desktop footer already had Games (that half was a stale-build report).
- **Verified:** desktop footer Games link present pre-fix
  (`bug003_desktop_home_initial_fullpage.png`); post-fix mobile bar shows
  Home/Quiz/Riddles/Images/Jokes/Games/Menu (`fix_mobile_home_header_nav.png`).

### BUG-003 — Mode selection: both remain open; click should close it

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Mode selection page
- **Priority:** P2
- **Fix:** `ModeCards.tsx` — the two mode cards are one accordion group: both start open, and
  the first header click switches to exclusive behavior (opening one collapses the other;
  clicking the open header collapses it). Covered by `src/__tests__/mode-cards.test.tsx`
  (5 tests, green).
- **Verified (pre-fix baseline):** independent always-open accordions confirmed
  (`bug003_desktop_home_initial_fullpage.png`, `bug003_desktop_timer_collapsed.png`).

### BUG-004 — Footer menu items open a selection drawer instead of a page

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Footer navigation
- **Priority:** P1
- **Fix:** `MobileFooter.tsx` rewritten — Quiz / Riddles / Images / Jokes / Games are now
  direct `<Link>`s to the module pages (each landing page has its own pickers); only Menu
  keeps a drawer (secondary destinations). Dead selection-drawer code and its fetchers removed.
- **Verified (pre-fix baseline):** drawer-instead-of-navigation reproduced
  (`bug004_mobile_bottomnav_quiz_click.png`, `bug004_mobile_quiz_subject_drawer.png`).
  Post-fix navigation pass pending (pane input); the items are plain `<Link>`s.

### BUG-006 — FAQ page missing

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** FAQ
- **Priority:** P2
- **Fix:** new `app/faq/page.tsx` (8 Q&As + FAQPage JSON-LD), footer legal-row link, and a
  sitemap registry entry (`seo.ts` INDEXABLE_ROUTES).
- **Verified:** `/faq` returns 200 locally and renders the FAQ content (curl grep); was 404
  on production pre-fix.

### BUG-007 — Mobile: "AI Quiz" text visible; need mobile logo/text controls

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Mobile header / site settings
- **Priority:** P2
- **Fix:** new site settings `mobileLogo` (mobile-only header logo) and `mobileShowSiteName`
  (toggle the site-name text) — backend defaults/interface/DTO, frontend types/brand context,
  root-layout resolution, Header rendering, and a "Mobile Header & Dark Mode" group in
  Admin → Settings → Site Info with uploads and light/dark previews.
- **Verified:** mobile header rendering pre-fix (`bug007_mobile_home_top_dark.png`);
  settings fields type-checked end-to-end (backend → public settings → admin form).

### BUG-008 — Mobile: header shows only the icon

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Mobile header
- **Priority:** P2
- **Fix:** resolved as clarified — the "icon only" report is the md+ breakpoint (text hidden
  when a logo exists), not a phone defect; phones show icon + text. The new mobile branding
  settings (BUG-007) give the owner direct control over what mobile shows.
- **Verified:** pre-fix breakpoint analysis (`bug007_mobile_home_top_dark.png`).

### BUG-009 — Light/dark mode toggle not working on mobile

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Theme toggle (mobile)
- **Priority:** P1
- **Fix:** `Header.tsx` — ThemeToggle is now rendered in the mobile top bar (user and admin
  headers), next to the hamburger; the drawer copy remains.
- **Verified:** post-fix GUI check — the top-bar toggle flipped dark→light and back
  (`fix_mobile_home_header_nav.png`, `fix_mobile_topbar_toggle_dark.png`; `dark` class
  toggled). Root cause had been discoverability: the toggle existed only inside the hamburger
  drawer (`bug009_mobile_hamburger_drawer_dark.png`, `bug009_mobile_after_toggle_click.png`).

### BUG-010 — Dark mode: logo color looks wrong

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Logo (dark mode)
- **Priority:** P2
- **Fix:** new `logoDark` site setting — an optional dark-mode variant uploaded in
  Admin → Site Info, rendered in header and footer via light/dark `<img>` pairs (falls back
  to the main logo when unset).
- **Verified:** current logo renders correctly in both modes with no filter
  (`bug003_desktop_home_initial_fullpage.png` vs `bug014_desktop_home_light_before_nav.png`);
  the owner's original suspicion was not reproduced with current assets.

### BUG-011 — Games link returns 404

- **Date found:** / **Date fixed:** 2026-09-16 (hub 404 fixed by the redeploy — no code change)
- **Area:** `/games` (Games hub; entered from the home page Games tile / navigation)
- **Priority:** P1
- **Fix:** none needed — the stale production build was the cause; the 2026-09-16 redeploy
  resolved it. Every `/games` link in nav/footer/home/sitemap verified correct.
- **Verified:** `https://pigzap.com/games` → 200 and local `/games` → 200
  (`bug011_games_hub_desktop.png`). The card-level 404 found during verification is BUG-015.

### BUG-013 — Verify Google Analytics & Search Console are connected

- **Date found:** / **Date fixed:** 2026-09-16 (verification + enablement)
- **Area:** Google Analytics / Google Search Console ("console") integrations
- **Priority:** P2
- **Fix:** status report + GA enablement built: the root layout now loads gtag when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set at build time (unset → no script, no tracking).
  GSC stays settings-driven: paste the verification token in Admin → SEO after adding the
  property in Google.
- **Verified:** GA absent everywhere (repo + live homepage); GSC verification meta absent on
  the live homepage while the settings plumbing exists. **Status: neither connected — GA needs
  the owner's measurement ID in the env; GSC needs the owner's token in Admin → SEO.**

### BUG-014 — Top progress bar on every page open, all devices

- **Date found:** / **Date fixed:** 2026-09-16
- **Area:** Navigation progress (global, all pages / all devices)
- **Priority:** P2
- **Fix:** `NavigationProgress.tsx` — 120 ms start delay (instant prefetched hops never show
  it), 450 ms minimum on-screen duration (finished navigations complete and fade instead of
  vanishing mid-frame), modified-click/\_blank/download filtering, and back/forward (popstate)
  coverage.
- **Verified (pre-fix baseline):** the bar mounts and is visible during slow navigations —
  captured at ~120 ms and ~720 ms (`bug014_progress_bar_t120ms.png`,
  `bug014_progress_bar_t720ms.png`); on fast navigations it flashed by invisibly, matching
  the owner report. Post-fix flash pass pending (pane input).

### BUG-015 — Game hub cards 404: `/games/<slug>/` never serves the static game

- **Date found:** 2026-09-16 (during BUG-011 verification) / **Date fixed:** 2026-09-16
- **Area:** `/games` hub → static games under `apps/frontend/public/games/<slug>/`
- **Priority:** P1
- **Fix:** hub card hrefs now point at `/games/<slug>/index.html` (the games load assets with
  relative URLs like `style.css`, so the document URL must sit inside the game folder), plus a
  `/games/:slug → /games/:slug/index.html` redirect in `next.config.mjs` so the clean URL
  keeps working.
- **Verified:** `/games/tic-tac-toe` → 307 → `index.html` → 200 serving the game
  (`<title>Tic Tac Toe — AI Quiz Games`), relative asset `/games/tic-tac-toe/style.css` → 200,
  hub → 200 with updated card hrefs; also opened from the pane ("Tap or Don't Tap" loaded).
  Pre-fix evidence: `bug011_game_card_click_result.png` (404), live curl
  `/games/tic-tac-toe/` → 404 vs `index.html` → 200.

### BUG-012 — Clear all stored analytics data

- **Date found:** / **Date fixed:** 2026-09-17 (production executed)
- **Area:** Analytics (stored data)
- **Priority:** P2
- **Fix:** executed the fresh start on production over SSH — fresh verified backup first
  (`/opt/quiz-backups/quiz_db_20260917_060306.sql.gz`), then `TRUNCATE analytics_events`
  (919 rows removed) + guest play counters zeroed. Content tables untouched (12,032
  questions / 3,022 riddles verified post-clear). The reusable admin reset
  (`POST /admin/analytics/reset` + Admin → Analytics "Clear data") had been built the day
  before; local dev was cleared then.
- **Verified:** post-clear count = 0 on production; local homepage statistics read 0
  (`verify_012_home_stats_zeroed.png`).

### BUG-016 — Analyze quiz-mcq & riddle-mcq against the 5-level option-count spec

- **Date found:** / **Date fixed:** 2026-09-17 (code + analysis; content regeneration
  remains owner content-ops)
- **Area:** quiz-mcq / riddle-mcq (levels, option counts, question content)
- **Priority:** P1
- **Analysis (dev DB = production content):**
  - Quiz UI conforms: easy 2 / medium 2 / hard 3 / expert 4 / extreme text input
    (`AnswerOptions` level slicing; verified in tests and code).
  - Quiz content: expert rows all exactly 4 options ✓, but **5,031 published questions are
    unwinnable as displayed** (1,456 easy + 3,072 medium with correctLetter C/D, 503 hard
    with D — hidden by the display slice), and per-subject × level counts are far from
    200/level/subject (uneven, e.g. Animals 371 easy vs 25 hard). → regeneration to spec is
    the owner's planned content step.
  - Riddle backend/content conforms: 0 unwinnable rows under the 2/3/4 display spec, 0
    duplicate questions, expert (130) open-ended; the admin editor already authors 2/3/4.
  - Riddle player UI was the gap: shared `AnswerOptions` applied the quiz mapping (2/2/3).
- **Fix:** `AnswerOptions` now takes `game` ("quiz" default | "riddle") with per-game option
  counts — riddle easy 2 / medium 3 / hard 4 (`RiddleCard` passes `game="riddle"`).
- **Verified:** live riddle session shows a medium riddle with 3 options
  (`verify_016_riddle_card_options.png`); unit tests updated
  (`answer-options.test.tsx` riddle-spec cases, `riddle-card.test.tsx` hard-shows-4) —
  552/552 green; `tsc` clean.

_(moved entries keep their **Verified** evidence lines; add **Date fixed** and **Fix** at
the top.)_
