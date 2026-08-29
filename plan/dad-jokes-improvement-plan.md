# Dad Jokes — Improvement Plan

> Created: 2026-08-28
> **Status: Workstreams A, B and C ALL IMPLEMENTED — 2026-08-28. Workstream D
> (social layer) IMPLEMENTED 2026-08-29 except the 🔥 Hot badge (D2), which
> remains pending.** Comments backend lives in [comments-system-plan.md](comments-system-plan.md).
> Implementation notes / deviations:
>
> - **A1+B1**: `POST /jokes/classic/:id/vote` accepts `remove?: boolean` (service clamps counts at 0). Frontend is optimistic-local-first, then fire-and-forget backend sync; server counts replace local on success. Vote dedup stays per-device (localStorage `VOTED_JOKES`). Un-vote = clicking your active vote button again; the other button stays locked.
> - **B6 (count inflation)**: resolved as a side effect — the online path no longer merges `Math.max(api, local)`; the server is the source of truth. Local `JOKE_VOTE_COUNTS` only matter in the offline fallback path. Caveat: votes cast while offline are lost on next online load (vote marker remains, so the user can re-vote).
> - **A2**: `createdAt` mapped into `RawJoke`/`AdaptedJoke` (default epoch when absent); Newest sort uses `Date.parse(createdAt)`.
> - **A3**: new `getAllJokes()` walks all pages of `GET /jokes/classic` (limit 100/page, `Promise.all`) using the returned `total`.
> - **A5**: `AdaptedJoke.isOneLiner` flag; front hint becomes "One-liner 😜", back restates the joke + "😂 Ba-dum-tss!" (no empty orange card). Same treatment applied to Joke of the Day.
> - **B7**: header height measured via `ResizeObserver` on `document.querySelector('header')`; drives the sticky section bar, sidebar sticky offset, and `scrollToGrid()`.
> - **B5**: reduced-motion CSS in `globals.css` neutralizes the 3D transforms; card faces cross-fade via opacity toggles (which also work in normal 3D mode — backface-visibility still does the hiding there).
> - Verified: `tsc --noEmit` clean on both apps; eslint clean on modified frontend files.

> Scope: Public `/jokes` page + vote pipeline + small backend touch-ups
> Related files:
>
> - `apps/frontend/src/app/jokes/page.tsx`
> - `apps/frontend/src/lib/jokes-api.ts`
> - `apps/frontend/src/app/jokes/layout.tsx`, `error.tsx`
> - `apps/backend/src/dad-jokes/dad-jokes.controller.ts`, `dad-jokes.service.ts`
> - `apps/backend/src/dad-jokes/entities/dad-joke.entity.ts`

---

## 1. Current State (Analysis Summary)

The format itself is **good and worth keeping**: flip-card (setup front / punchline back)
preserves the joke-telling beat, and the layout (Joke of the Day sidebar + Topics + grid)
is a solid content-site pattern. Code quality is already high (memoized filtering, seeded
shuffle, vote race-guard, multi-tab sync, a11y roles, SEO metadata, error boundary).

### What works

- Flip-card interaction with keyboard support (`Enter`/`Space`), `role="article"`, aria-labels
- Deterministic Joke of the Day (date-seeded, same all day)
- Category sidebar with live counts, deep links via `/jokes?category=<uuid>`
- Client-side search + Newest/Top/Shuffle sorts, ellipsis-collapsed pagination
- Votes persisted to localStorage + multi-tab sync via `storage` events
- Offline fallback to localStorage categories/jokes
- Backend: full CRUD, categories, draft/publish/trash bulk actions, random, search,
  public vote endpoint (rate-limited), stats, cache invalidation, admin guards

### Bugs found

