# Feature 01 — User Accounts (Auth, Profiles & Guest Users) (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

---

## 1. File inventory

Backend (`apps/backend/src/`):

| File                                           | Purpose                                                                                                                                                                                                                  | Size (verified) |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `auth/auth.controller.ts`                      | `/auth`: login, register, forgot/reset-password, refresh, Google OAuth start/callback — throttled                                                                                                                        | 115 lines       |
| `auth/auth.service.ts`                         | JWT access tokens + opaque 32-byte refresh tokens, brute-force lockout on login, SHA-256-hashed reset tokens (1h expiry), Google account linking by email, analytics records for auth events (committed — see P1 #6)     | 237 lines       |
| `auth/brute-force.service.ts`                  | Failed-attempt counter via CacheService: 5 attempts → 15-min lockout (423), TTL-preserving                                                                                                                               | —               |
| `auth/jwt.strategy.ts` / `jwt-auth.guard.ts`   | Passport JWT from Bearer; guard honors `@_Public()`                                                                                                                                                                      | —               |
| `auth/optional-jwt-auth.guard.ts`              | Soft guard: valid token → `req.user`, anything else → anonymous (analytics ingest + guest routes)                                                                                                                        | 46 lines        |
| `auth/google.strategy.ts`                      | passport-google-oauth20                                                                                                                                                                                                  | —               |
| `auth/dto/`                                    | `auth.dto.ts` (login/register/refresh), `forgot-password.dto.ts`, `reset-password.dto.ts`                                                                                                                                | —               |
| `users/users.controller.ts`                    | `/users`: admin list (Jwt+Roles), profile get/update, `:id` (self-or-admin via ForbiddenException)                                                                                                                       | —               |
| `users/users.service.ts`                       | bcrypt(12), refresh-token storage/lookup (**SHA-256-hashed at rest** + 7-day expiry), reset-token helpers, role update, delete, lastActive; **demographics methods removed**                                             | 129 lines       |
| `users/entities/user.entity.ts`                | `users`: unique email, password, name, avatar, role (`UserRole` enum + `users_role_check` DB CHECK), **hashed** refreshToken + expiry, googleId, hashed reset token/expiry, lastActive; **country/sex/ageGroup dropped** | —               |
| `guest-users/guest-users-public.controller.ts` | Public `POST /guest-users/activity` heartbeat (guestId DTO, throttled) — demographics endpoint removed                                                                                                                   | —               |
| `guest-users/guest-users.controller.ts`        | `admin/guest-users` list + by-id (Jwt+AdminGuard); update POST removed with demographics                                                                                                                                 | —               |
| `guest-users/entities/guest-user.entity.ts`    | `guest_users`: unique guestId, quizAttempts, totalScore, lastActive; **demographics columns dropped**                                                                                                                    | —               |
| `admin/users/admin-users.controller.ts`        | `admin/users`: list (now includes lastActive), get/update/delete; **demographics endpoints removed**                                                                                                                     | —               |

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

## 2. Endpoint map

| Method & Path                               | Auth                | Notes                                                       |
| ------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| POST `/auth/login`                          | public              | brute-force lockout (423) after 5 fails/15 min              |
| POST `/auth/register`                       | public              | forces role 'user'                                          |
| POST `/auth/forgot-password`                | public              | anti-enumeration constant message                           |
| POST `/auth/reset-password`                 | public              | SHA-256-hashed token, 1h expiry                             |
| POST `/auth/refresh`                        | public              | rotated access token from opaque refresh token              |
| POST `/auth/logout`                         | Jwt                 | server-side refresh-token revocation (idempotent)           |
| POST `/auth/verify-email`                   | public              | 24h hashed one-time token (anti-enumeration resend)         |
| POST `/auth/resend-verification`            | public              | anti-enumeration constant message                           |
| POST `/auth/oauth/exchange`                 | public              | single-use 60s OAuth code → tokens (delete-before-validate) |
| GET `/auth/google`, `/auth/google/callback` | public              | OAuth; callback redirects with a one-time code (see P1)     |
| GET `/users`                                | Jwt+Roles           | admin list (id, email, name, role, createdAt, lastActive)   |
| GET/PUT `/users/profile`                    | global JwtAuthGuard | profile read/update (name/avatar whitelist)                 |
| GET `/users/:id`                            | Jwt                 | self-or-admin                                               |
| GET `/admin/users`                          | Jwt+Admin           | full list                                                   |
| GET/PUT/DELETE `/admin/users/:id`           | Jwt+Admin           | update name/role/avatar; delete                             |
| GET `/admin/guest-users`, `/:guestId`       | Jwt+Admin           | guest listing                                               |
| POST `/guest-users/activity`                | public              | guestId heartbeat (lastActive), throttled                   |

## 3. Current status

**Design facts:**

- **Global guards are live**: `ThrottlerGuard` runs first (rate limiting works everywhere), then a **default-deny `JwtAuthGuard` as APP_GUARD** with `@_Public()` opt-out — profile endpoints are reachable and everything else is protected by default (STANDARDS C1/C3).
- The guest public endpoint now exists (`POST /guest-users/activity`) with a validated, throttled DTO.
- Demographics was **removed from the codebase entirely** (entity columns + drop migration).

**Design notes:**

- Brute-force protection is CacheService-backed (goes through the shared cache service, not a direct Redis client).

## 4. Task breakdown

### P0 — critical / broken

- None open. Login/register/reset/refresh all function; the flow works end-to-end.

### P1 — major gaps (security-weighted)

- [x] **Refresh-token hardening**
- [x] **OAuth callback**
- [x] **Constrain role to an enum**
- [x] **Email verification** — **open decision:** hard-gate login until verified, or keep non-blocking (currently non-blocking).
- [x] **End-user profile page**
- [x] **Auth-event analytics records**

### P2 — integration / quality

- [x] **Unit tests for AuthService**
- [ ] **Admin user management UI** — the admin views are read-only lists today; role change and delete exist as endpoints but check whether `JokesSection`-style editing UI is wanted (role changes currently require raw API calls). **Needs owner decision: build an admin user-editing UI?**
- [x] **Logout calls a server-side revoke endpoint**
- [x] **Unify the two token stores** — role-aware single login (owner decision): `/login` also stores the admin token pair for admin accounts; admins land straight on `/admin`.

### P3 — polish / tech debt

- [x] **Refresh token column cleanup: `as any` casts in `users.service.ts`**
- [x] **Guest display-name flow boundary**
- [x] **Consolidate `users.controller` and `admin/users`**
- [ ] `/guest-users/activity` heartbeat has no frontend caller — wire it or accept the endpoint as API-only.

## 5. Cross-feature touchpoints

- **All content features** — comments, votes, and guest play attribute to either a JWT user or a client `guestId`; the optional JWT guard resolves identity softly for public routes.
- **Admin Dashboard** — user/guest management views; role check gates every admin route (`AdminGuard` + default-deny global guard).
- **Analytics** — events carry real `userId` when logged in, `guestId` otherwise; auth events (`user_registered` / `user_login` / `login_failed` / `login_locked` / `password_reset_*`) recorded server-side (committed and live — feature 13).
- **Achievements** — anonymous/localStorage only today; linking achievements to accounts depends on the refresh-token/sessions work above.
