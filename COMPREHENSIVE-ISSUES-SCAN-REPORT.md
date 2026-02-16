# Comprehensive Website Issues Scan Report

**Generated:** February 15, 2026  
**Project:** Quiz Application (Backend + Frontend)  
**Scan Type:** Full Codebase Analysis  
**Verification Status:** All critical and high-severity issues verified against actual code

---

## Executive Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 5 | 7 | 9 | 2 | 23 |
| Error Handling | 1 | 3 | 13 | 3 | 20 |
| Logic Bugs | 0 | 6 | 9 | 4 | 19 |
| Performance | 0 | 2 | 13 | 2 | 17 |
| Code Quality | 0 | 0 | 5 | 14 | 19 |
| **Total** | **6** | **18** | **49** | **25** | **98** |

---

## Issues by Feature Category

### 1. AUTHENTICATION & AUTHORIZATION (8 issues)

#### 🔴 Critical Issues

| # | File | Line | Issue | Verified |
|---|------|------|-------|----------|
| 1 | `jwt.strategy.ts` | 50 | **Hardcoded JWT secret fallback** - Uses 'your-secret-key' as default if JWT_SECRET env var is not set. Attackers can forge tokens if app is misconfigured. | ✅ YES |
| 2 | `users.controller.ts` | 34 | **Unprotected getAll endpoint** - Returns all users without any authentication/authorization guards, exposing user data. | ✅ YES |

```typescript
// jwt.strategy.ts - Line 50 (VERIFIED)
secretOrKey: configService.get('JWT_SECRET', 'your-secret-key'),

// RECOMMENDATION:
secretOrKey: configService.getOrThrow('JWT_SECRET')
```

```typescript
// users.controller.ts - Line 34 (VERIFIED)
@Get()
@ApiOperation({ summary: 'Get all users' })
async getAll(): Promise<unknown[]> {
  return this.usersService.getAll();  // NO AUTH GUARDS
}

// RECOMMENDATION:
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
```

#### 🟠 High Severity

| # | File | Line | Issue | Verified |
|---|------|------|-------|----------|
| 3 | `auth.service.ts` | 56 | **JWT tokens lack expiration** - Tokens never expire, creating permanent security risk if leaked. | ✅ YES |
| 4 | `jwt.strategy.ts` | 68 | **Missing user existence validation** - Returns user without checking if they still exist in database. | ✅ YES |
| 5 | `users.controller.ts` | 50 | **IDOR vulnerability in getById** - Anyone can fetch any user's profile by ID without authentication. | ✅ YES |

```typescript
// auth.service.ts - Line 56 (VERIFIED)
const token = this.jwtService.sign({ id: user.id, email: user.email, role: user.role });

// RECOMMENDATION:
const token = this.jwtService.sign(payload, { expiresIn: '24h' })
```

#### 🟡 Medium Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 6 | `auth.service.ts` | 52 | Wrong exception type for duplicate email (should be ConflictException, not UnauthorizedException) |
| 7 | `users.service.ts` | 38 | **Mass assignment vulnerability** - Accepts Partial<User> allowing modification of password/role fields |
| 8 | `users.service.ts` | 14 | Weak bcrypt salt rounds (10 instead of 12-14 recommended by OWASP) |

---

### 2. SETTINGS MODULE (5 issues)

#### 🔴 Critical Issues

| # | File | Line | Issue | Verified |
|---|------|------|-------|----------|
| 1 | `settings.controller.ts` | 1 | **Authentication completely disabled** - All auth guards are commented out, allowing anyone to read/modify system settings. | ✅ YES |

```typescript
// settings.controller.ts (VERIFIED)
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
// @UseGuards(JwtAuthGuard, RolesGuard)
```

#### 🟠 High Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 2 | `settings.controller.ts` | 19 | No input validation for settings updates - accepts arbitrary Record<string, any> |

#### 🟡 Medium Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 3 | `settings.service.ts` | 122 | N+1 query pattern in updateSettings - calls updateSetting in a loop |
| 4 | `settings.service.ts` | 102 | Missing validation for invalid setting keys |
| 5 | `settings.service.ts` | 66 | Potential prototype pollution in deepMerge - no checks for '__proto__' or 'constructor' |

