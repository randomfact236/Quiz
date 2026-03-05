# 🔍 AI Quiz Platform — Full Site Audit Report (Section-by-Section)

> **Date:** March 5, 2026 | **Auditor:** Antigravity | **Scope:** Full codebase — Frontend (Next.js), Backend (NestJS), Admin Panel, APIs, Security, UX

---

## 🌐 SECTION 0 — SHARED / GLOBAL (Cross-cutting)

### 🐛 Bugs & Issues

| # | Severity | Location | Issue |
|---|---|---|---|
| G1 | 🔴 Critical | `app.module.ts` + `main.ts` | **Helmet applied twice** — `setupMiddleware()` in `main.ts` AND `AppModule.configure()` both call `app.use(helmet())`, causing double security header processing |
| G2 | 🔴 Critical | `/admin` route | **Admin panel has zero authentication** — anyone can visit `/admin` and manage all content with no login required |
| G3 | 🔴 Critical | `auth.service.ts` | **No refresh token system** — all users get silently logged out after 24h with no token renewal mechanism |
| G4 | 🔴 Critical | `api-client.ts` | **API client never sends auth token** — `Authorization: Bearer` header is never injected, so protected endpoints cannot be called from the frontend |
| G5 | 🟡 Medium | `app.module.ts` | `synchronize: !isProduction` in TypeORM — auto-schema sync in development can drop columns if an entity field is deleted/renamed |
| G6 | 🟡 Medium | `main.ts` | Rate limit is global (100 req/min) — auth endpoints (`/login`, `/register`) have no stricter limit, leaving them open to brute-force |
| G7 | 🟡 Medium | `layout.tsx` | Open Graph URL is hardcoded to `https://aiquiz.com` — domain doesn't exist, all social sharing previews are broken |
| G8 | 🟡 Medium | `layout.tsx` | `manifest.json`, `favicon.ico`, `apple-touch-icon.png` may not exist in `/public`, breaking PWA metadata |
| G9 | 🟡 Medium | `auth.controller.ts` | Auth endpoints use raw `@Body('email')` strings with no DTO class-validation — blank/null/invalid values pass through silently |
| G10 | 🟢 Minor | `auth.service.ts` | JWT expiry hardcoded to `'24h'` in both `register()` and `login()` — should read from `ConfigService` |
| G11 | 🟢 Minor | Frontend ALL pages | No route-level `error.tsx` or `loading.tsx` files — Next.js crash overlay shown on unhandled errors |
| G12 | 🟢 Minor | Root directory | 100+ `.bat`, `.ps1`, `.log`, `.md` files clutter the root directory, making it hard to navigate |

### 🚀 Enhancements

| Priority | Feature |
|---|---|
| P1 | Admin Authentication — JWT login + role guard on `/admin` |
| P2 | Refresh Token System — `/auth/refresh` endpoint + silent frontend renewal |
| P3 | API Auth Header Injection in `api-client.ts` |
| P4 | Stricter rate limits on auth endpoints (5 req/min) |
| P5 | Create `manifest.json` + add real favicon assets for PWA eligibility |
| P6 | Add route-level `error.tsx` and `loading.tsx` to all page directories |
| P7 | CI/CD pipeline — lint + test + build checks on every PR |
| P8 | API versioning (`/api/v1/`) with deprecation strategy |

---

## 🎯 SECTION 1 — QUIZ (Puzzle Quiz)

**Frontend:** `apps/frontend/src/app/quiz/`
**Backend:** `apps/backend/src/quiz/`

### 🐛 Bugs & Issues

