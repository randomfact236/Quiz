# Image Riddles — Feature & UX/Cosmetics Review

Companion docs: [image-riddles-upgrade-plan.md](image-riddles-upgrade-plan.md) (code-quality debt — not duplicated here),
[features/image-riddles.md](../docs/features/image-riddles.md).
Verified against source on 2026-08-28. Scope: **what the feature does, whether the game format/layout is good, and cosmetics worth implementing.**

## 1. What the feature is today (verified)

A self-contained "guess the image" game on `/image-riddles`:

- **Grid**: 3-column cards (image, difficulty chip top-left, timer chip top-right, title, blurred answer + per-card "Reveal" toggle), 12 per page, paginated.
- **Sidebar**: emoji category tiles ("Topics"), sticky, 2-col on mobile / 1-col on desktop.
- **Sticky header**: live search, Recent/Mix sort toggle, difficulty dropdown, "Score: X / Y" counter.
- **Modal game**: countdown timer + progress bar, guess input, Check Answer / Hint / Reveal buttons (via `ActionOptions.tsx`), shake-on-wrong, TIME'S UP overlay that auto-reveals, answer panel with guess count, Next Riddle button, ←/→/Esc keyboard navigation.
- **Data**: API-backed (`GET /image-riddles?limit=200` + `/categories`) with hardcoded offline fallback and an amber failure banner. Deep links `?category=&difficulty=` are read on mount.

Backend is complete and healthy for this (published-only reads, random/search/difficulty/stats endpoints, admin CRUD, media library). All remaining issues are frontend-side.

## 2. Data flow (how it's wired)

```
PUBLIC READ PATH (play)
  app/image-riddles/page.tsx            (client component, 'use client')
    │  on mount: Promise.all([getImageRiddles(1, 200), getImageRiddleCategories()])
    ▼
  lib/image-riddles-api.ts              (typed FE API layer)
    │  apiRequest / api.get ──► lib/api-client.ts ──► NEXT_PUBLIC_API_URL
    ▼
  GET /image-riddles?page&limit         GET /image-riddles/categories
  ImageRiddlesController (@_Public, throttle 60 req/min)
    ▼
  ImageRiddlesService
    │  TypeORM repos: imageRiddleRepo, categoryRepo
    │  lists hard-filter status = PUBLISHED; responses are { data, total }
    ▼
  PostgreSQL: image_riddles, image_riddle_categories
  (categories cached under image-riddles:categories via CacheService;
   every mutation runs delPattern('image-riddles:*'))

  ── back in the browser ──────────────────────────────────────────────
  filter (published → category → difficulty → search)
    → shuffle if "Mix" → paginate 12/page → card grid
  click card → modal gameplay state (client-only: timer, attempts,
  shake, revealedAnswers) — nothing here is persisted anywhere

ADMIN WRITE PATH (author)
  ImageRiddlesAdminSection.tsx
    │  lib/image-riddles-api.ts admin fns (apiClient, isAdmin: true, JWT)
    ▼
  /admin/image-riddles/*   → AdminImageRiddlesService → same repos
  (list/CRUD/categories/dashboard; cache invalidated on every mutation)
  status changes: POST /image-riddles/bulk-action  (single canonical surface)

IMAGE ASSET PATH
  MediaPicker (admin modal)
    │  lib/media-api.ts → POST /media (multipart)
    ▼
  MediaService: sharp → WebP q80 → local-disk StorageService
    │  returns asset URL ──► saved as ImageRiddle.imageUrl
    ▼
  served statically with CORP override (commit 04a02b2) so the
  frontend can embed it cross-origin
```

Key facts about this flow:

- **One source of truth**: PostgreSQL via the API. `lib/initial-data.ts` is only a cold-start/offline fallback; when the API fails, the page swaps to sample data with an amber banner (`page.tsx:175`).
- **Gameplay is a closed loop**: timer/attempts/revealed answers live entirely in React state. No view/like/attempt tables exist, and the `analyticsEvent` strings on the action options never leave the component (`onAnalytics` is never supplied) — this is why the score can't be made real without adding persistence (upgrade plan "Deferred" section).
- **The 200-row cap is flow-level**: because filtering happens client-side after one `limit=200` fetch, the grid silently truncates beyond 200 published riddles (upgrade plan item A1 moves filtering to `/image-riddles/search`).
- **Deep links are read-only**: `?category=&difficulty=` is parsed once on mount (`page.tsx:195-202`); nothing in the flow writes filter state back to the URL.
- **Action options**: each riddle carries a JSONB `actionOptions` array; the entity merges `DEFAULT_ACTION_PRESETS` when `useDefaultActions=true`. The page passes `riddle.actionOptions` through to `ActionOptions.tsx` or falls back to three locally-built defaults (check/hint/reveal, `page.tsx:140-143`) — the entity's richer presets (share/skip/report) never reach a handler (upgrade plan A2).

## 3. Is the format good?

