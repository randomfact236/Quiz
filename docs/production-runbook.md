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

### 2.1 ⚠️ Use **Deploy**, never **Rebuild**

**Rebuild reuses the cached build context. It does not re-clone the repository.** The
result is a brand-new image, with a fresh timestamp and a green health check, built from
**whatever source Dokploy last fetched**. It reports success. Nothing warns you.

This is not theoretical. On 2026-09-26 a security fix was pushed to `production`, CI went
green, and two **Rebuild** clicks produced images whose build timestamps were minutes old
and whose contents were three days stale. The site was healthy, the deploy log said `done`,
and the running code was missing every change from the push. Three independent probes
confirmed it (see 2.2). The fixes only reached production after a real **Deploy**.

- **Deploy** = fetch the branch fresh, then build. Use this for every code change.
- **Rebuild** = build the existing context again. Only useful for "the build was flaky,
  try again with the same source".

### 2.2 Verify a deploy actually landed

Never infer it from a green Dokploy card. Ask the running code directly:

```bash
# 400 = the new validation is live.  201 = still running the old build.
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://api.pigzap.com/api/v1/riddle-mcq/sessions \
  -H "Content-Type: application/json" \
  -d '{"totalRiddles":1,"correctCount":0,"score":0,"maxScore":1,"bogus":1}'
```

To inspect the running container directly (SSH as root to the VPS):

```bash
C=$(docker ps --filter name=quiz-api -q | head -1)
docker exec $C grep -rq "CreateRiddleSessionDto" /app/apps/backend/dist \
  && echo "new code is live" || echo "STALE BUILD"
```

Also useful, because Dokploy logs a clone step for a real deploy but not for a rebuild:

```bash
grep -iE "clone|checkout|fetch|Checking out" \
  /etc/dokploy/logs/quiz-api-wqmjxb/<latest>.log
```

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

## 11. Alerting & off-box backups (OPS-19 / OPS-21)

**Uptime / error alerting (not yet wired).** Concrete setup:

1. Add an external uptime monitor (UptimeRobot / Better Stack / Cloudflare Health Checks) on
   `https://api.pigzap.com/api/v1/health/liveness` and `https://pigzap.com`, 60s interval,
   alerting to email/Slack after 2 consecutive failures.
2. Route any error webhook to the same alert channel so 5xx spikes page you.
3. Set container log rotation on the VPS (Docker `log-opts max-size=10m max-file=3`) so logs
   cannot fill the disk.

**Off-box backup replication (not yet wired).**

1. After the nightly dump, push the newest `.sql.gz` off the VPS:
   `rclone copy /opt/quiz-backups remote:pigzap-backups --max-age 1d` (or an `scp` to a second host).
2. Keep 30 days there; keep the existing 7 locally.
3. Run a documented restore drill (quarterly): restore the newest off-box dump into a scratch
   database, compare row counts, drop it.

## 12. Auto-deploy not triggering — diagnosis (2026-09-26)

Pushes to `production` produced **no deployment at all**. Every deployment in Dokploy's
entire history is titled `Rebuild deployment`; not one was push-triggered. Work through
these in order — each step rules something out.

**1. Is the app configured to auto-deploy?** Application → General tab:
`Autodeploy` on, `Trigger Type` = **On Push**, repository/branch/build path correct.
All confirmed correct on `quiz-api`.

**2. Is the Git provider connection live?** Settings → Git. The pill switch on the provider
row is **"Share with entire organization"** — _not_ an auto-deploy switch. Do not toggle it
looking for an auto-deploy fix; it only controls provider sharing.

**3. Is the GitHub App installed and authorised?** Authenticate as the App using the
credentials in Dokploy's `github` table and ask GitHub directly (run on the VPS, delete the
temp key afterwards):

```
GET /app                                    -> app identity
GET /app/installations                      -> every installation
POST /app/installations/<id>/access_tokens  -> short-lived installation token
GET /installation/repositories              -> the repos actually in scope
```

Confirmed 2026-09-26: installation `158498141` on `randomfact236`,
`repository_selection=selected`, covering `randomfact236/Quiz` and
`randomfact236/product-ecommerce-affiliate-website`. Permissions are
`contents: read`, `metadata: read`, `pull_requests: write` — read is enough to clone.
**Authorisation is not the problem.**

**4. Is the webhook reachable from the internet?** This is the prime suspect, and it is
invisible from the VPS (which can always reach its own hostnames). Test from _outside_:

```bash
curl -o /dev/null -w "%{http_code}\n" https://vmi3549789.contaboserver.net   # -> 000
curl -o /dev/null -w "%{http_code}\n" https://dokploy.profitbenefit.com      # -> 200
```

The panel is served on two hostnames. `DOCKER-USER` drops inbound 80/443 from anything
outside the Cloudflare ranges (the NOW-01 lockdown), so `vmi3549789.contaboserver.net` is
unreachable from the public internet. **The App's webhook URL was set once at install time
(2026-09-02) and does not follow you when you change which hostname you browse on.** If it
still points at the Contabo hostname, GitHub's deliveries are silently dropped.

**5. Is the App subscribed to `push`?** GitHub → your App → Advanced → Webhook events.
`push` must be selected. If it is not, nothing is ever delivered regardless of hostname.

**6. Confirm the endpoint path.** `https://<reachable-host>/api/deploy/github/<secret>`
returns `401` to an unsigned request, which is correct; `/api/deploy/<id>` returns
`404 Application Not Found`. If the App's URL uses the firewalled hostname, repoint it at
`dokploy.profitbenefit.com` with the same path and secret.

**Also worth knowing:** Dokploy runs on Docker **Swarm** — container names look like
`quiz-api-wqmjxb.1.<taskid>`. Do not hand-build over SSH to "fix" a deploy: that bypasses
Swarm, Traefik, and the CI gate, and creates a second unmanaged deploy path.