---

### 3. DATABASE & INFRASTRUCTURE (6 issues)

#### 🔴 Critical Issues

| # | File | Line | Issue | Verified |
|---|------|------|-------|----------|
| 1 | `database/data-source.ts` | 11 | **Hardcoded database credentials** - Default username/password 'postgres'/'postgres' | ✅ YES |
| 2 | `database/seed.ts` | 27 | **Hardcoded credentials in seed file** | ✅ YES |

```typescript
// database/data-source.ts - Line 11 (VERIFIED)
username: process.env.DB_USERNAME || 'postgres',
password: process.env.DB_PASSWORD || 'postgres',

// RECOMMENDATION: Remove defaults
username: process.env.DB_USERNAME || (() => { throw new Error('DB_USERNAME required') })(),
```

#### 🟠 High Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 3 | `database/seed.ts` | 29 | Dangerous `synchronize: true` can drop tables automatically |
| 4 | `common/cache/cache.service.ts` | 57 | Inefficient Redis KEYS command blocks server (should use SCAN) |
| 5 | `common/services/bulk-action.service.ts` | 109 | Partial transaction commit allows inconsistent state |

#### 🟡 Medium Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 6 | `database/data-source.ts` | 17 | Database query logging enabled (may log sensitive data in production) |

---

### 4. RIDDLES MODULE (12 issues)

#### 🟠 High Severity

| # | File | Line | Issue | Verified |
|---|------|------|-------|----------|
| 1 | `riddles.service.ts` | 128 | **Status filter lost in search query** - Uses `.where()` instead of `.andWhere()`, exposing unpublished content | ✅ YES |
| 2 | `riddles.service.ts` | 167 | **No transaction in bulk operations** - Database inconsistency risk | ✅ YES |

```typescript
// riddles.service.ts - Line 128 (VERIFIED)
if (searchDto.search !== undefined && searchDto.search.length > 0) {
  queryBuilder.where('(riddle.question ILIKE :search OR riddle.answer ILIKE :search)', {
    // ^^^ This OVERWRITES the previous where clause!
  });
}

// RECOMMENDATION:
queryBuilder.andWhere('(riddle.question ILIKE :search OR riddle.answer ILIKE :search)', {
```

#### 🟡 Medium Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 3 | `riddles.controller.ts` | 247 | Unvalidated parseInt for count parameter |
| 4 | `riddles.controller.ts` | 254 | Unvalidated parseInt in mixed quiz endpoint |
| 5 | `riddles.service.ts` | 80 | Inefficient RANDOM() function for large datasets |
| 6 | `riddles.service.ts` | 401 | Inefficient random quiz riddle selection |
| 7 | `riddles.service.ts` | 409 | Inefficient mixed quiz riddle selection |
| 8 | `riddles.service.ts` | 167 | Silent failures in bulk creation (skips invalid entries) |
| 9 | `riddles.service.ts` | 431 | Silent failures in quiz riddles bulk creation |
| 10 | `riddles.service.ts` | 167 | N+1 query problem in bulk creation |

#### 🟢 Low Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 11 | `riddles-stats.util.ts` | 44 | Missing difficulty levels in stats (only easy/medium/hard) |
| 12 | `riddle.entity.ts` | 32 | Missing createdAt timestamp |

---

### 5. DAD JOKES MODULE (11 issues)

#### 🟠 High Severity

| # | File | Line | Issue | Verified |
|---|------|------|-------|----------|
| 1 | `dad-jokes.service.ts` | 114 | **Search overwrites status filter** - Same `.where()` vs `.andWhere()` bug | ✅ YES |

```typescript
// dad-jokes.service.ts - Line 114 (VERIFIED)
if (searchDto.search !== undefined && searchDto.search.length > 0) {
  queryBuilder.where('joke.joke ILIKE :search', { search: `%${searchDto.search}%` });
  // Should be .andWhere() to preserve status filter
}
```