**Verdict: yes, the format is fundamentally right — grid browse → modal play with a timer is the correct shape for image riddles, and visually the page is coherent (slate/indigo palette, rounded-3xl cards, consistent typography).** The problems are not structural; they are game-feel and polish gaps:

1. **The score is not a score.** `Score: X / Y` counts _revealed answers_ (`page.tsx:382-389`) — card reveals, give-ups, and correct answers all count the same. A player who reveals everything scores 100%. There is no correct-vs-revealed distinction and no persistence across reloads.
2. **The card-level "Reveal" button undermines the game.** Answers are blur-revealable directly on the grid (`page.tsx:566-579`) — before the player has even opened the riddle. It also feeds the inflated score. Spoiler-by-default on a guessing game is backwards.
3. **Exact-match answering is too strict for image riddles.** `userAnswer.trim().toLowerCase() === answer.toLowerCase()` (`page.tsx:351`) fails on "an umbrella" vs "umbrella", punctuation, or legitimate alternate answers ("carrot" vs "a carrot"). Wrong answers give only a shake — no "try again" message, no live attempt counter, and nothing about the answer's length.
4. **The modal can clip on small screens.** Fixed `h-[90vh]` + `overflow-hidden` + non-scrollable content column (`page.tsx:645-682`); on short viewports the input/action area gets cut off. `mx-8` side margins waste width on mobile where the prev/next arrows already overlay the content.
5. **"Mix" reshuffles on every keystroke.** The shuffle lives inside the filter `useMemo` (`page.tsx:293-299`), so typing in search re-randomizes the entire grid — disorienting.
6. **Filter state is one-way.** Deep links are read on mount (`page.tsx:195-202`) but filter changes never update the URL, and browser-back doesn't close the modal. Refresh/share of a filtered view is impossible.
7. **`showTimer` is ignored.** The entity has a per-riddle `showTimer` flag; the page always shows and runs the timer. Admins who disable it get no effect.
8. **Empty-state friction**: categories with zero published riddles still render as clickable tiles; hint button is active even when the riddle has no hint (`page.tsx:777-784` renders the panel only if a hint exists — clicking does nothing silently).

## 4. Cosmetic / visual findings

| #   | Finding                                                                                                                                                                                                                                                                                                                                   | Location                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| C1  | **Difficulty chip colors are overridden.** Card badge combines `difficultyColors[...]` (bg-green-100 etc.) with a later `bg-white/90` (`page.tsx:549`); the modal badge does the same with `bg-slate-100/50` (`page.tsx:686`). The four-color difficulty coding effectively never renders — every chip looks white/gray.                  | `page.tsx:549, 686`                                 |
| C2  | Raw `<img>` with no `loading="lazy"`, no error fallback (broken-image icon if a URL dies), no per-card skeleton; only a full-page loading state exists. (`next/image` swap itself is tracked as A4 in the upgrade plan.)                                                                                                                  | `page.tsx:538, 719`                                 |
| C3  | Cards are plain `div onClick` — no `role="button"`, no `tabIndex`, not keyboard-openable; modal has no focus trap and doesn't return focus on close.                                                                                                                                                                                      | `page.tsx:530-534, 644-653`                         |
| C4  | Blurred answer text is real DOM text — selectable, copyable, and read aloud by screen readers (`select-none`/`blur-sm` only).                                                                                                                                                                                                             | `page.tsx:569-571`                                  |
| C5  | Shortcut hints show Mac symbols (⌥ ⌃ ⌘) on every platform and are misleading: the Check Answer option declares `keyboardShortcut: 'Enter'`, but `ActionOptions` deliberately ignores non-modifier shortcuts — so the tooltip "Submit your answer (Enter)" advertises something the component never does (the modal handles Enter itself). | `ActionOptions.tsx:234-241, 598-600`; `page.tsx:81` |
| C6  | Hint button has no disabled state when `hint` is null; clicking is a silent no-op.                                                                                                                                                                                                                                                        | `page.tsx:759-784`                                  |
| C7  | Wrong answer = 500ms shake only; no inline feedback ("Not quite — try again"), no live attempt count (it appears only after reveal).                                                                                                                                                                                                      | `page.tsx:349-357`                                  |
| C8  | Correct answer and give-up/time-out reveal look identical (same indigo panel). No celebration moment on a correct guess.                                                                                                                                                                                                                  | `page.tsx:787-811`                                  |
| C9  | Sidebar tiles show no riddle counts; users can click into empty topics.                                                                                                                                                                                                                                                                   | `page.tsx:497-509`                                  |
| C10 | Image zoom `group-hover:scale-110` over 700ms is heavy/janky-feeling on large cards.                                                                                                                                                                                                                                                      | `page.tsx:541`                                      |
| C11 | Search input lacks a visible clear (✕) affordance; `type="search"` provides a native one only in some browsers.                                                                                                                                                                                                                           | `page.tsx:431-441`                                  |
| C12 | Emoji-only iconography (🖼️🔍📁👁️🕶️✨) renders inconsistently across OS/browser; a small icon set would be more uniform. Taste call — current look is internally consistent.                                                                                                                                                               | throughout                                          |
| C13 | Stale/duplicated header comment ("Pagination (12 Items per Page)" twice) and doc drift — `docs/features/image-riddles.md` still describes the page as localStorage-only in places.                                                                                                                                                        | `page.tsx:9-10`, docs §6                            |

