# Stale/Dead Code Scan — 2026-09-14b (post-resolution verification pass)

> Scan-and-record pass only. **No code was modified.** Scope: commit `bb25312` (HEAD, main) — the
> state **after** both resolution passes for the morning scan (`stale-code-scan-2026-09-14.md`).
> Uncommitted owner work in the working tree (riddle-csv generators, `apps/backend/src/database/
import-*.ts` + `check-quiz-read-path.ts`, `plan/imports/`, `gui-test-screenshots/`) is **excluded**.
> Per AGENTS.md, the 2D-games paths are excluded.
>
> **Method:** (1) global hygiene sweeps on committed HEAD (console/TODO/FIXME, leftover references
> to every symbol deleted this morning); (2) consumer verification of all 13 exports the resolution
> passes introduced; (3) export-consumer sweep across every `lib/`, `types/`, `services/`, `hooks/`
> file; (4) endpoint↔consumer boundary checks (live-verified earlier today: deleted routes 404,
> kept routes 200, admin `/all` 200 with token); (5) duplicate-target checks (single-definition
> verification for the merge results).
>
> **Confidence legend:** ✅ confirmed (grep-verified) · ⚠️ likely · **Rec:** DEL / MERGE / FIX / OWN

---

## Headline finding

**One deletion recorded in the morning scan's resolution log (and in commit `bb25312`'s message) was
never actually applied to the code.** The `types/settings.types.ts` sextet is still present, and the
same file's planned unexports plus three riddle-persistence function unexports also never landed.
Everything else recorded as deleted/merged/wired in the resolution logs **is** verified applied.
This pass records the gap; executing the already-owner-approved resolution is a one-file follow-up.

---

## Findings

### F01 User Accounts — no issues found

AuthContext `login`/`logout` removal held (only mount-time hydration remains); profile page uses
`authService.resendVerification`; all users/auth service methods and DTOs consumed (verified in the
morning scan, unchanged since — no commits touched this area beyond the recorded fixes).

### F02 MCQ Quiz — no issues found

`lib/quiz-mcq-api.ts` sweep clean after the pass-1 deletions (`getQuestionsBySubject`,
`StatusCountResponse`, `QuestionFilters` gone, zero remnants). `sessions/history` now consumed by
the results page (see B1 in the resolution log). `ResultsCelebration.tryAgain` remains the
documented intentional export (plan 02 P3).

### F03 Riddle MCQ — 2 findings

| ID   | Location                               | Category                | What                                                                                                                                                                                                                           | Evidence                                                                                  | Conf | Rec                                        |
| ---- | -------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---- | ------------------------------------------ |
| R-B1 | `lib/riddle-persistence.ts:53,103,153` | unused (export surface) | `loadRiddleSession`, `hasActiveSession`, `hasUnsavedProgress` still exported — the resolution log's R4 unexport **partially applied**: the three `RiddleResume*` type unexports landed, these three function unexports did not | `grep "^export function" riddle-persistence.ts` → both still exported; 0 external callers | ✅   | unexport (execute the recorded resolution) |
| R-B2 | —                                      | —                       | admin `/subjects/all` + `/categories/all` now consumed by the admin hooks (`getAllSubjectsAdmin`/`getAllCategoriesAdmin`, 3 external consumers each); public `getSubjects`/`getCategories` still consumed by the hub           | grep                                                                                      | ✅   | resolved — no finding                      |

### F04 Image Riddles — no issues found

Deleted routes gone (live-verified 404), `ParseUUIDPipe` guards the by-id routes (bad IDs → 400),
service imports clean. Remaining zero-external types (`Paginated`, the 9 unexported-this-morning
types aside) are the documented in-file-composed over-export set (informational, unchanged).

### F05 Dad Jokes — no issues found

`updateJokeStatus` gone; server search + category view live in the page (GUI-verified);
`/jokes/stats/overview` consumed. Remaining `adaptJoke`/`RawJoke`/`AdminJoke`/DTO exports are the
documented in-file-only over-export set (informational).

### F06 Achievements — no issues found

`hydrateUnlocksFromServer` consumed on the achievements page (3 external refs); GUI-verified
end-to-end (server-only unlocks appear merged). Evaluator unchanged since morning (clean).

### F07 Comments — no issues found (unchanged)

The five in-file-composed type exports remain the documented over-export set (informational).

### F08 Media Library — no issues found (unchanged)

`resolveMediaUrl` single implementation in `public-settings.ts` with the intentional `media-api`
re-export (verified: exactly 1 impl + 1 re-export). `MediaListResponse` remains the documented
over-export (informational).

### F09 Site Shell & SEO — 2 findings

| ID   | Location                        | Category                | What                                                                                                                 | Evidence                                  | Conf | Rec                   |
| ---- | ------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---- | --------------------- |
| S-B1 | `lib/seo.ts` (`IndexableRoute`) | unused (export surface) | New interface from the route-registry merge — used only in-file (sitemap/audit consume the `INDEXABLE_ROUTES` const) | grep → 0 external                         | ✅   | unexport              |
| S-B2 | —                               | —                       | `APP_URL` now defined exactly once (`lib/seo.ts:14`); robots/sitemap/layout import it — merge held                   | grep `NEXT_PUBLIC_APP_URL` → 1 definition | ✅   | resolved — no finding |

### F10 Landing & Shared UI — no issues found