| #   | Bug                                                                                                                                        | Where                                                    | Impact                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Votes never sent to backend** — `voteJoke()` exists in `jokes-api.ts:117` but the page never calls it; `handleVote` is localStorage-only | `page.tsx:164`, `jokes-api.ts:117`                       | Votes are per-device only; "🔥 Top" sort is meaningless across users; backend vote endpoint is dead code for the public page |
| B2  | **"Newest" sort broken with UUID ids** — `Number(b.id) - Number(a.id)` → `NaN` for UUIDs; `createdAt` is not mapped into `AdaptedJoke`     | `page.tsx:346`, `jokes-api.ts`                           | Sort silently does nothing; order is arbitrary                                                                               |
| B3  | **Hard cap of 100 jokes** — fetches `getJokes(1, 100)` and does all filter/search/sort client-side                                         | `page.tsx:209`                                           | Jokes beyond 100 silently invisible; search only covers fetched subset; backend search/category endpoints unused             |
| B4  | **Literal `&ldquo;` rendered on screen** — HTML entity inside a JS template string is not parsed                                           | `page.tsx:652-653`                                       | Empty-search state shows raw `&ldquo;` text                                                                                  |
| B5  | **Blank back-of-card for one-liners** — `splitJoke()` returns empty punchline when the joke has no `?` or `Because`                        | `jokes-api.ts:69-82`, offline path in `page.tsx:243-258` | Flipping reveals an empty orange card                                                                                        |
| B6  | **Local vote-count merge inflates numbers** — "local wins if higher" (`Math.max`) can show counts higher than reality for that user        | `page.tsx:217-226`                                       | Minor; becomes moot once B1 is fixed (server becomes source of truth)                                                        |

---

## 2. Data Flow Structure (Current Architecture)

### 2.1 Storage layer (TypeORM / DB)

```
joke_categories                      dad_jokes
┌──────────────────┐                ┌──────────────────────────────────┐
│ id          uuid │◄─── ManyToOne ─┤ id          uuid (PK)            │
│ name        text │                │ joke        text                 │
│ emoji       text │                │ categoryId  uuid? (FK column)    │
│ jokes: DadJoke[] │                │ status      enum(DRAFT|          │
└──────────────────┘                │             PUBLISHED|TRASH)     │
                                    │ likes       int  (default 0)     │
                                    │ dislikes    int  (default 0)     │
                                    │ createdAt / updatedAt          │
                                    └──────────────────────────────────┘
```

Public reads filter `status = PUBLISHED`; admin endpoints see all statuses.
Likes/dislikes are plain counters on the joke row — no per-voter records, so dedup
is purely a client-side (localStorage) concern.

### 2.2 Backend request flow

```
Client
  │
  ▼
DadJokesController (/jokes/…)          Throttle: 60/min reads, 20/min votes
  │  public: @_Public()   admin: JwtAuthGuard + RolesGuard('admin')
  ▼
DadJokesService
  │  • lists: findAndCount(PUBLISHED, relations: ['category'], order id DESC)
  │  • writes: create → status DRAFT; invalidateCacheFamilies('jokes:categories:hasContent')
  │  • categories: cached via CacheService.getOrSet(key, ttl=DEFAULT_CACHE_TTL_S)
  │  • votes: increment counter column only — NO cache invalidation needed
  │  • bulk: transaction + batch category fetch (N+1 fixed)
  ▼
TypeORM Repositories (DadJoke, JokeCategory)
  ▼
DB
```

Endpoint map:

| Route                                             | Auth            | Purpose                                           |
| ------------------------------------------------- | --------------- | ------------------------------------------------- |
| `GET /jokes/classic`                              | public (60/min) | Paginated published jokes `{ data, total }`       |
| `GET /jokes/classic/random`                       | public          | Random published joke                             |
| `GET /jokes/classic/search`                       | public (60/min) | ILIKE search + optional categoryId                |
| `GET /jokes/classic/categories[?hasContent=true]` | public          | Category list (cached)                            |
| `GET /jokes/classic/category/:id`                 | public          | Jokes in category                                 |
| `POST /jokes/classic/:id/vote`                    | public (20/min) | `{ voteType: like\|dislike }` → incremented joke  |
| `GET /jokes/classic/all`                          | admin           | All statuses                                      |
| `POST/PUT/DELETE /jokes/classic…`                 | admin           | CRUD + bulk import + bulk actions + status counts |