| # | Severity | Location | Issue |
|---|---|---|---|
| Q1 | 🔴 Critical | `quiz/play/page.tsx` (line 126) | **`localStorage.getItem()` called directly** — bypasses the shared `getItem()` helper from `@/lib/storage`, skipping SSR guard. Risk: hydration mismatch on server |
| Q2 | 🔴 Critical | Quiz Admin | **Quiz questions are managed entirely in localStorage** — no backend admin module for quiz CRUD. Refreshing storage wipes all admin edits |
| Q3 | 🟡 Medium | `quiz/play/page.tsx` | **`totalQuestions` is capped at `Math.min(quiz.totalQuestions, 10)`** in 4 separate places — this magic number `10` should be a named constant |
| Q4 | 🟡 Medium | `quiz/play/page.tsx` | **Loading state `div` missing `min-h-screen`** — causes a tiny layout flash as the parent fills height before the quiz loads |
| Q5 | 🟡 Medium | `useQuiz` hook | Results pushed to `localStorage` history, then the quiz play page reads from it to find `latestSession.id` — this is brittle. If two tabs are open the wrong session could be read |
| Q6 | 🟢 Minor | Quiz results page | **`alert()` fallback** on clipboard copy failure — should use the existing toast system |
| Q7 | 🟢 Minor | Quiz play page | Extend Quiz modal has no upper-limit warning when `availableQuestions` is 0 but the modal still renders the `additionalQuestions` spinner |

### 🚀 Enhancements (Priority Order)

| Priority | Feature |
|---|---|
| Q-P1 | **Backend Quiz Admin Module** — Persist questions to PostgreSQL via NestJS CRUD |
| Q-P2 | **Quiz Leaderboard** — Top 10 scores per subject/chapter, updated in real-time |
| Q-P3 | **Adaptive Difficulty** — Auto-adjust question difficulty based on user's running score |
| Q-P4 | **Timed Challenge Mode** — Tournament-style timed quizzes with countdown |
| Q-P5 | **Question Bookmarking** — Save hard questions for later review |
| Q-P6 | **Quiz History & Analytics** — User-level history showing score trends over time |
| Q-P7 | **Multiplayer Mode** — Real-time quiz battles using WebSockets |
| Q-P8 | **Question Explanations** — Show why an answer is correct after each question |

---

## 🧩 SECTION 2 — RIDDLE QUIZ

**Frontend:** `apps/frontend/src/app/riddles/`
**Backend:** `apps/backend/src/riddles/` (`riddles.service.ts` — 837 lines)

### 🐛 Bugs & Issues

| # | Severity | Location | Issue |
|---|---|---|---|
| R1 | 🔴 Critical | `riddles.service.ts` (line 682) | **`bulkActionQuizRiddles()` silently mocks all status actions** — comment says "QuizRiddle entity lacks a `status` field, so we mock publish/draft/trash actions." The admin UI shows success but nothing actually changes in the DB |
| R2 | 🔴 Critical | `riddles/results/page.tsx` (line 115) | **`alert()` used as clipboard fallback** — blocked in modern browsers and modern PWA contexts |
| R3 | 🟡 Medium | `riddles/results/page.tsx` | **`byDifficulty` only tracks 4 levels** (`easy/medium/hard/expert`) — riddles with `'extreme'` difficulty (valid in the schema) are silently ignored in the breakdown |
| R4 | 🟡 Medium | `riddles/results/page.tsx` | **Sessions never cleaned up from `localStorage`** — old session data accumulates indefinitely |
| R5 | 🟡 Medium | `riddles.service.ts` | **`findAllCategories()` loads all riddle relations** — fetching `relations: ['riddles']` for every category could be extremely slow if there are thousands of riddles |
| R6 | 🟡 Medium | `riddles.service.ts` | **`deleteCategory()` calls `riddleRepo.remove(category.riddles)`** in a loop with `.remove()` — this is not in a transaction. If the category delete fails after riddles are removed, data is corrupted |
| R7 | 🟢 Minor | `riddles/play` | No keyboard navigation for selecting answers (A/B/C/D hotkeys) — reduces accessibility |
| R8 | 🟢 Minor | `riddles.service.ts` (line 93) | **RANDOM() comment** — code includes `// PostgreSQL — change to RAND() for MySQL` suggesting the DB engine choice isn't fully locked in |

### 🚀 Enhancements (Priority Order)

| Priority | Feature |
|---|---|
| R-P1 | **Add `status` field to `QuizRiddle` entity** — prerequisite to fixing the silently-mocked bulk actions |
| R-P2 | **Session Cleanup** — Auto-expire sessions older than 7 days from `localStorage` |
| R-P3 | **Fix `deleteCategory()` to use a transaction** — wrap riddle deletion + category deletion in a single `dataSource.transaction()` |
| R-P4 | **Answer Hotkeys** — Keyboard shortcuts (1/2/3/4 or A/B/C/D) to select options |
| R-P5 | **Hint System** — Progressive hints that cost a score multiplier rather than revealing the full answer |
| R-P6 | **Difficulty Balancer** — Automatically select riddles to match a target difficulty spread |
| R-P7 | **Streak Bonus** — Award bonus points for consecutive correct answers |
| R-P8 | **Print / Export Results** — Allow users to download their riddle session summary as a PDF |

