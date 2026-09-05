# Feature 11 — Site Settings (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30 (headline finding then: a double split-brain); **re-audited + E2E-tested 2026-09-05** — the split-brain is fully closed (P1 #1–#3): the admin UI reads/writes the backend, a public endpoint serves gameplay, and the mock is deleted. Details in §3.

---

## 1. File inventory

Backend (`apps/backend/src/settings/`) — **real, complete, and now the single source of truth** (admin UI + gameplay read from it):

| File                                | Purpose                                                                                                                                                                                                                                             | Size (verified) |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `settings.controller.ts`            | `GET /settings` + `PATCH /settings`, both `JwtAuthGuard + RolesGuard` with `@Roles('admin')`                                                                                                                                                        | 33 lines        |
| `settings.service.ts`               | `onModuleInit` refresh (graceful fallback to defaults if the table is missing), deep-merge DB overrides over `config/settings.ts` defaults, prototype-pollution guards (`__proto__`/`constructor`/`prototype`), in-memory `effectiveSettings` cache | 248 lines       |
| `entities/system-setting.entity.ts` | `system_settings`: `key` (primary), `value` jsonb, description                                                                                                                                                                                      | —               |
| `dto/update-settings.dto.ts`        | Whitelist DTO (`forbidNonWhitelisted`), typed nested config DTOs                                                                                                                                                                                    | —               |
| `interfaces/settings.interface.ts`  | `AppSettings` = `global` (pagination/cache) + `dadJokes` + `imageRiddles` + `quiz` (incl. `defaults.levelTimers`) + `riddles` (incl. `defaults.levelTimers`) + `seo` (added 2026-09-05)                                                             | —               |
| `config/settings.ts`                | Default settings tree (quiz `defaults` is **empty**; imageRiddles has `timerSeconds: 90` + action presets incl. fullscreen/share/report)                                                                                                            | —               |

Frontend (`apps/frontend/src/`) — **wired to the backend since 2026-08-30** (the localStorage mock was deleted):