### 2.3 Frontend load flow (`JokesPage` mount)

```
mount
  ├─ restore votedJokes            ← localStorage VOTED_JOKES
  └─ load()  [cancelled flag guard]
       ├─ try (online path)
       │    Promise.all([ getJokes(1,100), getJokeCategories() ])
       │      └─ getJokes → GET /jokes/classic → RawJoke[]
       │           └─ adaptJoke(raw) ─→ splitJoke(raw.joke)   // '?' or 'Because' → setup/punchline
       │    merge local vote counts   // Math.max(api, local)  ⚠ inflates (bug B6)
       │    setJokes(merged) + setJokeCategories(api)
       │    Joke of the Day = merged[ dateSeed % length ]
       └─ catch (offline fallback)
            categories ← localStorage JOKE_CATEGORIES (or defaults)
            jokes      ← localStorage JOKES → re-split → hydrate counts
            Joke of the Day = same dateSeed pick
```

### 2.4 Vote flow (current — offline-only, bug B1)

```
click 👍/👎 on card
  → e.stopPropagation()            // don't flip the card
  → guard: already voted? / in-flight ref?
  → localStorage JOKE_VOTE_COUNTS[jokeId][likes|dislikes]++
  → setJokes(... optimistic count update)
  → setJokeOfTheDay(... same)
  → localStorage VOTED_JOKES[jokeId] = 'like'|'dislike'   // per-device dedup
  → toast "👍 Liked!" / "👎 Disliked!"
  ✗ backend POST /jokes/classic/:id/vote  — NEVER CALLED (bug B1)

Other tabs: window 'storage' event on JOKE_VOTE_COUNTS / VOTED_JOKES
  → setState sync (multi-tab consistency, device-local only)
```

### 2.5 Render pipeline

```
jokes[] ──useMemo──► filter (activeCategory UUID match, search in setup/punchline)
                     sort (newest: Number(id) ⚠ NaN for UUIDs / top: likes / random: seededShuffle)
        ────────────► paginate 12/page (ellipsis controls)
        ────────────► flip-card grid + sidebar counts (useMemo) + Joke of the Day
```

### 2.6 Target vote flow (after fix A1 + B1-toggle)

```
click 👍/👎 (or click again to un-vote)
  → guard + optimistic localStorage/state update (instant UI, offline-safe)
  → POST /jokes/classic/:id/vote { voteType, remove? }   // fire-and-forget
       ├─ success → server counts REPLACE local (converge, no inflation)
       └─ failure → keep local counts (offline still works)
```

---

## 3. Workstream A — Functional Fixes (bugs) ✅ IMPLEMENTED

### A1. Wire votes to the backend (fixes B1, B6)

- In `page.tsx` `handleVote`: keep the optimistic localStorage update (instant UI +
  offline resilience), then fire-and-forget `voteJoke(jokeId, type)`.
- On API success: replace local count with the server-returned counts (server wins) so
  counts converge instead of inflating.
- On API failure: keep the local value (offline still works); optionally queue a retry —
  out of scope for v1.
- Keep the existing ref-based double-vote guard; keep one-vote-per-joke-per-device rule
  (localStorage `VOTED_JOKES`) since the vote endpoint is anonymous.

### A2. Fix "Newest" sort with `createdAt` (fixes B2)

- Add `createdAt` to `RawJoke` and `AdaptedJoke`; map it in `adaptJoke()`.
- In the `displayedJokes` memo, sort newest by `Date(b.createdAt) - Date(a.createdAt)`
  with fallback to `0`.
- Remove the `Number(id)` subtraction entirely.

### A3. Lift the 100-joke cap (fixes B3)

Option chosen (v1, minimal): fetch all pages from `GET /jokes/classic` using the
returned `total` (loop `page=1..ceil(total/limit)`, `limit=100`, `Promise.all`) and
continue client-side filtering. Keeps the page's fast, no-wait UX.

