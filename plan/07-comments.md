# Feature 07 — Comments (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

---

## 1. File inventory

Backend (`apps/backend/src/comments/`):

| File                           | Purpose                                                                                                                                                                                                                                                                                                  | Size (verified) |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `comments.controller.ts`       | `/comments`: `GET my` (own entries), `GET counts` (per-content totals), `GET :contentType/:contentId` (public list), `POST` (create, throttled 20/min), `DELETE :id` (guest-scoped, throttled)                                                                                                           | —               |
| `comments-admin.controller.ts` | `/admin/comments`: paginated list + `POST bulk-action` (Jwt + RolesGuard)                                                                                                                                                                                                                                | —               |
| `comments.service.ts`          | All logic: guest-scoped create/read/delete (guests may only delete their own), author-name display, allow-listed chip-to-reveal taps, admin listing                                                                                                                                                      | 434 lines       |
| `comments.service.spec.ts`     | Backend unit tests exist for this module (one of the few)                                                                                                                                                                                                                                                | —               |
| `entities/comment.entity.ts`   | `comments`: `contentType` enum (incl. `JOKE`, `IMAGE_RIDDLE`), `contentId` uuid, **`guestId`** (FK → guest_users, indexed), `authorName` nullable, `kind` enum (`GUESS` / `CHIP` / `COMMENT`), `flagged`, ContentStatus (default PUBLISHED), composite index (contentType, contentId, status, createdAt) | —               |
| Migrations                     | `1788100000000-CreateCommentsTable.ts`, `1788200000000-AddCommentAuthorName.ts`                                                                                                                                                                                                                          | —               |

Frontend (`apps/frontend/src/`):

| File                                                                    | Purpose                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/comments-api.ts`                                                   | Typed client (create/list/counts/my/bulk)                                                                                                                                            |
| `components/jokes/JokeCommentsModal.tsx`                                | Per-joke comments modal; jokes page shows 💬 count chips per card                                                                                                                    |
| `features/image-riddles/components/GuessFeed.tsx`, `ChipRevealStep.tsx` | Image riddles use the **same comments system as their guess feed** (`kind: GUESS`) and chip-to-reveal flow (`kind: CHIP`) — comments are a gameplay primitive there, not just social |
| `app/admin/components/CommentsSection.tsx`                              | Moderation: admin list + bulk actions                                                                                                                                                |

Tests: `__tests__/image-riddle-comments.test.tsx` (frontend) + backend `comments.service.spec.ts`.

## 2. Endpoint map

| Method & Path                           | Auth                    | Notes                                         |
| --------------------------------------- | ----------------------- | --------------------------------------------- |
| GET `/comments/my`                      | public (guestId-scoped) | caller's own entries                          |
| GET `/comments/counts?…`                | public                  | per-content comment totals                    |
| GET `/comments/:contentType/:contentId` | public                  | PUBLISHED list for one item                   |
| POST `/comments`                        | public                  | guestId + authorName + kind; throttled 20/min |
| DELETE `/comments/:id`                  | public                  | only if `guestId` matches; throttled          |
| GET `/admin/comments`                   | Jwt + admin             | paginated, filterable                         |
| POST `/admin/comments/bulk-action`      | Jwt + admin             | moderation                                    |

## 3. Current status

**Done:** full-stack comment system with guest identity; live on **two** content types (jokes via modal + count chips; image riddles as the gameplay guess/chip feed); admin moderation with bulk actions; throttled writes; its own migrations and tests on both sides.

**Design fact worth knowing:** comments are **guest-identity based only** — every comment stores a `guestId`; there is no `userId` column, so logged-in users also comment as anonymous guests (display name is an optional free-text `authorName`).

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [x] **Logged-in attribution**
- [ ] Extend coverage to quiz/riddle-mcq content types — **needs owner decision** ("if desired" per plan): the enum/UI are additive-ready, but whether those surfaces should expose comments is a product call.

### P2 — integration / quality

- [x] **Flag path**
- [x] **Comment-count refresh**

### P3 — polish / tech debt

- [x] **`authorName` policy**

## 5. Cross-feature touchpoints

- **Dad Jokes (05)** — comment chips + modal on the public page.
- **Image Riddles (04)** — comments double as the guess feed (`GUESS`) and chip-reveal (`CHIP`) gameplay data.
- **User Accounts (01)** — guest identity via `guest_users`; `findOrCreate` is called on comment write. No `userId` linkage yet (P1).
- **Admin Dashboard (12)** — CommentsSection moderation over `/admin/comments`.
