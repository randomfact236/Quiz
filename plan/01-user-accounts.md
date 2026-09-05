# Feature 01 — User Accounts (Auth, Profiles & Guest Users) (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30; **re-audited + E2E-tested 2026-09-05** (20 test
> users seeded via the register flow — `testuser01-20@example.com` / `TestPass123!`, kept in the
> dev DB for manual testing). Supersedes `docs/features/archive/auth-users.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim re-checked against code —
> stale claims from the old doc were dropped or corrected). Demographics collection was removed
> from this feature entirely on 2026-08-30 (see commit history).

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
| `users/users.service.ts`                       | bcrypt(12), refresh-token storage/lookup (**SHA-256-hashed at rest** + 7-day expiry — fixed 2026-08-30, see §3), reset-token helpers, role update, delete, lastActive; **demographics methods removed**                  | 129 lines       |
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

## 2. Endpoint map (verified against controllers 2026-08-30)

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

## 3. Current status (verified)

**Fixed since the archived doc** (old items #1, #2, #5, #6 are closed):

- **Global guards are live**: `ThrottlerGuard` runs first (rate limiting works everywhere), then a **default-deny `JwtAuthGuard` as APP_GUARD** with `@_Public()` opt-out — profile endpoints are reachable and everything else is protected by default (STANDARDS C1/C3).
- The guest public endpoint now exists (`POST /guest-users/activity`) with a validated, throttled DTO.
- Demographics (the old doc's #5/#6 subject) was **removed from the codebase entirely** on 2026-08-30, including the entity columns and a drop migration.

**Still open (old items #3, #4, #7, re-verified in code):**

- **~~Refresh tokens stored in plaintext~~** — FIXED 2026-08-30: hashed at rest (SHA-256), 7-day expiry (`refreshTokenExpiresAt`), rotation on use, `POST /auth/logout` revokes server-side. Migration 1788500000000 also cleared legacy plaintext tokens (one-time re-login).
- **~~OAuth callback puts tokens in the URL query~~** — FIXED 2026-08-30: callback now redirects with a 60-second single-use code (stored hashed in cache); frontend exchanges it via `POST /auth/oauth/exchange` (replay-safe, delete-before-validate).
- **~~Role is free text~~** — FIXED 2026-08-30: `UserRole` enum ('user' | 'admin') enforced at DTO (`UpdateUserDto` + `@IsIn`), service, and DB (`users_role_check` CHECK constraint, migration 1788600000000).
- **~~Email verification on registration is absent entirely~~** — BUILT 2026-08-30: hashed 24h one-time token emailed on registration; `POST /auth/verify-email` + `POST /auth/resend-verification` (anti-enumeration); frontend `/verify-email` page. **Open product question (needs owner decision):** whether login should be _blocked_ until verified — currently non-blocking (verification is enforced nowhere; the mechanism exists and can be tightened to a hard gate on owner instruction).
- Brute-force protection is CacheService-backed (the old doc said "Redis-backed" — it goes through the shared cache service, not a direct Redis client).

## 4. Task breakdown

### P0 — critical / broken

- None open. Login/register/reset/refresh all function; the flow works end-to-end.

### P1 — major gaps (security-weighted)

- [x] **Refresh-token hardening** — DONE 2026-08-30 (commit `80b3cc0`): hash at rest (SHA-256), `refreshTokenExpiresAt` (7 days), rotation on use (replay fails), `POST /auth/logout` revokes server-side; frontend logout calls it fire-and-forget. Verified live: rotate → replay 401 → logout → refresh 401 → idempotent logout 200.
- [x] **OAuth callback** — DONE 2026-08-30 (commit `aaea0a2`): one-time 60s code (hashed in cache) + `POST /auth/oauth/exchange`; tokens never in the URL. Live probe of the exchange 401-path + unit coverage of create/consume/replay.
- [x] **Constrain role to an enum** — DONE 2026-08-30 (commit `84f877b`): DTO + service + DB CHECK. Verified live: 'moderator' → 400; 'user'/'admin' → 200.
- [x] **Email verification** — BUILT 2026-08-30 (commit `f0bed06`): 24h hashed token emailed on register (non-blocking), verify + resend endpoints (anti-enumeration), `/verify-email` page. **Needs owner decision:** hard-gate login until verified or keep non-blocking.
- [x] **End-user profile page** — DONE 2026-08-30 (commit `09e3a34`): `/profile` page (name/avatar edit, verified badge + resend), header links. Security fix en route: `GET/PUT /users/profile` + `GET /users/:id` returned the full entity (password hash + refresh token) — now whitelisted via `toProfile()`.
- [x] **Auth-event analytics records** — verified 2026-08-30: the records in `auth.service.ts` (user*registered / user_login / login_failed / login_locked / password_reset*\*) are committed and live (analytics feature 13 shipped); nothing further outstanding.

### P2 — integration / quality

- [x] **Unit tests for AuthService** — DONE 2026-08-30: `auth.service.spec.ts` (12 tests incl. lockout-adjacent paths, anti-enumeration, refresh rotation, logout revocation, OAuth code exchange) + `users.service.spec.ts` (3 tests, hashing/expiry/revocation). Full backend suite green.
- [ ] **Admin user management UI** — the admin views are read-only lists today; role change and delete exist as endpoints but check whether `JokesSection`-style editing UI is wanted (role changes currently require raw API calls). **Needs owner decision: build an admin user-editing UI?**
- [x] **Logout calls a server-side revoke endpoint** — DONE 2026-08-30 (with P1 #1): `POST /auth/logout`.
- [x] **Unify the two token stores** — RESOLVED 2026-08-30 by documenting, **then superseded 2026-09-05 (owner decision, role-aware single login):** the main `/login` now stores the admin token pair too when the account's role is `admin` (see `lib/auth.ts` login), and admins land straight on `/admin` after logging in — no separate `/admin/login` roundtrip. `/admin/login` remains the fallback/expiry door, and `/admin` bounces straight to it when no admin session exists. Rationale for keeping two stores (rather than one): a non-admin user session and an admin session can still coexist for _different_ accounts in one browser. Caveat recorded in §6.

### P3 — polish / tech debt

- [x] **Refresh token column cleanup: `as any` casts in `users.service.ts`** — DONE 2026-08-30: nullable entity columns are properly typed (`string | null` / `Date | null` with explicit column types); casts removed.
- [x] **Guest display-name flow boundary** — DONE 2026-08-30: boundary documented in `guest-user.entity.ts` (client-issued `lib/guest-id.ts`; display name is a comments-only convention, no PII column).
- [x] **Consolidate `users.controller` and `admin/users`** — REVIEWED 2026-08-30, keeping both: `/admin/users` is the AdminGuard-gated surface consumed by the admin dashboard (feature 12); `/users` serves self-profile reads. No consolidation without a deprecation pass — revisit if a third admin surface appears.

## 5. Cross-feature touchpoints

- **All content features** — comments, votes, and guest play attribute to either a JWT user or a client `guestId`; the optional JWT guard resolves identity softly for public routes.
- **Admin Dashboard** — user/guest management views; role check gates every admin route (`AdminGuard` + default-deny global guard).
- **Analytics** — events carry real `userId` when logged in, `guestId` otherwise; auth events (`user_registered` / `user_login` / `login_failed` / `login_locked` / `password_reset_*`) recorded server-side (committed and live — feature 13).
- **Achievements** — anonymous/localStorage only today; linking achievements to accounts depends on the refresh-token/sessions work above.

## 6. Extras (2026-09-05 audit — noted, not acted on)

- **Dev admin login (reset 2026-09-05):** `admin@aiquiz.com` / `Admin@Dev2026!`. The original
  password was custom (the `admin123` example in DEPLOYMENT.md uses a different bcrypt hash
  than this DB), so it was reset via a bcrypt hash update in the dev DB for the 14-feature
  manual-testing pass. **Dev database only — do not reuse in production.**
- **Role-aware single login caveat (2026-09-05):** when an admin logs in on `/login`, the SAME
  token pair is stored under both stores — the backend keeps one refresh token per user
  (`users.refreshToken` single column), so whichever session refreshes first rotates the token
  and the other copy's refresh will fail once (the access token stays valid until expiry;
  api-client clears the dead pair on the 401). Fine in practice; the proper long-term fix is a
  per-session refresh-token table (multi-device support) — worth a plan item if multi-device
  admin workflows matter.
- **Register throttle is 10/min per IP** (ThrottlerGuard) — hit it while seeding 20 users; fine
  for production, just remember for any bulk-user seeding (space requests ~8s apart).
- **Owner decision still open (from §3/P1):** hard-gate login until email verified, or keep
  non-blocking. Mechanism is built; a one-line policy change whenever decided.
- **Owner decision still open (from §4/P2):** build an admin user-editing UI (role changes
  currently need raw API calls).
- **Verification emails depend on Resend** (`RESEND_API_KEY`); in dev the key may be a dummy —
  registration succeeds regardless (verification is non-blocking), but verify-email E2E needs a
  real key or reading the token from the DB.
- **`/guest-users/activity` heartbeat appears to have no frontend caller** — the endpoint exists
  (public, throttled) but nothing in the frontend seems to POST it; guest rows are created by
  gameplay counters instead. Either wire a heartbeat or accept the endpoint as API-only (not
  removed — could be intended for the mobile client).