Option deferred (v2, if catalog grows >500): move search/filter to
`GET /jokes/classic/search` + `GET /jokes/classic/category/:id` server endpoints with
real server pagination.

### A4. Fix literal `&ldquo;` (fixes B4)

- Replace `&ldquo;`/`&rdquo;` with real `“ ”` characters inside the template strings at
  `page.tsx:652-653`.

### A5. Handle one-liners gracefully (fixes B5)

- In `splitJoke()`: when no punchline can be extracted, return
  `{ setup: fullJoke, punchline: '' }` (unchanged) **plus** a derived flag
  `isOneLiner: punchline === ''` on `AdaptedJoke`.
- Card front: render the full text as the setup.
- Card back: instead of an empty orange card, show a styled one-liner reveal
  (e.g., the joke restated large in italic + a "😭 Bad? Good!" hint). Front shows a
  one-liner hint chip instead of "Click to flip".

---

## 4. Workstream B — Cosmetics / UX Polish ✅ IMPLEMENTED

### B1. Vote buttons: distinguishable + toggleable

- Give `dislikeActive` a distinct treatment (red tint: `bg-red-100 text-red-600 ring-red-400`
  light variant; `bg-white text-red-500` dark variant). Like stays orange.
- Allow un-voting: clicking the already-voted button removes the vote (localStorage +
  backend decrement via a new `voteType` of `unlike`/`undislike`, or a `DELETE /vote`
  — pick smallest backend change: extend `voteForJoke` to accept `remove?: boolean`).
- Dim only the _other_ button after voting, not both.
- Accessible pressed state: `aria-pressed={voted === 'like'}` on each button.

### B2. Category badge on card front

- Add a small chip (category name) on the card front near the top, using the same
  `rounded-full` style as the back, so browsing is context-aware without flipping.

### B3. Loading skeletons

- Reintroduce a `loading` state; render 6 skeleton flip-cards (gray pulse shapes matching
  card min-height) while the API fetch is in flight. Replaces the current blank flash.

### B4. Copy / share button per card

- Small "📋 Copy" icon button on the card back (and Joke of the Day) that copies
  `setup + punchline` via `navigator.clipboard.writeText`, reusing the existing toast
  ("Copied!"). `stopPropagation` so it doesn't flip the card.

### B5. Respect `prefers-reduced-motion`

- Gate the 3D flip transform behind `@media (prefers-reduced-motion: no-preference)`;
  under reduced motion, cross-fade front/back instead of rotating.

### B6. Visible focus ring on flip cards

- Add `focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`
  to the flip-card wrappers and sidebar category items.

### B7. De-hardcode layout offsets

- Measure the site header height once (ref + `ResizeObserver` or `getBoundingClientRect`)
  and drive the sticky offsets (`top-[73px] md:top-[61px]`) and the `scrollToGrid()`
  `- 120` constant from it, instead of magic numbers.

### B8. Empty-category presentation

- In the Topics sidebar, hide categories with `count === 0` (or render a muted
  "coming soon" state) so the sidebar never shows a "0 jokes" row that looks broken.

---

## 5. Workstream C — Seen-Joke Tracking (New Feature) ✅ IMPLEMENTED

> Workstream C implementation notes (2026-08-28):
>
> - `SEEN_JOKES` storage key added (`lib/storage.ts`); map of jokeId → ISO timestamp.
> - `toggleFlip(id, countAsSeen = true)` records the timestamp on first flip only; un-flipping does not un-see. Joke of the Day passes `false` — its flips never mark seen and the card carries no badge (per §5.4 edge cases).
> - Grid card fronts of seen jokes render at `opacity-80` with a muted gray border (`border-gray-200`, hover `group-hover:border-gray-300`) instead of the orange hover, plus a `✓ Seen` chip (emerald-50/600, top-left).
> - Fourth sort option `Unseen` added (Newest | Unseen | 🔥 Top | Shuffle): stable two-pass sort — newest first, then unseen before seen, preserving Newest order within each group. `seenJokes` joined the `displayedJokes` memo deps, so flipping a card under this sort moves it to the seen group on the next render (accepted per plan).
> - Progress block in the Topics sidebar: "😄 You've seen X of Y jokes" + thin progress bar (role="progressbar") + "Reset seen history" button with `window.confirm`.
> - Multi-tab sync extended to `SEEN_JOKES` in the existing `storage` event listener (clear events reset to `{}`).
> - Joke of the Day and sidebar category counts are untouched by seen state (per §5.4).

