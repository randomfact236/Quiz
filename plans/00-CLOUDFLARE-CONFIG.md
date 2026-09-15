# Cloudflare Configuration & Runbook - pigzap.com

> Audited and configured 2026-09-15 via the Cloudflare API (account zone pigzap.com).
> Free plan. Origin: single Contabo VPS at 207.180.199.86 (Docker/Dokploy).

Shared origin note: both profitbenefit.com and pigzap.com resolve to the same VPS 207.180.199.86; a change to that host affects both sites.

## 1. Zone facts

| Item             | Value                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Zone ID          | e433ce4b61cd8dc6afdf954a670426da                                                                                   |
| Plan             | Free Website                                                                                                       |
| Status           | active                                                                                                             |
| Name servers     | merlin.ns.cloudflare.com / nucum.ns.cloudflare.com                                                                 |
| SSL mode         | strict                                                                                                             |
| Edge certificate | \*.pigzap.com (status: active)                                                                                     |
| Application      | Next.js "AI Quiz - Interactive Learning Platform"; backend API at api.pigzap.com; deployed on the same Contabo VPS |
| Repository       | Ai-Quiz/Quiz (package ai-quiz-platform, github randomfact236/Quiz)                                                 |

## 2. DNS records as configured

| Type  | Name           | Content        | Proxied |
| ----- | -------------- | -------------- | ------- |
| A     | api.pigzap.com | 207.180.199.86 | yes     |
| A     | pigzap.com     | 207.180.199.86 | yes     |
| CNAME | www.pigzap.com | pigzap.com     | yes     |

No MX records (no mail on this domain). No DMARC record (no email sending from this domain).

## 3. Edge settings (live values)

Observed via `GET /zones/e433ce4b61cd8dc6afdf954a670426da/settings` on 2026-09-15, after applying the changes in section 4.

| Setting                  | Value                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| always_online            | on                                                                |
| always_use_https         | on                                                                |
| automatic_https_rewrites | on                                                                |
| brotli                   | on                                                                |
| cache_level              | aggressive                                                        |
| early_hints              | on                                                                |
| email_obfuscation        | on                                                                |
| http2                    | on                                                                |
| http3                    | on                                                                |
| min_tls_version          | 1.2                                                               |
| minify (css / html / js) | off / off / off                                                   |
| opportunistic_encryption | on                                                                |
| rocket_loader            | off                                                               |
| security_level           | medium                                                            |
| tls_1_3                  | on                                                                |
| websockets               | on                                                                |
| 0rtt                     | off                                                               |
| HSTS                     | enabled; max_age=31536000; include_subdomains=true; preload=false |

## 4. Changes applied 2026-09-15

| Change                                         | Before     | After                                                                                              | Why                                                                                                   |
| ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Min TLS version                                | 1.0        | 1.2                                                                                                | TLS 1.0/1.1 are deprecated                                                                            |
| Always Use HTTPS                               | already on | on                                                                                                 | Confirmed; no change was needed                                                                       |
| Early Hints                                    | off        | on                                                                                                 | Free performance: send preload hints before the full response                                         |
| Always Online                                  | off        | on                                                                                                 | Serves a cached copy if the origin blips                                                              |
| HSTS                                           | disabled   | enabled; max-age 31536000; includeSubDomains true; preload false                                   | Keep browsers on HTTPS after the first visit; preload left off for now (see section 5)                |
| Cache rule (phase http_request_cache_settings) | none       | expression: `starts_with(http.request.uri.path, "/uploads/")`; edge TTL 30 days; browser TTL 1 day | Uploaded media filenames are content-hash stamped (immutable), so they can be cached hard at the edge |

No email records were touched: this domain sends no email and has no MX records.

Note: a cache rule using `matches` requires a Business plan; the Free plan must use `starts_with`.

## 5. Still recommended (not yet applied)

- Rate limiting rule on `/api/v1/auth/*` (about 10 req/min per IP) - the Free plan includes one rate-limiting rule.
- WAF rule / access restriction for the dokploy hostname (the Dokploy panel hostname lives on the profitbenefit.com zone and is currently publicly reachable through the proxy; it shares this origin).
- Consider `preload` on HSTS only after confirming every subdomain is permanently HTTPS.
- Origin-side: confirm the firewall only accepts Cloudflare IPs on ports 80/443 (avoid direct-to-origin bypass).

## 6. How to change a setting (runbook)

- Via the Cloudflare MCP connector in AutoClaw (preferred): read `GET /zones/<zone-id>/settings`, write `PATCH /zones/<zone-id>/settings/<setting>` with body `{ "value": ... }`. The zone-id is listed in section 1.
- Via dashboard: Zone -> SSL/TLS / Speed / Caching / Rules as appropriate.
- Verification: always re-GET the setting and paste the observed value into this file's section 3.

## 7. Verification log

| Date       | What was checked                                                       | Observed result                                                                                                   |
| ---------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-09-15 | Zone settings re-read via the API after applying the section 4 changes | Values match section 3 (min_tls_version 1.2, always_use_https on, early_hints on, always_online on, HSTS enabled) |
| 2026-09-15 | Cache ruleset (phase http_request_cache_settings)                      | `/uploads/` rule present with edge TTL 30 days and browser TTL 1 day                                              |
| 2026-09-15 | DNS records                                                            | Match section 2 (three records; no MX, no DMARC, as expected for a no-mail domain)                                |
