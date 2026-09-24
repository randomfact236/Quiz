# Runbook — Credential Rotation & SSH/Secrets Hygiene (NOW-02, was TASK-18)

> **Owner must be present** for this run: every new secret must be recorded in the
> owner's password manager as it is created. Nothing here is applied yet.
> Prepared 2026-09-22 after the 2026-09-17 prod content wipe (credentials were never
> rotated as part of that recovery).
> Context: origin firewall lockdown (NOW-01) is already live, which shrinks the
> attack surface this runbook closes.

## Order matters — follow top to bottom

### 0. Preconditions

- [ ] Owner's password manager open.
- [ ] Off-box backup verified: newest `r2:quiz-backups/db` object is from today
      (`rclone ls r2:quiz-backups/db`) + a fresh local `bash /opt/quiz-backups/backup.sh`.
- [ ] Second SSH session already open and authenticated (in case one dies mid-change).

### 1. SSH hygiene (host)

- [ ] Confirm no password auth: `sshd -T | grep -E 'passwordauthentication|permitrootlogin'`
      → expect `passwordauthentication no`. If not: set in `/etc/ssh/sshd_config.d/`,
      keep a working key session, `systemctl reload ssh`.
- [ ] Consider `PermitRootLogin prohibit-password` (key-only root) — owner decides whether
      to go further (non-root sudo user) this round.
- [ ] Install fail2ban (ufw already rate-limits 22/tcp; fail2ban adds banning):
      `apt install fail2ban && systemctl enable --now fail2ban`.

### 2. Database password (quiz-postgres)

1. Generate: `openssl rand -base64 32`.
2. `ALTER ROLE "<db-user>" WITH PASSWORD '<new>';` inside `docker exec -i quiz-postgres-… psql -U <db-user> -d postgres`.
3. Update the API's `DB_PASSWORD` in Dokploy (quiz-api service env) and redeploy quiz-api.
4. Verify: site loads a quiz, `/api/v1/analytics/summary` 200.
5. Record new password.

### 3. Redis password (quiz-redis)

- Same pattern: `redis-cli ACL SETUSER default on >'<new>'` (or requirepass in compose),
  update `REDIS_PASSWORD` in quiz-api env, redeploy, verify session/likes flows.

### 4. JWT secrets (API)

- Generate TWO new: access + refresh (`openssl rand -base64 48` each).
- Rotate in quiz-api env (`JWT_SECRET`, refresh secret), redeploy.
- **Blast radius:** every logged-in session is invalidated once (users just log in again).
  Guest ids are unaffected. Verify login + a guest like after deploy.
- **`GUEST_TOKEN_SECRET`** (added by the SEC-10/12 signed-guest-token work): rotate it in
  the same pass — blast radius is only that cached guest token pairs re-issue on the next
  write (the frontend self-heals with one retry).

### 5. Admin panel accounts

- Rotate the live admin's password (`admin@pigzap.com`) via the admin UI.
- Confirm the local dev admin (`admin@aiquiz.com`) is not present in PROD users table.

### 6. OAuth (Google)

- Regenerate the OAuth client secret in Google Cloud Console → update quiz-api env →
  redeploy → verify one Google sign-in.

### 7. R2 / Cloudflare

- Rotate the R2 API token used by rclone (`rclone config` on the VPS) — verify with
  `rclone ls r2:quiz-backups/db`.
- Review Cloudflare API tokens; roll the origin rules if any token predates 2026-09.
- **GSC service-account key** (`pigzap-gsc@…` JSON used by the SEO panel): if it ever
  left your machine, revoke it in Google Cloud Console and issue a new one — otherwise
  note its creation date and move on (it is read-only Search Console access).

### 8. Secret-history scan

- [ ] `git log -p | grep -iE 'password|secret|api[_-]?key'` on all private repos that
      ever touched prod; anything found → consider it compromised (it is, if the repo was
      ever shared/cloned) and rotate the corresponding credential.
- [ ] Check Dokploy env history / old compose files on the VPS (`/opt`, `~/…`) for
      stale secrets.

### 9. Close-out

- [ ] All new secrets in the owner's password manager.
- [ ] One more backup + R2 copy with the new DB password in place.
- [ ] Update QA-FINDINGS NOW-02 → Fixed.
