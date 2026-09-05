# Feature 14 — Newsletter (NEW FEATURE — 0% built)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken · **P1** = major gaps · **P2** = integration / quality · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: **2026-09-05 (built, migrated, and live-verified — see §3)**; originally 2026-08-30 when **nothing existed** — no backend endpoint, no table,
> no UI (repo-wide search confirmed; the only "subscribe" hits are the unrelated toast pub/sub).
>
> **Owner scope decision (2026-08-30): start with simple email collection only** — a footer form that
> stores emails, plus an admin list/export. Double opt-in, confirmation emails, campaigns etc. are
> explicitly deferred (§4 P3 / §6). Added as the first to-build feature in the tracker.

---

## 1. Planned file inventory (to be created)

Backend (`apps/backend/src/newsletter/`):

| Planned file                    | Purpose                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `newsletter.module.ts`          | Module wiring (TypeORM repo, throttler)                                                                                   |
| `newsletter.controller.ts`      | `POST subscribe` (public, throttled); `GET list` + `GET export` (Jwt + admin)                                             |
| `newsletter.service.ts`         | Idempotent insert (duplicate email = no-op success, no error leak), list, CSV export                                      |
| `entities/subscriber.entity.ts` | `newsletter_subscribers`: unique email (citext/lowercased), source (`footer`/`about`), `unsubscribed` boolean, timestamps |
| `dto/subscribe.dto.ts`          | Email validation (`IsEmail`, max length)                                                                                  |

Frontend (`apps/frontend/src/`):

| Planned file                                 | Purpose                                                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/newsletter/SubscribeForm.tsx`    | Footer form (email input + submit + success/"already subscribed"/error states) — mounted by feature 09's Footer                            |
| `app/admin/components/NewsletterSection.tsx` | Admin subscriber list: search, source/status filters, CSV download via `adminApi` (added by commit `f312c27`, after this plan was written) |

## 2. Planned endpoint map

| Method & Path                | Auth        | Notes                                                                                                                        |
| ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST `/newsletter/subscribe` | public      | body `{ email, source? }`; throttled (30/min); idempotent — duplicate email returns success without revealing who subscribed |
| GET `/newsletter`            | Jwt + admin | paginated list, filter by source/unsubscribed                                                                                |
| GET `/newsletter/export`     | Jwt + admin | CSV of active (non-unsubscribed) emails                                                                                      |

## 3. Current status

**BUILT and LIVE-VERIFIED 2026-09-05** (migration applied; endpoint probes passed). Backend module (subscribe/unsubscribe/list/export), migration, footer form, 6 service tests, **plus an admin subscriber section** (NewsletterSection: list, search, filters, CSV download — commit `f312c27`) wired via `adminApi`.

## 4. Task breakdown

### P0 — critical / broken

- None (feature doesn't exist yet; nothing to break).

### P1 — major gaps (= the build itself)

- [x] **Migration** — DONE 2026-08-30: `newsletter_subscribers` with UNIQUE lowercased email, `source`, `unsubscribed`, timestamps (`1789400000000` — run pending DB restore).
- [x] **Backend module** — DONE 2026-08-30: `POST /newsletter/subscribe` (public, 30/min, DTO-validated, idempotent — duplicates are a silent success, re-subscribe re-activates), `GET /newsletter` (admin, paginated, source/unsubscribed filters), `GET /newsletter/export` (admin CSV of active subscribers).
- [x] **Footer `SubscribeForm`** — DONE 2026-08-30: mounted in the Footer under the brand blurb; pending/success/error states, light-theme styling, honeypot field, privacy-consent line linking `/privacy`.

### P2 — integration / quality

- [x] **Unsubscribe** — DONE 2026-08-30: `POST /newsletter/unsubscribe` (public, throttled, idempotent) flags the row; exports exclude unsubscribed addresses.
- [x] **Anti-spam** — DONE 2026-08-30: hidden `website` honeypot (filled = fake success, nothing stored) + consent line under the form linking the privacy page.
- [x] **Unit tests** — DONE 2026-08-30: `newsletter.service.spec.ts` (6 tests) — lowercase/trim normalization, idempotent duplicates, honeypot discard, unsubscribe flag + export exclusion, re-subscribe re-activation, unknown-email unsubscribe.

### P3 — polish / tech debt

- [x] **Email normalization** — DONE 2026-08-30: trim + lowercase applied in the service on both subscribe and unsubscribe.

## 5. Cross-feature touchpoints

- **Site Shell & SEO (09)** — Footer hosts the form; legal pages (09 P1) should reference the consent line.
- **User Accounts (01)** — optional future `userId` linkage if subscribers may become users.
- **Analytics (13)** — optional `newsletter_subscribed` event, currently paused.

## 6. Explicitly deferred (build later, per owner)

- Double opt-in / confirmation emails (Resend `EmailService` is ready when needed).
- Unsubscribe confirmation emails, welcome mail, campaign sending.
- Subscriber↔user account linkage, segmentation, per-campaign tracking.

## 7. Extras (2026-09-05 F14 five-step pass — verification summary)

- **Step 1 (seed):** 20 subscribers (`newsletter-test1-20@example.com`, source `footer`) via the
  public subscribe endpoint — kept in the dev DB; the older `smoke-test@example.com` row predates.
- **Step 2 (plan audit):** all build claims hold; the admin subscriber section (post-dating this
  plan) is now in the inventory.
- **Step 3:** Extras above; deferred items (double opt-in, campaigns, linkage) unchanged.
- **Step 4 (dead code):** clean — SubscribeForm mounted in Footer, NewsletterSection consumed by
  the admin shell; no dedicated frontend lib (the section uses `adminApi` inline; the form posts
  inline as well).
- **Step 5 (E2E):** subscribe ×20 (200), duplicate re-subscribe idempotent (`subscribed:true`),
  unsubscribe flags the row, **export excludes unsubscribed** (19 active rows in the CSV payload)
  and the CSV shape matches what NewsletterSection downloads; admin list total 21.
