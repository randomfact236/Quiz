# Feature 08 — Media Library (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

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

## 2. Endpoint map

| Method & Path        | Auth        | Notes                                                           |
| -------------------- | ----------- | --------------------------------------------------------------- |
| POST `/media/upload` | Jwt + admin | multipart; MIME allow-list; sharp-validated; stored as WebP q80 |
| GET `/media`         | Jwt + admin | paginated list                                                  |
| GET `/media/stats`   | Jwt + admin | counts + storage savings                                        |
| GET `/media/:id`     | Jwt + admin | single asset                                                    |
| DELETE `/media/:id`  | Jwt + admin | removes row + disk file                                         |

## 3. Current status

**Done:** working upload→convert→store→browse pipeline; local-disk storage; **original kept + WebP variant stored in `variants` JSONB** (url serves the variant; stats report storage savings from the conversion); admin library UI with stats and alt-text cards; picker integrated into the image-riddle form. Upload multipart contract is **file + alt only** (no name/description fields).

**Gaps:** `imageUrl` on content is still a plain URL string — the DB has no FK to the media table, so nothing prevents deleting an asset that content still references; local disk storage only (no S3/presigned path); the picker is wired into **one** form only.

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [x] **Reference safety**
- [ ] Swap to object storage — **needs owner decision / pre-deploy item**: only relevant before multi-instance deployment; requires bucket + credentials provisioning. The `StorageService` seam exists for the swap.

### P2 — integration / quality

- [x] **MediaPicker standard for future fields**
- [x] **next/image serving**
- [x] **Upload-pipeline tests**

### P3 — polish / tech debt

- [x] **Alt text surfaced in the picker** — **open decision:** require alt text on upload (form-policy change for the admin upload dialog).

## 5. Cross-feature touchpoints

- **Image Riddles (04)** — primary consumer: `MediaPicker` in the admin form; public page renders the stored URLs.
- **Admin Dashboard (12)** — MediaLibrarySection + `lib/media-api` (whose error helper CommentsSection also reuses).
- **Site Settings (11)** — storage backend choice would belong there if object storage lands.
