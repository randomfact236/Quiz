# Login Feature - Implementation Plan

## Status Summary

| Feature | Status |
|---------|--------|
| User Registration (email/password) | ✅ Done |
| User Login (email/password) | ✅ Done |
| User Login (Google OAuth) | ✅ Done |
| Admin Login (separate) | ✅ Done |
| Token Refresh | ✅ Done |
| Forgot Password | ❌ TODO |
| Reset Password | ❌ TODO |
| Cleanup Dead Code | ❌ TODO |

---

## Dead Code Analysis

### Dead Code (Remove)

| File | Issue |
|------|-------|
| `brute-force.service.ts:60` | `getRemainingAttempts()` - Never called |
| `lib/auth.ts:39-45` | `authService.refresh()` - Never called |
| `settings.interface.ts:194-201` | Duplicate `AuthResponse` - Never used |
| `login/page.tsx:8` | `STORAGE_KEYS` imported but not used |
| `login/page.tsx:21` | `rememberMe` state set but never used |

### Half-Used / Bugs

| File | Issue |
|------|-------|
| `GoogleLoginButton.tsx:13-19` | `onLoginSuccess` fires immediately before redirect, not after OAuth |
| `admin/login/page.tsx` | Uses direct `api.post()` instead of `authService` (inconsistent) |

### Duplicates

| Item | Locations |
|------|-----------|
| `AuthResponse` interface | auth.controller.ts, lib/auth.ts, settings.interface.ts |
| `AuthUser` interface | lib/auth.ts, jwt-auth.guard.ts |

---

## PART 1: CLEANUP PLAN

### 1.1 Dead Code Removal

| File | Remove | Reason |
|------|--------|--------|
| `brute-force.service.ts` | `getRemainingAttempts()` method | Never called |
| `lib/auth.ts` | `refresh()` function | Never called (api-client handles) |
| `settings.interface.ts` | Duplicate `AuthResponse` | Unused |
| `login/page.tsx` | `rememberMe` state + unused import | Set but never used |

### 1.2 Bug Fixes

| File | Fix |
|------|-----|
| `GoogleLoginButton.tsx` | Remove useless try/catch, fix callback timing |
| `login/page.tsx` | Fix `rememberMe` actually storing to sessionStorage |
| `admin/login/page.tsx` | Use authService consistently or document difference |

### 1.3 Duplicates to Consolidate

| Duplicate | Action |
|-----------|--------|
| `AuthResponse` in 3 places | Keep in `lib/auth.ts`, remove from controller and settings |
| `AuthUser` in 2 places | Keep in `lib/auth.ts`, remove from jwt-auth.guard |

---

## PART 2: FORGOT PASSWORD IMPLEMENTATION

### Email Service: Resend (INSTALLED)

| Provider | Free Tier | Status |
|----------|-----------|--------|
| Resend | 100 emails/day | ✅ Installed (npm install resend) |

**Why Resend:**
- Send-only (no inbox needed)
- Professional - send from your domain
- Simple DNS verification
- Developer-friendly API

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |

### Files to Create (Backend)

```
apps/backend/src/auth/dto/forgot-password.dto.ts
apps/backend/src/auth/dto/reset-password.dto.ts
apps/backend/src/common/services/email.service.ts
```

### Files to Modify (Backend)

```
apps/backend/src/auth/auth.controller.ts  → Add endpoints
apps/backend/src/auth/auth.service.ts     → Add methods
apps/backend/src/auth/auth.module.ts      → Add EmailModule
apps/backend/.env                         → Add RESEND_API_KEY
```

### Files to Create (Frontend)

```
apps/frontend/src/app/forgot-password/page.tsx
apps/frontend/src/app/reset-password/page.tsx
```

### Files to Modify (Frontend)

```
apps/frontend/src/lib/auth.ts              → Add forgotPassword(), resetPassword()
apps/frontend/src/app/login/page.tsx        → Add forgot password link
```

### Flow Diagram