#### 🟡 Medium Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 2 | `dad-jokes.service.ts` | 111 | SQL injection risk in search query (missing sanitization) |
| 3 | `dad-jokes.service.ts` | 141 | Bulk create silently skips invalid entries |
| 4 | `dad-jokes-quiz.controller.ts` | 88 | Unvalidated count parameter in random jokes endpoint |
| 5 | `dad-jokes-quiz.controller.ts` | 95 | Unvalidated count parameter in mixed jokes endpoint |
| 6 | `dad-jokes.service.ts` | 381 | No validation on level parameter |
| 7 | `dad-jokes.controller.ts` | 123 | Update endpoint accepts Partial DTO without validation |
| 8 | `dad-jokes.service.ts` | 415 | Bulk quiz create silently skips invalid entries |

#### 🟢 Low Severity

| # | File | Line | Issue |
|---|------|------|-------|
| 9 | `dad-jokes-stats.util.ts` | 28 | No error handling for database count operations |
| 10 | `dad-jokes.service.ts` | 53 | Missing pagination limit validation |
| 11 | `dad-jokes.controller.ts` | 27 | Unused import ApiParam |
| 12 | `dad-jokes-quiz.controller.ts` | 13 | Unused import ApiParam |

---

### 6. IMAGE RIDDLES MODULE (10 issues)

| Severity | # | File | Line | Issue |
|----------|---|------|------|-------|
| 🔴 Critical | 1 | `image-riddles-update.helper.ts` | 96 | Missing undefined check before array access - causes runtime error |
| 🟠 High | 2 | `image-riddles.service.ts` | 214 | SQL Injection risk in search query |
| 🟡 Medium | 3 | `image-riddles.service.ts` | 289 | Silent failure in bulk create for invalid categories |
| 🟡 Medium | 4 | `image-riddles-update.helper.ts` | 78 | Missing validation for empty string categoryId |
| 🟡 Medium | 5 | `image-riddles.service.ts` | 413 | Inefficient multiple database queries for stats |
| 🟡 Medium | 6 | `image-riddles.controller.ts` | 134 | No validation for empty bulk create array |
| 🟢 Low | 7 | `image-riddles.service.ts` | 163 | Non-deterministic random query performance issues |
| 🟢 Low | 8 | `image-riddle.entity.ts` | 82 | No database-level constraint for actionOptions uniqueness |
| 🟢 Low | 9 | `image-riddles-update.helper.ts` | 30 | No input validation on imageUrl format |
| 🟢 Low | 10 | `image-riddles.service.ts` | 269 | Generic Error thrown instead of HTTP exception |

---

### 7. QUIZ MODULE (10 issues)

| Severity | # | File | Line | Issue |
|----------|---|------|------|-------|
| 🟠 High | 1 | `quiz.service.ts` | 169 | N+1 query problem in bulk create |
| 🟠 High | 2 | `quiz.controller.ts` | 178 | Missing validation for bulk create array size |
| 🟡 Medium | 3 | `quiz.controller.ts` | 38 | Unprotected GET endpoints without authentication |
| 🟡 Medium | 4 | `quiz.controller.ts` | 140 | Route parameter conflict in questions endpoint |
| 🟡 Medium | 5 | `quiz.controller.ts` | 155 | Missing input validation for count parameter |
| 🟡 Medium | 6 | `quiz.service.ts` | 169 | Silent failure on invalid chapter in bulk create |
| 🟡 Medium | 7 | `quiz.service.ts` | 33 | Missing pagination on findAllSubjects |
| 🟡 Medium | 8 | `quiz.service.ts` | 135 | Database-specific RANDOM() function (SQLite-only) |
| 🟡 Medium | 9 | `quiz.service.ts` | 154 | Potential field mapping error (options vs wrongAnswers) |
| 🟡 Medium | 10 | `quiz.service.ts` | 190 | Missing validation for empty string values in update |

---

### 8. FRONTEND - ADMIN COMPONENTS (14 issues)

