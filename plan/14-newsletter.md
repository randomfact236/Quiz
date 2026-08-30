# Feature 14 — Newsletter (NEW FEATURE — 0% built)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken · **P1** = major gaps · **P2** = integration / quality · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. **Nothing exists yet** — no backend endpoint, no table,
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

| Planned file                              | Purpose                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `components/newsletter/SubscribeForm.tsx` | Footer form (email input + submit + success/"already subscribed"/error states) — mounted by feature 09's Footer |

## 2. Planned endpoint map

| Method & Path                | Auth        | Notes                                                                                                                        |
| ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST `/newsletter/subscribe` | public      | body `{ email, source? }`; throttled (30/min); idempotent — duplicate email returns success without revealing who subscribed |
| GET `/newsletter`            | Jwt + admin | paginated list, filter by source/unsubscribed                                                                                |
| GET `/newsletter/export`     | Jwt + admin | CSV of active (non-unsubscribed) emails                                                                                      |

## 3. Current status

**0% — nothing built.** Everything in §1/§2 is a specification, not implementation.

## 4. Task breakdown

### P0 — critical / broken

- None (feature doesn't exist yet; nothing to break).

### P1 — major gaps (= the build itself)

- [ ] Migration: `newsletter_subscribers` table (unique lowercased email, source, unsubscribed flag).
- [ ] Backend module: subscribe endpoint (throttled, idempotent, email-validated) + admin list + CSV export.
- [ ] Footer `SubscribeForm` (feature 09 mounts it) with pending / success / "already subscribed" / error states.

### P2 — integration / quality

- [ ] Simple unsubscribe: `POST /newsletter/unsubscribe` (email + token-less, or a signed link) + flag filter on export.
- [ ] Anti-spam: honeypot field; consent line under the form (privacy policy link — feature 09's legal pages).
- [ ] Unit tests: idempotent duplicate handling, invalid email rejection, export contents.

### P3 — polish / tech debt

- [ ] Normalize emails to lowercase on write; trim inputs.

## 5. Cross-feature touchpoints

- **Site Shell & SEO (09)** — Footer hosts the form; legal pages (09 P1) should reference the consent line.
- **User Accounts (01)** — optional future `userId` linkage if subscribers may become users.
- **Analytics (13)** — optional `newsletter_subscribed` event, currently paused.

## 6. Explicitly deferred (build later, per owner)

- Double opt-in / confirmation emails (Resend `EmailService` is ready when needed).
- Unsubscribe confirmation emails, welcome mail, campaign sending.
- Subscriber↔user account linkage, segmentation, per-campaign tracking.
