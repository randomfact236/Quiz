# Frontend Core & App Shell

Analysis of `apps/frontend` core: app shell (layout/providers/home/about), shared UI components, lib utilities, hooks, contexts, services, types, and build configuration. Evidence gathered by direct file reading; all paths relative to `apps/frontend/`.

## 1. Scope & File Inventory

| File | Purpose | Status |
|---|---|---|
| `src/app/layout.tsx` | Root layout: Inter font, SEO metadata, Header/Footer/MobileFooter/DemographicsPopup, NavigationProgress, Providers | Done |
| `src/app/providers.tsx` | React Query + ThemeProvider + AuthProvider nesting | Done |
| `src/app/page.tsx` | Home page — composes TopicsSection, ModeCards, StatsSection over BubbleBackground | Done (minor issues) |
| `src/app/components/home/BubbleBackground.tsx` | Deterministic animated bubble backdrop (hydration-safe) | Done, simplistic (`animate-pulse`, not the reference bubble-animations.css) |
| `src/app/components/home/TopicSection.tsx` | Loads subjects + per-subject question counts from API, groups by category into collapsible sections | Done; N+1 request pattern |
| `src/app/components/home/TopicCard.tsx` | Topic tile with Lucide icon-key fallback map, "Soon" badge when 0 questions | Done |
| `src/app/components/home/ModeCards.tsx` | 5 mode shortcut cards (timer-challenge, practice-mode, riddles, image-riddles, jokes) | Done but contains a broken link (§5) |
| `src/app/components/home/StatsSection.tsx` | localStorage-driven stats (quizzes taken, questions answered, avg score, streak) via `getTotalStats()` | Done |
| `src/app/about/page.tsx` | Static server-rendered About page | Done |
| `src/components/Header.tsx` | Dual-mode header (admin vs user), login state from localStorage tokens, mobile menu | Done; duplicated nav blocks |
| `src/components/Footer.tsx`, `MobileFooter.tsx` | Site footers | Present (not deeply reviewed) |
| `src/components/DemographicsPopup.tsx` | Guest/user demographics collection popup posting to `/auth/demographics` / `/guest-users/demographics` | Done |
| `src/components/NavigationProgress.tsx` | nprogress-based route progress bar | Present |
| `src/components/ui/*` | Shared UI kit: Modal, ModalFooter, ConfirmDialog, ToastContainer, ThemeToggle, GoogleLoginButton, FileUploader, StatusDashboard, BulkActionToolbar, ContentManagementSection | Mostly admin-oriented; done |
| `src/lib/api-client.ts` | fetch wrapper: base URL, Bearer token injection, 401→refresh-token retry, 60s timeout, ApiError class | Done |
| `src/lib/quiz-api.ts` | Full quiz REST layer (subjects/chapters/questions/bulk/filter-counts/export) | Done |
| `src/lib/auth.ts` | authService: login/register/googleLogin/logout/forgot/reset/profile | Done |
| `src/lib/storage.ts` | Typed localStorage/sessionStorage wrapper, `aiquiz:` prefix keys, debounced writes | Done |
| `src/lib/progress.ts` | Chapter/subject progress + quiz history + total stats in localStorage | Done but **never wired** (§5) |
| `src/lib/achievements.ts` | 10 achievements, unlock/check/progress logic in localStorage | Partially wired (§3) |
| `src/lib/quiz-resume.ts` | Save/load/clear/match resumable quiz state (24h expiry) | Done |
| `src/lib/query-client.ts` | TanStack Query client defaults (staleTime 30s, retry 2) | Done |
| `src/lib/constants.ts` | Centralized constants (timers, cache TTLs, storage prefix, HTTP codes) | Done; some duplication |
| `src/lib/utils.ts` | cn(), generateId, debounce, time formatting, safeJsonParse etc. | Done |
| `src/lib/toast.ts` | Singleton pub/sub toast manager | Done |
| `src/lib/index.ts` | Barrel re-exporting utils/toast/constants | Done |
| `src/hooks/useQuiz.ts` | **Core quiz engine hook** (641 lines): load questions, answers, scoring, timer, resume, share | Done; complex (see 02 doc too) |
| `src/hooks/useQuizSubjects.ts` | Legacy useState-based subject fetcher (admin `Subject` type) | Legacy/duplicative |
| `src/hooks/useClickOutside.ts`, `index.ts` | Utility hook + barrel | Done |
| `src/contexts/AuthContext.tsx` | Auth state (user/isLoading/login/logout), token check on mount | Minimal but done |
| `src/contexts/ThemeContext.tsx` | light/dark/system theme, `dark` class on `<html>`, hydration-safe two-phase value | Done |
| `src/services/settings.service.ts` | "SettingsService" that only reads/writes **localStorage** mock settings with simulated delay | Stub/mock — not backend-backed |
| `src/types/index.ts`, `status.types.ts`, `settings.types.ts` | Type barrels for status & settings types | Done |
| `src/types/quiz.ts` | Question/QuizSession/QuizState/Achievement types | Done |
| `next.config.mjs` | standalone output, unoptimized images, webpack polling for Docker, NEXT_PUBLIC_API_URL env | Done |
| `package.json` | Next 15, React 18, TanStack Query 5, framer-motion, zustand, axios, react-hook-form, zod… | Done; unused deps (§5) |
| `tailwind.config.ts` | primary/secondary/accent palettes, darkMode 'class', animations | **Content globs miss `src/features/**`** (§5) |
| `tsconfig.json` | extends root, `@/*` path alias, bundler resolution | Done |