```
User                    Frontend                  Backend                    Resend            User's Email
 │                          │                         │                          │                  │
 │  Click "Forgot           │                         │                          │                  │
 │  Password"               │                         │                          │                  │
 │─────────────────────────>│                         │                          │                  │
 │                          │                         │                          │                  │
 │  Enter email             │                         │                          │                  │
 │─────────────────────────>│                         │                          │                  │
 │                          │  POST /auth/forgot      │                          │                  │
 │                          │  {email}                │                          │                  │
 │                          │────────────────────────>│                          │                  │
 │                          │                         │  Find user by email       │
 │                          │                         │───────────────────────────>
 │                          │                         │  Generate reset token    │
 │                          │                         │───────────────────────────>
 │                          │                         │  Send email via Resend   │
 │                          │                         │────────────────────────────────────────────>
 │                          │                         │                          │                  │
 │                          │  {message: "Email sent"} │                          │                  │
 │                          │<────────────────────────│                          │                  │
 │  "Check your email"      │                         │                          │                  │
 │<─────────────────────────│                         │                          │                  │
 │                          │                         │                          │                  │
 │                          │                         │                          │  Email with reset │
 │                          │                         │                          │  link received    │
 │                          │                         │                          │<──────────────────│
```

### Reset Password Flow

```
User                    Frontend                  Backend                    Database
 │                          │                         │                           │
 │  Click reset link:       │                         │                           │
 │  /reset-password?token=xxx│                         │                           │
 │─────────────────────────>│                         │                           │
 │                          │  POST /auth/reset        │                           │
 │                          │  {token, newPassword}   │                           │
 │                          │────────────────────────>│                           │
 │                          │                         │  Validate token           │
 │                          │                         │────────────────────────────>
 │                          │                         │  Hash new password        │
 │                          │                         │────────────────────────────>
 │                          │                         │  Update user password     │
 │                          │                         │────────────────────────────>
 │                          │  {message: "Success"}  │                           │
 │                          │<────────────────────────│                           │
```

---

## PART 3: EXECUTION ORDER

```
╔══════════════════════════════════════════════════════════════════╗
║ PHASE 1: CLEANUP (30 min) - Low Risk                           ║
╠══════════════════════════════════════════════════════════════════╣
║ TASK 1.1: Remove Dead Code                                      ║
║ ─────────────────────────────────────────────────────────────── ║
║ 1. brute-force.service.ts    → Remove getRemainingAttempts()    ║
║ 2. lib/auth.ts              → Remove refresh() function         ║
║ 3. settings.interface.ts    → Remove duplicate AuthResponse      ║
║ 4. login/page.tsx           → Remove unused STORAGE_KEYS import  ║
║ 5. login/page.tsx           → Remove unused rememberMe state     ║
║                                                                  ║
║ TASK 1.2: Fix Bugs                                              ║
║ ─────────────────────────────────────────────────────────────── ║
║ 1. GoogleLoginButton.tsx   → Fix useless try/catch              ║
║ 2. login/page.tsx          → Fix rememberMe using sessionStorage ║
║ 3. admin/login/page.tsx     → Document why separate from authService ║
║                                                                  ║
║ TASK 1.3: Remove Duplicates                                     ║
║ ─────────────────────────────────────────────────────────────── ║
║ 1. AuthResponse (3 places) → Keep in lib/auth.ts only           ║
║ 2. AuthUser (2 places)     → Keep in lib/auth.ts only           ║
╚══════════════════════════════════════════════════════════════════╝
                              ↓
╔══════════════════════════════════════════════════════════════════╗
║ PHASE 2: FORGOT PASSWORD (1.5-2 hours) - Medium Risk             ║
╠══════════════════════════════════════════════════════════════════╣
║ STEP 1: Backend Setup                                           ║
║ ─────────────────────────────────────────────────────────────── ║
║ 1. ✅ Install resend package    (npm install resend)             ║
║ 2. Add RESEND_* vars to .env                                    ║
║ 3. Create email.service.ts      (Resend wrapper)                ║
║ 4. Create forgot-password.dto.ts                                ║
║ 5. Create reset-password.dto.ts                                 ║
║ 6. Update auth.service.ts       (add forgotPassword, resetPassword)║
║ 7. Update auth.controller.ts    (add endpoints)                  ║
║ 8. Update auth.module.ts        (register module)                ║
║                                                                  ║
║ STEP 2: Frontend Setup                                          ║
║ ─────────────────────────────────────────────────────────────── ║
║ 1. Create app/forgot-password/page.tsx                          ║
║ 2. Create app/reset-password/page.tsx                           ║
║ 3. Update lib/auth.ts          (add forgotPassword, resetPassword)║
║ 4. Update login/page.tsx       (add forgot password link)       ║
╚══════════════════════════════════════════════════════════════════╝
                              ↓
╔══════════════════════════════════════════════════════════════════╗
║ PHASE 3: TESTING (30 min)                                       ║
╠══════════════════════════════════════════════════════════════════╣
║ 1. Test user login (email/password)                             ║
║ 2. Test user registration                                       ║
║ 3. Test Google OAuth                                            ║
║ 4. Test admin login                                            ║
║ 5. Test forgot password flow                                    ║
║ 6. Test reset password flow                                     ║
║ 7. Test token refresh                                           ║
╚══════════════════════════════════════════════════════════════════╝
```
PHASE 1: Cleanup (30 min) - Low Risk
───────────────────────────────────────
1. Remove dead code
   - Remove getRemainingAttempts() from brute-force.service.ts
   - Remove refresh() from lib/auth.ts
   - Remove duplicate AuthResponse from settings.interface.ts
   - Remove unused rememberMe state from login/page.tsx