---

## 😂 SECTION 3 — DAD JOKES

**Frontend:** `apps/frontend/src/app/jokes/`
**Backend:** `apps/backend/src/dad-jokes/`
**Entity:** `DadJoke` (has `likes`, `dislikes` columns already ✅)

### 🐛 Bugs & Issues

| # | Severity | Location | Issue |
|---|---|---|---|
| J1 | 🔴 Critical | `jokes/page.tsx` | **Votes (👍/👎) only saved to `localStorage`** — the `DadJoke` entity in the DB already has `likes` and `dislikes` columns, but they are never written to. Admin engagement column always shows 0 |
| J2 | 🔴 Critical | `jokes/page.tsx` | **No vote API endpoint exists** — there is no `PATCH /api/dad-jokes/:id/vote` endpoint in the backend. The backend persistence infrastructure needs to be built |
| J3 | 🟡 Medium | `jokes/page.tsx` | **`seededShuffle` uses 32-bit LCG** — produces predictable patterns. All users with the same seed see the same shuffle. Categories or date-based seeds would be more robust |
| J4 | 🟡 Medium | `jokes/page.tsx` | **Category state is hardcoded** in a `defaultJokeCategories` array — these are not loaded from the backend, so admin-created categories are invisible on the user-facing page |
| J5 | 🟡 Medium | Admin `JokesSection.tsx` | **`selectAll()` still references `filteredJokes.length`** for the checkbox check while pagination now uses `sortedJokes` — the counts may not match after sorting |
| J6 | 🟡 Medium | `DadJoke` entity | **`joke` single-column format** — the entity has only `joke: string` while the frontend expects `setup` + `punchline` separately. This inconsistency causes UI fallbacks via `joke?.split('?')[0]` |
| J7 | 🟢 Minor | `jokes/page.tsx` | Vote buttons use emoji (👍/👎) instead of `lucide-react` icons — inconsistent with the rest of the UI |
| J8 | 🟢 Minor | Admin `JokesSection.tsx` | Sorting icons use emoji (🔼/🔽/↕️) instead of chevron icons from `lucide-react` |

### 🚀 Enhancements (Priority Order)

| Priority | Feature |
|---|---|
| J-P1 | **Vote API Endpoint** — `POST /api/dad-jokes/:id/vote` (`{ type: 'like' | 'dislike' }`) persisted to DB |
| J-P2 | **Sync Categories from Backend** — Load joke categories dynamically from the API instead of hardcoded array |
| J-P3 | **Split `joke` into `setup` + `punchline`** in the DB entity, with a migration |
| J-P4 | **Fix `selectAll()` reference** to use `sortedJokes.length` |
| J-P5 | **Joke of the Day** — Feature one randomly selected joke prominently each day |
| J-P6 | **Joke Sharing** — Share individual jokes via a deep link (`/jokes/[id]`) with OG card |
| J-P7 | **User Comments** — Allow users to comment or reply to jokes |
| J-P8 | **AI Joke Generator** — Generate new dad jokes via AI API call from the admin panel |
| J-P9 | **Trending Jokes** — Sort by vote ratio so best jokes surface to the top |

---

## 🖼️ SECTION 4 — IMAGE RIDDLES

**Frontend:** `apps/frontend/src/app/image-riddles/`
**Backend:** `apps/backend/src/image-riddles/`, `apps/backend/src/admin/image-riddles/`
**Entity:** `ImageRiddle`

### 🐛 Bugs & Issues

