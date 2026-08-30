# Auth, Users & Guest Users (`apps/backend/src/auth|users|guest-users/` + frontend auth)

Identity layer: JWT auth, Google OAuth, password reset, user profiles, admin user management, and anonymous guest tracking. All backend paths relative to `apps/backend/src/`.

## 1. Scope & File Inventory

### Backend — auth/

| File                     | Purpose                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.controller.ts`     | `/auth` endpoints: login, register, forgot/reset-password, refresh, demographics, Google OAuth start/callback; @Throttle decorators throughout          |
| `auth.service.ts`        | Token generation (JWT + opaque refresh), login with brute-force lockout, registration, Google account linking, hashed reset tokens (SHA-256, 1h expiry) |
| `brute-force.service.ts` | Redis-backed failed-attempt counter: 5 attempts → 15-min lockout (423), TTL-preserving increments                                                       |
| `jwt.strategy.ts`        | Passport JWT from Bearer header, `getOrThrow('JWT_SECRET')`, loads full user per request                                                                |
| `jwt-auth.guard.ts`      | Honors `_Public()` decorator override                                                                                                                   |
| `google.strategy.ts`     | passport-google-oauth20 strategy                                                                                                                        |

### Backend — users/ & guest-users/ & admin/users/

| File                                        | Purpose                                                                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users/users.service.ts`                    | bcrypt(12) hashing, refresh-token storage/lookup, reset-token helpers, demographics, role update, delete                                           |
| `users/entities/user.entity.ts`             | `users`: unique email, password, name, avatar, role ('user' default), refreshToken, googleId, reset token/expiry, country/sex/ageGroup, lastActive |
| `users/users.controller.ts`                 | `/users`: admin list, profile get/update, `:id` get (self-or-admin)                                                                                |
| `guest-users/guest-users.service.ts`        | findOrCreate by client guestId, demographics, activity touch, count                                                                                |
| `guest-users/entities/guest-user.entity.ts` | `guest_users`: unique guestId, demographics, quizAttempts, totalScore                                                                              |
| `guest-users/guest-users.controller.ts`     | `admin/guest-users` guarded by JwtAuthGuard+AdminGuard                                                                                             |
| `admin/users/admin-users.controller.ts`     | `admin/users`: list, demographics list/update, role change, delete (Jwt+AdminGuard)                                                                |

### Frontend

| File                                                        | Purpose                                                                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lib/api-client.ts`                                         | Bearer injection from localStorage, 401→refresh retry (`apps/frontend/src/lib/api-client.ts:16-18` appends `/v1`) |
| `lib/auth.ts`                                               | authService: login/register/googleLogin/logout/forgot/reset/profile                                               |
| `components/DemographicsPopup.tsx`                          | Posts to `/api/v1/auth/demographics` (logged-in) or `/api/v1/guest-users/demographics` (guest)                    |
| `contexts/AuthContext` (see `../platform/frontend-core.md`) | Client auth state in localStorage                                                                                 |

## 2. What Is Done (implemented & working)

- **Login/register/refresh flow** complete end-to-end: bcrypt compare, JWT access token, opaque random 32-byte refresh token persisted per user (`auth.service.ts:18-24`); FE api-client auto-refreshes on 401.
- **Brute-force protection**: Redis counter keyed by email with TTL preservation on repeat failures and explicit lockout exception (`brute-force.service.ts:26-45`); controller-level throttle hints on login/register/refresh.
- **Password reset done right**: anti-enumeration constant message (`auth.service.ts:96-100`), SHA-256-hashed token at rest, 1h expiry checked both by lookup and date (`auth.service.ts:124-137`).
- **Google OAuth**: account linking by email when googleId absent (`auth.service.ts:74-87`); callback redirects to frontend with tokens.
- **Profile safety**: `updateProfile` whitelists only name/avatar — no mass assignment of role/email (`users.service.ts:29-39`).
- **Admin user management**: full CRUD incl. demographics export and role changes behind JwtAuthGuard+AdminGuard.

## 3. What Is Broken / Risky

1. **`GET/PUT /users/profile` are effectively dead endpoints** — they have **no auth guard** and rely on `req.user`, but there is **no global APP_GUARD** registered anywhere (`app.module.ts:97-108` has none). `req.user` is always undefined → guaranteed 401. Need `@UseGuards(JwtAuthGuard)` like `users.controller.ts:34`.
2. **Rate limiting is inert**: `@Throttle(...)` decorators require `ThrottlerModule` + `ThrottlerGuard` as APP_GUARD — neither exists anywhere in the codebase (verified by grep). All throttling currently comes only from the brute-force service (login path only); register/forgot/reset are unprotected.
3. **Refresh tokens stored in plaintext** in the users table with no expiry and no rotation-on-reuse detection (`users.service.ts:47-53`). A leaked DB row grants indefinite access. Should hash at rest + expire + revoke family on reuse.
4. **OAuth callback puts tokens in the URL query** (`auth.controller.ts` googleAuthCallback → `/login?token=...&refreshToken=...`) — leaks into browser history/referrer logs. Prefer short-lived one-time code exchanged via POST.
5. **Guest demographics endpoint mismatch**: frontend posts to `/api/v1/guest-users/demographics` (`DemographicsPopup.tsx`), but the only guest-users routes live under `admin/guest-users` behind AdminGuard (`guest-users.controller.ts:14`). Guest submissions 404 today; the popup's guest path is broken.
6. **No validation on guest DTO**: `UpdateDemographicsDto` class in the guest controller has no class-validator decorators, and admin demographic/role update bodies are untyped inline objects bypassing whitelist validation.
7. **Role is a free-text string** column with no enum/check constraint; `updateRole` accepts any value.

## 4. What Is Missing / Needs To Be Done

1. Add guards to profile endpoints; register ThrottlerModule globally and verify 429s fire.
2. Hash refresh tokens, add `refreshTokenExpiresAt`, rotate on use, invalidate on logout everywhere (logout currently only clears client storage).
3. Create public `POST /guest-users/demographics` endpoint (guestId-based, rate-limited) to match the frontend contract.
4. Add class-validator DTOs for all demographics/role payloads; constrain role to enum ('user'|'admin').
5. Email verification on registration is absent entirely; consider adding before public launch.

## 5. Process To Proceed

1. Fix #1/#5/#6 first (small, low-risk guard/DTO patches).
2. Introduce ThrottlerModule; load-test lockout interplay with brute-force service.
3. Refresh-token hardening as a dedicated PR with migration for new columns.
4. Add unit tests for AuthService (lockout, enumeration, token paths) — zero exist today (see `../platform/testing-quality.md`).

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../../plan/code-quality-plan.md](../../plan/code-quality-plan.md). Feature-specific debt tracked there in �5.