2. Fix bugs
   - Fix GoogleLoginButton callback timing
   - Fix rememberMe actually using sessionStorage

PHASE 2: Forgot Password (1.5-2 hours) - Medium Risk
───────────────────────────────────────────────────────────────────────
1. ✅ Install resend package (npm install resend)
2. Create email.service.ts (Resend wrapper)
3. Add DTOs for forgot/reset
4. Add endpoints to controller
5. Add RESEND_* vars to .env
6. Create forgot-password page
7. Create reset-password page
8. Add links to login page
9. Test end-to-end

PHASE 3: Testing (30 min)
────────────────────────────────────────────────────────
1. Test user login (email/password)
2. Test user registration
3. Test Google OAuth
4. Test admin login
5. Test forgot password flow
6. Test reset password flow
7. Test token refresh
```

---

## PART 4: FILE CHANGES SUMMARY

### Backend Changes

| Status | Action | File |
|--------|--------|------|
| ❌ | MODIFY | auth.controller.ts |
| ❌ | MODIFY | auth.service.ts |
| ❌ | MODIFY | auth.module.ts |
| ❌ | MODIFY | apps/backend/.env |
| ❌ | MODIFY | brute-force.service.ts |
| ❌ | MODIFY | settings.interface.ts |
| ❌ | CREATE | auth/dto/forgot-password.dto.ts |
| ❌ | CREATE | auth/dto/reset-password.dto.ts |
| ❌ | CREATE | common/services/email.service.ts |

### Frontend Changes

| Status | Action | File |
|--------|--------|------|
| ❌ | MODIFY | lib/auth.ts |
| ❌ | MODIFY | app/login/page.tsx |
| ❌ | MODIFY | components/ui/GoogleLoginButton.tsx |
| ❌ | CREATE | app/forgot-password/page.tsx |
| ❌ | CREATE | app/reset-password/page.tsx |

---

## PART 5: TASK TRACKER

### PHASE 1: Cleanup

| # | Task | Status |
|---|------|--------|
| 1.1.1 | Remove getRemainingAttempts() from brute-force.service.ts | ✅ |
| 1.1.2 | Remove refresh() from lib/auth.ts | ✅ |
| 1.1.3 | Remove duplicate AuthResponse from settings.interface.ts | ✅ |
| 1.1.4 | Remove unused STORAGE_KEYS import from login/page.tsx | ⏭️ Skip (used) |
| 1.1.5 | Fix rememberMe to use sessionStorage when unchecked | ✅ |
| 1.2.1 | Fix GoogleLoginButton useless try/catch | ✅ |
| 1.2.2 | Fix rememberMe using sessionStorage | ✅ (done in 1.1.5) |
| 1.3.1 | Consolidate AuthResponse interfaces | ✅ (removed duplicate) |
| 1.3.2 | Consolidate AuthUser interfaces | ⏭️ Skip (different layers) |
| 1.4 | Additional cleanup found during analysis | ✅ |
| 1.4.1 | google.strategy.ts - Remove debug Logger, unused params | ✅ |
| 1.4.2 | GoogleLoginButton - Remove unused onLoginSuccess prop | ✅ |
| 1.4.3 | login/page.tsx - Remove unused handleGoogleSuccess | ✅ |
| 1.4.4 | settings.interface.ts - Remove unused AuthenticatedUser, JwtValidationResult, FindConditions | ✅ |

### PHASE 2: Forgot Password

| # | Task | Status |
|---|------|--------|
| 2.1.1 | Add RESEND_* vars to .env | ✅ |
| 2.1.2 | Create email.service.ts | ✅ |
| 2.1.3 | Create forgot-password.dto.ts | ✅ |
| 2.1.4 | Create reset-password.dto.ts | ✅ |
| 2.1.5 | Update auth.service.ts (add methods) | ✅ |
| 2.1.6 | Update users.service.ts (add methods) | ✅ |
| 2.1.7 | Update auth.controller.ts (add endpoints) | ✅ |
| 2.1.8 | Update auth.module.ts (add EmailService) | ✅ |
| 2.2.1 | Create forgot-password page | ✅ |
| 2.2.2 | Create reset-password page | ✅ |
| 2.2.3 | Update lib/auth.ts (add methods) | ✅ |
| 2.2.4 | Update login page with link | ✅ |

---

## PART 5: TIME ESTIMATE

| Phase | Time | Risk |
|-------|------|------|
| Phase 1: Cleanup | 30 min | Low |
| Phase 2: Forgot Password | 1.5-2 hours | Medium |
| Phase 3: Testing | 30 min | - |
| **Total** | **2.5-3 hours** | - |

---

## PART 6: CURRENT PROGRESS

### ✅ COMPLETED

| Item | Date |
|------|------|
| Resend account created | Today |
| Domain verified (quiz.profitbenefit.com) | Today |
| DNS records verified (DKIM, SPF, DMARC) | Today |
| Resend package installed (npm install resend) | Today |

---

## Resend Configuration

### Account Details (COMPLETED)

| Setting | Value |
|---------|-------|
| Domain | `quiz.profitbenefit.com` |
| Region | us-east-1 |
| Custom Return-Path | `send` |
| Sending | ✅ Enabled |
| Receiving | ❌ Disabled (not needed) |

### API Key

```
RESEND_API_KEY=re_3JJXYZ8j_6D2bX57Ryg1KUyicGioZpcbT
RESEND_DOMAIN=quiz.profitbenefit.com
FROM_EMAIL=noreply@quiz.profitbenefit.com
```

### DNS Verification Status

| Record Type | Status |
|-------------|--------|
| DKIM | ✅ Verified |
| SPF | ✅ Verified |
| DMARC | ✅ Configured |

---

## Prerequisites

1. ✅ Resend account created
2. ✅ Domain verified (quiz.profitbenefit.com)
3. ✅ API key ready
4. ✅ DNS records verified

---

## Notes

- Resend is send-only (no inbox)
- For receiving feedback, use personal Gmail with mailto: link
- Remember me checkbox should use sessionStorage if unchecked
- Subdomains are FREE on Resend - can send from any email@quiz.profitbenefit.com
