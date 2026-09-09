# Feature 11 — Site Settings (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

---

## 1. File inventory

Backend (`apps/backend/src/settings/`) — **real, complete, and now the single source of truth** (admin UI + gameplay read from it):

| File                                | Purpose                                                                                                                                                                                                                                             | Size (verified) |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `settings.controller.ts`            | `GET /settings` + `PATCH /settings`, both `JwtAuthGuard + RolesGuard` with `@Roles('admin')`                                                                                                                                                        | 33 lines        |
| `settings.service.ts`               | `onModuleInit` refresh (graceful fallback to defaults if the table is missing), deep-merge DB overrides over `config/settings.ts` defaults, prototype-pollution guards (`__proto__`/`constructor`/`prototype`), in-memory `effectiveSettings` cache | 248 lines       |
| `entities/system-setting.entity.ts` | `system_settings`: `key` (primary), `value` jsonb, description                                                                                                                                                                                      | —               |
| `dto/update-settings.dto.ts`        | Whitelist DTO (`forbidNonWhitelisted`), typed nested config DTOs                                                                                                                                                                                    | —               |
| `interfaces/settings.interface.ts`  | `AppSettings` = `global` (pagination/cache) + `dadJokes` + `imageRiddles` + `quiz` (incl. `defaults.levelTimers`) + `riddles` (incl. `defaults.levelTimers`) + `seo`                                                                                | —               |
| `config/settings.ts`                | Default settings tree (quiz `defaults` is **empty**; imageRiddles has `timerSeconds: 90` + action presets incl. fullscreen/share/report)                                                                                                            | —               |

Frontend (`apps/frontend/src/`) — **wired to the backend** (localStorage mock deleted):

| File                                       | Purpose                                                                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/settings.service.ts`             | `getAdminSettings()` → `GET /settings` (admin token); `updateSettings()` → `PATCH /settings`; `getPublicSettings()` → `GET /settings/public` with the frontend constants as offline fallback. **The localStorage mock is deleted.** |
| `app/admin/components/SettingsSection.tsx` | Admin settings UI (tabs per settings section) — reads/writes the **backend**; the SEO tab edits the `seo` group (feature 09)                                                                                                        |
| Consumers                                  | `app/quiz-mcq/play/page.tsx` + `hooks/use-riddle-play/useRiddlePlay.ts` (real `levelTimers` via the public endpoint, constants as offline fallback), `types/settings.types.ts`, SEO Dashboard (feature 09)                          |

No test suite exists for settings (backend merge logic, DTO, or the frontend service).

## 2. Endpoint map

| Method & Path     | Auth        | Notes                                                    |
| ----------------- | ----------- | -------------------------------------------------------- |
| GET `/settings`   | Jwt + admin | returns effective settings (defaults + DB overrides)     |
| PATCH `/settings` | Jwt + admin | whitelist-validated deep merge; prototype-pollution-safe |

Plus `GET /settings/public` (`@_Public`) — gameplay keys only; cache TTLs/patterns stay admin-only.

## 3. Current status

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

- [x] **Admin UI wired to the backend**
- [x] **Public read path**
- [x] **`quiz.defaults.levelTimers` in the backend model**
- [x] **Backend consumption story decided** — `config/settings.ts` stays the defaults source; backend modules keep their config reads, and the DTO whitelist is the de-scoping mechanism (only whitelisted sections are PATCHable). Full DI of SettingsService into content modules deferred until a settings key actually needs runtime changes server-side.

### P2 — integration / quality

- [x] **Type parity**
- [ ] Cache invalidation: `refreshSettings()` re-reads the DB per process; a multi-instance deploy needs a version/etag or pub-sub invalidation — **folded into the S3/multi-instance pre-deploy decision (feature 08 P1 #2)**.
- [x] **Tests**

### P3 — polish / tech debt

- [x] **Mock deleted**
- [x] **Timer-constant consolidation evaluated**

## 5. Cross-feature touchpoints

- **Admin Dashboard (12)** — SettingsSection is a dashboard section; the only UI surface for settings.
- **MCQ Quiz (02)** — quiz play reads real `quiz.defaults.levelTimers` from the public endpoint (constants as offline fallback).
- **Riddle MCQ (03)** — `useRiddlePlay` reads real riddle `levelTimers` from the public endpoint (constants as offline fallback).
- **Image Riddles (04)** — backend defaults define `imageRiddles.defaults.timerSeconds: 90` and action presets; the entity's `getEffectiveTimer` reads the settings-shaped object, though the settings service itself is not injected into the image-riddles module.
- **Dad Jokes (05)** — the `dadJokes` settings group (category emoji, cache TTL) is edited by the admin Settings tab against the backend.

## 6. Site Information branding group (added 2026-09-09)

New `site` top-level settings group — the admin "Site Info" tab edits it, the public
endpoint serves it, and the site shell consumes it:

- **Fields:** `siteName`, `siteDescription`, `logo`, `favicon`, `tabTagline`,
  `socialLinks {facebook, instagram,
tiktok, youtube, twitter}` (full URLs; empty = footer icon hidden).
- **Backend:** defaults in `config/settings.ts`, `SiteSettings` interface, `SiteSettingsDto`
  (length-validated strings; social URLs are normalized to http(s) at render time, so
  partial input like `facebook.com/yourpage` is accepted), `'site'` added to the whitelist,
  `GET /settings/public` now returns `site`. Spec test covers defaults + partial deep-merge.
- **Frontend:** shared server fetch `lib/public-settings.ts` (`revalidate: 300`) feeds the
  root layout metadata (site name/description, `%s | <tabTagline>` title template — empty
  tagline keeps the seo template — and favicon via `icons`), the `SiteBrandProvider`
  context (Header logo/name), and the Footer (brand, description, `SocialLinks` icons).
  Fallback chain: site → seo group → built-in defaults.
- **Admin UI:** `SettingsSection` gains a "Site Info" tab (now the default tab) with
  media-library uploads + preview + remove for logo/favicon, name/description/tagline
  inputs, and the five social URL inputs.
- **Verified live (2026-09-09):** PATCH site group → `GET /settings/public` reflects it;
  dev render shows brand name/description in header+footer, "Page | best products" title
  template, all five social icons, and after an upload the favicon link +
  header/footer logo `<img>` resolve to the `/uploads/...` URL. Probe data reverted
  afterwards (row deleted; defaults re-verified after restart). Note: PATCHing a section
  replaces that section's stored row (pre-existing semantics) — clients must send the
  full section, which the admin UI does.
