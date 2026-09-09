# Feature 12 — Admin Dashboard (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
> Note: the per-content admin CRUD surfaces have their own files (01–04); this file covers the shell,
> navigation, guard, and the non-content sections.

---

## 1. File inventory

Frontend (`apps/frontend/src/app/admin/`):

| File / dir                                                                                            | Purpose                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.tsx` (595 lines)                                                                                | Admin shell: collapsible sidebar, URL-driven `?section=` navigation, section rendering, loads subjects for the quiz-mcq tree                                                     |
| `login/page.tsx`                                                                                      | Dedicated `/admin/login` page (stores `aiquiz:admin-token` / admin refresh variants)                                                                                             |
| `users/page.tsx`                                                                                      | Standalone `/admin/users` full page — **duplicates** the `users` section rendered inside the dashboard                                                                           |
| `components/AdminGuard.tsx`                                                                           | Client-side gate: reads `aiquiz:admin-token`, decodes the JWT payload, requires `role === 'admin'`, else redirects (to `/` for non-admins, `/admin/login` when no/invalid token) |
| `components/index.ts`                                                                                 | Barrel exports for all sections                                                                                                                                                  |
| `components/AdminUsersSection.tsx`                                                                    | Users section — plain registered/guest lists (demographics removed)                                                                                                              |
| `components/AnalyticsSection.tsx`                                                                     | Analytics dashboard (feature 13)                                                                                                                                                 |
| `components/CommentsSection.tsx`                                                                      | Comment moderation: admin list + bulk actions via `lib/comments-api`                                                                                                             |
| `components/ImageRiddlesAdminSection.tsx`                                                             | Thin 200-line composition layer over `features/image-riddles/admin/**`                                                                                                           |
| `components/JokesSection.tsx`                                                                         | Joke CRUD/import — receives `allJokes`/categories as **props from `hooks/useAdminData.ts`**, which persists them to localStorage (hybrid pattern; API-wired underneath)          |
| `components/MediaLibrarySection.tsx`                                                                  | Media library: upload/list/delete/stats via `lib/media-api`                                                                                                                      |
| `components/RiddleSidebar.tsx`, `SubjectList.tsx`, `SubjectEmptyState.tsx`, `SubjectLoadingState.tsx` | Sidebar/quiz subject tree helpers                                                                                                                                                |
| `components/SettingsSection.tsx`                                                                      | Site settings UI (feature 11)                                                                                                                                                    |
| `hooks/useAdminData.ts`                                                                               | Page-level joke/category state + localStorage persistence                                                                                                                        |
| `utils/quiz-mcq-importer.ts`, `utils/index.ts`                                                        | CSV import helper                                                                                                                                                                |

Backend admin surfaces (JWT + AdminGuard/RolesGuard, all under the default-deny global guard):

| Surface                                        | Location                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/users`                                 | `admin/users/admin-users.controller.ts` (list incl. lastActive, get/update/delete)                                                                       |
| `/admin/image-riddles/*`                       | `admin/image-riddles/` (canonical CRUD, categories, dashboard stats/recent)                                                                              |
| `/admin/guest-users`                           | `guest-users/guest-users.controller.ts` (list, by-id)                                                                                                    |
| `/admin/analytics/overview, retention, events` | `analytics/admin-analytics.controller.ts`                                                                                                                |
| `/media/*`                                     | `media/media.controller.ts` (JWT-guarded upload/list/stats/delete)                                                                                       |
| Admin-guarded reads inside content controllers | `quiz-mcq` (filter-counts, status-counts, all-questions), `riddle-mcq` (all, filter-counts, status-counts), `jokes` (all, status-counts, stats/overview) |

## 2. Current status

**Done:** full section navigation (10 sections) with URL sync; separate admin login; client-side role gate; every content feature has a working management UI (quiz-mcq incl. per-subject views, riddle-mcq, image-riddles, jokes); moderation (comments), media library, users, settings, analytics sections all render live data from their APIs; backend enforces admin on every surface (client JWT decode is convenience, not the security boundary).

**Remaining gaps:** the jokes management data pattern (props + useAdminData localStorage hybrid) still differs from every other section (P2 deferral stands); admin-shell unit tests remain deferred; **auth flow** — admins logging in on the main /login land straight here (role-aware single login), and /admin with no admin session bounces instantly to /admin/login.

## 3. Task breakdown

### P0 — critical / broken

- None open. All sections render and their APIs work.

### P1 — major gaps

- [x] **Summary section built**
- [x] **User management actions**
- [x] **Canonical user surface**

### P2 — integration / quality

- [ ] Unify section data patterns — **deferred as structural tech debt**: `JokesSection` is fully API-backed (feature 05) and works; the props-pattern → hooks migration plus `useAdminData` deletion is churn without user-visible benefit. Revisit when jokes admin needs new features.
- [ ] Consistent import/export — **deferred**: all four module importers work today; unifying them is a UX refactor with no functional gap. Revisit when adding the fifth importer.
- [x] **AdminGuard UX / 401-intercept**
- [ ] Tests for admin shell logic — partially covered indirectly (api-client/admin flows exercise the paths in integration tests); dedicated guard-decode unit tests **deferred** (the decode logic is inline in AdminGuard; extracting it solely for tests is churn — revisit with the section-data-patterns unification).

### P3 — polish / tech debt

- [x] **Dead `_downloadFile` block deleted**
- [x] **Sidebar grouping**
- [x] **`AdminGuard.tsx` indentation normalized**

## 4. Cross-feature touchpoints

- **User Accounts (01)** — admin login page + admin token storage variants; AdminGuard role check mirrors the backend `AdminGuard`.
- **Features 02–05** — one management section each; content features 02–04 moved their admin implementations into `features/*/admin` trees, jokes remains inline.
- **Analytics (13)** — AnalyticsSection is an admin dashboard section fed by `/admin/analytics/*`.
- **Site Settings (11)** — SettingsSection is an admin dashboard section.
- **Media** — MediaLibrarySection + `lib/media-api` over the JWT-guarded media module; used by the image-riddles form.
- **Comments** — CommentsSection moderation over `lib/comments-api`.
