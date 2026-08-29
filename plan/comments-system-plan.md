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