| # | Severity | Location | Issue |
|---|---|---|---|
| I1 | 🔴 Critical | `image-riddles/page.tsx` | **Image riddle data is loaded from `localStorage`/initial-data** — the backend `ImageRiddles` API exists but is not being used for the primary data source. Changes to the DB are not reflected |
| I2 | 🔴 Critical | `image-riddles/page.tsx` | **Votes (likes/dislikes) similarly not persisted** to backend — the `AdminImageRiddlesModule` exists but no vote endpoint is wired up |
| I3 | 🟡 Medium | `ImageRiddle` entity | **`likes` and `dislikes` columns were added and then reverted** — the entity currently does not have engagement tracking. Adding them back is required to enable the admin engagement display |
| I4 | 🟡 Medium | `image-riddles/page.tsx` | **Timer auto-reveals the answer** when it expires, but the image riddle's success/fail state does not distinguish between "revealed" and "solved" — stats count both as the same |
| I5 | 🟡 Medium | `image-riddles/page.tsx` | **Hydration mismatch risk** — `isHydrated` guard was added, but reading `localStorage` state before the guard fires causes a brief flash of incorrect state |
| I6 | 🟡 Medium | Admin `ImageRiddlesAdminSection.tsx` | **Image URL is not validated** — any string can be entered as the image URL. Broken URLs result in broken image placeholders with no fallback or error |
| I7 | 🟢 Minor | Image riddles | **No lazy loading on images** — all images load on page mount regardless of whether they're in the viewport. Very slow on low-bandwidth connections |
| I8 | 🟢 Minor | Image riddles | **No fallback image** for broken/expired image URLs |
| I9 | 🟢 Minor | Admin section | **"Sync Source 🔄" button** patches admin state from `initial-data.ts` — once the DB is the source of truth, this button becomes misleading |

### 🚀 Enhancements (Priority Order)

| Priority | Feature |
|---|---|
| I-P1 | **Restore `likes`/`dislikes` to `ImageRiddle` entity** + wire vote endpoint |
| I-P2 | **Use Backend API as data source** instead of `localStorage`/`initial-data.ts` |
| I-P3 | **Image URL Validation** — Use Next.js `<Image>` with `onError` fallback |
| I-P4 | **Lazy Image Loading** — Only load images as they enter the viewport |
| I-P5 | **Difficulty Progression** — Store user's session difficulty and auto-advance to harder riddles |
| I-P6 | **Image Riddle Categories Page** — Dedicated browse page by category with thumbnail grid |
| I-P7 | **Zoom/Pan on Image** — Let users pinch-zoom or tap to zoom image in the challenge modal |
| I-P8 | **Community Submission** — Let users submit image riddle suggestions (admin-reviewed) |
| I-P9 | **Animated Reveal** — Use a curtain/drop animation when the answer is revealed |

---

## 📊 ENTERPRISE SCORE CARD

| Section | Current | Target |
|---|---|---|
| 🎯 Quiz | 5.5/10 | 9/10 |
| 🧩 Riddle Quiz | 6.0/10 | 9/10 |
| 😂 Dad Jokes | 5.0/10 | 9/10 |
| 🖼️ Image Riddles | 5.0/10 | 9/10 |
| 🌐 Global/Shared | 4.0/10 | 9/10 |
| **Overall Platform** | **5.1/10** | **9.0/10** |

---

## ⚡ QUICK WINS (Fix in 1–2 hours each)

1. **Quiz:** Replace bare `localStorage.getItem()` with `getItem()` helper (prevents SSR mismatch)
2. **Riddles:** Replace `alert()` in results share with the existing toast notification pattern
3. **Dad Jokes:** Replace emoji sort icons (🔼/🔽) with `ChevronUp`/`ChevronDown` from `lucide-react`
4. **Dad Jokes:** Fix `selectAll()` to reference `sortedJokes.length` instead of `filteredJokes.length`
5. **Image Riddles:** Add `loading="lazy"` to all image tags + `onError` fallback placeholder
6. **Global:** Remove duplicate `helmet()` call from `AppModule.configure()`
7. **Global:** Add `RegisterDto`/`LoginDto` with class-validator decorators to auth controller
8. **Global:** Move JWT `expiresIn: '24h'` to `ConfigService`
9. **Global:** Add route-level `error.tsx` and `loading.tsx` to every page directory
10. **Dad Jokes:** Add `POST /api/dad-jokes/:id/vote` endpoint pointing to existing `likes`/`dislikes` DB columns