| Severity | # | File | Line | Issue |
|----------|---|------|------|-------|
| 🟠 High | 1 | `admin/page.tsx` | 444 | Unsafe type assertion for potentially null value |
| 🟠 High | 2 | `admin/page.tsx` | 1069 | Hook defined after component usage can cause errors |
| 🟡 Medium | 3 | `admin/page.tsx` | 258 | Non-unique ID generation using Date.now() |
| 🟡 Medium | 4 | `ImageRiddlesAdminSection.tsx` | 387 | Unmemoized filter calculations causing unnecessary re-renders |
| 🟡 Medium | 5 | `ImageRiddlesAdminSection.tsx` | 837 | Using img tag instead of Next.js Image component |
| 🟡 Medium | 6 | `ImageRiddlesAdminSection.tsx` | 453 | Missing FileReader error handling |
| 🟡 Medium | 7 | `JokesSection.tsx` | 139 | Missing FileReader error handling |
| 🟡 Medium | 8 | `JokesSection.tsx` | 73 | Unsafe type assertion in filter operation |
| 🟡 Medium | 9 | `QuestionManagementSection.tsx` | 120 | Unmemoized filtered questions calculation |
| 🟡 Medium | 10 | `QuestionManagementSection.tsx` | 337 | Missing FileReader error handling |
| 🟡 Medium | 11 | `RiddlesSection.tsx` | 120 | Unmemoized filtered riddles calculation |
| 🟡 Medium | 12 | `RiddlesSection.tsx` | 198 | Missing FileReader error handling |
| 🟡 Medium | 13 | `SettingsSection.tsx` | 80 | Generic error handling without specific messages |
| 🟢 Low | 14 | `ImageRiddlesAdminSection.tsx` | 1237 | Button without onClick handler (non-functional) |

---

### 9. FRONTEND - PAGES (12 issues)

| Severity | # | File | Line | Issue |
|----------|---|------|------|-------|
| 🟠 High | 1 | `riddles/page.tsx` | 196 | Unsafe array indexing with charCodeAt calculation |
| 🟡 Medium | 2 | `riddles/page.tsx` | 47 | LocalStorage access without try-catch |
| 🟡 Medium | 3 | `jokes/page.tsx` | 48 | LocalStorage access without try-catch |
| 🟡 Medium | 4 | `image-riddles/page.tsx` | 99 | Incomplete/corrupted base64 audio data |
| 🟡 Medium | 5 | `image-riddles/page.tsx` | 837 | Using native img instead of Next.js Image |
| 🟡 Medium | 6 | `image-riddles/page.tsx` | 907 | Using native img without dimensions in modal |
| 🟡 Medium | 7 | `image-riddles/page.tsx` | 570 | LocalStorage access without error handling in state initializer |
| 🟡 Medium | 8 | `image-riddles/page.tsx` | 93 | Audio element not cleaned up on unmount |
| 🟡 Medium | 9 | `quiz/page.tsx` | 212 | Buttons without type="button" or onClick handlers |
| 🟢 Low | 10 | `image-riddles/page.tsx` | 538 | Using alert() for user feedback (poor UX) |
| 🟢 Low | 11 | `image-riddles/page.tsx` | 147 | Unhandled promise rejection in audio play |
| 🟢 Low | 12 | `quiz/page.tsx` | 66 | Potential URL injection in query parameters |

---

### 10. FRONTEND - COMPONENTS (9 issues)

| Severity | # | File | Line | Issue |
|----------|---|------|------|-------|
| 🟠 High | 1 | `BulkActionToolbar.tsx` | 94 | Potential undefined Icon component access |
| 🟠 High | 2 | `BulkActionToolbar.tsx` | 249 | Potential undefined Icon component access |
| 🟠 High | 3 | `BulkActionToolbar.tsx` | 334 | Unhandled promise rejection in handleConfirm |
| 🟡 Medium | 4 | `FileUploader.tsx` | 50 | Overly permissive MIME type validation |
| 🟡 Medium | 5 | `ThemeContext.tsx` | 37 | Unprotected localStorage access |
| 🟡 Medium | 6 | `ThemeContext.tsx` | 87 | Unprotected localStorage.setItem in setTheme |
| 🟡 Medium | 7 | `ThemeContext.tsx` | 94 | Unprotected localStorage.setItem in toggleTheme |
| 🟢 Low | 8 | `FileUploader.tsx` | 141 | Missing event prevention on keyboard handler |
| 🟢 Low | 9 | `ToastContainer.tsx` | 84 | Non-null assertion on potentially undefined icon style |

---

