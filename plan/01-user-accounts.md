# Feature 01 — User Accounts (Auth, Profiles & Guest Users) (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> This is the same convention used in `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`.
>
> Verified against the live codebase: 2026-08-30. Supersedes `docs/features/archive/auth-users.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim re-checked against code —
> stale claims from the old doc were dropped or corrected). Demographics collection was removed
> from this feature entirely on 2026-08-30 (see commit history).

---

## 1. File inventory

Backend (`apps/backend/src/`):

| File                                           | Purpose                                                                                                                                                                                                        | Size (verified) |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `auth/auth.controller.ts`                      | `/auth`: login, register, forgot/reset-password, refresh, Google OAuth start/callback — throttled                                                                                                              | 115 lines       |
| `auth/auth.service.ts`                         | JWT access tokens + opaque 32-byte refresh tokens, brute-force lockout on login, SHA-256-hashed reset tokens (1h expiry), Google account linking by email, **(uncommitted)** analytics records for auth events | 237 lines       |
| `auth/brute-force.service.ts`                  | Failed-attempt counter via CacheService: 5 attempts → 15-min lockout (423), TTL-preserving                                                                                                                     | —               |
| `auth/jwt.strategy.ts` / `jwt-auth.guard.ts`   | Passport JWT from Bearer; guard honors `@_Public()`                                                                                                                                                            | —               |
| `auth/optional-jwt-auth.guard.ts`              | Soft guard: valid token → `req.user`, anything else → anonymous (analytics ingest + guest routes)                                                                                                              | 46 lines        |
| `auth/google.strategy.ts`                      | passport-google-oauth20                                                                                                                                                                                        | —               |
| `auth/dto/`                                    | `auth.dto.ts` (login/register/refresh), `forgot-password.dto.ts`, `reset-password.dto.ts`                                                                                                                      | —               |
| `users/users.controller.ts`                    | `/users`: admin list (Jwt+Roles), profile get/update, `:id` (self-or-admin via ForbiddenException)                                                                                                             | —               |
| `users/users.service.ts`                       | bcrypt(12), refresh-token storage/lookup (plaintext), reset-token helpers, role update, delete, lastActive; **demographics methods removed**                                                                   | 129 lines       |
| `users/entities/user.entity.ts`                | `users`: unique email, password, name, avatar, role (free-text, default 'user'), refreshToken (plaintext), googleId, hashed reset token/expiry, lastActive; **country/sex/ageGroup dropped**                   | —               |
| `guest-users/guest-users-public.controller.ts` | Public `POST /guest-users/activity` heartbeat (guestId DTO, throttled) — demographics endpoint removed                                                                                                         | —               |
| `guest-users/guest-users.controller.ts`        | `admin/guest-users` list + by-id (Jwt+AdminGuard); update POST removed with demographics                                                                                                                       | —               |
| `guest-users/entities/guest-user.entity.ts`    | `guest_users`: unique guestId, quizAttempts, totalScore, lastActive; **demographics columns dropped**                                                                                                          | —               |
| `admin/users/admin-users.controller.ts`        | `admin/users`: list (now includes lastActive), get/update/delete; **demographics endpoints removed**                                                                                                           | —               |

Frontend (`apps/frontend/src/`):

| File                                                          | Purpose                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `lib/api-client.ts`                                           | Bearer injection, separate user/admin token keys, **automatic 401 → `/auth/refresh` retry** with re-request |
| `lib/auth.ts`                                                 | authService: login/register/googleLogin/logout/forgot/reset                                                 |
| `contexts/AuthContext.tsx`                                    | Client auth state from localStorage (`isAuthenticated`, login/logout)                                       |
| `app/login/page.tsx`                                          | Login (+ Google OAuth callback handling: reads token/refreshToken/user from query)                          |
| `app/register/page.tsx`                                       | Registration                                                                                                |
| `app/forgot-password/page.tsx`, `app/reset-password/page.tsx` | Password reset flow                                                                                         |
| `lib/guest-id.ts`                                             | Client-issued guest identity (`aiquiz:guest-id`) + guest display name for comments                          |
| `lib/storage.ts`                                              | Token/refresh keys (user + admin variants)                                                                  |

## 2. Endpoint map (verified against controllers 2026-08-30)

| Method & Path                               | Auth                | Notes                                                     |
| ------------------------------------------- | ------------------- | --------------------------------------------------------- |
| POST `/auth/login`                          | public              | brute-force lockout (423) after 5 fails/15 min            |
| POST `/auth/register`                       | public              | forces role 'user'                                        |
| POST `/auth/forgot-password`                | public              | anti-enumeration constant message                         |
| POST `/auth/reset-password`                 | public              | SHA-256-hashed token, 1h expiry                           |
| POST `/auth/refresh`                        | public              | rotated access token from opaque refresh token            |
| GET `/auth/google`, `/auth/google/callback` | public              | OAuth; callback redirects with tokens in URL (see P1)     |
| GET `/users`                                | Jwt+Roles           | admin list (id, email, name, role, createdAt, lastActive) |
| GET/PUT `/users/profile`                    | global JwtAuthGuard | profile read/update (name/avatar whitelist)               |
| GET `/users/:id`                            | Jwt                 | self-or-admin                                             |
| GET `/admin/users`                          | Jwt+Admin           | full list                                                 |
| GET/PUT/DELETE `/admin/users/:id`           | Jwt+Admin           | update name/role/avatar; delete                           |
| GET `/admin/guest-users`, `/:guestId`       | Jwt+Admin           | guest listing                                             |
| POST `/guest-users/activity`                | public              | guestId heartbeat (lastActive), throttled                 |

## 3. Current status (verified)

**Fixed since the archived doc** (old items #1, #2, #5, #6 are closed):

- **Global guards are live**: `ThrottlerGuard` runs first (rate limiting works everywhere), then a **default-deny `JwtAuthGuard` as APP_GUARD** with `@_Public()` opt-out — profile endpoints are reachable and everything else is protected by default (capacity-plan C1/C3).
- The guest public endpoint now exists (`POST /guest-users/activity`) with a validated, throttled DTO.
- Demographics (the old doc's #5/#6 subject) was **removed from the codebase entirely** on 2026-08-30, including the entity columns and a drop migration.

**Still open (old items #3, #4, #7, re-verified in code):**

- **Refresh tokens stored in plaintext** (`users.service.ts:60-65`) with no expiry and no rotation-on-reuse detection.
- **OAuth callback puts tokens in the URL query** (`auth.controller.ts:111` → `/login?token=...&refreshToken=...`).
- **Role is free text** — `PUT /admin/users/:id` accepts any role string; no enum/check.
- **Email verification on registration is absent entirely.**
- Brute-force protection is CacheService-backed (the old doc said "Redis-backed" — it goes through the shared cache service, not a direct Redis client).

## 4. Task breakdown

### P0 — critical / broken

- None open. Login/register/reset/refresh all function; the flow works end-to-end.

### P1 — major gaps (security-weighted)

- [ ] **Refresh-token hardening**: hash at rest, add `refreshTokenExpiresAt`, rotate on use, revoke on logout server-side (logout currently clears client storage only — the token stays valid).
- [ ] **OAuth callback**: replace token-in-URL with a short-lived one-time code exchanged via POST (tokens leak to browser history/referrer logs today).
- [ ] **Constrain role to an enum** ('user' \| 'admin') at the DTO and DB level.
- [ ] **Email verification** before public launch (absent entirely).
- [ ] **End-user profile page**: `GET/PUT /users/profile` exist but there is no page to view/edit name or avatar — build `/profile` (also listed in plan/BUILD-BACKLOG.md #6).
- [ ] Commit the auth-event analytics records in `auth.service.ts` when the analytics feature is revisited (paused by decision 2026-08-30).

### P2 — integration / quality

- [ ] Unit tests for AuthService (lockout, anti-enumeration, token paths) — zero exist.
- [ ] Admin user management UI: the admin views are read-only lists today; role change and delete exist as endpoints but check whether `JokesSection`-style editing UI is wanted (role changes currently require raw API calls).
- [ ] Logout should call a server-side revoke endpoint once refresh tokens are expiring/rotating.
- [ ] Unify the two token stores (user vs admin variants in `lib/api-client.ts`) or document why they diverge.

### P3 — polish / tech debt

- [ ] Refresh token column cleanup: `as any` casts in `users.service.ts` (typeorm update typing).
- [ ] Guest display-name flow (`lib/guest-id.ts` `getGuestName`) is comments-only — fine, but document the boundary in the entity comments.
- [ ] Consider consolidating `users.controller` and `admin/users` (two admin surfaces for the same entity).

## 5. Cross-feature touchpoints

- **All content features** — comments, votes, and guest play attribute to either a JWT user or a client `guestId`; the optional JWT guard resolves identity softly for public routes.
- **Admin Dashboard** — user/guest management views; role check gates every admin route (`AdminGuard` + default-deny global guard).
- **Analytics** — events carry real `userId` when logged in, `guestId` otherwise; auth events (uncommitted) recorded server-side.
- **Achievements** — anonymous/localStorage only today; linking achievements to accounts depends on the refresh-token/sessions work above.