## 2. What Is Done (implemented & working)

- **App shell**: complete `layout.tsx` with metadata template, OpenGraph/Twitter cards, viewport/theme-color, skip-to-content link, Suspense-wrapped NavigationProgress (layout.tsx:19–99). Providers correctly order QueryClient → Theme → Auth (providers.tsx:8–16).
- **Home page**: fully decomposed into sub-components; live data from backend (`getSubjects(false)` + per-subject published question counts) drives topic tiles; empty subjects render as disabled "Soon" cards (TopicSection.tsx:210–218). Stats section reads real localStorage history with skeleton loading and cross-tab `storage` event refresh (StatsSection.tsx:45–63).
- **API client** (api-client.ts): robust — automatic access-token attach, transparent 401 → `/auth/refresh` retry once with new token (api-client.ts:92–125), 60s AbortController timeout, typed `ApiError`, convenience `api.get/post/put/patch/delete`.
- **Quiz REST layer** (quiz-api.ts): complete coverage of the NestJS quiz endpoints including bulk import, filter counts, status counts, CSV export download (quiz-api.ts:413–442).
- **Storage layer** (storage.ts): SSR-safe (`typeof window === 'undefined'` guards), sessionStorage-first-then-localStorage lookup for auth flexibility, debounced writes, full key registry.
- **Auth flow**: login/register persist tokens (auth.ts:18–32); AuthContext validates token against `/users/profile` on mount (AuthContext.tsx:21–35); Header reacts to pathname changes to refresh login state (Header.tsx:19–24).
- **Theme system**: system preference listener, meta theme-color sync, memoized pre-mount value to avoid hydration mismatch (ThemeContext.tsx:100–129).
- **Toast system**: singleton manager with subscribe/dismiss/auto-dismiss and typed helpers (toast.ts).
- **Error/loading UX at app level**: `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx` exist; about page is static and correct.

## 3. What Is Partially Done / In Progress

- **Achievements**: definitions, unlock logic and stats exist (lib/achievements.ts), and `app/achievements/page.tsx` displays them via `getAllAchievementsWithStatus()`. However **nothing ever calls `checkAchievements()`**, so achievements can never unlock through play (only the page reads stale state). The `streak` condition type is explicitly unimplemented (achievements.ts:164–167).
- **Progress tracking**: `saveQuizResult`, `getRecommendedChapters`, `exportProgress`, `importProgress` are exported but have **zero call sites** — chapter/subject progress records are never written even though `/quiz` reads `getChapterProgress` for badges (app/quiz/page.tsx:374). Stats on home therefore only reflect raw session history, not the richer progress model.
- **Settings service**: `SettingsService.getSettings/updateSettings` is a localStorage mock with fake latency (settings.service.ts:67–85). It is consumed by `/quiz/play` for timer config, but the mock defaults don't include `quiz.defaults.levelTimers`, so that read always falls back to hardcoded limits (play/page.tsx:76–84 vs settings.service.ts:46–50).
- **Dark mode coverage**: infrastructure is done, but nearly all quiz/home pages hardcode light-only colors (`bg-white/95`, `text-gray-800`) — dark theme only truly applies to header/footer/admin chrome.
- **UI kit consolidation**: `components/ui` mixes generic primitives (Modal, ConfirmDialog, ThemeToggle) with admin-specific widgets (StatusDashboard, BulkActionToolbar, ContentManagementSection) — index.ts exports everything together.

