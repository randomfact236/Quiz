# Feature 08 — Media Library (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30; **re-audited + E2E-tested 2026-09-05** (20 assets seeded via the upload endpoint). No archived ledger doc existed for this feature —
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

**Done:** working upload→convert→store→browse pipeline (re-verified 2026-09-05 with 20 seeded uploads); local-disk storage; **original kept + WebP variant stored in `variants` JSONB** (url serves the variant; stats report storage savings from the conversion); admin library UI with stats and alt-text cards; picker integrated into the image-riddle form. Upload multipart contract is **file + alt only** (no name/description fields).

**Gaps:** `imageUrl` on content is still a plain URL string — the DB has no FK to the media table, so nothing prevents deleting an asset that content still references; local disk storage only (no S3/presigned path); the picker is wired into **one** form only.

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [x] **Reference safety** — VERIFIED ALREADY IMPLEMENTED 2026-08-30 (plan stale): `MediaService.remove` runs a `getUsageCount` LIKE check against `image_riddles.imageUrl` and throws 409 with the referencing count instead of deleting; regression-tested in `media.service.spec.ts`.
- [ ] Swap to object storage — **needs owner decision / pre-deploy item**: only relevant before multi-instance deployment; requires bucket + credentials provisioning. The `StorageService` seam exists for the swap.

### P2 — integration / quality

- [x] **MediaPicker standard for future fields** — ACCEPTED 2026-08-30: riddle-mcq has no images and quiz subjects use emoji, so there is nothing to wire today; the picker is wired in the image-riddles admin form (the only image field) and is the default for any new image field.
- [x] **next/image serving** — VERIFIED 2026-08-30 in the feature-04 pass: RiddleCard uses `next/image` with `sizes` + blur placeholder; `next.config.mjs` carries the images config.
- [x] **Upload-pipeline tests** — DONE 2026-08-30: `media.service.spec.ts` (5 tests) — MIME rejection, undecodable-file rejection, WebP re-encode + dimensions/conversion metadata, delete blocked when referenced (409), delete cleans record + file when unreferenced.

### P3 — polish / tech debt

- [x] **Alt text surfaced in the picker** — DONE 2026-08-30: asset cards now show the stored alt text (with a visible "No alt text" marker when missing). **Needs owner decision if it should be _required_**: making uploads reject missing alt text is a form-policy change for the admin upload dialog.

## 5. Cross-feature touchpoints

- **Image Riddles (04)** — primary consumer: `MediaPicker` in the admin form; public page renders the stored URLs.
- **Admin Dashboard (12)** — MediaLibrarySection + `lib/media-api` (whose error helper CommentsSection also reuses).
- **Site Settings (11)** — storage backend choice would belong there if object storage lands.

## 6. Extras (2026-09-05 F08 five-step pass — noted, not acted on)

- **Seeded test content:** 20 uploads ("E2E test image N", alt text set) generated with sharp and
  uploaded via the endpoint — kept in the dev DB (storage savings stats now reflect them).
- **Upload multipart contract is `file` + `alt` only** — extra form fields (name/description) are
  silently ignored; alt text is the only metadata an upload can carry (edited nowhere today).
- **Delete E2E verified:** 20 nameless uploads deleted (204 each); stats dropped accordingly; the
  referenced-asset 409 path stays covered by `media.service.spec.ts`.
- **First probe gotcha:** the stats `total` counts all rows (drafts/status don't exist here), while
  the plan's earlier "originalName/name/description" fields no longer exist — updated §1.
