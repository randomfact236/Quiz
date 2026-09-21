# R2 Object Storage — Setup & Status (Quiz)

**Date:** 2026-09-21
**Provider:** Cloudflare R2 — account `Cusoon06@gmail.com` (account id `9ab8bed70e15245597577866e261c2b7`)
**Plan:** free tier — 10 GB storage, 1M Class A / 10M Class B ops/month, **$0 egress**

## 1. Summary

R2 is enabled and in use for the quiz platform for two jobs:

1. **Off-box database backups** — nightly `pg_dump` → R2.
2. **Media storage** — new media-library uploads go to R2 (env-gated; local disk fallback).

VPS: `207.180.199.86` (Contabo + Dokploy).

Buckets (separate from the affiliate project):
| Bucket | Access | Purpose |
|---|---|---|
| `quiz-media` | **public** (managed `r2.dev` URL) | media library (logos, riddles, covers) |
| `quiz-backups` | **private** | DB dumps (PII) |

Public media base: `https://pub-689cf690e2ee473f867f4207667fd51f.r2.dev`
S3 endpoint: `https://9ab8bed70e15245597577866e261c2b7.r2.cloudflarestorage.com`

## 2. Database backups — LIVE & VERIFIED

- **Script:** `/opt/quiz-backups/backup.sh` (extended; original kept as `backup.sh.bak`).
  - Auto-discovers the `quiz-postgres` + `quiz-api` containers and reads `DB_DATABASE` / `DB_USERNAME` from the quiz-api env.
  - `pg_dump | gzip` → `/opt/quiz-backups/quiz_db_<stamp>.sql.gz` → sanity size check.
  - **Off-box copy:** `rclone copy "$OUT" r2:quiz-backups/db`.
  - **Retention:** local **7**, R2 **365 days** (`R2_RETENTION_DAYS`).
- **Cron:** `30 3 * * *` (unchanged from before).
- **Verified (2026-09-21):** dump `quiz_db_20260921_172220.sql.gz` (2.15 MB) uploaded to R2, `gunzip -t` OK, and a **restore rehearsal** into a scratch DB → **exit 0, 24 tables** (`chapters`, `comments`, `duel_matches`, `dad_jokes`, …), then dropped.
- **Runbook:** `/opt/quiz-backups/README.md` on the VPS.

## 3. Media storage — ENABLED (app)

- **Code (quiz repo):**
  - `apps/backend/src/media/storage.service.ts` — rewritten to write to **R2/S3** (`@aws-sdk/client-s3`) when `R2_*` is set, else local disk under `UPLOADS_DIR`. `uploadFile`/`deleteFile` are now async.
  - `apps/backend/src/media/media.service.ts` — `await` the upload/delete calls.
  - `apps/backend/package.json` + lock — added `@aws-sdk/client-s3`.
  - `.env.example` / `.env.production.example` — documented `R2_*`.
  - Frontend unchanged (`resolveMediaUrl` already passes absolute URLs through).
- **Env (Dokploy → quiz-api):** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=quiz-media`, `R2_PUBLIC_BASE_URL=https://pub-689cf690e2ee473f867f4207667fd51f.r2.dev`.
- **Behaviour:** env present → upload to R2 + store the absolute R2 URL; env absent → local disk (unchanged). Old `/uploads/*` files keep serving from the volume.
- **Verified:** code present in the running image; startup log **"Object storage enabled (bucket=quiz-media, publicBase=https://pub-689cf690…r2.dev)"**; public URL serves a test object (**200**).
- **Commit:** `1c78f72` (quiz `main`; backup branch `backup-2026-09-21-2149`).

## 4. Credentials (NOT stored here — by design)

Live only in **Dokploy** (quiz-api service env) and the VPS **`/root/.config/rclone/rclone.conf`** (chmod 600). The repo contains none. Tokens created during setup: `R2 User Token` (read-only, safe to delete) + an **Admin Read & Write** token (in use); a pre-existing `full-edit` token also exists.

## 5. Follow-ups (optional)

- [ ] One **admin → Media upload** to confirm the app→R2 path end-to-end.
- [ ] Replace `r2.dev` with a **custom domain** (e.g. `cdn.<domain>`) — only `R2_PUBLIC_BASE_URL` changes.
- [ ] Migrate existing media to R2 (`rclone copy`) + update DB URLs.
- [ ] Token hygiene: delete the read-only token; consider per-app/per-bucket least-privilege tokens.

## 6. Verification commands (VPS)

```bash
# DB backup
tail -n 20 /opt/quiz-backups/backup.log
ls -lh /opt/quiz-backups/
rclone ls r2:quiz-backups/db

# Media bucket
rclone ls r2:quiz-media
curl -s -o /dev/null -w '%{http_code}\n' https://pub-689cf690e2ee473f867f4207667fd51f.r2.dev/uploads/<file>

# rclone sanity
rclone listremotes            # -> r2:
```