## 4. What Is Missing / Needs To Be Done

- **Wire achievements**: call `checkAchievements()` after each completed quiz (natural place: useQuiz completion effect or results page) and surface newly unlocked toasts.
- **Wire progress persistence**: call `saveQuizResult(session)` on quiz completion so chapter/subject progress, best scores, and the `/quiz` chapter badges actually work.
- **Backend-backed settings**: replace mock SettingsService with real NestJS settings endpoints (or delete it and move timer config into constants/backend subject meta).
- **Fix `/riddles` routing**: no `app/riddles` route exists (routes are `riddle-mcq`, `image-riddles`, `jokes`) and there are no rewrites in next.config.mjs — every "Riddles" nav link 404s.
- **Tailwind content globs**: add `'./src/features/**/*.{js,ts,jsx,tsx}'` (and consider `./src/lib`, `./src/hooks`) to tailwind.config.ts:4–8; currently any Tailwind class used *only* inside `src/features/**` (e.g., admin QuizContainer feature) risks being purged from production CSS.
- **Port reference styling**: quiz-reference CSS defines `.home-content`, `.section-header` gradients and a real bubble animation system (`bubble-animations.css`); the Next port uses ad-hoc Tailwind and `animate-pulse` circles instead, and page.tsx:15 references the orphan `.home-content` class that has no definition in globals.css.
- **Remove dead dependencies**: axios, zustand, react-hook-form/@hookform/resolvers/zod, @dnd-kit/*, date-fns are declared in package.json:20–39 but not imported anywhere in the analyzed code (data fetching uses fetch + TanStack Query).

## 5. Known Issues, Bugs & Tech Debt

1. **Broken navigation links** — `ModeCards.tsx:29` links to `/riddles`; `Header.tsx:71,113,148,208` also link `/riddles`. No such route exists → 404. (Riddle content lives under `/riddle-mcq`.)
2. **N+1 API waterfall on home** — TopicSection.tsx:103–112 issues one `getQuestionsBySubject` request per subject serially just to get counts; same pattern again in `app/quiz/page.tsx:227–236` and both challenge pages. With N subjects this is N sequential round trips on first paint.
3. **Inconsistent API URL fallbacks** — api-client.ts:9 defaults to `http://localhost:3012/api`, DemographicsPopup.tsx:29 defaults to `http://localhost:3000`, auth.ts:35 repeats the 3012 default inline. One missed env var silently posts demographics to the wrong origin.
4. **Duplicated constant sets** — `SECONDS_PER_HOUR` vs `ONE_HOUR_S`, `SECONDS_PER_DAY` vs `ONE_DAY_S` etc. defined twice side-by-side (constants.ts:121–136); `STORAGE_PREFIX` exists in constants.ts:230 while storage.ts:12 redefines its own `PREFIX`.
5. **Dead/duplicated hooks** — `hooks/useQuizSubjects.ts` duplicates what TanStack-based `features/quiz/hooks/useSubjects.ts` does, using a different `Subject` type imported from `app/admin/types` (leakage of admin types into public code).
6. **Silent error swallowing** — storage.ts:101 `catch (err) {}` discards quota errors; getItem returns raw strings cast to T on parse failure (storage.ts:80) which can mask corrupted state.
7. **Token storage in localStorage** — both access and refresh tokens persisted long-term (auth.ts:21–22, storage.ts:96–100); XSS would expose refresh tokens. The sessionStorage-first lookup suggests an unfinished "remember me" design.
8. **Header duplication** — admin and user headers are two ~110-line near-identical JSX blocks in one component (Header.tsx:57–132 vs 135–243); mobile menu items repeated a third time.
9. **Orphan CSS class** — page.tsx:15 uses `home-content` which is only defined in `quiz-reference/quiz-css/home-page.css:8`, not in globals.css → no-op class.
10. **Stale tsc-errors.log** — `apps/frontend/tsc-errors.log` lists errors (missing `getAllChapters`/`getRiddlesByChapter` exports from riddle-mcq-api, implicit anys) affecting `MobileFooter.tsx:7` and riddle pages; log may be outdated but signals unresolved type drift between lib and pages. Verify with `npm run type-check`.
11. **StatsSection totalQuestions metric is wrong-ish** — progress.ts:152–155 sums `maxScore` of sessions as "Questions Answered", which counts unanswered skipped questions as answered.
12. **No tests found** for lib/hooks despite jest/testing-library being configured in package.json.

## 6. How It Works (architecture/data flow)

- **Rendering model**: App Router with mostly `'use client'` pages; only `about/page.tsx` is a server component. Global chrome (Header/Footer/DemographicsPopup) mounts once in the root layout inside `Providers`.
- **State management** is a three-layer hybrid:
  1. **TanStack Query** for server state in the admin feature area (query-client.ts defaults; features/quiz/hooks/*).
  2. **Plain useState/useEffect + module-level fetch functions** (`lib/quiz-api.ts`) for all public pages — no query cache on home/quiz pages, hence the refetch-per-navigation behavior.
  3. **localStorage** (via lib/storage.ts, `aiquiz:` keys) as the persistence backbone for auth tokens, quiz history, resume state, achievements, and (mocked) settings. Cross-tab sync is done manually via `window.storage` events (StatsSection.tsx:55–62).
- **API flow**: components → `lib/*-api.ts` service functions → `api-client.apiRequest` (adds Bearer token from storage, auto-refreshes on 401 once, normalizes errors to `ApiError`) → NestJS at `NEXT_PUBLIC_API_URL` + `/v1`.
- **Theme/auth contexts** sit above everything; ThemeContext toggles the `dark` class that tailwind `darkMode: 'class'` expects.
- **Relationship to quiz-reference**: the vanilla JS/CSS reference (state machine in quiz-feature/*.js, styles in quiz-css/*.css) was used as the behavioral spec; the React port reimplements logic in hooks (useQuiz ≈ quiz-state.js + quiz-timer.js + quiz-storage.js) but only partially ports the visual system.

## 7. Recommended Process To Proceed (prioritized)

1. **P0 – Fix broken routes & run type-check**: change `/riddles` links to `/riddle-mcq` (ModeCards.tsx:29, Header.tsx:71/113/148/208); run `npm run type-check` and clear/re-triage `tsc-errors.log` findings (especially MobileFooter import).
2. **P0 – Fix Tailwind content globs**: add `./src/features/**` so admin feature styles can't be purged in production builds.
3. **P1 – Wire the finished-but-disconnected libraries**: call `saveQuizResult()` and `checkAchievements()` on quiz completion (single integration point: useQuiz completion effect at src/hooks/useQuiz.ts:407–425); add achievement-unlock toasts.
4. **P1 – Consolidate API base URL handling**: single source of truth for `NEXT_PUBLIC_API_URL` (fix DemographicsPopup.tsx:29), export it from api-client and reuse.
5. **P2 – Kill the N+1 count queries**: use the existing `GET /quiz/filter-counts` endpoint (already wrapped as `getFilterCounts`, quiz-api.ts:292) to fetch all per-subject counts in one request on Home, /quiz, timer-challenge, practice-mode.
6. **P2 – De-duplicate challenge pages**: extract shared SubjectLevelPicker component from `timer-challenge/page.tsx` and `practice-mode/page.tsx` (files are ~95% identical; see also doc 02 §5).
7. **P3 – Decide settings strategy**: either implement backend `/settings` endpoints and point SettingsService at them, or remove the mock and encode level timers in `constants.ts`/backend meta.
8. **P3 – Hygiene pass**: remove unused deps (axios, zustand, dnd-kit, rhf/zod unless planned), delete duplicated constants and `hooks/useQuizSubjects.ts`, split Header into `AdminHeader`/`UserHeader`, and port the reference `bubble-animations.css` or drop the orphan `.home-content` class.