| File                                       | Purpose                                                                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/settings.service.ts`             | `getAdminSettings()` → `GET /settings` (admin token); `updateSettings()` → `PATCH /settings`; `getPublicSettings()` → `GET /settings/public` with the frontend constants as offline fallback. **The localStorage mock is deleted.** |
| `app/admin/components/SettingsSection.tsx` | Admin settings UI (tabs per settings section) — reads/writes the **backend**; the SEO tab edits the `seo` group (feature 09)                                                                                                        |
| Consumers                                  | `app/quiz-mcq/play/page.tsx` + `hooks/use-riddle-play/useRiddlePlay.ts` (real `levelTimers` via the public endpoint, constants as offline fallback), `types/settings.types.ts`, SEO Dashboard (feature 09)                          |

No test suite exists for settings (backend merge logic, DTO, or the frontend service).

## 2. Endpoint map (verified against controller 2026-08-30)

| Method & Path     | Auth        | Notes                                                    |
| ----------------- | ----------- | -------------------------------------------------------- |
| GET `/settings`   | Jwt + admin | returns effective settings (defaults + DB overrides)     |
| PATCH `/settings` | Jwt + admin | whitelist-validated deep merge; prototype-pollution-safe |

Plus `GET /settings/public` (`@_Public`) — gameplay keys only; cache TTLs/patterns stay admin-only.

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

- [x] **Admin UI wired to the backend** — DONE 2026-08-30: `SettingsService.getAdminSettings()` reads `GET /settings` and `updateSettings()` PATCHes via the admin token; `SettingsSection` switched to the admin read.
- [x] **Public read path** — BUILT 2026-08-30 (code-complete; live probe pending DB restore): new `GET /settings/public` (`SettingsPublicController`, `@_Public`) returning only gameplay keys — quiz/riddles `levelTimers` and imageRiddles `timers`. Cache TTLs/patterns stay admin-only.
- [x] **`quiz.defaults.levelTimers` in the backend model** — DONE 2026-08-30: interface + config defaults (30/45/60/90/120s, mirroring the frontend fallbacks) + `QuizDefaultsDto.levelTimers`; `riddles.defaults.levelTimers` added the same way (30/60/90/120). `play/page.tsx` and `useRiddlePlay` now receive real values through the public endpoint (with the old constants as offline fallback).
- [x] **Backend consumption story decided** — 2026-08-30: `config/settings.ts` stays the defaults source; backend modules keep their config reads, and the DTO whitelist is the de-scoping mechanism (only whitelisted sections are PATCHable). Full DI of SettingsService into content modules deferred until a settings key actually needs runtime changes server-side.

### P2 — integration / quality

- [x] **Type parity** — RESOLVED 2026-08-30 by split: gameplay consumes `PublicSettings` (mirrors the backend payload exactly — this is the single source of truth for gameplay); the admin `SystemSettings` type remains the admin form's view. The mock-only keys (timeLimit/passingScore/…) left with the deleted mock.
- [ ] Cache invalidation: `refreshSettings()` re-reads the DB per process; a multi-instance deploy needs a version/etag or pub-sub invalidation — **folded into the S3/multi-instance pre-deploy decision (feature 08 P1 #2)**.
- [x] **Tests** — DONE 2026-08-30: `settings.service.spec.ts` (4 tests) — defaults ship levelTimers, partial-section deep-merge preserves siblings, prototype-pollution keys rejected (`__proto__`, `constructor`), unknown top-level keys rejected by the whitelist.

### P3 — polish / tech debt

- [x] **Mock deleted** — DONE 2026-08-30: `DEFAULT_MOCK_SETTINGS` and the `MOCK_API_DELAY_MS` delay removed from the service (the constant itself remains in `lib/constants.ts` for other dev mockers; gameplay service no longer touches localStorage).
- [x] **Timer-constant consolidation evaluated** — ACCEPTED 2026-08-30: the three copies now have distinct roles — `config/settings.ts` is the server default, `GET /settings/public` is the live value, and the frontend constants (`RIDDLE_TIMERS`, `DEFAULT_TIME_LIMITS`) are offline fallbacks mirrored to the same numbers. Consolidating further would couple gameplay to a network round-trip; keep the fallbacks.

## 5. Cross-feature touchpoints

- **Admin Dashboard (12)** — SettingsSection is a dashboard section; the only UI surface for settings.
- **MCQ Quiz (02)** — quiz play reads real `quiz.defaults.levelTimers` from the public endpoint (constants as offline fallback).
- **Riddle MCQ (03)** — `useRiddlePlay` reads real riddle `levelTimers` from the public endpoint (constants as offline fallback).
- **Image Riddles (04)** — backend defaults define `imageRiddles.defaults.timerSeconds: 90` and action presets; the entity's `getEffectiveTimer` reads the settings-shaped object, though the settings service itself is not injected into the image-riddles module.
- **Dad Jokes (05)** — the `dadJokes` settings group (category emoji, cache TTL) is edited by the admin Settings tab against the backend.

## 6. Extras (2026-09-05 F11 five-step pass

## 6. Extras (2026-09-05 F11 five-step pass — noted, not acted on)

- **Settings E2E re-verified live:** admin GET 200 -> PATCH distinctive quiz levelTimers
  (33/44/66/99/111) -> `GET /settings/public` reflects them -> restored to defaults. The
  prototype-pollution guard engages on `__proto__` payloads (spec-covered).
- **Seeded test data:** none kept — the PATCH probe restored the default timers deliberately
  (gameplay timing stays predictable for the remaining feature passes).
- **Cross-module import-status inconsistency:** quiz bulk import accepts `status: 'published'`
  while riddle/joke/image-riddle imports land DRAFT (see plan/05 + plan/04 Extras).
- **Cache invalidation (P2 open)** stays folded into the multi-instance/S3 pre-deploy decision.