## 5. Cosmetic improvement plan

Rule: UX changes are behavior-visible, so each item should be a small, individually reviewable PR. Refactor prerequisites (feature-folder split, server-side filtering) live in the upgrade plan and are only referenced where they unblock a cosmetic item.

### Phase C0 — Quick wins (pure frontend, hours)

1. **C1** — fix the chip classes: render difficulty color as the actual background (drop `bg-white/90` / `bg-slate-100/50` conflicts), or intentionally restyle to neutral chips with a colored dot — but pick one; today it's an accident.
2. **C6** — hide or disable the Hint button when `!selectedRiddle.hint` (cleanest: filter it out of the default actions for hint-less riddles).
3. **C7** — inline "Not quite — try again" message under the input + live "Attempts: N" chip while playing.
4. **C4** — card answer: render `Answer Hidden` placeholder when unrevealed instead of blurred real text; only mount the answer string once revealed.
5. **C5** — platform-aware shortcut display (`navigator.platform` gate for ⌘/⌥) and remove the bogus `keyboardShortcut: 'Enter'` from the Check Answer action (modal already handles Enter).
6. **C11** — visible clear button on search.
7. **C13** — fix header comment; refresh `docs/features/image-riddles.md` §6 to describe the API-backed flow.
8. **C2 (partial)** — add `loading="lazy"` + `onError` placeholder to both `<img>` usages now; full `next/image` stays with A4.

### Phase C1 — Game feel (small state changes)

9. **Score rework (#1)** — track `correctIds` separately from `revealedIds`; header shows "Solved X · Revealed Y · of Z"; persist both to `localStorage` (pattern exists: `lib/storage.ts` keys already defined for image riddles).
10. **Answer matching (#3)** — normalize both sides (collapse whitespace, strip leading articles "a/an/the", strip trailing punctuation). Add optional `alternativeAnswers: string[]` to the entity/DTO (JSONB, nullable) so admins can accept synonyms; matcher checks all. Frontend matcher extracted to a pure util + unit tests (aligns with A10 in the upgrade plan).
11. **Letter-count hint chip (#3)** — "7 letters" next to the input (toggleable, default on for hard/expert).
12. **Distinct correct vs revealed panel (C8)** — green/celebratory panel (confetti burst or ✓ animation) for a correct guess; neutral indigo for give-up/time-out, with copy "The answer was:".
13. **Modal scroll (#4)** — `overflow-y-auto` on the content column, `max-h-[90vh]` instead of fixed height, `mx-8` → `mx-0 sm:mx-8`.
14. **Shuffle stability (#5)** — shuffle only when "Mix" is toggled or the filter set (category/difficulty/search) changes, not on every render of the same filter state (store a seed or shuffle in the toggle handler).
15. **Timer (#7)** — respect `showTimer === false` (hide chip/progress bar; game untimed). Optionally: on expiry, show "TIME'S UP — Reveal?" choice instead of auto-revealing (keeps the player in control).
16. **Empty topics (#8, C9)** — category counts from the existing public search endpoint (count per category) or `/stats/overview`; render zero-count topics dimmed/disabled.

### Phase C2 — Structure-dependent (do after the A8/A9 split, with A1/A2/A4)

17. **C3** — keyboard-accessible cards (`role="button"`, `tabIndex={0}`, Enter/Space opens) + focus trap and focus-return in the modal. Do during the `RiddleModal`/`RiddleCard` extraction.
18. **URL sync (#6)** — filters write back to `?category=&difficulty=` (replaceState) and modal open pushes a history entry so Back closes it. Natural home: the planned `useImageRiddleFilters` hook.
19. **Wire the unused endpoints** — "Mix" → `/image-riddles/random`; stats overview for a header count; share action (A2) opens Web Share with a deep link once URL sync lands.
20. **C2 (finish)** — `next/image` with blur placeholders + per-card skeletons during the A4 swap.
21. **C10/C12** — tune hover zoom (scale-105 / 300ms) and evaluate an icon set — fold into the extraction PR's styling pass.

## 6. Exit criteria

- Score header distinguishes solved vs revealed and survives a reload.
- No way to see the answer before opening the riddle other than an explicit in-modal reveal.
- Wrong-answer feedback, hint disabled state, and letter-count chip are present in the modal.
- Difficulty chips visibly differ per level on card and modal.
- Modal is usable at 360×640 with no clipped controls.
- Grid is fully keyboard-operable; Back closes the modal; filters are shareable via URL.
- Answer matching accepts normalized/alternate answers, covered by unit tests.