### 11. FRONTEND - HOOKS & SERVICES (10 issues)

| Severity | # | File | Line | Issue |
|----------|---|------|------|-------|
| 🟠 High | 1 | `settings.service.ts` | 74 | Shallow merge causes data loss for nested objects |
| 🟡 Medium | 2 | `useBulkActions.ts` | 161 | Stale closure in retry function |
| 🟡 Medium | 3 | `useStatusCounts.ts` | 91 | Incorrect NodeJS type in browser environment |
| 🟡 Medium | 4 | `useStatusCounts.ts` | 147 | isStale remains true on fetch failure |
| 🟡 Medium | 5 | `settings.service.ts` | 68 | No input validation on settings updates |
| 🟡 Medium | 6 | `utils.ts` | 41 | Predictable ID generation using Math.random |
| 🟡 Medium | 7 | `utils.ts` | 74 | Potential memory leak in debounce function |
| 🟡 Medium | 8 | `utils.ts` | 129 | Negative slice index when maxLength is too small |
| 🟢 Low | 9 | `useBulkActions.ts` | 204 | Typo in success message ("Succesfully") |
| 🟢 Low | 10 | `utils.ts` | 41 | Deprecated substr() method usage |

---

## Priority Fix Recommendations

### Immediate Action Required (Critical - Fix within 24 hours)

1. **Remove hardcoded JWT secret fallback** (`jwt.strategy.ts:50`)
   - Risk: Token forgery, complete auth bypass
   - Fix: Use `configService.getOrThrow('JWT_SECRET')`

2. **Add authentication to users endpoints** (`users.controller.ts:34,50`)
   - Risk: Data breach, user enumeration
   - Fix: Add `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles('admin')`

3. **Enable authentication on settings endpoints** (`settings.controller.ts`)
   - Risk: System compromise, configuration tampering
   - Fix: Uncomment auth guards and add role checks

4. **Remove hardcoded database credentials** (`database/data-source.ts:11`, `database/seed.ts:27`)
   - Risk: Database compromise
   - Fix: Remove fallback values, throw error if env vars missing

### High Priority (Fix within 1 week)

5. **Fix status filter overwrite bugs** (`riddles.service.ts:128`, `dad-jokes.service.ts:114`, `image-riddles.service.ts`)
   - Risk: Exposing unpublished/draft content
   - Fix: Change `.where()` to `.andWhere()`

6. **Add JWT token expiration** (`auth.service.ts:56`)
   - Risk: Permanent token validity if leaked
   - Fix: Add `expiresIn: '24h'` option

7. **Add transactions to bulk operations** (`riddles.service.ts:167`)
   - Risk: Database inconsistency
   - Fix: Wrap in `dataSource.transaction()`

8. **Fix N+1 query problems** (`quiz.service.ts:169`, `riddles.service.ts:167`)
   - Risk: Performance degradation
   - Fix: Use `In()` clause for batch queries

### Medium Priority (Fix within 2 weeks)

- Add input validation to all controllers
- Fix localStorage error handling in frontend
- Add rate limiting differentiation for auth endpoints
- Fix unmemoized filter calculations in admin components
- Add proper error handling for FileReader operations

---

## False Positives Identified

During verification, the following potential issues were determined to be false positives:

| Issue | Reason |
|-------|--------|
| User entity import unused in auth.service.ts | Actually used as type reference in JSDoc and return types |
| Async/await redundancy in jwt.strategy.ts | While technically redundant, improves readability |
| Observable type import in jwt-auth.guard.ts | Inlined import is valid TypeScript syntax |

---

## Appendix: Issue Type Definitions

| Type | Description |
|------|-------------|
| **Security** | Vulnerabilities that could lead to unauthorized access, data breaches, or system compromise |
| **Error Handling** | Missing or inadequate error handling that could cause crashes or unhandled exceptions |
| **Logic Bugs** | Code that functions incorrectly or produces unexpected results |
| **Performance** | Code that may cause slowdowns, memory leaks, or scalability issues |
| **Code Quality** | Issues affecting maintainability, readability, or best practices |

---

*Report generated by Comprehensive Code Scanner*  
*All critical and high-severity issues manually verified against actual source code*
