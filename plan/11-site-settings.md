# Feature 11 — Site Settings (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> This is the same convention used in `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`.
>
> Verified against the live codebase: 2026-08-30. **No archived ledger doc existed for this feature** —
> built entirely from current code. Headline finding: **the feature is a double split-brain** — a real
> backend settings module nobody consumes, and a frontend mock the admin UI saves into. Details below.

---

## 1. File inventory

Backend (`apps/backend/src/settings/`) — **real and complete, but consumed by nothing**:

| File                                | Purpose                                                                                                                                                                                                                                             | Size (verified) |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `settings.controller.ts`            | `GET /settings` + `PATCH /settings`, both `JwtAuthGuard + RolesGuard` with `@Roles('admin')`                                                                                                                                                        | 33 lines        |
| `settings.service.ts`               | `onModuleInit` refresh (graceful fallback to defaults if the table is missing), deep-merge DB overrides over `config/settings.ts` defaults, prototype-pollution guards (`__proto__`/`constructor`/`prototype`), in-memory `effectiveSettings` cache | 248 lines       |
| `entities/system-setting.entity.ts` | `system_settings`: `key` (primary), `value` jsonb, description                                                                                                                                                                                      | —               |
| `dto/update-settings.dto.ts`        | Whitelist DTO (`forbidNonWhitelisted`), typed nested config DTOs                                                                                                                                                                                    | —               |
| `interfaces/settings.interface.ts`  | `AppSettings` = `global` (pagination/cache) + `dadJokes` + `imageRiddles` (timerSeconds, action presets) + `quiz` + `riddles`                                                                                                                       | —               |
| `config/settings.ts`                | Default settings tree (quiz `defaults` is **empty**; imageRiddles has `timerSeconds: 90` + action presets incl. fullscreen/share/report)                                                                                                            | —               |

Frontend (`apps/frontend/src/`) — **a mock, not the API**:

| File                                       | Purpose                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `services/settings.service.ts`             | `getSettings()` reads localStorage (`aiquiz:settings`) with a **simulated network delay**; `updateSettings` shallow-merges into localStorage. No HTTP call exists. Ships `DEFAULT_MOCK_SETTINGS` (quiz defaults: timeLimit/passingScore/questionsPerQuiz/shuffle…, riddles `levelTimers` from `RIDDLE_TIMERS` constants) |
| `app/admin/components/SettingsSection.tsx` | Admin settings UI (tabs per settings section) — reads/writes the **mock**                                                                                                                                                                                                                                                |
| Consumers                                  | `app/quiz-mcq/play/page.tsx` (reads `quiz.defaults.levelTimers` — never supplied by the mock → hardcoded fallback wins), `hooks/use-riddle-play/useRiddlePlay.ts` (reads riddle config), `types/settings.types.ts`                                                                                                       |

No test suite exists for settings (backend merge logic, DTO, or the frontend service).

## 2. Endpoint map (verified against controller 2026-08-30)

| Method & Path     | Auth        | Notes                                                    |
| ----------------- | ----------- | -------------------------------------------------------- |
| GET `/settings`   | Jwt + admin | returns effective settings (defaults + DB overrides)     |
| PATCH `/settings` | Jwt + admin | whitelist-validated deep merge; prototype-pollution-safe |

That is the entire surface. There is **no public settings endpoint** — gameplay pages (public, no auth) can never read real settings even if the frontend were wired.

## 3. Current status (verified)

**The split-brain, stated precisely:**

1. **Backend module is an island.** `SettingsService` is injected nowhere outside its own module (verified by grep) — no content service reads cache TTLs, timers, or emojis from it. The `system_settings` table accepts admin writes that nothing will ever read.
2. **Admin UI writes to localStorage.** `SettingsSection` edits the frontend mock, so an admin's changes persist per-browser only and never reach the database.
3. **Gameplay reads the mock with hardcoded fallbacks.** The quiz play page asks the mock for `quiz.defaults.levelTimers` (not defined in the mock) and silently uses hardcoded `DEFAULT_TIME_LIMITS`; riddle play similarly reads mock config. The real backend defaults (`config/settings.ts`) are a third copy of similar values.
4. Net effect: **"Site Settings" today is a per-browser UI demo, not a working feature.** Nothing is broken or lost — but nothing configured by an admin affects anyone else.

**Correction propagated:** `plan/02-mcq-quiz.md` previously credited settings-driven quiz timers as "Done"; it has been corrected — the read path exists but the mock never supplies `levelTimers`, so hardcoded fallbacks always win.

## 4. Task breakdown

### P0 — critical / broken

- None open (nothing crashes or corrupts data; the feature is inert, see P1).

### P1 — major gaps

- [ ] **Wire the admin UI to the backend**: `SettingsSection` → `GET/PATCH /settings` with `adminApi` (replacing the mock), so admin changes actually persist.
- [ ] **Add a public read path for gameplay-relevant settings** (e.g., `GET /settings/public` returning only safe keys: quiz `levelTimers`, image-riddle timers) — `GET /settings` is admin-only, so public pages can never read real settings.
- [ ] **Give the backend model the keys gameplay needs**: `quiz.defaults` is empty in `config/settings.ts` — add `levelTimers` (easy/medium/hard/expert/extreme) so quiz timers are genuinely configurable, then feed the real values to `play/page.tsx` and `useRiddlePlay`.
- [ ] **Decide the backend consumption story**: either inject `SettingsService` into the content modules that own the configured values (cache TTLs, emoji defaults, timer defaults) or de-scope the unused sections from the DTO.

### P2 — integration / quality

- [ ] Schema/type parity: the frontend `SystemSettings` type and the backend `AppSettings` interface have drifted (mock has `quiz.defaults.timeLimit` etc. the backend lacks) — make one source of truth (generate FE types from the backend interface).
- [ ] Cache invalidation for settings: PATCH updates the in-memory copy only in the same process — verify multi-instance deployments and add a version/etag if needed.
- [ ] Tests: deep-merge/override logic, prototype-pollution guard, DTO whitelist (zero exist).

### P3 — polish / tech debt

- [ ] Delete the mock (`services/settings.service.ts` + `DEFAULT_MOCK_SETTINGS`) once the API is wired; remove `MOCK_API_DELAY_MS`.
- [ ] Consolidate the three copies of timer/difficulty constants (`RIDDLE_TIMERS`, `DEFAULT_TIME_LIMITS` in quiz play, `config/settings.ts`).

## 5. Cross-feature touchpoints

- **Admin Dashboard (12)** — SettingsSection is a dashboard section; the only UI surface for settings.
- **MCQ Quiz (02)** — quiz play reads (mock) settings for per-level timers; falls back to hardcoded constants.
- **Riddle MCQ (03)** — `useRiddlePlay` reads (mock) settings for riddle config.
- **Image Riddles (04)** — backend defaults define `imageRiddles.defaults.timerSeconds: 90` and action presets; the entity's `getEffectiveTimer` reads the settings-shaped object, though the settings service itself is not injected into the image-riddles module.
- **Dad Jokes (05)** — `dadJokes` settings section (category emoji, cache TTL) exists in both mock and backend; the admin "Dad Jokes" settings tab edits the mock.