> Not a bug fix — new capability. There is currently **no "seen" state at all**:
> `VOTED_JOKES` tracks votes only, and Joke of the Day is date-deterministic (same for
> everyone), not tied to what a user has viewed. Nothing hides or deprioritizes
> already-viewed jokes on revisit/refresh.

### 5.1 Why it fits this feature

Dad jokes lose their value the moment the punchline is known — repeat visitors see the
same cards and the experience degrades faster than on other content types. Tracking
"seen" keeps revisits fresh. It is device-local (localStorage), needs no backend change
and no auth layer, and reuses patterns already in the page (localStorage persistence,
multi-tab `storage` sync).

### 5.2 Design decisions (chosen)

| Decision          | Choice                                             | Rationale                                                                                                                 |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| When to mark seen | On **card flip** (first flip only), not on render  | Marking on render would mark whole pages unseen→seen at a glance; flip = intentional engagement                           |
| Seen behavior     | **Deprioritize + badge**, never hide               | With a small catalog (<100 jokes), hiding seen jokes can empty the grid and look broken; hiding is a later opt-in if ever |
| Scope             | Device-local (localStorage)                        | No user auth/accounts exist (votes are anonymous); cross-device sync would require a new auth layer — deferred            |
| Joke of the Day   | Unaffected — stays date-deterministic for everyone | It's a shared daily ritual, not a personal feed                                                                           |
| Shuffle           | Stays pure random; seen badge still visible        | Mixing "seen" into shuffle would make it feel rigged                                                                      |

### 5.3 Implementation

1. **State**: new `SEEN_JOKES` storage key — `Record<jokeId, ISO-timestamp>`.
   - Load on mount alongside `VOTED_JOKES`; sync across tabs via the existing
     `storage` event listener.
   - `toggleFlip(id)` records `seenJokes[id] ??= new Date().toISOString()` on first
     flip; un-flipping does not un-see.
2. **Visual treatment on cards**:
   - Small `✓ Seen` chip on the card front (muted gray-green), replacing nothing.
   - Seen cards render at reduced prominence: `opacity-80` on the front face + muted
     hover border, so the grid still reads as full but the eye skips them.
3. **"Unseen first" sorting**:
   - Add a fourth sort option `Unseen` to the Newest/Top/Shuffle segment control
     (unseen jokes first, preserving Newest order within each group; seen jokes
     follow, grayed).
   - Memo dependency: `seenJokes` joins the `displayedJokes` memo deps.
4. **Progress indicator (engagement hook)**:
   - In the Topics sidebar above categories: "😄 You've seen **X** of **Y** jokes"
     with a thin progress bar. Cheap, and gives a reason to keep browsing.
5. **Reset control**:
   - Small "Reset seen history" text button under the progress bar with a confirm
     (window.confirm is enough) — clears `SEEN_JOKES`.

### 5.4 Edge cases

- New jokes added later are unseen by definition (no ID in the map) — no migration needed.
- Offline fallback jokes use the same IDs, so seen state survives online/offline switches.
- Do NOT let seen state affect Joke of the Day or the category counts in the sidebar.

---

## 6. Workstream D — Social Layer: Share, Hot Badge & Comments

> Added 2026-08-28 after the social-layer design discussion. Comments reuse the
> shared module spec'd in [comments-system-plan.md](comments-system-plan.md).

### D1. Share ✅ IMPLEMENTED (2026-08-29, superseded design)

- The per-card 📋 Copy button was **removed entirely** (owner: unnecessary) and
  replaced with a **🔗 Share button** on card backs and Joke of the Day.
