# Feature 08 — Media Library (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. No archived ledger doc existed for this feature —
> built from current code. This file was added after the initial 9-file pass (user request); the
> backend module was previously documented only as a fragment inside features 04 and 11.

---

## 1. File inventory

Backend (`apps/backend/src/media/`):

| File                                          | Purpose                                                                                                                                                              | Size (verified) |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `media.controller.ts`                         | `/media`: `POST upload` (multipart, Jwt + RolesGuard), `GET` (list, paginated), `GET stats`, `GET :id`, `DELETE :id`                                                 | —               |
| `media.service.ts`                            | Upload pipeline: MIME allow-list (jpeg/png/webp/gif), verify decode with **sharp**, re-encode **WebP quality 80**, persist to local `/uploads` disk, record metadata | —               |
| `storage.service.ts` + `storage-path.util.ts` | Local-disk storage abstraction                                                                                                                                       | —               |
| `entities/`                                   | `media` table: url/originalName/name (varchar 500), description, mimeType (100), size (int) + timestamps                                                             | —               |
| Migration                                     | `1787900000000-CreateMediaTable.ts`                                                                                                                                  | —               |

Frontend (`apps/frontend/src/`):

| File                                           | Purpose                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `lib/media-api.ts`                             | Typed client: upload, list, delete, stats, `formatFileSize`, `resolveMediaUrl`, error helper (also reused by CommentsSection) |
| `components/MediaPicker.tsx` (admin)           | Browse / upload / select / delete dialog for choosing an image                                                                |
| `app/admin/components/MediaLibrarySection.tsx` | Admin "Media" section: upload, search, stats (storage savings %), delete                                                      |

## 2. Endpoint map (verified 2026-08-30)

| Method & Path        | Auth        | Notes                                                           |
| -------------------- | ----------- | --------------------------------------------------------------- |
| POST `/media/upload` | Jwt + admin | multipart; MIME allow-list; sharp-validated; stored as WebP q80 |
| GET `/media`         | Jwt + admin | paginated list                                                  |
| GET `/media/stats`   | Jwt + admin | counts + storage savings                                        |
| GET `/media/:id`     | Jwt + admin | single asset                                                    |
| DELETE `/media/:id`  | Jwt + admin | removes row + disk file                                         |

## 3. Current status (verified)

**Done:** working upload→convert→store→browse pipeline; local-disk storage with on-disk WebP; admin library UI with stats; picker integrated into the image-riddle form ("🖼️ Library" button in the Image URL field).

**Gaps:** `imageUrl` on content is still a plain URL string — the DB has no FK to the media table, so nothing prevents deleting an asset that content still references; local disk storage only (no S3/presigned path); the picker is wired into **one** form only.

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [ ] **Reference safety**: track content usage per asset (or at least a "referenced by" check on delete) so an admin can't orphan images currently shown on the site.
- [ ] Swap local-disk for object storage (S3-compatible) behind the existing `StorageService` abstraction before any multi-instance deployment — local `/uploads` breaks with more than one backend replica.

### P2 — integration / quality

- [ ] Wire `MediaPicker` into the remaining image fields (riddle-mcq has no images today; quiz subjects have emoji only — likely N/A; make the picker the standard for any future image field).
- [ ] Serve media through `next/image` with proper sizing now that WebP is guaranteed (see feature 04 P3).
- [ ] Tests: upload pipeline (MIME rejection, re-encode) — none exist.

### P3 — polish / tech debt

- [ ] Alt-text (`description`) is stored but not surfaced in the picker — show it and require it for accessibility.

## 5. Cross-feature touchpoints

- **Image Riddles (04)** — primary consumer: `MediaPicker` in the admin form; public page renders the stored URLs.
- **Admin Dashboard (12)** — MediaLibrarySection + `lib/media-api` (whose error helper CommentsSection also reuses).
- **Site Settings (11)** — storage backend choice would belong there if object storage lands.
