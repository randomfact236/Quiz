# PigZap - Production Runbook

Single authoritative reference for running, deploying and recovering the production stack.
Consolidates and supersedes the operational parts of `DEPLOYMENT.md`,
`docs/cloudflare-config-runbook.md`, `CONTENT-PUSH-RUNBOOK.md` and `PORT-REFERENCE.md`
(audit item 6.4, created 2026-09-21).

## 1. Topology

- **Local dev:** `docker compose -f docker-compose.local.yml up -d` (Postgres/Redis) + `npm run dev`
  (frontend :3010, backend :3012).
- **Deploy path:** `main` -> push `production` -> Dokploy applications `quiz-api` and
  `quiz-frontend` watch the `production` branch and rebuild automatically.
- **Edge:** Cloudflare (proxied A records for `pigzap.com` and `api.pigzap.com`,
  SSL mode strict, HSTS + Always Use HTTPS).
- **CI:** `CI` workflow runs on pushes/PRs to `main` (lint, theme guard, type-check, tests, build).
  Pushing `production` runs the `Sync branches` workflow which fast-forwards `main` and the
  backup branch to the same commit (fast-forward only).

## 2. Deploy

```
git push origin main:production
```

Preconditions: CI green on the exact `main` commit; Dokploy apps show a successful build
afterwards. Verify live: `https://pigzap.com` (200), `https://api.pigzap.com/api/v1/health`
(200), `https://api.pigzap.com/api/v1/quiz-mcq/subjects` (200).

## 3. Rollback

1. Find the last known-good commit: `git log --oneline origin/production`.
2. Push it back onto production (fast-forward requires the target to be an ancestor; if not,
   `git revert` the bad commit on `main` and push `main:production`):
   ```
   git push origin <known-good-sha>:production
   git push origin <known-good-sha>:main
   ```
3. Confirm Dokploy rebuilt and the health endpoints are 200.

## 4. Secret rotation (audit H9 - owner action, still pending)

Secrets live in the Dokploy app environment variables (production) and the untracked local
`.env` files. Rotate, in order, and redeploy both apps after each:

| Secret                 | Where                        | Rotation                                             |
| ---------------------- | ---------------------------- | ---------------------------------------------------- |
| Admin account password | DB `users` row               | create/reset via `create-admin`                      |
| `POSTGRES_PASSWORD`    | Dokploy env + VPS DB         | `ALTER USER`, then update env + redeploy             |
| `REDIS_PASSWORD`       | Dokploy env + VPS Redis      | update redis config + env + redeploy                 |
| `JWT_SECRET`           | Dokploy env                  | new random >= 32 bytes; **invalidates all sessions** |
| `GOOGLE_CLIENT_SECRET` | Google Console + Dokploy env | rotate in Console, update env                        |

Generate secrets with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
The old dev values may still exist in git history - decide whether to scrub history or accept
they were dev-only (tracked in the audit as H9).

## 5. Origin firewall / Cloudflare (audit H6 - owner action)

- Prod compose ports are now bound to `127.0.0.1` (4004/3001), so they are not publicly
  reachable from this repo's configuration.
- Still to do on the VPS: restrict inbound 80/443 to Cloudflare's published IP ranges, and
  restrict the Dokploy panel to an allowlist.
- Keep Cloudflare SSL mode strict and the pending items from the Cloudflare runbook
  (auth rate-limit, panel restriction) applied.

## 6. Monitoring & logs

- Dokploy build/deploy logs per application; container logs via the Dokploy UI or
  `docker logs quiz-backend --tail=100`.
- Uptime/error alerting and log retention are not yet wired (audit OPS-21) - add an external
  uptime monitor against `/api/v1/health/liveness` and the homepage.

## 7. Backups & restore

- Nightly 03:30 VPS time: `/opt/quiz-backups/backup.sh` dumps the prod DB (gzipped, last 7 kept).
  Re-install from the repo with `bash scripts/setup-prod-db-backups.sh` (also runs a restore test).
- **Same-host only today** (audit OPS-19): copy the newest `.sql.gz` off the VPS periodically
  and run a documented restore drill.

## 8. Incident response

1. Confirm blast radius: `/api/v1/health/liveness` (app up?) vs `/api/v1/health` (dependencies).
2. If a deploy caused it: roll back (section 3).
3. If data-related: restore the newest backup into a scratch DB first, verify, then decide.
4. Record what happened in `QA-FINDINGS.md` (open) or the relevant plan doc.

## 9. Content pipeline

Content is authored locally and pushed with `npm run content:push` (dry-run default;
`-- --apply` to write). It is idempotent, never deletes, and protects live edits. See
`CONTENT-PUSH-RUNBOOK.md` for the full flow. Note the audit (H4): the last full quiz push
stopped at 6450/11541 questions and the state file has no `questions` baseline - re-run to
completion and confirm the state file gains the missing families.

## 10. CI/CD & dependencies

- Workflows: `CI` (main/PR), `Sync branches` (production -> fast-forward main + backup branch).
- Dependabot opens grouped/individual PRs; merge only when CI is green on the PR.
- Do not push directly to `production` except through `main` (keeps main == production on deploy).
