# Feature 09 — Site Shell & SEO (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> Same convention as `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`.
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

- [ ] **Mount `<ToastContainer />`** in the root layout/providers. One line, site-wide impact: achievement unlocks, vote feedback, and admin/save toasts currently never appear to anyone.

### P1 — major gaps

- [ ] **SEO basics**: add `app/sitemap.ts` (static routes + published subjects/chapters/categories from the public APIs), `app/robots.ts`, and OpenGraph/Twitter metadata in the root layout. Decide server-rendering strategy for SEO-relevant content (Joke-of-the-Day, subject pages) — currently client-fetched.
- [ ] **Newsletter (new feature)**: subscribe endpoint (email capture, double opt-in, throttled) + footer form + admin export. Depends on nothing else; pair the storage decision with User Accounts if subscribers may later become users.

### P2 — integration / quality

- [ ] Mobile drawer links are hardcoded to jokes/image-riddles destinations — derive them from the same data the footer cards use, and audit for the riddle/quiz pages.
- [ ] Header is 444 lines — extract nav config; MobileFooter duplicates link lists with Footer (three copies of navigation data).
- [ ] Accessibility pass on the shell: skip-to-content link, focus trap in the mobile drawer, aria-current on nav items.

### P3 — polish / tech debt

- [ ] Web manifest + theme-color for installability if mobile traffic justifies it.
- [ ] Consolidate the duplicated emoji/link constants between Footer, MobileFooter, and page CTAs.

## 4. Cross-feature touchpoints

- **All content features (02–05)** — the shell frames their pages; MobileFooter deep links feed them query params.
- **User Accounts (01)** — Header carries login/register state; AuthContext lives beside ThemeContext.
- **Achievements (06)** — achievement unlock toasts are among the notifications currently invisible (P0).
- **Site Settings (10)** — future home for SEO/newsletter configuration if it becomes dynamic.
- **Analytics (12)** — `page_viewed` fires on every route change the shell renders.
