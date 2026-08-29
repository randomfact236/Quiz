# Shared Comments System — Guess Feeds, Chip-to-Reveal & Joke Comments

> Created: 2026-08-28
> Status: ✅ IMPLEMENTED (2026-08-28) — backend `comments` module + migration,
> image-riddles GuessFeed/chip-to-reveal, dad-jokes 💬 modal. See "Implementation
> Notes" at the bottom for deviations from the original design.
> Serves: **Image Riddles** (primary — guesses-as-comments + chip-to-reveal) and
> **Dad Jokes** (secondary — 💬 comment counts + modal)
> Related plans: [image-riddles-upgrade-plan.md](image-riddles-upgrade-plan.md) §5,
> [dad-jokes-improvement-plan.md](dad-jokes-improvement-plan.md) §5 (Workstream D)

---

## 1. Design Decisions (agreed with owner)

| Decision              | Choice                                                                                                                                                     | Rationale                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Comment model         | **Guess-as-comment** for riddles: every submitted guess lands in the riddle's feed                                                                         | Feed populates from gameplay — no empty-comment-section problem; wrong guesses are fun to read    |
| Correct-guess display | **Spoiler-masked**: renders as "Someone solved it 🔓", never the answer text                                                                               | First correct solver must not kill the riddle for future visitors                                 |
| Free-text force gates | **Never.** No "comment to reveal" typing gates                                                                                                             | Forced typing produces junk ("idk", "pls show") that destroys feed quality                        |
| Give-up reveal        | **Tap-chip-to-reveal**: Reveal Answer with zero prior guesses opens a chip picker (🤯 Never got it / 😑 So obvious / 🙃 So close); one tap posts + reveals | Structured choice = no junk; one tap = confession beat, not a toll; chips are aggregate-able data |
| Already-guessed users | Reveal is free — no chip required                                                                                                                          | They've already contributed to the feed                                                           |
| Delete-own            | Users can delete their own comments                                                                                                                        | Ownership via `guestId` (guest_users table already exists)                                        |
| Moderation            | Auto-publish + admin hide/delete from panel; rate-limited endpoints                                                                                        | Small-site scale; reuse DRAFT/PUBLISHED status pattern                                            |
| Aggregates            | Chip counts shown as "🤯 ×14" style tallies; riddle feed shows "N guesses today"                                                                           | Social proof drives participation more than any gate                                              |
| Network failures      | Never block the answer reveal on a failed POST                                                                                                             | Optimistic fire-and-forget like joke votes; user never locked out of content                      |

## 2. Backend — New `comments` Module

### 2.1 Entity: `comments` (polymorphic — one table, many content types)

```
comments
┌────────────────────────────────────────────────────────┐
│ id           uuid (PK)                                 │
│ contentType  enum('image-riddle' | 'joke')             │
│ contentId    uuid (riddle id / joke id)                │
│ guestId      string  (FK → guest_users.guestId)        │
│ kind         enum('guess' | 'chip' | 'comment')        │
│              // riddle guesses, chip taps, joke replies│
│ text         text (nullable for chip kind)             │
│ chip         varchar (nullable — 'never-got' etc.)     │
│ isCorrect    boolean (default false; server-set)       │
│ status       enum(DRAFT | PUBLISHED | TRASH)           │
│              // default PUBLISHED; TRASH = admin-hidden│
│ createdAt / updatedAt                                  │
└────────────────────────────────────────────────────────┘
INDEX: (contentType, contentId, status, createdAt DESC)
INDEX: (guestId)  — for "my comments" + delete ownership
```