storage/initial-data deletions held; `SOCIAL_PLATFORMS` consumed by both footer and admin form;
`ShareMenuProps` unexport held. `SAVED_ITEMS_KEY` (`lib/saved-items.ts`) is in-file-used only —
documented over-export (informational, unchanged from morning).

### F11 Site Settings — 2 findings

| ID   | Location                                                    | Category                | What                                                                                                                                                                                                                                                                                                                               | Evidence                                                                  | Conf | Rec                                   |
| ---- | ----------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- | ------------------------------------- |
| T-B1 | `types/settings.types.ts`                                   | **half-removed**        | The sextet (`SettingsFormData`, `SettingsResponse`, `SettingsUpdatePayload`, `SettingsUpdateResponse`, `isSettingsTab`, `isSystemSettings`) — recorded as deleted in the morning resolution log **and in commit bb25312's message**, but the file was never edited. All six verified still present, def-only (0 callers anywhere). | `grep -cE "SettingsFormData\|..." → 6`; per-symbol grep → definition only | ✅   | DEL (execute the recorded resolution) |
| T-B2 | `types/settings.types.ts` (~19 composed types)              | unused (export surface) | T2's planned unexport batch also never applied — 32 exports remain in the file; the composed types are in-file-used only                                                                                                                                                                                                           | grep → 0 external each                                                    | ✅   | unexport                              |
| T-B3 | `services/settings.service.ts` (`FALLBACK_PUBLIC_SETTINGS`) | unused (export surface) | In-file fallback use only, 0 external consumers (new finding this pass — not flagged in the morning scan)                                                                                                                                                                                                                          | grep → 0 external                                                         | ✅   | unexport                              |

### F12 Admin Dashboard — no issues found

`parseCSVLine`/`toCsv` unexports held; admin barrels consumed; module lists now share
`ANALYTICS_MODULES` (4 external consumers) — the three-list drift finding is resolved.

### F13 Analytics — no issues found

`MODULE_LABELS` deletion held (0 remnants); `EventsBrowser` consumes the shared
`ANALYTICS_MODULES`; `AnalyticsModuleName`/`TrackOptions` unexports held.

### F14 Newsletter — no issues found (second consecutive scan)

### F15 Full SEO — no issues found

`INDEXABLE_ROUTES` registry consumed by sitemap + seo-audit (4 external refs); `SeoHealth`
unexport held; `getSeo` duplication in `opengraph-image.tsx` resolved (now uses
`getPublicSettings`); live robots.txt/sitemap.xml/OG output verified correct.

### Cross-cutting — no issues found

Zero leftovers from any deletion this morning (swept every removed symbol);
`bulk-action.service` imports clean after `getStatusCounts` removal; `run-migration.ts`,
`fix-database.js`, `next.config.docker.js`, `_patch*.py`, empty `interceptors/`, `@backend/*`
alias all confirmed gone from HEAD; env examples carry only the Resend keys; lockfile matches
the trimmed package.json files. The morning scan's documented deferrals (bucket-C mobile reads,
duels, unwired dev seeds, launcher family) remain deliberate keeps, not findings.

---

## Consolidated summary

| Category                                                                | Count | IDs                    |
| ----------------------------------------------------------------------- | ----- | ---------------------- |
| Half-removed (recorded-but-unapplied deletion)                          | 1     | T-B1                   |
| Unused (over-exports, incl. 2 from the resolution passes' own new code) | 4     | R-B1, S-B1, T-B2, T-B3 |

- **Confirmed-safe-to-delete / unexport (✅):** all 6 findings — they are mechanical executions of
  resolutions already approved this morning, plus three cosmetic unexports.
- **Need review:** none new.
- **Fully clean features:** 01, 02, 04, 05, 06, 07, 08, 12, 13, 14, 15, Cross-cutting (12 of 16).
- **Not clean:** 03 (one unexport batch half-applied), 09 (one new-code over-export),
  11 (the settings.types file — the one real gap).
- **Correction to the record:** the morning resolution log and commit `bb25312`'s message say
  "settings-types sextet" was deleted; it was not. The other deletion claims in that log were
  re-verified one-by-one this pass and all hold.

Recommendation for the follow-up: apply F-table items in one small commit (delete the sextet,
unexport the ~21 listed symbols in `settings.types.ts`, `riddle-persistence.ts`, `seo.ts`,
`settings.service.ts`), then `tsc` + jest re-run. Everything else is clean.

---

## Resolution note (2026-09-14 — same day)

All 6 findings above were resolved. `types/settings.types.ts`: sextet deleted
(`SettingsFormData`, `SettingsResponse`, `SettingsUpdatePayload`, `SettingsUpdateResponse`,
`isSettingsTab`, `isSystemSettings`), the 19 composed sub-structure types unexported (only
`SystemSettings`, `SeoSettings`, `SeoSocialOverride`, `SiteSettings`, `SiteSocialLinks`,
`SettingsTab`, `SettingsValue` remain exported — all externally consumed);
`lib/riddle-persistence.ts`: `loadRiddleSession` / `hasActiveSession` / `hasUnsavedProgress`
unexported; `lib/seo.ts`: `IndexableRoute` unexported; `services/settings.service.ts`:
`FALLBACK_PUBLIC_SETTINGS` unexported.

Verified after the fixes: frontend `tsc --noEmit` clean, frontend jest **541/541 (31 suites)**.
Backend untouched by this pass (last verified clean at `bb25312`). Changes left uncommitted for
owner review.
