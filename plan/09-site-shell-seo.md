# Feature 09 — Site Shell & SEO (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. No archived ledger doc existed for this feature —
> built from current code. This file was added after the initial 9-file pass (user request) to own the
> cross-page UI shell, SEO, and the **Newsletter** roadmap item, which previously had no home.

---

## 1. File inventory

Frontend (`apps/frontend/src/`):

| File                                                                 | Purpose                                                                  | Size (verified) |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------- |
| `components/Header.tsx`                                              | Global header / navigation                                               | 444 lines       |
| `components/Footer.tsx`                                              | Global footer                                                            | 80 lines        |
| `components/MobileFooter.tsx`                                        | Mobile drawer with category/difficulty deep links (jokes, image riddles) | 379 lines       |
| `components/NavigationProgress.tsx`                                  | Route-change progress indicator                                          | 53 lines        |
| `contexts/ThemeContext.tsx`                                          | Dark-mode theming                                                        | 144 lines       |
| `components/ui/ToastContainer.tsx`                                   | Toast renderer — **exists but is mounted nowhere** (see P0)              | 160 lines       |
| `app/layout.tsx`                                                     | Root layout + global metadata                                            | —               |
| `app/about/page.tsx`                                                 | About page (with metadata)                                               | 77 lines        |
| `app/error.tsx`, `loading.tsx`, `not-found.tsx` + per-route variants | Route boundaries                                                         | —               |
| `lib/toast.ts` + `services/settings.service.ts`                      | Toast pub/sub ("subscribe" hits in grep — not a newsletter)              | —               |

Backend: none — the shell is frontend-only. (No newsletter endpoints exist.)

## 2. Current status (verified)

**Done:** consistent header/footer across routes (verified usage); dark mode via ThemeContext; mobile drawer deep links into jokes/image-riddles (`?category=`, `?difficulty=`); per-route metadata on the content layouts and About page; NavigationProgress; styled 404/error/loading boundaries.

**Broken / missing:**

- **P0: toasts never render.** `toast.success(...)` is called all over the app (achievement unlocks, vote feedback, settings saves, media ops) and `ToastContainer` exists — but no layout or page mounts it. Every toast in the app is silently invisible.
- **SEO is metadata-only**: no `app/sitemap.ts`, no `app/robots.ts`, no web manifest (verified — the files don't exist), and gameplay content (client-rendered quiz/riddle/Joke-of-the-Day) is invisible to crawlers beyond initial HTML.
- **Newsletter: does not exist at all** — no backend endpoint, no UI (the earlier grep hits were toast pub/sub "subscribe", a false positive). It is a new feature, not a doc gap.

## 3. Task breakdown

### P0 — critical / broken

- [x] **`<ToastContainer />` mounted** — DONE 2026-08-30 in `app/providers.tsx` (above the app tree); the duplicate local mount in `RiddleMcqContainer` removed per the root-TODO note.

### P1 — major gaps

- [x] **SEO basics** — DONE 2026-08-30: `app/robots.ts` (allow all, disallow /admin + /api, sitemap pointer) and `app/sitemap.ts` (static routes + quiz/riddle subjects and image categories from the public APIs, graceful-failure on API downtime). OG/Twitter metadata + theme-color already existed in the root layout (plan stale).
- [ ] Server-rendering strategy for JotD/subject pages — **needs owner decision** (SEO priorities determine the RSC rework).
- [ ] **Newsletter** — owned by feature 14 (simple email collection first); this feature hosts the footer form. See [14-newsletter.md](14-newsletter.md).
- [x] **Legal pages** — BUILT 2026-08-30: `/privacy`, `/terms`, `/contact` with shared `LegalPage` shell and honest PLACEHOLDER markers. **Needs owner decision/approved copy before public launch** (contact email is a placeholder too).

### P2 — integration / quality

- [x] **Mobile drawer links** — VERIFIED 2026-08-30 (plan stale): MobileFooter's drawers are data-driven from the public subject/category APIs, not hardcoded; the static section links now come from the shared nav config.
- [x] **Nav config extraction** — DONE 2026-08-30: `lib/nav-config.ts` is the single source; both Header variants (admin + user, desktop + mobile) and Footer render from it, with `aria-current="page"` on active items. The three hand-maintained copies are gone.
- [ ] Accessibility pass: skip-to-content link exists (root layout) and aria-current added; **focus trap in the mobile drawer deferred** — a correct trap needs a vetted implementation (dependency addition = owner decision); Escape/lambda-close and click-away already work.

### P3 — polish / tech debt

- [ ] Web manifest — **needs owner decision** (installability only pays off with meaningful mobile traffic; theme-color already present).
- [x] **Link constants consolidated** — DONE 2026-08-30 via `lib/nav-config.ts`. Emoji sets in Footer/MobileFooter remain local literals (presentational, low churn) — accepted.

## 4. Cross-feature touchpoints

- **All content features (02–05)** — the shell frames their pages; MobileFooter deep links feed them query params.
- **User Accounts (01)** — Header carries login/register state; AuthContext lives beside ThemeContext.
- **Achievements (06)** — achievement unlock toasts are among the notifications currently invisible (P0).
- **Site Settings (11)** — future home for SEO/newsletter configuration if it becomes dynamic.
- **Analytics (13)** — `page_viewed` fires on every route change the shell renders.