- `isCorrect` is set **server-side only** at guess time (compare against the
  riddle's answer using the same normalized compare as gameplay). Public list
  responses NEVER include `isCorrect` or the raw answer; masked rendering is
  decided by the server: correct guesses are returned as `text: null,
masked: true`.
- Guest identity: frontend already has a `guestId` bootstrap (guest_users);
  ensure it is issued/stored (cookie or localStorage) before first guess.

### 2.2 Endpoints (all under `/comments`, throttled — writes 20/min like votes)

| Route                                                | Auth                      | Purpose                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /comments/:contentType/:contentId?page=&limit=` | public                    | PUBLISHED feed, masked per §2.1; includes chip aggregate counts                                                                                                           |
| `GET /comments/my?contentType=&contentId=`           | guest                     | Caller's own comments (incl. TRASH? no — own PUBLISHED) for delete UI                                                                                                     |
| `POST /comments`                                     | guest (20/min)            | `{ contentType, contentId, kind, text?, chip? }` — server validates kind vs content type; riddle guesses also go through existing answer-check path so `isCorrect` is set |
| `DELETE /comments/:id`                               | guest (own) / admin (any) | Ownership check by guestId; admin bypass via RolesGuard                                                                                                                   |
| `POST /admin/comments/bulk-action`                   | admin                     | Reuse BulkActionService (publish/trash/delete) — same pattern as jokes/riddles                                                                                            |
| `GET /admin/comments?status=&contentType=`           | admin                     | Moderation list + status counts                                                                                                                                           |

- Chip endpoint is just `POST /comments` with `kind: 'chip'` — one code path.
- Cache: feed lists can reuse CacheService `getOrSet` keyed per
  `comments:{contentType}:{contentId}:p{n}` with short TTL; invalidate on
  write (same `invalidateCacheFamilies` pattern as jokes).

### 2.3 Abuse controls

- Throttler on POST/DELETE (20/min/IP) — existing Throttle infrastructure.
- Length cap on text (e.g., 280 chars) via DTO validation.
- Chip values validated against an allow-list enum server-side.
- Admin trash = soft-hide; hard delete via bulk action. No user-reported flag
  in v1 (admin cleanup suffices at current scale).

## 3. Frontend — Image Riddles (guess feed + chip-to-reveal)

1. **Guess feed component** (`features/image-riddles/components/GuessFeed.tsx`):
   - Rendered inside/below `RiddleModal` (or below the card once solved).
   - Shows recent guesses verbatim, correct solves masked ("Someone solved it 🔓"),
     chip tallies ("🤯 ×14"), and "N guesses today" social-proof line.
   - Own comments show a small delete (🗑) button; `DELETE` + optimistic removal.
2. **Chip-to-reveal flow** (`useImageRiddleGame` give-up path):
   - `Reveal Answer` with zero guesses → modal step "How close were you? 😏"
     with the 3 chips → tap posts `kind:'chip'` (optimistic) → answer reveals.
   - Already-guessed → unchanged behavior, reveal directly.
   - Reveal proceeds even if the POST fails (rule: never block content).
3. **Post-solve brag (optional, v1.1)**: after a correct solve, "Join the wall"
   button with the guess pre-filled → one-tap post.

## 4. Frontend — Dad Jokes (integration only; see dad-jokes plan §5)

1. 💬 count chip on card back (replaces nothing — sits next to 📋 Copy).
2. Click opens a lightweight `JokeCommentsModal` (text input + feed +
   delete-own), using the same `/comments` endpoints with
   `contentType: 'joke'`.
3. No chip/guess semantics for jokes — `kind: 'comment'` only.

## 5. Implementation Order

1. Backend module: entity + migration, guest bootstrap check, endpoints,
   moderation routes, throttling, tests.
2. Image-riddles: GuessFeed component + chip-to-reveal step in game hook.
3. Dad jokes: 💬 chip + JokeCommentsModal.
4. Aggregates + social-proof lines (cheap, high impact — ship with step 2).

## 6. Out of Scope (v1)

- User-reported flags / auto-profanity filtering
- Nested replies (threads) — flat feed only
- Cross-device comment history (needs real auth, same deferral as seen-sync)
- Notifications ("someone replied")

---

## 7. Implementation Notes (2026-08-28)

Deviations / additions discovered while building:

1. **DELETE admin bypass** — instead of a conditional RolesGuard on
   `DELETE /comments/:id`, that route stays guest-only (ownership by
   `?guestId=`, 403 otherwise) and admins hard-delete through the canonical
   `POST /admin/comments/bulk-action` (`delete` action), same surface as
   jokes/riddles. Admin moderation list: `GET /admin/comments?status=&contentType=`.
2. **Added `GET /comments/counts?ids=`** — batched per-content comment counts
   so the jokes grid's 💬 chips need one request, not N.
3. **Guest bootstrap** — no separate bootstrap endpoint: the comments service
   upserts the guest_users row (`GuestUsersService.findOrCreate`) on first
   POST. Frontend guest identity lives in the new shared
   `apps/frontend/src/lib/guest-id.ts` (localStorage `aiquiz:guest-id`).
4. **Chip picker escape hatch** — the chip-to-reveal step includes a subtle
   "Just show me the answer" skip so the reveal is never forced or blocked
   (consistent with the "never block content on a failed POST" rule).
5. **Files**: backend `src/comments/*` (entity, DTOs, service, public +
   admin controllers, 10 service tests) and migration
   `1788100000000-CreateCommentsTable`; frontend `lib/guest-id.ts`,
   `lib/comments-api.ts`, `features/image-riddles/components/{GuessFeed,
ChipRevealStep}.tsx`, `components/jokes/JokeCommentsModal.tsx`, plus the
   game-hook/RiddleModal/jokes-page wiring and
   `__tests__/image-riddle-comments.test.tsx`.
6. **Admin dashboard section** — new "Comments" entry in the admin panel
   sidebar (System group, `?section=comments`) rendering
   `app/admin/components/CommentsSection.tsx`: status/contentType filters,
   paginated moderation list, and per-row Publish / Hide (trash = soft-hide) /
   Delete actions, all through `/admin/comments*` with the admin JWT.

## 8. Implementation Notes — Iteration 2 (2026-08-29)

Follow-up round driven by live-use feedback:

1. **`@_Public()` fix** — the public controller originally shipped without the
   decorator, so the default-deny JWT guard 401'd every comments route. All
   guest-facing routes (feed, my, counts, POST, DELETE) are now `@_Public()`;
   `/admin/comments*` correctly stays JWT-only. Verified live.
2. **Display names** — new nullable `authorName` column (migration
   `1788200000000-AddCommentAuthorName`, 50-char cap, server-trimmed). Guests
   type any name once (`aiquiz:guest-name` localStorage; editor in the guess
   wall header and the jokes modal); every post sends it. Feeds render
   name-above-comment; masked solves read "**Ravi** solved it 🔓" when the
   solver gave a name, otherwise "Someone/Guest". Logged-in real names are
   deferred until the profile is cached client-side (tokens only today).
3. **Blog-style feeds** — entries show name · relative time (`lib/time-ago.ts`);
   the guess wall collapses to the newest 4 entries with a "View all N
   comments" expander, and the scrollbar only appears once expanded.
   Collapsed cards show just the 💬 count.
4. **Card-level social row (image riddles)** — 💬 (inline expandable guess
   wall, spoiler-safe via masking) + 🔗 Share under the Answer/Reveal row.
   Card "Reveal" now routes through the modal so zero-guess reveals always
   pass the chip-to-reveal step (inline reveal previously bypassed it).
5. **Counts endpoint** — `GET /comments/counts` takes `contentType` (was
   hardcoded to jokes) so the riddles grid uses the same batched call.
   Fixed a cache bug: the counts key lacked a suffix segment, so the family
   invalidation `comments:{type}:counts:*` never matched and stale counts
   survived writes — key is now `…:counts:all`.
6. **Modal fixes (image riddles)** — the image container used `flex-1
min-h-0` and collapsed to zero height on shorter viewports (riddle
   rendered without its image); fixed with a guaranteed height. Added a
   direct 🔖 save button next to the modal's close ✕, synced with the card
   chip + ShareMenu via the saved-changed event.
7. **Dad jokes parity** — 💬 chip sits beside the vote buttons on both card
   faces (owner-requested layout); 📋 Copy removed in favor of the ShareMenu
   (Facebook / X / WhatsApp / LinkedIn / Copy Link / 🔖 Save); 🔖 bookmark
   chips on each card face flip with the 3D card.
8. **Moderation policy (agreed)** — auto-publish for all kinds; chips are
   pre-approved by allow-list; free text stays auto-published with
   hide-later moderation (rate limit + length cap + admin panel). Manual
   approval and auto-rejection were considered and rejected.