- Design evolved beyond the original `navigator.share` idea: desktop browsers
  rarely have a native share sheet, so a silent clipboard fallback felt broken.
  Share now opens a **`ShareMenu`** popup (`components/share/ShareMenu.tsx`)
  with explicit targets: **Facebook, X (Twitter), WhatsApp, LinkedIn, Copy
  Link, and 🔖 Save** (device-local bookmark via `lib/saved-items.ts`).
- `stopPropagation` kept so the card doesn't flip.

### D2. 🔥 Hot badge (derived, not a button) ⬜ PENDING

- A third reaction _button_ was explicitly rejected (overlaps like, needs a
  new counter column, crowds the card).
- Instead: automatic badge on jokes that earn it — `likes >= 10` OR score
  (likes − dislikes) in the top decile, whichever is cheaper to compute
  client-side from data already fetched. Rendered on the card front beside
  the category chip. Zero backend change.
- Can later feed a "🔥 Hot" sort option using the same derived value.

### D3. Comments ✅ IMPLEMENTED (2026-08-29)

- 💬 count chips now sit **beside the like/dislike buttons on BOTH card faces**
  (owner-requested layout — stronger social proof than a back-only chip),
  plus on Joke of the Day's front. Click opens `JokeCommentsModal`
  (`components/jokes/JokeCommentsModal.tsx`): text input, flat feed, optimistic
  post, delete-own via guestId.
- `contentType: 'joke'` against the shared `/comments` endpoints; no
  guess/chip semantics for jokes — `kind: 'comment'` only.
- Counts for all cards load in one batched request (`GET /comments/counts?ids=`).
- Display names (2026-08-29): guests type any name once (field in the modal,
  stored per device); replies render name-above-comment with relative
  timestamps (`lib/time-ago.ts`).
- Backend note: the shared controller initially shipped without `@_Public()`
  decorators so every comments route 401'd under the default-deny JWT guard —
  fixed and verified live (feed/POST/delete/counts all 200).
- Rate limiting, moderation, and the polymorphic schema all live in the
  shared module — nothing jokes-specific beyond the modal UI.

### D4. 🔖 Save bookmarks (added 2026-08-29, owner request)

- Device-local bookmarks via `lib/saved-items.ts` + `hooks/useSavedItems.ts`
  (localStorage `aiquiz:saved-items`, namespaced per section: `jokes`,
  `image-riddles`).
- A 🔖 chip sits on each card **face** (front + back) so it flips naturally
  with the 3D card animation; tapping toggles save without flipping the card.
- The ShareMenu's Save row and the card chips stay in sync through a
  `aiquiz:saved-changed` window event.
- A synced/cross-device "Saved" collection is out of scope until real auth
  (same deferral as seen-sync).

---

## 7. Suggested Implementation Order

1. **A4** (2-line entity fix) — trivial, ship first
2. **A2** (`createdAt` mapping + sort) — small, unblocks honest "Newest"
3. **A5** (one-liner handling) — contained to adapter + card render
4. **A1** (backend vote sync + toggle in B1) — core value; do together with B1's
   toggleable votes since both touch `handleVote`
5. **A3** (fetch all pages) — small; revisit server-side pagination only if catalog grows
6. **B2–B8** — polish batch, any order
7. **C (seen-joke tracking)** — self-contained; can start anytime after A2 since it
   builds on the sort-control segment UI
8. ~~D1 + D2 (share upgrade, hot badge)~~ — D1 done 2026-08-29 (as ShareMenu, see §6); **D2 hot badge remains**
9. ~~D3 (joke comments)~~ — done 2026-08-29 alongside the shared comments module

---

## 8. Out of Scope (for now)

- Authenticated voting / dedup per user (vote endpoint is anonymous; localStorage is the
  per-device guard)
- Cross-device "seen" sync (would require a user-auth layer that doesn't exist yet)
- Backend retry queue for failed votes
- Server-side search + true server pagination (deferred until >500 jokes)
- New joke formats (e.g., "Would you rather") — separate feature
